import { useEffect, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { rng, smooth } from './splatShape';
import { C, edge, fill, hard } from '../theme';

/**
 * How the board is drawn. All three are messy on purpose.
 * - wet: a hand-painted board. Painted squares are gloopy puddles that run together and drip.
 * - wonky: tiles tossed into a tray, every one a bit crooked.
 * - scribble: coloured in with fat markers, well outside the lines.
 */
export type BoardSkin = 'wet' | 'wonky' | 'scribble';

const SKINS: BoardSkin[] = ['wet', 'wonky', 'scribble'];
const fromEnv = process.env.EXPO_PUBLIC_BOARD as BoardSkin | undefined;
export const BOARD_SKIN: BoardSkin = fromEnv && SKINS.includes(fromEnv) ? fromEnv : 'wet';

const LOOK = {
  wet: { tray: C.white, dark: '#BDE4FF' },
  wonky: { tray: C.ink, dark: C.lilac },
  scribble: { tray: C.white, dark: '#8EC3F5' },
} as const;

export const BOARD_RADIUS = 18;
const BORDER = 3;

// Every shape below is drawn for a square that runs 0..100, then scaled to fit.

const cache = new Map<string, unknown>();
function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

/** A wobbly rounded square, as if filled in with a loaded brush. `reach` is how far it goes from the centre. */
function blobPath(seed: number, reach: number, wobble: number) {
  return cached(`blob:${seed}:${reach}:${wobble}`, () => {
    const r = rng(seed * 131 + 7);
    const pts: [number, number][] = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      const R = reach + (r() - 0.5) * wobble * 2;
      // The 0.4 power squares the circle off, leaving soft corners.
      pts.push([50 + Math.sign(c) * Math.abs(c) ** 0.4 * R, 50 + Math.sign(s) * Math.abs(s) ** 0.4 * R]);
    }
    return smooth(pts);
  });
}

interface Wet {
  blob: string;
  /** Paint running down from the puddle, or '' on a tidy square. */
  drip: string;
  drops: { x: number; y: number; r: number }[];
}

function wetShape(seed: number): Wet {
  return cached(`wet:${seed}`, () => {
    const r = rng(seed * 57 + 3);
    let drip = '';
    if (r() < 0.6) {
      const x = 22 + r() * 56;
      const w = 11 + r() * 8;
      const end = 112 + r() * 34;
      drip = `M${x - w / 2},78L${x - w / 2},${end}A${w / 2},${w / 2} 0 0 0 ${x + w / 2},${end}L${x + w / 2},78Z`;
    }
    const drops: Wet['drops'] = [];
    const count = r() < 0.55 ? 1 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = 66 + r() * 12;
      drops.push({ x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d, r: 3 + r() * 3.5 });
    }
    return { blob: blobPath(seed, 55, 7), drip, drops };
  });
}

/** A fat marker zigzag that mostly covers the square and often misses the edges. */
function scribblePath(seed: number, passes: number, spread: number) {
  return cached(`scribble:${seed}:${passes}:${spread}`, () => {
    const r = rng(seed * 211 + 17);
    const turn = ((r() - 0.5) * 50 * Math.PI) / 180;
    const cos = Math.cos(turn), sin = Math.sin(turn);
    let d = '';
    for (let i = 0; i <= passes; i++) {
      const x = (i % 2 ? 50 + spread : 50 - spread) + (r() - 0.5) * 16;
      const y = 50 - spread + (i / passes) * spread * 2 + (r() - 0.5) * 8;
      const px = 50 + (x - 50) * cos - (y - 50) * sin;
      const py = 50 + (x - 50) * sin + (y - 50) * cos;
      d += `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return d;
  });
}

/** How crooked one tossed tile lands. */
function wonk(seed: number) {
  return cached(`wonk:${seed}`, () => {
    const r = rng(seed * 73 + 29);
    return { rotate: (r() - 0.5) * 16, dx: (r() - 0.5) * 0.09, dy: (r() - 0.5) * 0.09, size: 0.88 + r() * 0.08 };
  });
}

function wonkyTile(sq: number, seed: number, grow = 0): ViewStyle {
  const w = wonk(seed);
  const size = sq * (w.size + grow);
  return {
    position: 'absolute',
    left: (sq - size) / 2 + w.dx * sq,
    top: (sq - size) / 2 + w.dy * sq,
    width: size,
    height: size,
    borderRadius: sq * 0.16,
    transform: [{ rotate: `${w.rotate}deg` }],
  };
}

/** A neat inset square for the "picked" ring and the last-move tint, so they stay easy to read on a messy board. */
export function tileStyle(sq: number): ViewStyle {
  return { position: 'absolute', left: 2, top: 2, width: sq - 4, height: sq - 4, borderRadius: sq * 0.14 };
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
  const cells = Array.from({ length: n * n }, (_, i) => ({ i, x: i % n, y: Math.floor(i / n), dark: ((i % n) + Math.floor(i / n)) % 2 === 1 }));
  const k = sq / 100;
  if (skin === 'wonky') {
    return (
      <View style={[fill, { backgroundColor: look.tray }]} pointerEvents="none">
        {cells.map((c) => (
          <View key={c.i} style={{ position: 'absolute', left: c.x * sq, top: c.y * sq, width: sq, height: sq }}>
            <View style={[wonkyTile(sq, c.i), { backgroundColor: c.dark ? look.dark : C.white }]} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <Svg width={sq * n} height={sq * n} style={fill} pointerEvents="none">
      <Rect x={0} y={0} width={sq * n} height={sq * n} fill={look.tray} />
      {cells
        .filter((c) => c.dark)
        .map((c) => (
          <G key={c.i} transform={`translate(${c.x * sq} ${c.y * sq}) scale(${k})`}>
            {skin === 'wet' ? (
              <Path d={blobPath(c.i + 400, 48, 6)} fill={look.dark} />
            ) : (
              <Path d={scribblePath(c.i + 400, 9, 40)} fill="none" stroke={look.dark} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            )}
          </G>
        ))}
    </Svg>
  );
}

export interface PaintSpot {
  x: number;
  y: number;
  color: string;
  /** Painted by the move that just happened, so it should well up. */
  fresh?: boolean;
}

/**
 * All the paint on the board. Draw it on top of the squares but outside the board's clip, so it can run over the edge.
 * Each colour gets its ink outlines first and its fills second, which makes neighbouring squares pool into one puddle.
 */
export function BoardPaint({ n, sq, spots, skin = BOARD_SKIN }: { n: number; sq: number; spots: PaintSpot[]; skin?: BoardSkin }) {
  if (skin === 'wonky') {
    return (
      <>
        {spots.map((s) => (
          <Grow key={`${s.color}-${s.x}-${s.y}`} fresh={s.fresh} style={{ position: 'absolute', left: s.x * sq, top: s.y * sq, width: sq, height: sq }}>
            <View style={[wonkyTile(sq, s.y * n + s.x + 900, 0.08), { backgroundColor: s.color }, edge(2.5)]} />
          </Grow>
        ))}
      </>
    );
  }
  const colors = [...new Set(spots.map((s) => s.color))].sort();
  return (
    <>
      {colors.map((color) =>
        (['ink', 'fill'] as const).map((layer) =>
          spots
            .filter((s) => s.color === color)
            .map((s) => (
              <Grow key={`${color}-${layer}-${s.x}-${s.y}`} fresh={s.fresh} style={{ position: 'absolute', left: (s.x - 0.5) * sq, top: (s.y - 0.5) * sq, width: sq * 2, height: sq * 2 }}>
                <Svg width={sq * 2} height={sq * 2} viewBox="-50 -50 200 200">
                  {skin === 'wet' ? <WetSpot seed={s.y * n + s.x} color={color} layer={layer} /> : <ScribbleSpot seed={s.y * n + s.x} color={color} layer={layer} />}
                </Svg>
              </Grow>
            )),
        ),
      )}
    </>
  );
}

function WetSpot({ seed, color, layer }: { seed: number; color: string; layer: 'ink' | 'fill' }) {
  const w = wetShape(seed);
  if (layer === 'ink') {
    const ink = { fill: C.ink, stroke: C.ink, strokeWidth: 7, strokeLinejoin: 'round' } as const;
    return (
      <>
        <Path d={w.blob} {...ink} />
        {w.drip ? <Path d={w.drip} {...ink} /> : null}
        {w.drops.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r + 3.5} fill={C.ink} />
        ))}
      </>
    );
  }
  return (
    <>
      <Path d={w.blob} fill={color} />
      {w.drip ? <Path d={w.drip} fill={color} /> : null}
      {w.drops.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} />
      ))}
      {/* A wet shine in the corner */}
      <Path d="M14,30Q15,15 30,13" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" opacity={0.75} />
    </>
  );
}

function ScribbleSpot({ seed, color, layer }: { seed: number; color: string; layer: 'ink' | 'fill' }) {
  const d = scribblePath(seed, 7, 43);
  return <Path d={d} fill="none" stroke={layer === 'ink' ? C.ink : color} strokeWidth={layer === 'ink' ? 27 : 20} strokeLinecap="round" strokeLinejoin="round" />;
}

/** Fresh paint wells up from the middle of its square. */
function Grow({ fresh, style, children }: { fresh?: boolean; style: ViewStyle; children: ReactNode }) {
  const g = useSharedValue(fresh ? 0 : 1);
  useEffect(() => {
    if (fresh) g.value = withSpring(1, { damping: 11, stiffness: 190 });
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 0.3 + Math.min(1.2, g.value) * 0.7 }], opacity: Math.min(1, g.value * 2) }));
  return (
    <Animated.View pointerEvents="none" style={[style, st]}>
      {children}
    </Animated.View>
  );
}
