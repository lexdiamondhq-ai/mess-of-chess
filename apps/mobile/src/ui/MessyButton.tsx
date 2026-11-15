import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Bouncy } from './Bouncy';
import { isLight } from './color';
import { C, F, tight } from '../theme';

interface Props {
  label: string;
  sub?: string;
  onPress?: () => void;
  /** Ink by default. Pass a paint colour for a loud button, or C.surface for a quiet one. */
  color?: string;
  textColor?: string;
  /** Shown after the label, e.g. an arrow. */
  icon?: ReactNode;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  /** Paint drips hanging off the bottom edge. */
  drips?: boolean;
  disabled?: boolean;
  tilt?: number;
}

const H = { xl: 72, lg: 64, md: 54, sm: 46 };
const T = { xl: 28, lg: 22, md: 18, sm: 16 };
const R = { xl: 24, lg: 22, md: 20, sm: 18 };
const DRIPS = [
  { left: '12%', w: 11, h: 16 },
  { left: '21%', w: 8, h: 9 },
  { left: '68%', w: 12, h: 22 },
  { left: '78%', w: 8, h: 12 },
] as const;

export function MessyButton({ label, sub, onPress, color = C.ink, textColor, icon, size = 'lg', style, drips = false, disabled, tilt }: Props) {
  const text = textColor ?? (isLight(color) ? C.ink : C.white);
  return (
    <Bouncy onPress={onPress} splash={disabled ? undefined : color === C.surface ? C.ink : color} disabled={disabled} accessibilityLabel={label} tilt={tilt} style={style}>
      {drips &&
        DRIPS.map((d, i) => (
          <View key={i} pointerEvents="none" style={[s.drip, { left: d.left, width: d.w, height: d.h + 10, bottom: -d.h, borderRadius: d.w / 2, backgroundColor: color }]} />
        ))}
      <View style={[s.btn, { backgroundColor: color, minHeight: H[size], borderRadius: R[size], opacity: disabled ? 0.4 : 1 }]}>
        <View style={{ alignItems: 'center', flexShrink: 1 }}>
          <Text style={[s.label, { color: text, fontSize: T[size] }, tight(T[size])]} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
          {sub ? <Text style={[s.sub, { color: text }]}>{sub}</Text> : null}
        </View>
        {icon}
      </View>
    </Bouncy>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontFamily: F.title },
  sub: { fontFamily: F.body, fontSize: 13, opacity: 0.75, marginTop: 1 },
  drip: { position: 'absolute' },
});
