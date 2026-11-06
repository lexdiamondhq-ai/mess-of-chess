import { useEffect, type ReactNode } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

/** Gentle floating idle animation. */
export function Bob({ children, delay = 0, amount = 8, tilt = 4, style }: { children: ReactNode; delay?: number; amount?: number; tilt?: number; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);
  const st = useAnimatedStyle(() => ({
    transform: [{ translateY: -t.value * amount }, { rotate: `${(t.value - 0.5) * tilt}deg` }],
  }));
  return <Animated.View style={[style, st]}>{children}</Animated.View>;
}
