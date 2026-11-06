export const C = {
  grape: '#2A1A4A',
  grapeDeep: '#1E1238',
  card: '#3A2763',
  cardHi: '#4A3478',
  muted: '#CBBDF0',
  slime: '#8BE04E',
  goo: '#FF5FA2',
  yellow: '#FFD23F',
  sky: '#4FC3F7',
  orange: '#FF8A3D',
  ink: '#1A1030',
  cream: '#FFF8F0',
  light: '#FFFFFF',
  dark: '#E6DDF7',
};

export const F = {
  display: 'LilitaOne_400Regular',
  black: 'Nunito_900Black',
  bold: 'Nunito_800ExtraBold',
};

/** Chunky "sticker" shadow used on cards and buttons. */
export const chunky = (depth = 6) =>
  ({
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: depth },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: depth,
  }) as const;
export const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
