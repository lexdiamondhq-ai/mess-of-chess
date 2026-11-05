import { describe, it, expect } from 'vitest';
import { PaintGame, pickMove } from '../src/paint';

describe('bot', () => {
  it('always returns a legal move', () => {
    for (const level of ['easy', 'messy', 'mean'] as const) {
      const g = new PaintGame();
      for (let i = 0; i < 12 && !g.result.over; i++) {
        const m = pickMove(g, level);
        expect(m).not.toBeNull();
        expect(g.move(m!.from, m!.to).ok).toBe(true);
      }
    }
  });
  it('takes a free queen', () => {
    const g = new PaintGame({}, '4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1');
    const m = pickMove(g, 'messy');
    expect(m?.to).toBe('d5');
  });
  it('plays mate in one on mean', () => {
    const g = new PaintGame({}, '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
    const m = pickMove(g, 'mean');
    expect(m?.to).toBe('a8');
  });
});
