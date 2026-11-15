import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Bouncy } from './Bouncy';
import { isLight } from './color';
import { C, F, edge, hard } from '../theme';

interface Props {
  label: string;
  sub?: string;
  onPress?: () => void;
  /** Slime green by default. Pass another paint colour, or C.surface for a quiet white button. */
  color?: string;
  textColor?: string;
  /** Shown after the label, e.g. an arrow. */
  icon?: ReactNode;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  tilt?: number;
}

const H = { xl: 76, lg: 66, md: 56, sm: 46 };
const T = { xl: 36, lg: 26, md: 21, sm: 17 };
const R = { xl: 24, lg: 22, md: 20, sm: 16 };
const D = { xl: 6, lg: 5, md: 4, sm: 3 };

/** A chunky sticker button with an ink outline and a hard shadow. */
export function MessyButton({ label, sub, onPress, color = C.slime, textColor, icon, size = 'lg', style, disabled, tilt }: Props) {
  const text = textColor ?? (isLight(color) ? C.ink : C.white);
  return (
    <Bouncy onPress={onPress} splash={disabled ? undefined : color === C.surface ? C.goo : color} disabled={disabled} accessibilityLabel={label} tilt={tilt} style={style}>
      <View style={[s.btn, hard(D[size]), { backgroundColor: color, minHeight: H[size], borderRadius: R[size], opacity: disabled ? 0.4 : 1 }]}>
        <View style={{ alignItems: 'center', flexShrink: 1 }}>
          <Text style={[s.label, { color: text, fontSize: T[size], lineHeight: Math.round(T[size] * 1.12) }]} numberOfLines={1} adjustsFontSizeToFit>
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
  btn: { paddingHorizontal: 20, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...edge(3) },
  label: { fontFamily: F.title },
  sub: { fontFamily: F.bold, fontSize: 13, marginTop: 1 },
});
