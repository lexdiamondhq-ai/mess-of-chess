import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bouncy } from './Bouncy';
import { BackIcon, CloseIcon } from './Icons';
import { C, F, edge, hard } from '../theme';
import { useNav } from '../nav';

/** A sunny yellow poster with safe-area padding. */
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const inset = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[{ flex: 1, paddingTop: inset.top + 10, paddingBottom: inset.bottom + 14, paddingHorizontal: 20 }, style]}>{children}</View>
    </View>
  );
}

/** Staggered spring-in for screen content. */
export function Pop({ i = 0, children, style }: { i?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(160 + i * 60).springify().damping(16).stiffness(170)} style={style}>
      {children}
    </Animated.View>
  );
}

export function Title({ children, size = 44, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: F.display, fontSize: size, color, lineHeight: Math.round(size * 1.08) }, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: F.body, fontSize: 16, color: C.gray, lineHeight: 22 }, style]}>{children}</Text>;
}

/** Small all-purpose label, e.g. "3 wins". */
export function Chip({ children, icon, style }: { children: ReactNode; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.chip, style]}>
      {icon}
      <Text style={s.chipText}>{children}</Text>
    </View>
  );
}

export function BackButton({ onPress, icon = 'back' }: { onPress?: () => void; icon?: 'back' | 'close' }) {
  const nav = useNav();
  return (
    <Bouncy onPress={onPress ?? nav.back} splash={C.goo} accessibilityLabel={icon === 'back' ? 'Back' : 'Close'} style={s.back}>
      <View style={s.backInner}>{icon === 'back' ? <BackIcon /> : <CloseIcon />}</View>
    </Bouncy>
  );
}

export function Header({ title, right, icon }: { title: string; right?: ReactNode; icon?: 'back' | 'close' }) {
  return (
    <View style={s.header}>
      <BackButton icon={icon} />
      <Title size={28} style={{ flex: 1 }}>
        {title}
      </Title>
      {right}
    </View>
  );
}

/** A white sticker. Pass `raised` for pop-up cards that sit over a dimmed screen. */
export function Card({ children, style, color = C.surface, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; color?: string; raised?: boolean }) {
  return <View style={[s.card, { backgroundColor: color }, hard(raised ? 7 : 4), style]}>{children}</View>;
}

const s = StyleSheet.create({
  back: { width: 44, height: 44 },
  backInner: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', ...edge(2.5), ...hard(3) },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, minHeight: 44 },
  card: { borderRadius: 22, padding: 16, ...edge(3) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.surface, ...edge(2.5), ...hard(3) },
  chipText: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
});
