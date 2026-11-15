import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PaintGame, pickMove, ALL_SQUARES, type BotLevel, type Color, type Square } from 'mess-of-chess-engine';
import { Screen, BackButton, Title, Card, Body } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Splat } from '../ui/Splat';
import { CaptureFX, type Hit } from '../ui/CaptureFX';
import { buzz } from '../ui/Bouncy';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { SETS, PIECE_NAME, type PieceSet, type PieceType } from '../pieces';
import { C, F, fill, lift } from '../theme';

const ROWS: Square[][] = Array.from({ length: 8 }, (_, row) => ALL_SQUARES.filter((s) => Number(s[1]) === 8 - row));
const FILES = 'abcdefgh';
const col = (s: Square) => FILES.indexOf(s[0]);
const row = (s: Square) => 8 - Number(s[1]);

interface Last {
  from: Square;
  to: Square;
  id: number;
}

export function Game({ mode, level }: { mode: 'bot' | 'friend'; level: BotLevel }) {
  const nav = useNav();
  const store = useStore();
  const { width, height } = useWindowDimensions();
  const [game, setGame] = useState(() => new PaintGame());
  const [, setTick] = useState(0);
  const [picked, setPicked] = useState<Square | null>(null);
  const [fresh, setFresh] = useState<Square[]>([]);
  const [last, setLast] = useState<Last | null>(null);
  const [hit, setHit] = useState<Hit | null>(null);
  const [taken, setTaken] = useState<Record<Color, PieceType[]>>({ w: [], b: [] });
  const [note, setNote] = useState('Tap a piece, then tap where to splat it.');
  const [reward, setReward] = useState<{ before: number; gained: number } | null>(null);
  const [thinking, setThinking] = useState(false);
  const caps = useRef(0);
  const moveId = useRef(0);

  const sets: Record<Color, PieceSet> = { w: SETS[store.save.equipped], b: SETS.goo };
  const names: Record<Color, string> = mode === 'bot' ? { w: 'You', b: 'Goo Bot' } : { w: sets.w.name, b: 'Goo' };

  const boardW = Math.floor(Math.min(width - 38, height * 0.5, 520) / 8) * 8;
  const sq = boardW / 8;

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value * 7 }, { rotate: `${shake.value * 0.6}deg` }] }));

  const me = game.turn;
  const botTurn = mode === 'bot' && me === 'b';
  const targets = picked ? game.legalMoves(picked).map((m) => m.to) : [];

  function play(from: Square, to: Square) {
    const mover = game.turn;
    const r = game.move(from, to);
    if (!r.ok || !r.move) return;
    moveId.current += 1;
    setPicked(null);
    setFresh(r.painted);
    setLast({ from, to, id: moveId.current });
    const capturedType = r.move.captured as PieceType | undefined;
    if (capturedType) {
      const victimColor: Color = mover === 'w' ? 'b' : 'w';
      setTaken((t) => ({ ...t, [mover]: [...t[mover], capturedType] }));
      if (mode === 'friend' || mover === 'w') caps.current += 1;
      void victimColor;
    }
    const paint = sets[mover].paint;
    if (r.result.over && r.result.reason === 'checkmate') {
      setHit({ key: Date.now(), kind: 'mate', word: 'CHECKMATE', color: paint });
      shakeIt(true);
    } else if (capturedType) {
      setHit({
        key: Date.now(),
        kind: 'capture',
        word: PIECE_NAME[capturedType].toUpperCase(),
        color: paint,
      });
      shakeIt(capturedType === 'q' || capturedType === 'r');
    } else if (r.check) {
      setHit({ key: Date.now(), kind: 'check', word: 'CHECK', color: C.yellow });
      shakeIt(false);
    }
    if (r.stolen.length) {
      const other = names[mover === 'w' ? 'b' : 'w'];
      setNote(`${names[mover]} painted over ${other === 'You' ? 'your' : `${other}’s`} square!`);
    }
    else if (capturedType) setNote(`${names[mover]} splatted a ${PIECE_NAME[capturedType].toLowerCase()}.`);
    else setNote(mode === 'bot' ? (game.turn === 'w' ? 'Your move.' : 'Goo Bot is plotting…') : `${names[game.turn]} to play.`);
    if (r.result.over) setNote(r.result.winner ? `${names[r.result.winner]} ${mode === 'bot' && r.result.winner === 'w' ? 'win' : 'wins'}!` : 'Paint tie!');
    setTick((t) => t + 1);
    if (r.result.over) finish(r.result.winner);
  }

  function shakeIt(big: boolean) {
    buzz(big ? 'heavy' : 'medium');
    const a = big ? 1.4 : 0.8;
    shake.value = withSequence(
      withTiming(a, { duration: 40 }),
      withTiming(-a, { duration: 60 }),
      withTiming(a * 0.6, { duration: 60 }),
      withTiming(-a * 0.4, { duration: 60 }),
      withSpring(0, { damping: 6 }),
    );
  }

  function finish(winner: Color | null) {
    const won = mode === 'bot' ? winner === 'w' : winner !== null;
    const before = store.save.meter;
    const gained = store.addMess(15 + (won ? 30 : 0) + caps.current * 3);
    store.update((s) => ({
      games: s.games + 1,
      wins: s.wins + (mode === 'bot' && winner === 'w' ? 1 : 0),
      splats: s.splats + caps.current,
    }));
    setTimeout(() => setReward({ before, gained }), 1600);
  }

  // The bot moves after a beat, longer if the last move made a splash.
  useEffect(() => {
    if (!botTurn || game.result.over) return;
    setThinking(true);
    const wait = hit ? 1700 : 700;
    const t = setTimeout(() => {
      const m = pickMove(game, level);
      setThinking(false);
      if (m) play(m.from, m.to);
    }, wait);
    return () => clearTimeout(t);
  }, [botTurn, moveId.current]);

  function tap(s: Square) {
    if (game.result.over || botTurn) return;
    if (picked && targets.includes(s)) return play(picked, s);
    const mine = game.pieceAt(s)?.color === me;
    if (mine) buzz('light');
    setPicked(mine && picked !== s ? s : null);
  }

  function rematch() {
    setGame(new PaintGame());
    setPicked(null);
    setFresh([]);
    setLast(null);
    setHit(null);
    setTaken({ w: [], b: [] });
    setReward(null);
    caps.current = 0;
    moveId.current += 1;
    setNote('Fresh board. Make a mess.');
  }

  const result = game.result;
  const moveNo = Math.min(game.moveNumber, game.rules.moveLimit);

  return (
    <Screen style={{ paddingHorizontal: 19 }}>
      <View style={s.topBar}>
        <BackButton icon="close" onPress={nav.back} />
        <Text style={s.moveText}>
          Move {moveNo} of {game.rules.moveLimit}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <PaintBar game={game} sets={sets} labels={mode === 'bot' ? { w: 'Your paint', b: 'Goo paint' } : { w: `${names.w} paint`, b: 'Goo paint' }} />

      <View style={s.middle}>
        <PlayerRow color="b" game={game} set={sets.b} name={names.b} sub={mode === 'bot' ? `${level[0].toUpperCase()}${level.slice(1)} level` : undefined} taken={taken.b} enemy={sets.w} thinking={thinking} />

        <Animated.View style={[s.board, { width: boardW, height: boardW }, lift(16), shakeStyle]}>
          {/* 1. Checker squares, last-move tint and paint, clipped to the rounded board */}
          <View style={s.boardClip}>
            {ROWS.map((r, ri) => (
              <View key={ri} style={s.row}>
                {r.map((q, ci) => (
                  <View key={q} style={{ width: sq, height: sq, backgroundColor: (ri + ci) % 2 === 0 ? C.boardLight : C.boardDark }}>
                    {last && (last.from === q || last.to === q) && <View style={s.lastMove} />}
                  </View>
                ))}
              </View>
            ))}
            {ALL_SQUARES.map((q) => {
              const paint = game.paintAt(q);
              if (!paint) return null;
              return (
                <View key={q} pointerEvents="none" style={[s.cell, { left: col(q) * sq, top: row(q) * sq, width: sq, height: sq }]}>
                  <PaintSpot color={sets[paint].paint} fresh={fresh.includes(q)} size={sq} />
                </View>
              );
            })}
            {picked && <View pointerEvents="none" style={[s.cell, s.ring, { left: col(picked) * sq, top: row(picked) * sq, width: sq, height: sq }]} />}
          </View>
          <View pointerEvents="none" style={s.boardEdge} />
          {/* 2. Pieces, the one that just moved drawn on top. They may poke over the board edge. */}
          {ALL_SQUARES.map((q) => game.pieceAt(q) && q)
            .filter((q): q is Square => Boolean(q))
            .sort((a, b) => (last?.to === a ? 1 : last?.to === b ? -1 : row(a) - row(b)))
            .map((q) => {
              const piece = game.pieceAt(q)!;
              const moved = last && last.to === q ? last : null;
              return (
                <View key={q} pointerEvents="none" style={[s.cell, { left: col(q) * sq, top: row(q) * sq, width: sq, height: sq }]}>
                  <PieceView
                    src={sets[piece.color].art[piece.type as PieceType]}
                    sq={sq}
                    lift={picked === q}
                    from={moved ? { dx: (col(moved.from) - col(q)) * sq, dy: (row(moved.from) - row(q)) * sq, id: moved.id } : null}
                  />
                </View>
              );
            })}
          {/* 3. Touch targets and move hints */}
          {ALL_SQUARES.map((q) => {
            const piece = game.pieceAt(q);
            const paint = game.paintAt(q);
            const isTarget = targets.includes(q);
            return (
              <Pressable
                key={q}
                onPress={() => tap(q)}
                accessibilityLabel={`${q}${piece ? ` ${names[piece.color]} ${PIECE_NAME[piece.type as PieceType]}` : ''}${paint ? `, ${names[paint]} paint` : ''}`}
                style={[s.cell, s.square, { left: col(q) * sq, top: row(q) * sq, width: sq, height: sq }]}
              >
                {isTarget && <View style={[s.target, piece && s.targetCapture]} />}
              </Pressable>
            );
          })}
        </Animated.View>

        <PlayerRow color="w" game={game} set={sets.w} name={names.w} taken={taken.w} enemy={sets.b} />
      </View>

      <View style={s.note}>
        <Text style={s.noteText} numberOfLines={2}>
          {note}
        </Text>
      </View>

      {hit && <CaptureFX hit={hit} onDone={() => setHit(null)} />}

      {result.over && reward && (
        <EndCard
          title={result.winner ? (mode === 'bot' ? (result.winner === 'w' ? 'You win!' : 'Goo wins') : `${names[result.winner]} wins!`) : 'Paint tie!'}
          reason={result.reason === 'checkmate' ? 'by checkmate' : result.reason === 'most-paint' ? `most paint, ${game.score('w')} to ${game.score('b')}` : 'nobody wins, everybody’s messy'}
          color={result.winner ? sets[result.winner].paint : C.yellow}
          meterColor={sets.w.paint}
          before={reward.before}
          gained={reward.gained}
          onRematch={rematch}
          onHome={nav.home}
          onMeter={() => nav.replace({ name: 'meter' })}
        />
      )}
    </Screen>
  );
}

function PieceView({ src, sq, lift, from }: { src: any; sq: number; lift: boolean; from: { dx: number; dy: number; id: number } | null }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const up = useSharedValue(0);
  const squash = useSharedValue(1);
  useEffect(() => {
    if (!from) return;
    x.value = from.dx;
    y.value = from.dy;
    x.value = withSpring(0, { damping: 16, stiffness: 180 });
    y.value = withSpring(0, { damping: 16, stiffness: 180 });
    squash.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0.82, { duration: 70 }), withSpring(1, { damping: 5, stiffness: 300 }));
  }, [from?.id]);
  useEffect(() => {
    up.value = withSpring(lift ? 1 : 0, { damping: 10, stiffness: 300 });
  }, [lift]);
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value - up.value * sq * 0.14 },
      { scale: 1 + up.value * 0.1 },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
    ],
    zIndex: from ? 5 : 1,
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st]}>
      <View style={s.pieceBox}>
        <Image source={src} style={s.pieceImg} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

/** A square soaked in paint. It wells up from the centre when it's freshly painted. */
function PaintSpot({ color, fresh, size }: { color: string; fresh: boolean; size: number }) {
  const g = useSharedValue(fresh ? 0 : 1);
  useEffect(() => {
    if (!fresh) return;
    g.value = 0;
    g.value = withSpring(1, { damping: 11, stiffness: 190 });
  }, [fresh, color]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 0.3 + Math.min(1, g.value) * 0.7 }], opacity: Math.min(1, g.value * 2) * 0.82 }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, backgroundColor: color }, st]} />;
}

/** The score: two big numbers and one line of paint split between the players. */
function PaintBar({ game, sets, labels }: { game: PaintGame; sets: Record<Color, PieceSet>; labels: Record<Color, string> }) {
  const w = game.score('w');
  const b = game.score('b');
  const total = Math.max(1, w + b);
  const wf = useSharedValue(0.5);
  useEffect(() => {
    wf.value = withSpring(w + b === 0 ? 0.5 : Math.max(0.08, Math.min(0.92, w / total)), { damping: 14, stiffness: 120 });
  }, [w, b]);
  const left = useAnimatedStyle(() => ({ width: `${wf.value * 100}%` }));
  return (
    <View style={s.score} accessibilityLabel={`Paint, ${w} to ${b}`}>
      <Text style={s.scoreNum}>{w}</Text>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={s.scoreBar}>
          <Animated.View style={[s.scoreLeft, { backgroundColor: sets.w.paint }, left]} />
          <View style={[s.scoreRight, { backgroundColor: sets.b.paint }]} />
        </View>
        <View style={s.scoreLabels}>
          <Text style={s.scoreLabel}>{labels.w}</Text>
          <Text style={s.scoreLabel}>{labels.b}</Text>
        </View>
      </View>
      <Text style={s.scoreNum}>{b}</Text>
    </View>
  );
}

function PlayerRow({ color, game, set, name, sub, taken, enemy, thinking }: { color: Color; game: PaintGame; set: PieceSet; name: string; sub?: string; taken: PieceType[]; enemy: PieceSet; thinking?: boolean }) {
  const active = game.turn === color && !game.result.over;
  return (
    <View style={s.player}>
      <View style={[s.avatar, { backgroundColor: `${set.paint}4D` }]}>
        <Image source={set.art.k} style={{ width: 38, height: 38 }} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={s.playerName}>{name}</Text>
        {taken.length ? (
          <View style={s.taken}>
            {taken.map((t, i) => (
              <Animated.View key={i} entering={ZoomIn.springify()}>
                <Image source={enemy.art[t]} style={{ width: 20, height: 20, marginRight: -6 }} />
              </Animated.View>
            ))}
            <Text style={[s.playerSub, { marginLeft: 10 }]}>
              {taken.length} {taken.length === 1 ? 'splat' : 'splats'}
            </Text>
          </View>
        ) : (
          <Text style={s.playerSub}>{sub ?? 'No splats yet'}</Text>
        )}
      </View>
      {active && (
        <Animated.View entering={FadeIn} style={s.turnTag}>
          <View style={[s.turnDot, { backgroundColor: set.paint }]} />
          <Text style={s.turn}>{game.inCheck() ? 'In check!' : thinking ? 'Thinking…' : 'Your move'}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function EndCard(props: {
  title: string;
  reason: string;
  color: string;
  meterColor: string;
  before: number;
  gained: number;
  onRematch: () => void;
  onHome: () => void;
  onMeter: () => void;
}) {
  const { width } = useWindowDimensions();
  const full = props.before + props.gained >= METER_MAX;
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, s.endWrap]}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={s.endSplat}>
        <Splat color={props.color} size={width * 1.5} seed={404} arms={8} dots={8} drips={3} />
      </Animated.View>
      <Animated.View entering={ZoomIn.delay(120).springify().damping(13)} style={{ width: '100%' }}>
        <Card raised style={{ alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 20 }}>
          <Title size={48} style={{ textAlign: 'center' }}>
            {props.title}
          </Title>
          <Body style={{ textAlign: 'center', marginBottom: 10 }}>{props.reason}</Body>
          <View style={{ width: '100%', gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={s.endLabel}>Messy Meter</Text>
              <Text style={s.endGain}>+{props.gained}</Text>
            </View>
            <MeterBar value={(props.before + props.gained) / METER_MAX} delay={350} color={props.meterColor} />
          </View>
          {full ? <MessyButton label="Meter full! Open it" size="md" color={props.meterColor} style={{ alignSelf: 'stretch', marginTop: 18 }} onPress={props.onMeter} /> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: full ? 10 : 18, alignSelf: 'stretch' }}>
            <MessyButton label="Rematch" size="md" style={{ flex: 1 }} onPress={props.onRematch} />
            <MessyButton label="Home" size="md" color={C.surface} tilt={1.5} style={{ flex: 1 }} onPress={props.onHome} />
          </View>
        </Card>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  moveText: { color: C.gray, fontFamily: F.bold, fontSize: 15 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  scoreNum: { fontFamily: F.display, fontSize: 40, lineHeight: 42, color: C.ink, letterSpacing: -1.5, minWidth: 26, textAlign: 'center' },
  scoreBar: { flexDirection: 'row', gap: 3, height: 16 },
  scoreLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  scoreRight: { flex: 1, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  scoreLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { fontFamily: F.bold, fontSize: 13, color: C.gray },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  board: { backgroundColor: C.boardLight, borderRadius: 20 },
  boardClip: { ...fill, borderRadius: 20, overflow: 'hidden' },
  boardEdge: { ...fill, borderRadius: 20, borderWidth: 1.5, borderColor: C.line },
  row: { flexDirection: 'row' },
  cell: { position: 'absolute' },
  square: { alignItems: 'center', justifyContent: 'center' },
  lastMove: { ...fill, backgroundColor: C.yellow, opacity: 0.4 },
  ring: { borderWidth: 3.5, borderColor: C.ink },
  target: { position: 'absolute', width: '30%', aspectRatio: 1, borderRadius: 999, backgroundColor: C.ink, opacity: 0.3, zIndex: 9 },
  targetCapture: { width: '86%', backgroundColor: 'transparent', borderWidth: 4, borderColor: C.ink, opacity: 0.3 },
  pieceBox: { position: 'absolute', left: '-6%', right: '-6%', top: '-13%', bottom: '1%' },
  pieceImg: { width: '100%', height: '100%' },
  note: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 18, minHeight: 56, justifyContent: 'center', marginTop: 10 },
  noteText: { color: C.ink, fontSize: 16, fontFamily: F.bold, textAlign: 'center' },
  player: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', minHeight: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  playerName: { color: C.ink, fontFamily: F.title, fontSize: 17, letterSpacing: -0.3 },
  playerSub: { color: C.gray, fontFamily: F.body, fontSize: 13 },
  taken: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  turnTag: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, borderRadius: 17, paddingHorizontal: 14, backgroundColor: C.ink },
  turnDot: { width: 8, height: 8, borderRadius: 4 },
  turn: { fontFamily: F.title, fontSize: 14, color: C.white },
  endWrap: { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center', padding: 22 },
  endSplat: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  endLabel: { fontFamily: F.title, color: C.ink, fontSize: 16 },
  endGain: { fontFamily: F.title, color: C.ink, fontSize: 16 },
});
