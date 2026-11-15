// "Fresh Canvas": clean paper, ink-black words, and paint as the only colour.
export const C = {
  /** Screen background. */
  paper: '#FBFAF6',
  /** Tiles, chips and soft buttons. */
  surface: '#F0EDE5',
  /** Empty meter tracks and locked things. */
  track: '#E9E5DB',
  /** Hairlines around the board and white cards. */
  line: '#E2DED3',
  white: '#FFFFFF',
  ink: '#16161D',
  /** Secondary text. Passes contrast on paper and on surface. */
  gray: '#5A5A64',
  slime: '#8BE04E',
  goo: '#FF5FA2',
  yellow: '#FFD23F',
  sky: '#3DB4FF',
  orange: '#FF8A3D',
  boardLight: '#FFFFFF',
  boardDark: '#EDEAE1',
  /** Dim layer behind pop-up cards. */
  scrim: 'rgba(22,22,29,0.45)',
};

export const F = {
  /** Huge headlines (40px and up). */
  display: 'Bricolage-Display',
  /** Titles, buttons and names. */
  title: 'Bricolage-Title',
  bold: 'Bricolage-Bold',
  body: 'Bricolage-SemiBold',
};

/** Tight tracking that suits the heavy headline weights. */
export const tight = (size: number) => ({ letterSpacing: -size * 0.03 });

/** Soft shadow that lifts the board and pop-up cards off the paper. */
export const lift = (depth = 14) =>
  ({
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: depth },
    shadowOpacity: 0.16,
    shadowRadius: depth * 1.4,
    elevation: Math.round(depth / 2),
  }) as const;

export const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
