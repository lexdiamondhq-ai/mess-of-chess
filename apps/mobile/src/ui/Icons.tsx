import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { C } from '../theme';

export function LockIcon({ size = 14, color = C.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 11V8a5 5 0 0 1 10 0v3" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Rect x={4} y={10} width={16} height={12} rx={4} fill={color} />
    </Svg>
  );
}

export function CrownIcon({ size = 16, color = C.yellow }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18 L2 7 L8 11 L12 4 L16 11 L22 7 L21 18 Z" fill={color} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
      <Rect x={3} y={18} width={18} height={3.5} rx={1.5} fill={color} stroke={C.ink} strokeWidth={2} />
    </Svg>
  );
}

export function DropIcon({ size = 16, color = C.goo }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2 C12 2 4 11 4 15.5 A8 8 0 0 0 20 15.5 C20 11 12 2 12 2 Z" fill={color} stroke={C.ink} strokeWidth={2} />
      <Circle cx={9} cy={15} r={2} fill="#fff" opacity={0.6} />
    </Svg>
  );
}
