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
import { CaptureFX, SquareBurst, type Hit } from '../ui/CaptureFX';
import { buzz } from '../ui/Bouncy';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { SETS, PIECE_NAME, type PieceSet, type PieceType } from '../pieces';
import { C, F, chunky, fill } from '../theme';

const ROWS: Square[][] = Array.from({ length: 8 }, (_, row) => ALL_SQUARES.filter((s) => Number(s[1]) === 8 - row));
const FILES = 'abcdefgh';
const col = (s: Square) => FILES.indexOf(s[0]);
const row = (s: Square) => 8 - Number(s[1]);

interface Last {
  from: Square;
  to: Square;
  id: number;
}
interface Burst {
  x: number;
  y: number;
  color: string;
  seed: number;
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
  const [burst, setBurst] = useState<Burst | null>(null);
  const [taken, setTaken] = useState<Record<Color, PieceType[]>>({ w: [], b: [] });
  const [note, setNote] = useState('Tap a piece, then tap where to splat it.');
  const [reward, setReward] = useState<{ before: number; gained: number } | null>(null);
  const [thinking, setThinking] = useState(false);
  const caps = useRef(0);
  const moveId = useRef(0);

  const sets: Record<Color, PieceSet> = { w: SETS[store.save.equipped], b: SETS.goo };
  const names: Record<Color, string> = mode === 'bot' ? { w: 'You', b: 'Goo Bot' } : { w: sets.w.name, b: 'Goo' };

  const boardW = Math.min(width - 28, height * 0.52, 520);
  const sq = (boardW - 22) / 8;

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value * 7 }, { rotate: `${shake.value * 0.6}deg` }] }));

  const me = game.turn;
  const botTurn = mode === 'bot' && me === 'b';
  const targets = picked ? game.legalMoves(picked).map((m) => m.to) : [];

  function play(from: Square, to: Square) {
    const mover = game.turn;
    const victim = game.pieceAt(to);
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
      // En passant takes a pawn that isn't on the target square, so splat where it was.
      const at = victim ? to : ((to[0] + from[1]) as Square);
      setBurst({ x: 8 + col(at) * sq + sq / 2, y: 8 + row(at) * sq + sq / 2, color: sets[mover].paint, seed: moveId.current * 31 });
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
      setHit({ key: Date.now(), kind: 'check', word: 'CHECK', color: C.cream });
      shakeIt(false);
    }
    if (r.stolen.length) setNote(`${names[mover]} painted over ${names[mover === 'w' ? 'b' : 'w']}'s square!`);
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
    setBurst(null);
    setTaken({ w: [], b: [] });
    setReward(null);
    caps.current = 0;
    moveId.current += 1;
    setNote('Fresh board. Make a mess.');
  }

  const result = game.result;

  return (
    <Screen style={{ paddingHorizontal: 14 }}>
      <View style={s.topBar}>
        <BackButton icon="close" onPress={nav.back} />
        <PaintBar game={game} sets={sets} />
      </View>

      <View style={s.middle}>
        <PlayerCard color="b" game={game} set={sets.b} name={names.b} taken={taken.b} enemy={sets.w} thinking={thinking} />

        <Animated.View style={[s.boardFrame, { width: boardW, height: boardW }, chunky(9), shakeStyle]}>
          <View style={{ width: sq * 8, height: sq * 8 }}>
            {/* 1. Checker squares and last-move tint */}
            {ROWS.map((r, ri) => (
              <View key={ri} style={s.row}>
                {r.map((q, ci) => (
                  <View key={q} style={{ width: sq, height: sq, backgroundColor: (ri + ci) % 2 === 0 ? C.light : C.dark }}>
                    {last && (last.from === q || last.to === q) && <View style={s.lastMove} />}
                  </View>
                ))}
              </View>
            ))}
            {/* 2. Paint, which can spill over square edges */}
            {ALL_SQUARES.map((q) => {
              const paint = game.paintAt(q);
              if (!paint) return null;
              return (
                <View key={q} pointerEvents="none" style={[s.cell, { left: col(q) * sq, top: row(q) * sq, width: sq, height: sq }]}>
                  <PaintSpot color={sets[paint].paint} seed={row(q) * 8 + col(q) + 3} fresh={fresh.includes(q)} size={sq} />
                </View>
              );
            })}
            {/* 3. Pieces, the one that just moved drawn on top */}
            {ALL_SQUARES.map((q) => game.pieceAt(q) && q)
              .filter((q): q is Square => Boolean(q))
              .sort((a, b) => (last?.to === a ? 1 : last?.to === b ? -1 : row(a) - row(b)))
              .map((q) => {
                const piece = game.pieceAt(q)!;
                const moved = last && last.to === q ? last : null;
                return (
                  <View key={q} pointerEvents="none" style={[s.cell, { left: col(q) * sq, top: row(q) * sq, width: sq, height: sq }]}>
                    {picked === q && <View style={s.ring} />}
                    <PieceView
                      src={sets[piece.color].art[piece.type as PieceType]}
                      sq={sq}
                      lift={picked === q}
                      from={moved ? { dx: (col(moved.from) - col(q)) * sq, dy: (row(moved.from) - row(q)) * sq, id: moved.id } : null}
                    />
                  </View>
                );
              })}
            {/* 4. Touch targets and move hints */}
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
          </View>
          {burst && <SquareBurst key={burst.seed} {...burst} sq={sq} />}
        </Animated.View>

        <PlayerCard color="w" game={game} set={sets.w} name={names.w} taken={taken.w} enemy={sets.b} />
      </View>

      <View style={s.note}>
        <Text style={s.noteText} numberOfLines={2}>
          {note}
        </Text>
      </View>

      {hit && <CaptureFX hit={hit} onDone={() => setHit(null)} />}

      {result.over && reward && (
        <EndCard
          title={result.winner ? (mode === 'bot' ? (result.winner === 'w' ? 'YOU WIN!' : 'GOO WINS') : `${names[result.winner].toUpperCase()} WINS!`) : 'PAINT TIE!'}
          reason={result.reason === 'checkmate' ? 'by checkmate' : result.reason === 'most-paint' ? `most paint, ${game.score('w')} to ${game.score('b')}` : 'nobody wins, everybody’s messy'}
          color={result.winner ? sets[result.winner].paint : C.yellow}
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
      <View style={[s.pieceShadow, { left: sq * 0.25, width: sq * 0.5, height: sq * 0.12, bottom: sq * 0.05 }]} />
      <View style={s.pieceBox}>
        <Image source={src} style={s.pieceImg} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

function PaintSpot({ color, seed, fresh, size }: { color: string; seed: number; fresh: boolean; size: number }) {
  const g = useSharedValue(fresh ? 0.1 : 1);
  useEffect(() => {
    if (!fresh) return;
    g.value = 0.1;
    g.value = withSpring(1, { damping: 7, stiffness: 160 });
  }, [fresh, color]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: g.value }] }));
  const big = size * 2;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (size - big) / 2, top: (size - big) / 2, width: big, height: big, opacity: 0.88 }, st]}>
      <Splat color={color} size={big} seed={seed} arms={4} dots={3} drips={1} />
    </Animated.View>
  );
}

function PaintBar({ game, sets }: { game: PaintGame; sets: Record<Color, PieceSet> }) {
  const w = game.score('w');
  const b = game.score('b');
  const total = Math.max(1, w + b);
  const wf = useSharedValue(0.5);
  useEffect(() => {
    wf.value = withSpring(w + b === 0 ? 0.5 : w / total, { damping: 14, stiffness: 120 });
  }, [w, b]);
  const left = useAnimatedStyle(() => ({ width: `${wf.value * 100}%` }));
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={s.paintBar} accessibilityLabel={`Paint ${w} to ${b}`}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: sets.b.paint }]} />
        <Animated.View style={[s.paintLeft, { backgroundColor: sets.w.paint }, left]} />
        <View style={s.paintNums}>
          <Text style={[s.paintNum, { color: sets.w.on }]}>{w}</Text>
          <Text style={[s.paintNum, { color: sets.b.on }]}>{b}</Text>
        </View>
      </View>
      <Text style={s.moveText}>
        MOVE {Math.min(game.moveNumber, game.rules.moveLimit)} OF {game.rules.moveLimit}
      </Text>
    </View>
  );
}

function PlayerCard({ color, game, set, name, taken, enemy, thinking }: { color: Color; game: PaintGame; set: PieceSet; name: string; taken: PieceType[]; enemy: PieceSet; thinking?: boolean }) {
  const active = game.turn === color && !game.result.over;
  return (
    <View style={[s.player, active && { borderColor: set.paint, backgroundColor: C.card }]}>
      <View style={[s.avatar, { backgroundColor: set.paint }]}>
        <Image source={set.art.k} style={{ width: 44, height: 44, marginTop: -6 }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.playerName}>{name}</Text>
        <View style={s.taken}>
          {taken.map((t, i) => (
            <Animated.View key={i} entering={ZoomIn.springify()}>
              <Image source={enemy.art[t]} style={{ width: 20, height: 20, marginRight: -5 }} />
            </Animated.View>
          ))}
        </View>
      </View>
      {active && (
        <Animated.View entering={FadeIn} style={[s.turnTag, { backgroundColor: set.paint }]}>
          <Text style={[s.turn, { color: set.on }]}>{game.inCheck() ? 'IN CHECK!' : thinking ? 'THINKING…' : 'YOUR MOVE'}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function EndCard(props: {
  title: string;
  reason: string;
  color: string;
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
      <View style={s.endSplat}>
        <Splat color={props.color} size={width * 1.3} seed={404} arms={10} dots={16} drips={4} />
      </View>
      <Animated.View entering={ZoomIn.springify().damping(11)} style={{ width: '100%' }}>
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
          <Title size={50} color={props.color} style={{ textAlign: 'center' }}>
            {props.title}
          </Title>
          <Body style={{ textAlign: 'center', marginBottom: 8 }}>{props.reason}</Body>
          <View style={{ width: '100%', gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.endLabel}>MESSY METER</Text>
              <Text style={[s.endLabel, { color: C.slime }]}>+{props.gained}</Text>
            </View>
            <MeterBar value={(props.before + props.gained) / METER_MAX} delay={350} />
          </View>
          {full ? (
            <MessyButton label="METER FULL! OPEN IT" size="md" color={C.slime} style={{ alignSelf: 'stretch', marginTop: 16 }} onPress={props.onMeter} />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: full ? 10 : 16, alignSelf: 'stretch' }}>
            <MessyButton label="REMATCH" size="md" style={{ flex: 1 }} onPress={props.onRematch} />
            <MessyButton label="HOME" size="md" color={C.goo} tilt={2} style={{ flex: 1 }} onPress={props.onHome} />
          </View>
        </Card>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  middle: { flex: 1, justifyContent: 'space-evenly', alignItems: 'center' },
  boardFrame: { backgroundColor: C.light, borderRadius: 22, padding: 8, borderWidth: 3, borderColor: C.ink },
  row: { flexDirection: 'row' },
  cell: { position: 'absolute' },
  square: { alignItems: 'center', justifyContent: 'center' },
  lastMove: { ...fill, backgroundColor: C.yellow, opacity: 0.35 },
  ring: { ...fill, margin: 2, borderRadius: 10, borderWidth: 3, borderColor: C.ink },
  target: { position: 'absolute', width: '30%', aspectRatio: 1, borderRadius: 999, backgroundColor: C.ink, opacity: 0.35, zIndex: 9 },
  targetCapture: { width: '90%', backgroundColor: 'transparent', borderWidth: 4, borderColor: C.goo, opacity: 0.85 },
  pieceBox: { position: 'absolute', left: '-10%', right: '-10%', top: '-24%', bottom: '2%' },
  pieceImg: { width: '100%', height: '100%' },
  pieceShadow: { position: 'absolute', borderRadius: 999, backgroundColor: C.ink, opacity: 0.22 },
  note: { backgroundColor: C.card, borderRadius: 18, borderWidth: 2, borderColor: C.ink, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
  noteText: { color: C.light, fontSize: 16, fontFamily: F.bold },
  paintBar: { height: 28, borderRadius: 999, overflow: 'hidden', borderWidth: 3, borderColor: C.ink, justifyContent: 'center' },
  paintLeft: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  paintNums: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  paintNum: { fontFamily: F.display, fontSize: 16 },
  moveText: { color: C.muted, fontFamily: F.black, fontSize: 12, letterSpacing: 1.5, textAlign: 'center' },
  player: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 3, borderColor: 'transparent', alignSelf: 'stretch' },
  avatar: { width: 46, height: 46, borderRadius: 16, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playerName: { color: C.light, fontFamily: F.display, fontSize: 22 },
  taken: { flexDirection: 'row', minHeight: 20 },
  turnTag: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: C.ink },
  turn: { fontFamily: F.black, fontSize: 12, letterSpacing: 1 },
  endWrap: { backgroundColor: 'rgba(20,10,40,0.6)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  endSplat: { position: 'absolute', alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  endLabel: { fontFamily: F.display, color: C.light, fontSize: 18 },
});
