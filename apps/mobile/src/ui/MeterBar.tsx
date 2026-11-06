import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { C } from '../theme';

/** A chunky paint tube that fills with rainbow mess. Value is 0..1. */
export function MeterBar({ value, height = 30, delay = 0 }: { value: number; height?: number; delay?: number }) {
  const v = useSharedValue(0);
  const wobble = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(value, { duration: 900, easing: Easing.out(Easing.back(1.2)) }));
  }, [value]);
  useEffect(() => {
    wobble.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, v.value)) * 100}%` }));
  const edge = useAnimatedStyle(() => ({ transform: [{ translateY: wobble.value * 3 - 1.5 }] }));
  return (
    <View style={[s.tube, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[s.fill, fill]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 10" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="mess" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={C.slime} />
              <Stop offset="0.35" stopColor={C.yellow} />
              <Stop offset="0.7" stopColor={C.orange} />
              <Stop offset="1" stopColor={C.goo} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="10" fill="url(#mess)" />
        </Svg>
        <Animated.View style={[s.shine, edge]} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  tube: { backgroundColor: C.grapeDeep, borderWidth: 3, borderColor: C.ink, overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
  shine: { position: 'absolute', top: 4, left: 8, right: 8, height: 5, borderRadius: 9, backgroundColor: '#FFFFFF', opacity: 0.45 },
});
