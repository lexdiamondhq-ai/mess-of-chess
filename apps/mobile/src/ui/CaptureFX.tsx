import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Splat } from './Splat';
import { C, F } from '../theme';

export interface Hit {
  key: number;
  kind: 'capture' | 'check' | 'mate';
  /** The word that gets splatted onto the screen in paint, e.g. the captured piece's name. */
  word: string;
  /** Paint colour the letters are made of. */
  color: string;
}

/** Tiny seeded random so each word splats the same way every time it renders. */
function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * The capture moment. The captured piece's name is splatted onto the glass,
 * one gloopy paint letter at a time. The letters drip, then the whole word
 * slowly slides down the screen and fades away.
 */
export function CaptureFX({ hit, onDone }: { hit: Hit; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const slide = useSharedValue(0);
  const letters = hit.word.split('');
  const fontSize = Math.min(118, (width * 0.9) / (letters.length * 0.64));
  const land = 90 + letters.length * 65;
  const hold = hit.kind === 'mate' ? 1300 : hit.kind === 'check' ? 450 : 700;
  const fallTime = hit.kind === 'check' ? 1300 : 2000;

  useEffect(() => {
    slide.value = 0;
    slide.value = withDelay(
      land + hold,
      withTiming(1, { duration: fallTime, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) runOnJS(onDone)();
      }),
    );
  }, [hit.key]);

  const fall = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, slide.value - 0.5) / 0.5,
    transform: [{ translateY: slide.value * height * 0.7 }, { scaleY: 1 + slide.value * 0.25 }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.center]}>
      <Animated.View style={[s.row, { marginTop: -height * 0.06 }, fall]}>
        {letters.map((ch, i) => (
          <PaintLetter key={`${hit.key}-${i}`} ch={ch} i={i} seed={hit.key % 1000} size={fontSize} color={hit.color} drip={land + hold + fallTime} />
        ))}
      </Animated.View>
    </View>
  );
}

function PaintLetter({ ch, i, seed, size, color, drip }: { ch: string; i: number; seed: number; size: number; color: string; drip: number }) {
  const r = (k: number) => seeded(seed + i * 17 + k);
  const slam = useSharedValue(0);
  const flow = useSharedValue(0);
  const tiltEnd = (r(1) - 0.5) * 14;
  const tiltStart = (r(2) - 0.5) * 50;
  const hasDrip = ch !== ' ' && r(3) < 0.7;
  const dripX = 0.25 + r(4) * 0.5;
  const dripLen = size * (0.35 + r(5) * 0.7);
  const lift = (r(6) - 0.5) * size * 0.16;

  useEffect(() => {
    slam.value = withDelay(90 + i * 65, withSpring(1, { damping: 7, stiffness: 320, mass: 0.6 }));
    flow.value = withDelay(260 + i * 65, withTiming(1, { duration: drip, easing: Easing.out(Easing.quad) }));
  }, []);

  const letter = useAnimatedStyle(() => ({
    opacity: Math.min(1, slam.value * 3),
    transform: [
      { translateY: lift },
      { scale: 2.6 - Math.min(slam.value, 1.2) * 1.6 + (slam.value > 1 ? 0 : 0) },
      { rotate: `${tiltStart + (tiltEnd - tiltStart) * Math.min(1, slam.value)}deg` },
    ],
  }));
  const dripStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.02 + flow.value }] }));
  const ball = useAnimatedStyle(() => ({ transform: [{ translateY: flow.value * dripLen }] }));

  if (ch === ' ') return <View style={{ width: size * 0.3 }} />;

  // Ink copies behind the paint give each letter a thick outline and a chunky drop shadow.
  const o = Math.max(2, size * 0.045);
  const outline = [
    [-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o], [0, o * 2.6], [o, o * 2.6], [-o, o * 2.6],
  ];
  const t = { fontFamily: F.display, fontSize: size, lineHeight: size * 1.08 };
  return (
    <Animated.View style={[{ marginHorizontal: -size * 0.015 }, letter]}>
      {/* splatter flicked off the letter as it hits */}
      <View style={[StyleSheet.absoluteFill, s.center]}>
        <Splat color={color} size={size * 1.25} seed={seed + i * 31} arms={6} dots={8} drips={0} shine={false} style={{ opacity: 0.9 }} />
      </View>
      {hasDrip && (
        <View style={{ position: 'absolute', left: `${dripX * 100}%`, top: size * 0.82 }}>
          <Animated.View style={[{ width: size * 0.16, height: dripLen, marginLeft: -size * 0.08, backgroundColor: color, borderColor: C.ink, borderWidth: o * 0.7, borderTopWidth: 0, borderBottomLeftRadius: 99, borderBottomRightRadius: 99, transformOrigin: 'top' }, dripStyle]} />
          <Animated.View style={[{ position: 'absolute', top: -size * 0.02, left: -size * 0.11, width: size * 0.22, height: size * 0.22, borderRadius: 99, backgroundColor: color, borderColor: C.ink, borderWidth: o * 0.7 }, ball]} />
        </View>
      )}
      {outline.map(([x, y], k) => (
        <Text key={k} style={[t, { position: 'absolute', left: x, top: y, color: C.ink }]}>
          {ch}
        </Text>
      ))}
      <Text style={[t, { color }]}>{ch}</Text>
    </Animated.View>
  );
}

/** A small burst right on the square where the capture happened. */
export function SquareBurst({ x, y, color, seed, sq }: { x: number; y: number; color: string; seed: number; sq: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withSequence(withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }), withDelay(900, withTiming(1.2, { duration: 500 })));
  }, [seed]);
  const st = useAnimatedStyle(() => ({
    opacity: t.value > 1 ? 1 - (t.value - 1) * 5 : 1,
    transform: [{ scale: Math.min(1, t.value) }],
  }));
  const size = sq * 3.4;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, st]}>
      <Splat color={color} size={size} seed={seed} arms={8} dots={12} drips={2} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: F.display, textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 0, letterSpacing: 1, maxWidth: '86%' },
  tag: { fontFamily: F.display, fontSize: 22, letterSpacing: 3, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0, marginBottom: -6 },
  drip: { position: 'absolute', top: 0, borderBottomLeftRadius: 99, borderBottomRightRadius: 99 },
});
