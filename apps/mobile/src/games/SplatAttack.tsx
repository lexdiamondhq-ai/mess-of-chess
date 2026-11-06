import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Shell, type Phase } from './Shell';
import { Splat } from '../ui/Splat';
import { buzz } from '../ui/Bouncy';
import { useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F } from '../theme';

const TIME = 30;
const HOLES = 9;
type Pop = { id: number; set: SetId; type: PieceType; hit: boolean };

/** Whack-a-mole with paint: splat the pink pieces, leave your own alone. */
export function SplatAttack() {
  const { save } = useStore();
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [holes, setHoles] = useState<(Pop | null)[]>(Array(HOLES).fill(null));
  const n = useRef(0);
  const leftRef = useRef(TIME);
  leftRef.current = left;
  const cell = Math.min((width - 36 - 24) / 3, 130);

  useEffect(() => {
    if (phase !== 'play') return;
    const clock = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(clock);
  }, [phase]);
  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('done');
      setHoles(Array(HOLES).fill(null));
    }
  }, [left, phase]);

  // Spawner: speeds up as time runs out.
  useEffect(() => {
    if (phase !== 'play') return;
    let alive = true;
    const spawn = () => {
      if (!alive) return;
      const speed = 0.55 + (leftRef.current / TIME) * 0.45;
      setHoles((h) => {
        const free = h.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
        if (!free.length) return h;
        const at = free[Math.floor(Math.random() * free.length)];
        const friendly = Math.random() < 0.22;
        const types: PieceType[] = ['p', 'p', 'p', 'n', 'b', 'r', 'q', 'k'];
        const pop: Pop = { id: ++n.current, set: friendly ? save.equipped : 'goo', type: types[Math.floor(Math.random() * types.length)], hit: false };
        const id = pop.id;
        setTimeout(() => alive && setHoles((hh) => hh.map((p) => (p && p.id === id ? null : p))), 1000 * speed + 250);
        const next = [...h];
        next[at] = pop;
        return next;
      });
      setTimeout(spawn, 380 + Math.random() * 420 * speed);
    };
    spawn();
    return () => {
      alive = false;
    };
  }, [phase]);

  function whack(i: number) {
    const p = holes[i];
    if (!p || p.hit || phase !== 'play') return;
    const friendly = p.set !== 'goo';
    buzz(friendly ? 'heavy' : 'medium');
    setScore((s) => Math.max(0, s + (friendly ? -3 : p.type === 'k' ? 3 : p.type === 'q' ? 2 : 1)));
    setHoles((h) => h.map((q, j) => (j === i && q ? { ...q, hit: true } : q)));
    setTimeout(() => setHoles((h) => h.map((q) => (q && q.id === p.id ? null : q))), 420);
  }

  return (
    <Shell
      id="splat-attack"
      title="Splat Attack"
      rule="Tap the pink pieces as they pop up. Don’t splat your own!"
      color={C.goo}
      phase={phase}
      score={score}
      mess={(s) => Math.min(20, Math.round(s * 0.7))}
      hud={<Text style={[s.timer, left <= 5 && { color: C.goo }]}>{left}s</Text>}
      onStart={() => {
        setScore(0);
        setLeft(TIME);
        setHoles(Array(HOLES).fill(null));
        setPhase('play');
      }}
    >
      <View style={[s.grid, { width: cell * 3 + 24 }]}>
        {holes.map((p, i) => (
          <Pressable key={i} {...(Platform.OS === 'web' ? { onPress: () => whack(i) } : { onPressIn: () => whack(i) })} style={{ width: cell, height: cell * 1.15 }} accessibilityLabel={`Hole ${i + 1}`}>
            <Pot cell={cell} pop={p} />
          </Pressable>
        ))}
      </View>
      <Text style={s.legend}>Pink = +1 · Queen +2 · King +3 · Yours = −3</Text>
    </Shell>
  );
}

/** A paint pot seen from the front. Pieces rise out of the opening. */
function Pot({ cell, pop }: { cell: number; pop: Pop | null }) {
  const mouthY = cell * 0.62; // centre of the pot opening
  const mouthH = cell * 0.26;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* dark opening */}
      <View style={[s.mouth, { top: mouthY - mouthH / 2, height: mouthH, left: cell * 0.06, right: cell * 0.06, borderRadius: cell }]} />
      {/* piece, clipped at the opening so it looks like it comes out of the pot */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: -cell * 0.3, height: mouthY + cell * 0.3, overflow: 'hidden', alignItems: 'center' }}>
        {pop && <Popper key={pop.id} pop={pop} cell={cell} />}
      </View>
      {/* front of the pot */}
      <View style={[s.potFront, { top: mouthY, left: cell * 0.06, right: cell * 0.06, bottom: 0, borderBottomLeftRadius: cell * 0.22, borderBottomRightRadius: cell * 0.22 }]}>
        <View style={[s.potBand, { top: cell * 0.12 }]} />
      </View>
      <View style={[s.rim, { top: mouthY - mouthH / 2, height: mouthH, left: cell * 0.03, right: cell * 0.03, borderRadius: cell }]} />
      {pop?.hit && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', top: -cell * 0.2 }]}>
          <Splat color={pop.set === 'goo' ? SETS.goo.paint : C.ink} size={cell * 1.3} seed={pop.id * 13} drips={1} />
        </View>
      )}
    </View>
  );
}

function Popper({ pop, cell }: { pop: Pop; cell: number }) {
  const y = useSharedValue(cell);
  const squash = useSharedValue(1);
  useEffect(() => {
    y.value = withSpring(0, { damping: 10, stiffness: 260 });
  }, []);
  useEffect(() => {
    if (pop.hit) {
      squash.value = withSequence(withTiming(0.5, { duration: 70 }), withTiming(0.35, { duration: 250 }));
      y.value = withTiming(cell, { duration: 380, easing: Easing.in(Easing.quad) });
    }
  }, [pop.hit]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scaleY: squash.value }, { scaleX: 1 + (1 - squash.value) * 0.5 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: -cell * 0.1, width: cell * 0.82, height: cell * 0.82, transformOrigin: 'bottom' }, st]}>
      <Image source={SETS[pop.set].art[pop.type]} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 22, justifyContent: 'center' },
  mouth: { position: 'absolute', backgroundColor: C.ink },
  rim: { position: 'absolute', borderWidth: 4, borderColor: C.cardHi, backgroundColor: 'transparent' },
  potFront: { position: 'absolute', backgroundColor: C.card, borderWidth: 3, borderTopWidth: 0, borderColor: C.ink, overflow: 'hidden' },
  potBand: { position: 'absolute', left: 0, right: 0, height: 8, backgroundColor: C.goo, opacity: 0.8 },
  timer: { fontFamily: F.display, fontSize: 28, color: C.light },
  legend: { fontFamily: F.bold, color: C.muted, fontSize: 14, marginTop: 24, textAlign: 'center' },
});
