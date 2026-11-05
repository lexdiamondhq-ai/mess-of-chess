import { describe, it, expect } from 'vitest';
import { PaintGame } from '../src/paint';

describe('paint', () => {
  it('paints the square a piece lands on', () => {
    const g = new PaintGame();
    const r = g.move('e2', 'e4');
    expect(r.ok).toBe(true);
    expect(g.paintAt('e4')).toBe('w');
    expect(g.paintAt('e2')).toBe(null);
    expect(g.score('w')).toBe(1);
  });
  it('steals paint when landing on the other colour', () => {
    const g = new PaintGame();
    g.move('e2', 'e4');
    g.move('d7', 'd5');
    const r = g.move('e4', 'd5');
    expect(r.capture).toBe(true);
    expect(r.stolen).toEqual(['d5']);
    expect(g.score('w')).toBe(2);
    expect(g.score('b')).toBe(0);
  });
  it('castling paints both the king and rook squares', () => {
    const g = new PaintGame({}, 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const r = g.move('e1', 'g1');
    expect(r.painted.sort()).toEqual(['f1', 'g1']);
  });
  it('rejects illegal moves', () => {
    const g = new PaintGame();
    expect(g.move('e2', 'e5').ok).toBe(false);
    expect(g.turn).toBe('w');
  });
});

describe('winning', () => {
  it('checkmate wins', () => {
    const g = new PaintGame();
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']] as const) g.move(f, t);
    const r = g.move('d8', 'h4');
    expect(r.check).toBe(true);
    expect(r.result).toEqual({ over: true, winner: 'b', reason: 'checkmate' });
  });
  it('most paint wins at the move limit', () => {
    const g = new PaintGame({ moveLimit: 2 });
    g.move('e2', 'e4');
    g.move('g8', 'f6');
    g.move('d2', 'd4');
    const r = g.move('f6', 'e4'); // black steals e4: black 2, white 1
    expect(r.result).toEqual({ over: true, winner: 'b', reason: 'most-paint' });
  });
  it('equal paint at the limit is a draw', () => {
    const g = new PaintGame({ moveLimit: 1 });
    g.move('e2', 'e4');
    expect(g.move('e7', 'e5').result).toEqual({ over: true, winner: null, reason: 'draw' });
  });
  it('stalemate is settled by paint instead of a plain draw', () => {
    const g = new PaintGame({}, '7k/8/6K1/8/8/8/8/5Q2 w - - 0 1');
    const r = g.move('f1', 'f7'); // black king on h8 has no moves and isn't in check
    expect(r.result).toEqual({ over: true, winner: 'w', reason: 'most-paint' });
  });
});
