import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Splat } from './Splat';

let hapticsOn = true;
export function setHaptics(on: boolean) {
  hapticsOn = on;
}
export function buzz(kind: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (!hapticsOn || Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else
    Haptics.impactAsync(
      kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
}

interface Props {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Paint colour of the little splat that pops out on press. */
  splash?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Wobble direction so a row of buttons doesn't tilt in lockstep. */
  tilt?: number;
}

/** Anything tappable: squishes down, springs back with a wobble, and pops a paint splat. */
export function Bouncy({ onPress, children, style, splash, disabled, accessibilityLabel, tilt = -2 }: Props) {
  const scale = useSharedValue(1);
  const rot = useSharedValue(0);
  const pop = useSharedValue(0);
  const [seed, setSeed] = useState(1);

  const body = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rot.value}deg` }],
  }));
  const splat = useAnimatedStyle(() => ({
    opacity: pop.value === 0 ? 0 : 1 - pop.value,
    transform: [{ scale: 0.4 + pop.value * 1.1 }],
  }));

  return (
    <Pressable
      style={style}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 14, stiffness: 420 });
        rot.value = withSpring(tilt, { damping: 12, stiffness: 300 });
        buzz('light');
      }}
      onPressOut={() => {
        scale.value = withSequence(withSpring(1.06, { damping: 8, stiffness: 420 }), withSpring(1, { damping: 10, stiffness: 260 }));
        rot.value = withSequence(withSpring(-tilt * 0.8, { damping: 8, stiffness: 380 }), withSpring(0, { damping: 9, stiffness: 240 }));
      }}
      onPress={() => {
        if (Platform.OS === 'web') {
          // Web skips press-in on quick taps, so play the whole squish here.
          scale.value = withSequence(withTiming(0.9, { duration: 70 }), withSpring(1.06, { damping: 8, stiffness: 420 }), withSpring(1, { damping: 10, stiffness: 260 }));
          rot.value = withSequence(withTiming(tilt, { duration: 70 }), withSpring(-tilt * 0.8, { damping: 8, stiffness: 380 }), withSpring(0, { damping: 9, stiffness: 240 }));
        }
        if (splash) {
          setSeed((s) => s + 7);
          pop.value = 0.001;
          pop.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
        }
        onPress?.();
      }}
    >
      <Animated.View style={[{ flexGrow: 1 }, body]}>
        {splash && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View style={splat}>
              <Splat color={splash} size={220} seed={seed} shine={false} drips={0} />
            </Animated.View>
          </View>
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
}
