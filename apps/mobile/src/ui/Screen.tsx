import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Splat } from './Splat';
import { Bouncy } from './Bouncy';
import { C, F, chunky } from '../theme';
import { useNav } from '../nav';

const BG_SPLATS = [
  { color: C.slime, x: -0.28, y: -0.06, size: 0.85, seed: 5, o: 0.16 },
  { color: C.goo, x: 0.62, y: 0.2, size: 0.75, seed: 19, o: 0.14 },
  { color: C.yellow, x: -0.18, y: 0.7, size: 0.7, seed: 41, o: 0.11 },
  { color: C.sky, x: 0.7, y: 0.82, size: 0.6, seed: 77, o: 0.12 },
];

function Breathing({ children, delay }: { children: ReactNode; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 3200 + delay, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * 0.06 }, { rotate: `${t.value * 6}deg` }] }));
  return <Animated.View style={st}>{children}</Animated.View>;
}

/** Big soft paint splats behind every screen. */
export function Backdrop({ tint }: { tint?: string }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BG_SPLATS.map((b, i) => (
        <View key={i} style={{ position: 'absolute', left: b.x * width, top: b.y * height, opacity: b.o }}>
          <Breathing delay={i * 500}>
            <Splat color={i === 0 && tint ? tint : b.color} size={b.size * width} seed={b.seed} shine={false} />
          </Breathing>
        </View>
      ))}
    </View>
  );
}

export function Screen({ children, scroll, style, tint }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; tint?: string }) {
  const inset = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.grape }}>
      <Backdrop tint={tint} />
      <View style={[{ flex: 1, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 18 }, style]}>{children}</View>
    </View>
  );
}

/** Staggered spring-in for screen content. */
export function Pop({ i = 0, children, style }: { i?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(180 + i * 70).springify().damping(13).stiffness(160)} style={style}>
      {children}
    </Animated.View>
  );
}

export function Title({ children, size = 44, color = C.light, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      style={[
        { fontFamily: F.display, fontSize: size, color, lineHeight: size * 1.05, textShadowColor: C.ink, textShadowOffset: { width: 0, height: size / 11 }, textShadowRadius: 0 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: F.bold, fontSize: 16, color: C.muted, lineHeight: 22 }, style]}>{children}</Text>;
}

export function BackButton({ onPress, icon = 'back' }: { onPress?: () => void; icon?: 'back' | 'close' }) {
  const nav = useNav();
  return (
    <Bouncy onPress={onPress ?? nav.back} splash={C.yellow} accessibilityLabel={icon === 'back' ? 'Back' : 'Close'} style={[s.back, chunky(4)]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d={icon === 'back' ? 'M15 4 L7 12 L15 20' : 'M6 6 L18 18 M18 6 L6 18'}
          stroke={C.ink}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Bouncy>
  );
}

export function Header({ title, right, icon }: { title: string; right?: ReactNode; icon?: 'back' | 'close' }) {
  return (
    <View style={s.header}>
      <BackButton icon={icon} />
      <Title size={30} style={{ flex: 1 }}>
        {title}
      </Title>
      {right}
    </View>
  );
}

export function Card({ children, style, color = C.card }: { children: ReactNode; style?: StyleProp<ViewStyle>; color?: string }) {
  return <View style={[s.card, { backgroundColor: color }, chunky(6), style]}>{children}</View>;
}

const s = StyleSheet.create({
  back: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.yellow, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  card: { borderRadius: 26, borderWidth: 3, borderColor: C.ink, padding: 16 },
});
