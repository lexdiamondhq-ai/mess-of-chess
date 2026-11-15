import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { C, F } from '../theme';

interface Props {
  children: string;
  size: number;
  /** Fill colour of the letters. */
  color?: string;
  /** Thickness of the ink outline. */
  stroke?: number;
  /** How far the hard shadow drops, right and down. 0 for none. */
  drop?: number;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

const RING = Array.from({ length: 16 }, (_, i) => [Math.cos((i / 16) * Math.PI * 2), Math.sin((i / 16) * Math.PI * 2)] as const);

/**
 * Sticker lettering: filled letters with a thick ink outline and a hard shadow.
 * React Native has no text stroke, so the outline is ink copies of the word fanned out around the real one.
 */
export function OutlineText({ children, size, color = C.white, stroke = 3, drop = 5, align = 'left', style }: Props) {
  const base: TextStyle = { fontFamily: F.display, fontSize: size, lineHeight: Math.round(size * 1.04), letterSpacing: size * 0.02, textAlign: align };
  const copies: [number, number][] = [];
  for (const [x, y] of RING) copies.push([x * stroke, y * stroke]);
  if (drop) {
    // Fill the path from the word to its shadow so thin strokes don't leave a gap.
    for (const t of [0.5, 1]) for (const [x, y] of RING) copies.push([x * stroke + drop * t, y * stroke + drop * t * 1.15]);
  }
  return (
    <View style={style} accessible accessibilityRole="header" accessibilityLabel={children}>
      {copies.map(([x, y], i) => (
        <Text key={i} aria-hidden importantForAccessibility="no" style={[base, { position: 'absolute', left: x, top: y, width: '100%', color: C.ink }]}>
          {children}
        </Text>
      ))}
      <Text aria-hidden importantForAccessibility="no" style={[base, { color }]}>
        {children}
      </Text>
    </View>
  );
}
