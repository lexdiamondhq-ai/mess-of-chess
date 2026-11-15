import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { C } from '../theme';

/** A line of wet paint that fills from the left. A drip hangs off the leading edge. Value is 0..1. */
export function MeterBar({ value, height = 16, delay = 0, color = C.slime }: { value: number; height?: number; delay?: number; color?: string }) {
  const v = useSharedValue(0);
  const drip = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(value, { duration: 900, easing: Easing.out(Easing.back(1.2)) }));
  }, [value]);
  useEffect(() => {
    drip.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, v.value)) * 100}%` }));
  const dripStyle = useAnimatedStyle(() => ({
    opacity: v.value > 0.04 && v.value < 0.98 ? 1 : 0,
    height: height * (0.75 + drip.value * 0.45),
  }));
  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[s.fill, { borderRadius: height / 2, backgroundColor: color }, fill]}>
        <Animated.View style={[s.drip, { top: height * 0.6, width: height * 0.56, borderRadius: height * 0.28, backgroundColor: color }, dripStyle]} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  track: { backgroundColor: C.track },
  fill: { height: '100%', minWidth: 0 },
  drip: { position: 'absolute', right: 1 },
});
