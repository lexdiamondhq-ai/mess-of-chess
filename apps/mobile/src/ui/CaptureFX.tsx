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
import { isLight } from './color';
import { C, F } from '../theme';

export interface Hit {
  key: number;
  kind: 'capture' | 'check' | 'mate';
  /** Big word that slams onto the screen. */
  word: string;
  /** Small line above it. */
  tag: string;
  color: string;
}

/**
 * The capture moment. A huge splat slaps onto the "glass", the captured piece's
 * name slams in on top, then the whole thing slowly slides down the screen and fades.
 */
export function CaptureFX({ hit, onDone }: { hit: Hit; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const slap = useSharedValue(0);
  const word = useSharedValue(0);
  const slide = useSharedValue(0);
  const drip = useSharedValue(0);
  const size = Math.min(width * 1.05, 520);
  const hold = hit.kind === 'mate' ? 1300 : hit.kind === 'check' ? 450 : 650;
  const fallTime = hit.kind === 'check' ? 1200 : 1900;

  useEffect(() => {
    slap.value = 0;
    word.value = 0;
    slide.value = 0;
    drip.value = 0;
    slap.value = withSpring(1, { damping: 9, stiffness: 260, mass: 0.7 });
    word.value = withDelay(110, withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2.6)) }));
    drip.value = withDelay(260, withTiming(1, { duration: hold + fallTime, easing: Easing.inOut(Easing.quad) }));
    slide.value = withDelay(
      260 + hold,
      withTiming(1, { duration: fallTime, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) runOnJS(onDone)();
      }),
    );
  }, [hit.key]);

  const glass = useAnimatedStyle(() => ({
    opacity: slap.value === 0 ? 0 : 1 - Math.max(0, slide.value - 0.45) / 0.55,
    transform: [
      { translateY: slide.value * height * 0.75 },
      { scaleY: 1 + slide.value * 0.3 },
      { scale: 0.25 + slap.value * 0.75 },
      { rotate: `${(1 - slap.value) * 25}deg` },
    ],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, word.value * 2),
    transform: [{ scale: 3.2 - word.value * 2.2 }, { rotate: `${-8 + (1 - word.value) * -12}deg` }],
  }));
  const drips = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.05 + drip.value }] }));

  const light = isLight(hit.color);
  const textColor = light ? C.ink : C.light;
  const shadow = light ? C.light : C.ink;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.center]}>
      <Animated.View style={[s.center, { width: size, height: size, marginTop: -height * 0.08 }, glass]}>
        <Splat color={hit.color} size={size} seed={hit.key % 997} arms={9} dots={14} drips={0} />
        {/* Long drips that keep running down while the splat slides. */}
        <View style={[StyleSheet.absoluteFill, { top: size * 0.55 }]}>
          {[0.27, 0.41, 0.58, 0.7].map((x, i) => (
            <Animated.View
              key={i}
              style={[
                s.drip,
                { left: x * size, width: 10 + ((i * 7) % 9), height: size * (0.32 + ((i * 13) % 5) * 0.08), backgroundColor: hit.color, transformOrigin: 'top' },
                drips,
              ]}
            />
          ))}
        </View>
        <Animated.View style={[s.center, StyleSheet.absoluteFill, wordStyle]}>
          <Text style={[s.tag, { color: textColor, textShadowColor: shadow }]}>{hit.tag}</Text>
          <Text
            style={[s.word, { color: textColor, textShadowColor: shadow, fontSize: Math.min(80, (size * 0.84) / (hit.word.length * 0.72)) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {hit.word}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
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
  word: { fontFamily: F.display, textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 0, letterSpacing: 1, maxWidth: '86%' },
  tag: { fontFamily: F.display, fontSize: 22, letterSpacing: 3, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0, marginBottom: -6 },
  drip: { position: 'absolute', top: 0, borderBottomLeftRadius: 99, borderBottomRightRadius: 99 },
});
