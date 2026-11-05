import Svg, { Circle, G, Path } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';
import { splatShape } from './splatShape';

export interface SplatProps {
  color: string;
  size: number;
  seed?: number;
  arms?: number;
  dots?: number;
  drips?: number;
  /** Adds a soft highlight so the paint looks wet. */
  shine?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Splat({ color, size, seed = 1, arms, dots, drips, shine = true, style }: SplatProps) {
  const sh = splatShape(seed, { arms, dots, drips });
  return (
    <Svg width={size} height={size} viewBox="-100 -100 200 200" style={style} pointerEvents="none">
      <G>
        <Path d={sh.drips} fill={color} />
        <Path d={sh.body} fill={color} />
        {sh.dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} />
        ))}
        {shine && (
          <>
            <Path d="M-30,-34 C-18,-44 4,-46 16,-40" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={7} strokeLinecap="round" fill="none" />
            <Circle cx={26} cy={-36} r={4} fill="#FFFFFF" opacity={0.35} />
          </>
        )}
      </G>
    </Svg>
  );
}
