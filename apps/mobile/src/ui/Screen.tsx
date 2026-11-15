import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bouncy } from './Bouncy';
import { BackIcon, CloseIcon } from './Icons';
import { C, F, lift, tight } from '../theme';
import { useNav } from '../nav';

/** A clean sheet of paper with safe-area padding. The paint on top is the only colour. */
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
  return <Text style={[{ fontFamily: size >= 40 ? F.display : F.title, fontSize: size, color, lineHeight: size * 1.02 }, tight(size), style]}>{children}</Text>;
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
    <Bouncy onPress={onPress ?? nav.back} splash={C.ink} accessibilityLabel={icon === 'back' ? 'Back' : 'Close'} style={s.back}>
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

/** A soft tile. Pass `raised` for pop-up cards that float over a dimmed screen. */
export function Card({ children, style, color = C.surface, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; color?: string; raised?: boolean }) {
  return <View style={[s.card, { backgroundColor: raised ? C.paper : color }, raised && lift(18), style]}>{children}</View>;
}

const s = StyleSheet.create({
  back: { width: 44, height: 44 },
  backInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, minHeight: 44 },
  card: { borderRadius: 24, padding: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: C.surface },
  chipText: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
});
