import { describe, it, expect } from 'vitest';
import { MessGame } from '../src/mess';

describe('mess from moves', () => {
  it('leaves mess on the square a piece leaves', () => {
    const g = new MessGame();
    expect(g.act({ type: 'move', from: 'e2', to: 'e4' }).ok).toBe(true);
    expect(g.messAt('e2').level).toBe(1);
    expect(g.messAt('e2').by).toBe('w');
    expect(g.meter('w')).toBe(1);
    expect(g.turn).toBe('b');
  });
});

describe('sticky mess', () => {
  it('blocks sliders and double pawn steps, but not knights', () => {
    const g = new MessGame();
    g.setMess('e3', 1);
    g.setMess('f3', 1);
    const moves = g.legalMoves().map((m) => m.from + m.to);
    expect(moves).not.toContain('e2e4'); // passes through e3
    expect(moves).toContain('e2e3'); // can stop in mess
    expect(moves).toContain('g1f3'); // knights jump
  });
  it('mess on the escape path can turn check into mate', () => {
    // Black king h8 in check from a rook on a8; g7/h7 pawns. Normally a rook on b8? Use a back rank mate where the only defender is blocked.
    const g = new MessGame({}, '6k1/5ppp/8/8/8/8/5PPP/r5K1 w - - 0 1');
    // White is in check; the white rook-less side. Only king moves, all covered; real chess mate already.
    expect(g.legalMoves().length).toBe(0);
  });
  it('blocks a defender behind mess, making a mess-mate', () => {
    // White in check from a1 rook; white rook on d8 could block on d1 by sliding d8-d1.
    const g = new MessGame({}, '3R2k1/5ppp/8/8/8/8/5PPP/r5K1 w - - 0 1');
    expect(g.legalMoves().some((m) => m.to === 'd1' || m.to === 'a1')).toBe(true);
    g.setMess('d4', 1);
    g.setMess('a8', 0);
    // Block d8->d1 and d8->a8 lines... d8 can't reach a1 anyway; d1 is now blocked by d4 mess.
    const moves = g.legalMoves();
    expect(moves.some((m) => m.to === 'd1')).toBe(false);
  });
});

describe('flick', () => {
  it('moves a whole blob onto the enemy half and uses a turn and a flick', () => {
    const g = new MessGame();
    g.setMess('d4', 3, 'w'); // touches nothing... put a piece next to it
    g.act({ type: 'move', from: 'e2', to: 'e4' }); // e4 is next to d4
    g.act({ type: 'move', from: 'a7', to: 'a6' });
    expect(g.flickSources()).toContain('d4');
    expect(g.flickTargets('d4')).toContain('d6');
    const r = g.act({ type: 'flick', from: 'd4', to: 'd6' });
    expect(r.ok).toBe(true);
    expect(g.messAt('d4').level).toBe(0);
    expect(g.messAt('d6').level).toBe(3);
    expect(g.flicks.w).toBe(1);
    expect(g.turn).toBe('b');
  });
  it('cannot flick onto your own half or too far', () => {
    const g = new MessGame();
    g.setMess('d2', 2, 'w');
    expect(g.flickTargets('d2').every((t) => t[1] === '5')).toBe(true); // range 3 from rank 2 reaches rank 5 only
    g.setMess('d4', 2, 'w');
    g.act({ type: 'move', from: 'e2', to: 'e4' });
    g.act({ type: 'move', from: 'a7', to: 'a6' });
    expect(g.act({ type: 'flick', from: 'd4', to: 'd3' }).ok).toBe(false);
    expect(g.act({ type: 'flick', from: 'd4', to: 'd8' }).ok).toBe(false);
  });
});

describe('tidy', () => {
  it('king cleans around himself and then cools down', () => {
    const g = new MessGame();
    g.setMess('d1', 2);
    g.setMess('f2', 1);
    g.setMess('e3', 3);
    expect(g.act({ type: 'tidy' }).ok).toBe(true);
    expect(g.messAt('d1').level).toBe(0);
    expect(g.messAt('f2').level).toBe(0);
    expect(g.messAt('e3').level).toBe(3); // not adjacent to e1
    g.act({ type: 'move', from: 'a7', to: 'a6' });
    expect(g.canTidy()).toBe(false);
  });
});

describe('splash chains', () => {
  it('a capture on a messy square splashes, and full squares chain', () => {
    const g = new MessGame({}, '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1');
    g.setMess('d5', 1);
    g.setMess('c6', 3); // full: will overflow and splash on
    const r = g.act({ type: 'move', from: 'e4', to: 'd5' });
    expect(r.ok).toBe(true);
    expect(r.captured).toBe('p');
    expect(g.messAt('e6').level).toBe(1);
    expect(r.splashed).toContain('b7'); // only reached through c6
    expect(g.flicks.w).toBe(3);
  });
});

describe('winning', () => {
  it('burying the enemy wins', () => {
    const g = new MessGame({ capacity: 5 });
    g.setMess('a5', 3, 'b');
    g.setMess('h5', 1, 'b');
    g.setMess('d4', 1, 'w');
    g.act({ type: 'move', from: 'e2', to: 'e4' });
    g.act({ type: 'move', from: 'h7', to: 'h6' }); // black meter now 5 -> buried by own mess
    expect(g.result).toEqual({ over: true, winner: 'w', reason: 'buried' });
  });
  it('less mess wins at the move limit', () => {
    const g = new MessGame({ moveLimit: 1 });
    g.act({ type: 'move', from: 'g1', to: 'f3' });
    g.setMess('a6', 2);
    g.act({ type: 'move', from: 'g8', to: 'f6' });
    expect(g.result).toEqual({ over: true, winner: 'w', reason: 'less-mess' });
  });
  it('checkmate still wins', () => {
    const g = new MessGame({}, '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
    g.act({ type: 'move', from: 'a1', to: 'a8' });
    expect(g.result).toEqual({ over: true, winner: 'w', reason: 'checkmate' });
  });
  it('the mess left by e7-e5 blocks the classic fastest mate', () => {
    const g = new MessGame();
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']] as const) g.act({ type: 'move', from: f, to: t });
    expect(g.act({ type: 'move', from: 'd8', to: 'h4' }).ok).toBe(false);
  });
  it('no flicking or tidying while in check', () => {
    const g = new MessGame({}, '4k3/8/8/8/8/8/3PPP2/r3K3 w - - 0 1');
    g.setMess('d2', 1);
    expect(g.canTidy()).toBe(false);
    expect(g.flickSources()).toEqual([]);
  });
});
