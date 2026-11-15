import Svg, { Path } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';
import { BRUSH_BOX, BRUSH_STROKE, SPLAT_BOX, splatShape } from './splatShape';

export interface SplatProps {
  color: string;
  size: number;
  seed?: number;
  arms?: number;
  dots?: number;
  drips?: number;
  style?: StyleProp<ViewStyle>;
}

/** A flat splash of paint. */
export function Splat({ color, size, seed = 1, arms, dots, drips, style }: SplatProps) {
  const sh = splatShape(seed, { arms, dots, drips });
  return (
    <Svg width={size} height={size} viewBox={SPLAT_BOX} style={style} pointerEvents="none">
      {sh.drips ? <Path d={sh.drips} fill={color} /> : null}
      <Path d={sh.body} fill={color} />
    </Svg>
  );
}

/** One swipe of a loaded brush. Sits behind a word to highlight it. */
export function Brush({ color, width = '100%', height = '100%', style }: { color: string; width?: number | `${number}%`; height?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width={width} height={height} viewBox={BRUSH_BOX} preserveAspectRatio="none" style={style} pointerEvents="none">
      <Path d={BRUSH_STROKE} fill={color} />
    </Svg>
  );
}
