import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

const line = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function LockIcon({ size = 14, color = C.gray }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 11V8a5 5 0 0 1 10 0v3" stroke={color} strokeWidth={3} {...line} />
      <Rect x={4} y={10} width={16} height={12} rx={4} fill={color} />
    </Svg>
  );
}

export function CrownIcon({ size = 16, color = C.ink, fill = C.yellow }: IconProps & { fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" stroke={color} strokeWidth={2.4} {...line} fill={fill} />
    </Svg>
  );
}

export function DropIcon({ size = 16, color = C.ink, fill = C.goo }: IconProps & { fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3s6.5 6.6 6.5 11.2A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-6.8C5.5 9.6 12 3 12 3z" stroke={color} strokeWidth={2.4} {...line} fill={fill} />
    </Svg>
  );
}

export function ArrowIcon({ size = 24, color = C.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={3.6} {...line} />
    </Svg>
  );
}

export function BackIcon({ size = 20, color = C.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={3.6} {...line} />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = C.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={3.6} {...line} />
    </Svg>
  );
}

export function Dot({ size = 8, color = C.slime }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8">
      <Circle cx={4} cy={4} r={4} fill={color} />
    </Svg>
  );
}
