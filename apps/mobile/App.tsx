import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaintGame, ALL_SQUARES, type Color, type Square } from 'mess-of-chess-engine';

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

// Paint Supplies pieces: lime for Slime (w), pink for Goo (b).
const PIECE_ART = {
  w: {
    k: require('./assets/pieces/wking.png'),
    q: require('./assets/pieces/wqueen.png'),
    r: require('./assets/pieces/wrook.png'),
    b: require('./assets/pieces/wbishop.png'),
    n: require('./assets/pieces/wknight.png'),
    p: require('./assets/pieces/wpawn.png'),
  },
  b: {
    k: require('./assets/pieces/bking.png'),
    q: require('./assets/pieces/bqueen.png'),
    r: require('./assets/pieces/brook.png'),
    b: require('./assets/pieces/bbishop.png'),
    n: require('./assets/pieces/bknight.png'),
    p: require('./assets/pieces/bpawn.png'),
  },
} as const;
const NAME: Record<Color, string> = { w: 'Slime', b: 'Goo' };
const PAINT: Record<Color, string> = { w: C.slime, b: C.goo };

// A few hand-tuned blob shapes so painted squares look splattered, not tiled.
const BLOBS = [
  { borderTopLeftRadius: 18, borderTopRightRadius: 9, borderBottomLeftRadius: 11, borderBottomRightRadius: 20 },
  { borderTopLeftRadius: 9, borderTopRightRadius: 20, borderBottomLeftRadius: 19, borderBottomRightRadius: 10 },
  { borderTopLeftRadius: 15, borderTopRightRadius: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 17 },
];

const ROWS: Square[][] = Array.from({ length: 8 }, (_, row) => ALL_SQUARES.filter((s) => Number(s[1]) === 8 - row));

type Splash = { kind: 'splat' | 'pie' | 'slime'; key: number; text: string };

export default function App() {
  const [game, setGame] = useState(() => new PaintGame());
  const [, setTick] = useState(0);
  const [picked, setPicked] = useState<Square | null>(null);
  const [fresh, setFresh] = useState<Square[]>([]);
  const [splash, setSplash] = useState<Splash | null>(null);
  const [note, setNote] = useState('Every square you land on gets your paint.');

  const me = game.turn;
  const targets = picked ? game.legalMoves(picked).map((m) => m.to) : [];

  function tap(s: Square) {
    if (game.result.over) return;
    if (picked && targets.includes(s)) {
      const r = game.move(picked, s);
      setPicked(null);
      setFresh(r.painted);
      if (r.result.over && r.result.reason === 'checkmate') {
        setSplash({ kind: 'slime', key: Date.now(), text: 'SLIMED!' });
      } else if (r.check) {
        setSplash({ kind: 'pie', key: Date.now(), text: 'PIE! Check!' });
      } else if (r.capture) {
        setSplash({ kind: 'splat', key: Date.now(), text: 'SPLAT!' });
      }
      if (r.stolen.length) setNote(`${NAME[me]} painted over ${NAME[me === 'w' ? 'b' : 'w']}'s square!`);
      else if (r.capture) setNote(`${NAME[me]} splatted a piece.`);
      else setNote(`${NAME[game.turn]} to play.`);
      setTick((t) => t + 1);
      return;
    }
    setPicked(game.pieceAt(s)?.color === me ? s : null);
  }

  function restart() {
    setGame(new PaintGame());
    setPicked(null);
    setFresh([]);
    setSplash(null);
    setNote('Every square you land on gets your paint.');
  }

  const result = game.result;
  const banner = result.over
    ? result.winner
      ? `${NAME[result.winner]} wins ${result.reason === 'checkmate' ? 'by checkmate' : 'with the most paint'}!`
      : 'Paint tie. It’s a draw.'
    : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <View style={s.screen}>
        <Player color="b" game={game} />

        <PaintBar game={game} />

        <View style={s.boardFrame}>
          {ROWS.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((sq, ci) => {
                const paint = game.paintAt(sq);
                const piece = game.pieceAt(sq);
                const isTarget = targets.includes(sq);
                return (
                  <Pressable
                    key={sq}
                    onPress={() => tap(sq)}
                    accessibilityLabel={`${sq}${piece ? ` ${NAME[piece.color]} ${piece.type}` : ''}${paint ? `, ${NAME[paint]} paint` : ''}`}
                    style={[s.square, { backgroundColor: (ri + ci) % 2 === 0 ? C.light : C.dark }]}
                  >
                    {paint && <PaintBlob color={PAINT[paint]} shape={(ri * 3 + ci) % 3} fresh={fresh.includes(sq)} />}
                    {picked === sq && <View style={s.ring} />}
                    {isTarget && <View style={[s.target, piece && s.targetCapture]} />}
                    {piece && (
                      <>
                        <View style={s.pieceShadow} />
                        <View pointerEvents="none" style={s.pieceBox}>
                          <Image
                            source={PIECE_ART[piece.color][piece.type as keyof (typeof PIECE_ART)['w']]}
                            style={s.pieceImg}
                            resizeMode="contain"
                          />
                        </View>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
          {splash && <SplashOverlay splash={splash} onDone={() => setSplash(null)} />}
        </View>

        <View style={s.note}>
          <Text style={s.noteText}>{banner ?? note}</Text>
        </View>

        {result.over && (
          <Pressable style={s.cta} onPress={restart} accessibilityRole="button">
            <Text style={s.ctaText}>Play again</Text>
          </Pressable>
        )}

        <Player color="w" game={game} />
      </View>
    </SafeAreaView>
  );
}

function PaintBlob({ color, shape, fresh }: { color: string; shape: number; fresh: boolean }) {
  const grow = useRef(new Animated.Value(fresh ? 0.2 : 1)).current;
  useEffect(() => {
    if (!fresh) return;
    grow.setValue(0.2);
    Animated.spring(grow, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  }, [fresh, color]);
  return <Animated.View style={[s.blob, BLOBS[shape], { backgroundColor: color, transform: [{ scale: grow }] }]} />;
}

function SplashOverlay({ splash, onDone }: { splash: Splash; onDone: () => void }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    t.setValue(0);
    const hold = splash.kind === 'slime';
    Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.delay(hold ? 1600 : 500),
      Animated.timing(t, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [splash.key]);
  const bg = splash.kind === 'slime' ? C.slime : splash.kind === 'pie' ? C.cream : C.yellow;
  return (
    <View pointerEvents="none" style={s.overlay}>
      <Animated.View
        style={[
          s.burst,
          { backgroundColor: bg, opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: '-6deg' }] },
        ]}
      >
        <Text style={s.burstText}>{splash.text}</Text>
      </Animated.View>
    </View>
  );
}

function PaintBar({ game }: { game: PaintGame }) {
  const w = game.score('w');
  const b = game.score('b');
  return (
    <View style={s.paintWrap}>
      <View style={s.paintBar} accessibilityLabel={`Paint: Slime ${w}, Goo ${b}`}>
        <View style={{ flex: w || 0.0001, backgroundColor: C.slime }} />
        <View style={{ flex: b || 0.0001, backgroundColor: C.goo }} />
        {w + b === 0 && <View style={{ flex: 1, backgroundColor: C.card }} />}
      </View>
      <View style={s.paintLabels}>
        <Text style={[s.paintNum, { color: C.slime }]}>{w}</Text>
        <Text style={s.moveText}>
          MOVE {Math.min(game.moveNumber, game.rules.moveLimit)} OF {game.rules.moveLimit}
        </Text>
        <Text style={[s.paintNum, { color: C.goo }]}>{b}</Text>
      </View>
    </View>
  );
}

function Player({ color, game }: { color: Color; game: PaintGame }) {
  const active = game.turn === color && !game.result.over;
  return (
    <View style={[s.player, active && { borderColor: PAINT[color] }]}>
      <View style={[s.avatar, { backgroundColor: PAINT[color] }]}>
        <Text style={s.avatarText}>{NAME[color][0]}</Text>
      </View>
      <Text style={s.playerName}>{NAME[color]}</Text>
      {active && <Text style={[s.turn, { color: PAINT[color] }]}>{game.inCheck() ? 'IN CHECK' : 'YOUR MOVE'}</Text>}
    </View>
  );
}

const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.grape },
  screen: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 12, justifyContent: 'center' },
  boardFrame: {
    backgroundColor: C.light,
    borderRadius: 22,
    padding: 8,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  row: { flexDirection: 'row' },
  square: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  blob: { ...fill, margin: 3, opacity: 0.85 },
  ring: { ...fill, margin: 2, borderRadius: 10, borderWidth: 3, borderColor: C.ink },
  target: { position: 'absolute', width: '30%', aspectRatio: 1, borderRadius: 999, backgroundColor: C.ink, opacity: 0.35 },
  targetCapture: { width: '86%', backgroundColor: 'transparent', borderWidth: 3, borderColor: C.ink, opacity: 0.5 },
  // The art overhangs the square upward a little, like a real piece standing on the board.
  pieceBox: { position: 'absolute', left: '-10%', right: '-10%', top: '-24%', bottom: '2%' },
  pieceImg: { width: '100%', height: '100%' },
  pieceShadow: { position: 'absolute', bottom: '5%', width: '50%', height: '12%', borderRadius: 999, backgroundColor: C.ink, opacity: 0.22 },
  overlay: { ...fill, alignItems: 'center', justifyContent: 'center' },
  burst: { paddingHorizontal: 26, paddingVertical: 14, borderRadius: 28, borderWidth: 4, borderColor: C.ink },
  burstText: { color: C.ink, fontSize: 34, fontWeight: '900' },
  note: { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  noteText: { color: C.light, fontSize: 14, fontWeight: '700' },
  cta: { minHeight: 58, borderRadius: 18, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: C.ink, fontWeight: '900', fontSize: 20 },
  paintWrap: { gap: 6 },
  paintBar: { height: 14, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: C.card },
  paintLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paintNum: { fontWeight: '900', fontSize: 16, minWidth: 28 },
  moveText: { color: C.muted, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  player: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  avatar: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.ink, fontWeight: '900' },
  playerName: { color: C.light, fontWeight: '900', fontSize: 16, flex: 1 },
  turn: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
