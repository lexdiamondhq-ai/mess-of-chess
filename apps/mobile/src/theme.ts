// "Poster Pop": sunny yellow, thick ink outlines and hard comic-book shadows.
export const C = {
  /** Screen background. */
  paper: '#FFD60A',
  /** Cards, chips and quiet buttons. */
  surface: '#FFFFFF',
  /** Empty meter tracks and locked things. */
  track: '#F3F0E8',
  white: '#FFFFFF',
  ink: '#16161D',
  /** Secondary text. Passes contrast on yellow and on white. */
  gray: '#45454F',
  slime: '#8BE04E',
  goo: '#FF5FA2',
  yellow: '#FFD60A',
  sky: '#45B8FF',
  orange: '#FF8A3D',
  /** Soft tints for tiles that sit next to the loud colours. */
  pink: '#FF8FC0',
  blue: '#7FD0FF',
  lilac: '#CFC4FF',
  /** Dim layer behind pop-up cards. */
  scrim: 'rgba(22,22,29,0.55)',
};

export const F = {
  /** Fat rounded headline face: titles, buttons, names and numbers. */
  display: 'Bagel',
  title: 'Bagel',
  /** Small labels. */
  bold: 'DMSans-ExtraBold',
  /** Sentences. */
  body: 'DMSans-Bold',
};

/** The thick ink outline every card, button and tile wears. */
export const edge = (width = 3) => ({ borderWidth: width, borderColor: C.ink }) as const;

/** A hard, unblurred drop shadow, like a misprinted poster. */
export const hard = (depth = 4) => ({ boxShadow: `${depth}px ${depth}px 0px ${C.ink}` }) as const;

export const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
