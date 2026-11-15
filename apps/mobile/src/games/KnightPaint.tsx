import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Shell, type Phase } from './Shell';
import { buzz } from '../ui/Bouncy';
import { useStore } from '../store';
import { SETS } from '../pieces';
import { C, F, edge, fill } from '../theme';
import { BOARD_RADIUS, BoardFrame, BoardSquares, paintStyle } from '../ui/Board';

const N = 5;
const JUMPS = [
  [1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1],
];
const key = (x: number, y: number) => y * N + x;

function hops(at: number, painted: Set<number>) {
  const x = at % N, y = Math.floor(at / N);
  return JUMPS.map(([dx, dy]) => [x + dx, y + dy])
    .filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !painted.has(key(a, b)))
    .map(([a, b]) => key(a, b));
}

/** Hop a knight around a 5x5 board. Every square it lands on gets painted. */
export function KnightPaint() {
  const { save } = useStore();
  const set = SETS[save.equipped];
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('intro');
  const [at, setAt] = useState(0);
  const [painted, setPainted] = useState<Set<number>>(new Set([0]));
  const [from, setFrom] = useState<{ dx: number; dy: number; n: number } | null>(null);
  const size = Math.floor(Math.min(width - 52, 420) / N) * N;
  const cell = size / N;
  const moves = hops(at, painted);

  function hop(to: number) {
    if (phase !== 'play' || !moves.includes(to)) return;
    buzz('light');
    const next = new Set(painted);
    next.add(to);
    setFrom({ dx: ((at % N) - (to % N)) * cell, dy: (Math.floor(at / N) - Math.floor(to / N)) * cell, n: next.size });
    setAt(to);
    setPainted(next);
    if (!hops(to, next).length) setTimeout(() => setPhase('done'), 900);
  }

  return (
    <Shell
      id="knight-paint"
      title="Knight Paint"
      rule="Hop the knight in an L to paint squares. Paint them all before you get stuck!"
      color={C.slime}
      phase={phase}
      score={painted.size}
      scoreLabel="Squares painted"
      mess={(s) => Math.min(20, Math.round(s * 0.8))}
      hud={<Text style={s.hud}>{painted.size} / {N * N}</Text>}
      onStart={() => {
        setAt(0);
        setPainted(new Set([0]));
        setFrom(null);
        setPhase('play');
      }}
    >
      <View style={{ width: size, height: size }}>
        <BoardFrame />
        <View style={s.clip} pointerEvents="none">
          <BoardSquares n={N} sq={cell} />
          {[...painted].map((i) => (
            <View key={`p${i}`} pointerEvents="none" style={[s.cell, { left: (i % N) * cell, top: Math.floor(i / N) * cell, width: cell, height: cell }]}>
              <Animated.View entering={ZoomIn.springify().damping(9)} style={paintStyle(cell, set.paint)} />
            </View>
          ))}
        </View>
        {Array.from({ length: N * N }, (_, i) => {
          const can = moves.includes(i) && phase === 'play';
          return (
            <Pressable key={i} onPress={() => hop(i)} accessibilityLabel={`Square ${i + 1}${can ? ', can hop here' : ''}`}
              style={[s.cell, { left: (i % N) * cell, top: Math.floor(i / N) * cell, width: cell, height: cell }]}>
              {can && <View style={s.dot} />}
            </Pressable>
          );
        })}
        <Knight src={set.art.n} cell={cell} x={at % N} y={Math.floor(at / N)} from={from} />
      </View>
      {phase === 'play' && <Text style={s.tip}>Tap a dot to hop there.</Text>}
    </Shell>
  );
}

function Knight({ src, cell, x, y, from }: { src: any; cell: number; x: number; y: number; from: { dx: number; dy: number; n: number } | null }) {
  const tx = useSharedValue(0), ty = useSharedValue(0), arc = useSharedValue(0);
  useEffect(() => {
    if (!from) return;
    tx.value = from.dx;
    ty.value = from.dy;
    tx.value = withSpring(0, { damping: 15, stiffness: 170 });
    ty.value = withSpring(0, { damping: 15, stiffness: 170 });
    arc.value = withSequence(withTiming(1, { duration: 150 }), withSpring(0, { damping: 8 }));
  }, [from?.n]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value - arc.value * cell * 0.4 }, { scale: 1 + arc.value * 0.15 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x * cell - cell * 0.1, top: y * cell - cell * 0.28, width: cell * 1.2, height: cell * 1.2 }, st]}>
      <Image source={src} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  clip: { ...fill, borderRadius: BOARD_RADIUS - 3, overflow: 'hidden' },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dot: { width: '28%', aspectRatio: 1, borderRadius: 99, backgroundColor: C.white, ...edge(3) },
  hud: { fontFamily: F.title, fontSize: 22, color: C.ink },
  tip: { fontFamily: F.bold, color: C.ink, fontSize: 15, marginTop: 24 },
});
