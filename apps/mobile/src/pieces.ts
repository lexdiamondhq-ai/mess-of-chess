import type { ImageSourcePropType } from 'react-native';

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type SetId = 'slime' | 'goo' | 'ocean' | 'tangerine' | 'grape' | 'gold' | 'chalk' | 'ink';

export interface PieceSet {
  id: SetId;
  name: string;
  paint: string;
  /** Text colour that reads on top of the paint colour. */
  on: string;
  blurb: string;
  art: Record<PieceType, ImageSourcePropType>;
}


export const SETS: Record<SetId, PieceSet> = {
  slime: {
    id: 'slime', name: 'Slime', paint: '#8BE04E', on: '#1A1030', blurb: 'The classic. Gloopy and green.',
    art: {
      k: require('../assets/sets/slime/king.png'), q: require('../assets/sets/slime/queen.png'),
      r: require('../assets/sets/slime/rook.png'), b: require('../assets/sets/slime/bishop.png'),
      n: require('../assets/sets/slime/knight.png'), p: require('../assets/sets/slime/pawn.png'),
    },
  },
  goo: {
    id: 'goo', name: 'Goo', paint: '#FF5FA2', on: '#1A1030', blurb: 'Pink, sticky, always up to something.',
    art: {
      k: require('../assets/sets/goo/king.png'), q: require('../assets/sets/goo/queen.png'),
      r: require('../assets/sets/goo/rook.png'), b: require('../assets/sets/goo/bishop.png'),
      n: require('../assets/sets/goo/knight.png'), p: require('../assets/sets/goo/pawn.png'),
    },
  },
  ocean: {
    id: 'ocean', name: 'Ocean', paint: '#2BA8F0', on: '#1A1030', blurb: 'Splashy blue. Mind the waves.',
    art: {
      k: require('../assets/sets/ocean/king.png'), q: require('../assets/sets/ocean/queen.png'),
      r: require('../assets/sets/ocean/rook.png'), b: require('../assets/sets/ocean/bishop.png'),
      n: require('../assets/sets/ocean/knight.png'), p: require('../assets/sets/ocean/pawn.png'),
    },
  },
  tangerine: {
    id: 'tangerine', name: 'Tangerine', paint: '#FF7A1F', on: '#1A1030', blurb: 'Zesty orange drips.',
    art: {
      k: require('../assets/sets/tangerine/king.png'), q: require('../assets/sets/tangerine/queen.png'),
      r: require('../assets/sets/tangerine/rook.png'), b: require('../assets/sets/tangerine/bishop.png'),
      n: require('../assets/sets/tangerine/knight.png'), p: require('../assets/sets/tangerine/pawn.png'),
    },
  },
  grape: {
    id: 'grape', name: 'Grape Jelly', paint: '#9B4DFF', on: '#FFFFFF', blurb: 'Deep purple and extra jiggly.',
    art: {
      k: require('../assets/sets/grape/king.png'), q: require('../assets/sets/grape/queen.png'),
      r: require('../assets/sets/grape/rook.png'), b: require('../assets/sets/grape/bishop.png'),
      n: require('../assets/sets/grape/knight.png'), p: require('../assets/sets/grape/pawn.png'),
    },
  },
  gold: {
    id: 'gold', name: 'Liquid Gold', paint: '#F5C02E', on: '#1A1030', blurb: 'Fancy. Very fancy. Still messy.',
    art: {
      k: require('../assets/sets/gold/king.png'), q: require('../assets/sets/gold/queen.png'),
      r: require('../assets/sets/gold/rook.png'), b: require('../assets/sets/gold/bishop.png'),
      n: require('../assets/sets/gold/knight.png'), p: require('../assets/sets/gold/pawn.png'),
    },
  },
  chalk: {
    id: 'chalk', name: 'Marshmallow', paint: '#F4F0FF', on: '#1A1030', blurb: 'Soft white paint, hard to keep clean.',
    art: {
      k: require('../assets/sets/chalk/king.png'), q: require('../assets/sets/chalk/queen.png'),
      r: require('../assets/sets/chalk/rook.png'), b: require('../assets/sets/chalk/bishop.png'),
      n: require('../assets/sets/chalk/knight.png'), p: require('../assets/sets/chalk/pawn.png'),
    },
  },
  ink: {
    id: 'ink', name: 'Midnight Ink', paint: '#4A4366', on: '#FFFFFF', blurb: 'Spilled ink. Spooky and smudgy.',
    art: {
      k: require('../assets/sets/ink/king.png'), q: require('../assets/sets/ink/queen.png'),
      r: require('../assets/sets/ink/rook.png'), b: require('../assets/sets/ink/bishop.png'),
      n: require('../assets/sets/ink/knight.png'), p: require('../assets/sets/ink/pawn.png'),
    },
  },
};

/** Sets the player can own and equip, in unlock order. Goo is the opponent's colour. */
export const PLAYER_SETS: SetId[] = ['slime', 'ocean', 'tangerine', 'grape', 'gold', 'chalk', 'ink'];

export const PIECE_NAME: Record<PieceType, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
};
