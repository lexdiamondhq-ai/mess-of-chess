import { it } from 'vitest';
import { MessGame } from '../src/mess';
it('sim', () => {
  const tally: Record<string, number> = {}; let len = 0;
  for (let i = 0; i < 300; i++) {
    const g = new MessGame();
    let guard = 0;
    while (!g.result.over && guard++ < 400) {
      const moves = g.legalMoves();
      const r = Math.random();
      const src = g.flickSources();
      if (src.length && r < 0.15) { const s = src[0]; const t = g.flickTargets(s); g.act({ type: 'flick', from: s, to: t[Math.floor(Math.random()*t.length)] }); }
      else if (g.canTidy() && r < 0.25) g.act({ type: 'tidy' });
      else if (moves.length) { const m = moves.find(x=>x.captured) ?? moves[Math.floor(Math.random()*moves.length)]; g.act({ type: 'move', from: m.from, to: m.to }); }
      else if (g.canTidy()) g.act({ type: 'tidy' });
      else break;
    }
    const k = g.result.over ? (g.result as any).reason : 'stuck';
    tally[k] = (tally[k] ?? 0) + 1; len += g.turns.w;
  }
  console.log(tally, 'avg moves', len / 300);
});
