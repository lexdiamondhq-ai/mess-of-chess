// Wet-paint letters made by tools/paint-letters.py. `base` is tinted to the paint colour, `gloss` adds shine, shadow and the ink outline.
// Sizes are in pixels for a 300px font, so scale by fontSize / 300.
export const PAINT_LETTERS: Record<string, { base: number; gloss: number; w: number; h: number }> = {
  A: { base: require('../../assets/letters/A-base.png'), gloss: require('../../assets/letters/A-gloss.png'), w: 213, h: 430 },
  B: { base: require('../../assets/letters/B-base.png'), gloss: require('../../assets/letters/B-gloss.png'), w: 196, h: 401 },
  C: { base: require('../../assets/letters/C-base.png'), gloss: require('../../assets/letters/C-gloss.png'), w: 199, h: 470 },
  E: { base: require('../../assets/letters/E-base.png'), gloss: require('../../assets/letters/E-gloss.png'), w: 168, h: 410 },
  G: { base: require('../../assets/letters/G-base.png'), gloss: require('../../assets/letters/G-gloss.png'), w: 195, h: 412 },
  H: { base: require('../../assets/letters/H-base.png'), gloss: require('../../assets/letters/H-gloss.png'), w: 206, h: 473 },
  I: { base: require('../../assets/letters/I-base.png'), gloss: require('../../assets/letters/I-gloss.png'), w: 159, h: 473 },
  K: { base: require('../../assets/letters/K-base.png'), gloss: require('../../assets/letters/K-gloss.png'), w: 206, h: 473 },
  M: { base: require('../../assets/letters/M-base.png'), gloss: require('../../assets/letters/M-gloss.png'), w: 283, h: 422 },
  N: { base: require('../../assets/letters/N-base.png'), gloss: require('../../assets/letters/N-gloss.png'), w: 204, h: 469 },
  O: { base: require('../../assets/letters/O-base.png'), gloss: require('../../assets/letters/O-gloss.png'), w: 235, h: 401 },
  P: { base: require('../../assets/letters/P-base.png'), gloss: require('../../assets/letters/P-gloss.png'), w: 192, h: 388 },
  Q: { base: require('../../assets/letters/Q-base.png'), gloss: require('../../assets/letters/Q-gloss.png'), w: 226, h: 375 },
  R: { base: require('../../assets/letters/R-base.png'), gloss: require('../../assets/letters/R-gloss.png'), w: 190, h: 414 },
  S: { base: require('../../assets/letters/S-base.png'), gloss: require('../../assets/letters/S-gloss.png'), w: 177, h: 461 },
  T: { base: require('../../assets/letters/T-base.png'), gloss: require('../../assets/letters/T-gloss.png'), w: 174, h: 413 },
  U: { base: require('../../assets/letters/U-base.png'), gloss: require('../../assets/letters/U-gloss.png'), w: 204, h: 460 },
  W: { base: require('../../assets/letters/W-base.png'), gloss: require('../../assets/letters/W-gloss.png'), w: 300, h: 404 },
};
