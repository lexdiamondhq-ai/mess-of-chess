// A small, friendly bot for Paint Chess. It looks one move ahead (two on "mean"),
// likes captures, paint and checks, and tries not to leave pieces hanging.
import { PaintGame, type Color, type Move } from './paint';

export type BotLevel = 'easy' | 'messy' | 'mean';

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function evaluate(g: PaintGame, me: Color): number {
  const r = g.result;
  if (r.over) {
    if (r.winner === me) return 1000;
    if (r.winner === null) return 0;
    return -1000;
  }
  const them: Color = me === 'w' ? 'b' : 'w';
  let material = 0;
  const fen = g.fen().split(' ')[0];
  for (const ch of fen) {
    const lower = ch.toLowerCase();
    if (!(lower in VALUE)) continue;
    const isWhite = ch !== lower;
    material += (isWhite === (me === 'w') ? 1 : -1) * VALUE[lower];
  }
  // Paint matters more as the move limit gets closer.
  const late = Math.min(1, g.moveNumber / g.rules.moveLimit);
  const paint = (g.score(me) - g.score(them)) * (0.25 + late * 0.75);
  return material * 3 + paint + (g.inCheck() ? (g.turn === them ? 0.5 : -0.5) : 0);
}

function hangingPenalty(g: PaintGame, m: Move, me: Color): number {
  const them: Color = me === 'w' ? 'b' : 'w';
  if (g.result.over) return 0;
  if (!g.attacked(m.to, them)) return 0;
  const defended = g.attacked(m.to, me);
  const v = VALUE[m.promotion ?? m.piece] * 3;
  // If it's defended, assume a trade for a pawn at worst.
  return defended ? Math.max(0, v - 3) * 0.5 : v;
}

function score1(g: PaintGame, m: Move, me: Color): number {
  const next = g.clone();
  next.move(m.from, m.to);
  return evaluate(next, me) - hangingPenalty(next, m, me);
}

export function pickMove(game: PaintGame, level: BotLevel = 'messy', rand: () => number = Math.random): Move | null {
  const moves = game.legalMoves();
  if (!moves.length) return null;
  const me = game.turn;
  if (level === 'easy') {
    // Mostly random, but grabs captures and mates when it sees them.
    const mate = moves.find((m) => {
      const n = game.clone();
      return n.move(m.from, m.to).result.over;
    });
    if (mate && rand() < 0.7) return mate;
    const caps = moves.filter((m) => m.captured);
    if (caps.length && rand() < 0.5) return caps[Math.floor(rand() * caps.length)];
    return moves[Math.floor(rand() * moves.length)];
  }
  let best: Move[] = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    let s: number;
    if (level === 'mean') {
      const next = game.clone();
      next.move(m.from, m.to);
      if (next.result.over) s = evaluate(next, me);
      else {
        // Assume the reply that hurts us most.
        let worst = Infinity;
        for (const r of next.legalMoves()) {
          const n2 = next.clone();
          n2.move(r.from, r.to);
          worst = Math.min(worst, evaluate(n2, me));
          if (worst <= -1000) break;
        }
        s = worst;
      }
    } else {
      s = score1(game, m, me);
    }
    s += rand() * (level === 'messy' ? 1.2 : 0.3);
    if (s > bestScore + 1e-9) {
      bestScore = s;
      best = [m];
    } else if (Math.abs(s - bestScore) < 1e-9) best.push(m);
  }
  return best[Math.floor(rand() * best.length)] ?? moves[0];
}
