import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Bouncy } from './Bouncy';
import { C, F, chunky } from '../theme';

interface Props {
  label: string;
  sub?: string;
  onPress?: () => void;
  color?: string;
  textColor?: string;
  icon?: ReactNode;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  /** Paint drips hanging off the bottom edge. */
  drips?: boolean;
  disabled?: boolean;
  tilt?: number;
}

const H = { xl: 82, lg: 68, md: 56, sm: 44 };
const T = { xl: 34, lg: 26, md: 20, sm: 16 };

export function MessyButton({ label, sub, onPress, color = C.yellow, textColor = C.ink, icon, size = 'lg', style, drips = false, disabled, tilt }: Props) {
  return (
    <Bouncy onPress={onPress} splash={disabled ? undefined : color} disabled={disabled} accessibilityLabel={label} tilt={tilt} style={style}>
      <View style={[s.btn, { backgroundColor: color, minHeight: H[size], opacity: disabled ? 0.45 : 1 }, chunky(size === 'sm' ? 4 : 7)]}>
        <View style={s.gloss} />
        {icon}
        <View style={{ alignItems: icon ? 'flex-start' : 'center', flexShrink: 1 }}>
          <Text style={[s.label, { color: textColor, fontSize: T[size] }]} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
          {sub ? <Text style={[s.sub, { color: textColor }]}>{sub}</Text> : null}
        </View>
      </View>
      {drips && (
        <Svg width="100%" height={22} viewBox="0 0 300 22" preserveAspectRatio="none" style={s.drips} pointerEvents="none">
          <Path
            d="M40 0 h14 v10 a7 7 0 0 1 -14 0z M120 0 h10 v15 a5 5 0 0 1 -10 0z M210 0 h16 v7 a8 8 0 0 1 -16 0z M252 0 h9 v12 a4.5 4.5 0 0 1 -9 0z"
            fill={color}
          />
        </Svg>
      )}
    </Bouncy>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: 24,
    borderWidth: 3,
    borderColor: C.ink,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  gloss: { position: 'absolute', top: 5, left: 14, right: 14, height: 10, borderRadius: 99, backgroundColor: '#FFFFFF', opacity: 0.35 },
  label: { fontFamily: F.display, letterSpacing: 0.5 },
  sub: { fontFamily: F.bold, fontSize: 13, opacity: 0.8, marginTop: -2 },
  drips: { position: 'absolute', left: 0, right: 0, bottom: -18 },
});
