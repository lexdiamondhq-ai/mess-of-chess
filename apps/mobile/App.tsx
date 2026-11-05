import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MessGame, ALL_SQUARES, type Color, type Square } from 'mess-of-chess-engine';

const C = {
  grape: '#2A1A4A',
  card: '#3A2763',
  muted: '#CBBDF0',
  slime: '#8BE04E',
  goo: '#FF5FA2',
  yellow: '#FFD23F',
  ink: '#1A1030',
  cream: '#FFF8F0',
  light: '#FFFFFF',
  dark: '#E6DDF7',
};

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const NAME: Record<Color, string> = { w: 'Slime', b: 'Goo' };
const TEAM: Record<Color, string> = { w: C.slime, b: C.goo };

type Mode = 'move' | 'flick';

// Board rows top to bottom: rank 8 down to rank 1, so white (Slime) plays from the bottom.
const ROWS: Square[][] = Array.from({ length: 8 }, (_, row) =>
  ALL_SQUARES.filter((s) => Number(s[1]) === 8 - row),
);

export default function App() {
  const [game, setGame] = useState(() => new MessGame());
  const [, setTick] = useState(0);
  const [mode, setMode] = useState<Mode>('move');
  const [picked, setPicked] = useState<Square | null>(null);
  const [splashed, setSplashed] = useState<Square[]>([]);
  const [note, setNote] = useState('Every move leaves mess. Don’t get buried.');

  const refresh = () => setTick((t) => t + 1);
  const me = game.turn;

  const targets = useMemo<Square[]>(() => {
    if (!picked) return [];
    if (mode === 'move') return game.legalMoves().filter((m) => m.from === picked).map((m) => m.to);
    return game.flickTargets(picked);
  }, [game, picked, mode, game.fen(), game.turns.w, game.turns.b]);

  const flickable = mode === 'flick' ? game.flickSources() : [];

  function tap(s: Square) {
    if (game.result.over) return;
    if (picked && targets.includes(s)) {
      const r =
        mode === 'move'
          ? game.act({ type: 'move', from: picked, to: s })
          : game.act({ type: 'flick', from: picked, to: s });
      setPicked(null);
      setSplashed(r.splashed);
      if (r.splashed.length) setNote(`Splash! ${r.splashed.length} squares got messy.`);
      else if (mode === 'flick') setNote(`${NAME[me]} flicked mess across the board.`);
      else if (r.captured) setNote(`${NAME[me]} captured a piece.`);
      else setNote(game.inCheck() ? 'Check!' : `${NAME[game.turn]} to play.`);
      setMode('move');
      refresh();
      return;
    }
    if (mode === 'move' && game.pieceAt(s)?.color === me) setPicked(s);
    else if (mode === 'flick' && flickable.includes(s)) setPicked(s);
    else setPicked(null);
  }

  function tidy() {
    const r = game.act({ type: 'tidy' });
    if (r.ok) {
      setNote(`${NAME[me]}’s king tidied up.`);
      setPicked(null);
      setSplashed([]);
      refresh();
    }
  }

  function restart() {
    setGame(new MessGame());
    setPicked(null);
    setSplashed([]);
    setMode('move');
    setNote('Every move leaves mess. Don’t get buried.');
  }

  const result = game.result;
  const banner = result.over
    ? result.winner
      ? `${NAME[result.winner]} wins by ${result.reason === 'less-mess' ? 'less mess' : result.reason}!`
      : 'It’s a draw.'
    : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <View style={s.screen}>
      <Meter color="b" game={game} />

      <View style={s.pill}>
        <Text style={s.pillText}>
          MOVE {Math.min(game.turns.b + 1, game.rules.moveLimit)} OF {game.rules.moveLimit}
        </Text>
      </View>

      <View style={s.boardFrame}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((sq) => {
              const [f, r] = [sq.charCodeAt(0) - 97, Number(sq[1]) - 1];
              const cell = game.messAt(sq);
              const piece = game.pieceAt(sq);
              const isTarget = targets.includes(sq);
              const isPicked = picked === sq;
              const canFlick = flickable.includes(sq);
              return (
                <Pressable
                  key={sq}
                  onPress={() => tap(sq)}
                  accessibilityLabel={`${sq}${piece ? ` ${piece.color === 'w' ? 'slime' : 'goo'} ${piece.type}` : ''}${cell.level ? `, mess ${cell.level}` : ''}`}
                  style={[s.square, { backgroundColor: (f + r) % 2 === 0 ? C.dark : C.light }]}
                >
                  {cell.level > 0 && (
                    <View
                      style={[
                        s.blob,
                        {
                          backgroundColor: cell.by ? TEAM[cell.by] : C.slime,
                          opacity: 0.35 + cell.level * 0.2,
                          margin: 6 - cell.level * 2,
                          borderColor: splashed.includes(sq) ? C.yellow : 'transparent',
                        },
                      ]}
                    />
                  )}
                  {(isPicked || canFlick) && <View style={[s.ring, { borderColor: isPicked ? C.ink : C.yellow }]} />}
                  {isTarget && <View style={s.target} />}
                  {piece && (
                    <Text style={[s.piece, { color: piece.color === 'w' ? C.cream : C.ink }]}>
                      {GLYPH[piece.type]}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.note}>
        <Text style={s.noteText}>{banner ?? note}</Text>
      </View>

      {result.over ? (
        <Pressable style={s.cta} onPress={restart}>
          <Text style={s.ctaText}>Play again</Text>
        </Pressable>
      ) : (
        <View style={s.actions}>
          <Action label="Move" sub="a piece" active={mode === 'move'} onPress={() => { setMode('move'); setPicked(null); }} />
          <Action
            label="Flick mess"
            sub={`${game.flicks[me]} left`}
            active={mode === 'flick'}
            disabled={game.flickSources().length === 0}
            onPress={() => { setMode('flick'); setPicked(null); }}
          />
          <Action label="Tidy" sub="king cleans" disabled={!game.canTidy()} onPress={tidy} />
        </View>
      )}

      <Meter color="w" game={game} />
      </View>
    </SafeAreaView>
  );
}

function Meter({ color, game }: { color: Color; game: MessGame }) {
  const pct = game.meterPct(color);
  const active = game.turn === color && !game.result.over;
  return (
    <View style={s.meterRow}>
      <View style={[s.avatar, { backgroundColor: TEAM[color] }]}>
        <Text style={s.avatarText}>{NAME[color][0]}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.meterLabels}>
          <Text style={s.meterName}>{NAME[color]}{active ? ' · your turn' : ''}</Text>
          <Text style={[s.meterPct, pct >= 0.75 && { color: C.yellow }]}>BURIED {Math.round(pct * 100)}%</Text>
        </View>
        <View style={s.meterTrack}>
          <View style={[s.meterFill, { width: `${pct * 100}%`, backgroundColor: TEAM[color === 'w' ? 'b' : 'w'] }]} />
        </View>
      </View>
    </View>
  );
}

function Action(props: { label: string; sub: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[s.action, props.active && s.actionActive, props.disabled && { opacity: 0.4 }]}
    >
      <Text style={[s.actionLabel, props.active && { color: C.ink }]}>{props.label}</Text>
      <Text style={[s.actionSub, props.active && { color: C.ink }]}>{props.sub}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.grape },
  screen: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 12, justifyContent: 'center' },
  pill: { alignSelf: 'center', backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { color: C.muted, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  boardFrame: { backgroundColor: C.light, borderRadius: 22, padding: 8, shadowColor: C.ink, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
  row: { flexDirection: 'row' },
  square: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  blob: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 2 },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, margin: 2, borderRadius: 10, borderWidth: 3 },
  target: { width: '34%', aspectRatio: 1, borderRadius: 999, borderWidth: 3, borderColor: C.ink, borderStyle: 'dashed', position: 'absolute' },
  piece: { fontSize: 30, textShadowColor: C.ink, textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  note: { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  noteText: { color: C.light, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 58, borderRadius: 16, borderWidth: 2, borderColor: '#5A4790', backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  actionActive: { backgroundColor: C.slime, borderColor: C.slime },
  actionLabel: { color: C.light, fontWeight: '900', fontSize: 15 },
  actionSub: { color: C.muted, fontWeight: '800', fontSize: 11 },
  cta: { minHeight: 58, borderRadius: 18, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: C.ink, fontWeight: '900', fontSize: 20 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.ink, fontWeight: '900' },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterName: { color: C.light, fontWeight: '900', fontSize: 15 },
  meterPct: { color: C.muted, fontWeight: '900', fontSize: 13 },
  meterTrack: { height: 12, borderRadius: 999, backgroundColor: C.card, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 999 },
});
