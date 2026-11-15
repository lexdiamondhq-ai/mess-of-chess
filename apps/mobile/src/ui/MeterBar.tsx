import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { C, edge } from '../theme';

/** An outlined tube that fills with paint from the left. Value is 0..1. */
export function MeterBar({ value, height = 20, delay = 0, color = C.goo }: { value: number; height?: number; delay?: number; color?: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(value, { duration: 900, easing: Easing.out(Easing.back(1.2)) }));
  }, [value]);
  const fill = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1, v.value));
    return { width: `${f * 100}%`, opacity: f > 0.01 ? 1 : 0, borderRightWidth: f > 0.985 ? 0 : 2.5 };
  });
  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[s.fill, { backgroundColor: color }, fill]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: { backgroundColor: C.track, overflow: 'hidden', ...edge(2.5) },
  fill: { height: '100%', minWidth: 0, borderColor: C.ink },
});
