import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { C, edge, fill, hard } from '../theme';

/**
 * How the board is drawn.
 * - tiles: chunky separate tiles sitting in an ink tray, like a toy.
 * - dots: a printed comic page, where the dark squares are fields of ink dots.
 * - night: bold charcoal and white, so the paint glows.
 */
export type BoardSkin = 'tiles' | 'dots' | 'night';

const SKINS: BoardSkin[] = ['tiles', 'dots', 'night'];
const fromEnv = process.env.EXPO_PUBLIC_BOARD as BoardSkin | undefined;
export const BOARD_SKIN: BoardSkin = fromEnv && SKINS.includes(fromEnv) ? fromEnv : 'tiles';

const LOOK = {
  tiles: { tray: C.ink, light: C.white, dark: C.lilac, gap: 1.5, round: 0.17 },
  dots: { tray: C.white, light: C.white, dark: C.white, gap: 0, round: 0 },
  night: { tray: C.ink, light: C.white, dark: '#2B2B38', gap: 0, round: 0 },
} as const;

export const BOARD_RADIUS = 18;
const BORDER = 3;

/** Where one square's tile sits inside its cell. Painted squares and the picked ring use it too, so they line up. */
export function tileStyle(sq: number, skin: BoardSkin = BOARD_SKIN): ViewStyle {
  const { gap, round } = LOOK[skin];
  return { position: 'absolute', left: gap, top: gap, width: sq - gap * 2, height: sq - gap * 2, borderRadius: sq * round };
}

/** Painted squares are plain fills. On the flat boards they get a thin ink outline so pale paint still shows. */
export function paintStyle(sq: number, color: string, skin: BoardSkin = BOARD_SKIN): ViewStyle {
  return { ...tileStyle(sq, skin), backgroundColor: color, ...(skin === 'tiles' ? null : { borderWidth: 1.5, borderColor: C.ink }) };
}

/** The outlined tray with its hard shadow. It sits just outside the squares so they keep their full size. */
export function BoardFrame({ skin = BOARD_SKIN }: { skin?: BoardSkin }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', left: -BORDER, top: -BORDER, right: -BORDER, bottom: -BORDER, borderRadius: BOARD_RADIUS, backgroundColor: LOOK[skin].tray }, edge(BORDER), hard(6)]}
    />
  );
}

/** The empty squares of an n by n board. Put it inside a clipped view the size of the board. */
export function BoardSquares({ n, sq, skin = BOARD_SKIN }: { n: number; sq: number; skin?: BoardSkin }) {
  const look = LOOK[skin];
  const cells = Array.from({ length: n * n }, (_, i) => ({ x: i % n, y: Math.floor(i / n), dark: ((i % n) + Math.floor(i / n)) % 2 === 1 }));
  if (skin === 'dots') {
    const step = sq / 7;
    return (
      <Svg width={sq * n} height={sq * n} style={fill} pointerEvents="none">
        <Defs>
          <Pattern id="halftone" x={0} y={0} width={step} height={step} patternUnits="userSpaceOnUse">
            <Circle cx={step / 2} cy={step / 2} r={step * 0.27} fill={C.ink} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={sq * n} height={sq * n} fill={look.light} />
        {cells
          .filter((c) => c.dark)
          .map((c) => (
            <Rect key={`${c.x}-${c.y}`} x={c.x * sq} y={c.y * sq} width={sq} height={sq} fill="url(#halftone)" opacity={0.38} />
          ))}
      </Svg>
    );
  }
  return (
    <View style={[fill, { backgroundColor: look.tray }]} pointerEvents="none">
      {cells.map((c) => (
        <View key={`${c.x}-${c.y}`} style={{ position: 'absolute', left: c.x * sq, top: c.y * sq, width: sq, height: sq }}>
          <View style={[tileStyle(sq, skin), { backgroundColor: c.dark ? look.dark : look.light }]} />
        </View>
      ))}
    </View>
  );
}
