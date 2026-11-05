// A Mess of Chess: Mess Meter rules engine.
// Chess legality comes from chess.js. Mess rules are layered on top.

import { Chess, type Square, type Move as ChessMove } from 'chess.js';

export type Color = 'w' | 'b';

export interface Rules {
  /** Mess added to the square a piece leaves. */
  messPerMove: number;
  /** Highest mess a single square can hold. */
  maxPerSquare: number;
  /** Total mess on your half that buries you. */
  capacity: number;
  /** Flicks each player starts with. */
  startFlicks: number;
  /** Flicks earned per capture. */
  flicksPerCapture: number;
  /** How far (in squares) a blob can be flicked. */
  flickRange: number;
  /** Your own turns that must pass before the king can tidy again. */
  tidyCooldown: number;
  /** Full moves per player before the game is decided on mess. */
  moveLimit: number;
}

export const DEFAULT_RULES: Rules = {
  messPerMove: 1,
  maxPerSquare: 3,
  capacity: 20,
  startFlicks: 2,
  flicksPerCapture: 1,
  flickRange: 3,
  tidyCooldown: 4,
  moveLimit: 40,
};

export interface MessCell {
  level: number;
  /** Who made it, for colouring. */
  by: Color | null;
}

export type Action =
  | { type: 'move'; from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' }
  | { type: 'flick'; from: Square; to: Square }
  | { type: 'tidy' };

export type Result =
  | { over: false }
  | { over: true; winner: Color | null; reason: 'checkmate' | 'buried' | 'less-mess' | 'stalemate' | 'draw' };

export interface ActionReport {
  ok: boolean;
  error?: string;
  /** Squares that got mess from a splash, in chain order. */
  splashed: Square[];
  captured?: string;
  result: Result;
}

const FILES = 'abcdefgh';

export function sq(file: number, rank: number): Square {
  return (FILES[file] + (rank + 1)) as Square;
}
export function coords(s: Square): [number, number] {
  return [FILES.indexOf(s[0]), Number(s[1]) - 1];
}
export const ALL_SQUARES: Square[] = Array.from({ length: 64 }, (_, i) => sq(i % 8, Math.floor(i / 8)));

/** White's half is ranks 1-4, black's is ranks 5-8. */
export function halfOf(s: Square): Color {
  return coords(s)[1] <= 3 ? 'w' : 'b';
}

function between(from: Square, to: Square): Square[] {
  const [f1, r1] = coords(from);
  const [f2, r2] = coords(to);
  const df = Math.sign(f2 - f1);
  const dr = Math.sign(r2 - r1);
  const straight = f1 === f2 || r1 === r2;
  const diagonal = Math.abs(f2 - f1) === Math.abs(r2 - r1);
  if (!straight && !diagonal) return [];
  const out: Square[] = [];
  let f = f1 + df;
  let r = r1 + dr;
  while (f !== f2 || r !== r2) {
    out.push(sq(f, r));
    f += df;
    r += dr;
  }
  return out;
}

function neighbours(s: Square): Square[] {
  const [f, r] = coords(s);
  const out: Square[] = [];
  for (let df = -1; df <= 1; df++)
    for (let dr = -1; dr <= 1; dr++) {
      if (!df && !dr) continue;
      const nf = f + df;
      const nr = r + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) out.push(sq(nf, nr));
    }
  return out;
}

export class MessGame {
  readonly rules: Rules;
  private chess: Chess;
  private mess = new Map<Square, MessCell>();
  flicks: Record<Color, number>;
  /** Plies since each side last tidied (starts ready). */
  private sinceTidy: Record<Color, number>;
  /** Actions taken by each side. */
  turns: Record<Color, number> = { w: 0, b: 0 };
  result: Result = { over: false };

  constructor(rules: Partial<Rules> = {}, fen?: string) {
    this.rules = { ...DEFAULT_RULES, ...rules };
    this.chess = new Chess(fen);
    this.flicks = { w: this.rules.startFlicks, b: this.rules.startFlicks };
    this.sinceTidy = { w: this.rules.tidyCooldown, b: this.rules.tidyCooldown };
    for (const s of ALL_SQUARES) this.mess.set(s, { level: 0, by: null });
  }

  // ---------- reading state ----------

  get turn(): Color {
    return this.chess.turn();
  }
  fen(): string {
    return this.chess.fen();
  }
  pieceAt(s: Square) {
    return this.chess.get(s) ?? null;
  }
  messAt(s: Square): MessCell {
    return { ...this.mess.get(s)! };
  }
  inCheck(): boolean {
    return this.chess.inCheck();
  }

  /** Total mess on a player's half. */
  meter(color: Color): number {
    let total = 0;
    for (const [s, cell] of this.mess) if (halfOf(s) === color) total += cell.level;
    return total;
  }
  /** Meter as 0-1 of capacity. */
  meterPct(color: Color): number {
    return Math.min(1, this.meter(color) / this.rules.capacity);
  }

  /** Testing and level setup: place mess directly. */
  setMess(s: Square, level: number, by: Color | null = null) {
    this.mess.set(s, { level: Math.max(0, Math.min(this.rules.maxPerSquare, level)), by: level > 0 ? by : null });
  }

  // ---------- legal actions ----------

  /** Chess moves that aren't blocked by mess. Sliders, pawn double steps and castling can't pass through mess. */
  legalMoves(): ChessMove[] {
    if (this.result.over) return [];
    return this.chess.moves({ verbose: true }).filter((m) => {
      const path = m.piece === 'n' ? [] : between(m.from, m.to);
      return path.every((p) => this.mess.get(p)!.level === 0);
    });
  }

  canTidy(): boolean {
    return !this.result.over && !this.chess.inCheck() && this.sinceTidy[this.turn] >= this.rules.tidyCooldown;
  }

  /** Flick sources: messy squares on your half that hold or touch one of your pieces. */
  flickSources(): Square[] {
    if (this.result.over || this.chess.inCheck() || this.flicks[this.turn] <= 0) return [];
    const me = this.turn;
    return ALL_SQUARES.filter((s) => {
      if (halfOf(s) !== me || this.mess.get(s)!.level === 0) return false;
      return [s, ...neighbours(s)].some((n) => this.chess.get(n)?.color === me);
    });
  }

  /** Where a blob from `from` can land: enemy half, within range, not on a king. */
  flickTargets(from: Square): Square[] {
    if (!this.flickSources().includes(from)) return [];
    const [f1, r1] = coords(from);
    const enemy: Color = this.turn === 'w' ? 'b' : 'w';
    return ALL_SQUARES.filter((s) => {
      if (halfOf(s) !== enemy) return false;
      const [f2, r2] = coords(s);
      if (Math.max(Math.abs(f2 - f1), Math.abs(r2 - r1)) > this.rules.flickRange) return false;
      return this.chess.get(s)?.type !== 'k';
    });
  }

  // ---------- doing things ----------

  act(action: Action): ActionReport {
    const fail = (error: string): ActionReport => ({ ok: false, error, splashed: [], result: this.result });
    if (this.result.over) return fail('Game is over');
    const me = this.turn;
    let splashed: Square[] = [];
    let captured: string | undefined;

    if (action.type === 'move') {
      const legal = this.legalMoves().find(
        (m) => m.from === action.from && m.to === action.to && (!m.promotion || m.promotion === (action.promotion ?? 'q')),
      );
      if (!legal) return fail('That move is blocked or illegal');
      const landedInMess = this.mess.get(legal.to)!.level > 0;
      this.chess.move({ from: legal.from, to: legal.to, promotion: legal.promotion ? (action.promotion ?? 'q') : undefined });
      this.addMess(legal.from, this.rules.messPerMove, me);
      if (legal.captured) {
        captured = legal.captured;
        this.flicks[me] += this.rules.flicksPerCapture;
        if (landedInMess) splashed = this.splash(legal.to, me);
      }
    } else if (action.type === 'flick') {
      if (!this.flickTargets(action.from).includes(action.to)) return fail('Can’t flick there');
      const blob = this.mess.get(action.from)!;
      this.mess.set(action.from, { level: 0, by: null });
      this.addMess(action.to, blob.level, me);
      this.flicks[me] -= 1;
      this.passTurn();
    } else {
      if (!this.canTidy()) return fail('The king can’t tidy yet');
      const king = ALL_SQUARES.find((s) => {
        const p = this.chess.get(s);
        return p?.type === 'k' && p.color === me;
      })!;
      for (const s of [king, ...neighbours(king)]) this.mess.set(s, { level: 0, by: null });
      this.sinceTidy[me] = -1;
      this.passTurn();
    }

    this.turns[me] += 1;
    this.sinceTidy[me] += 1;
    this.result = this.evaluate(me);
    return { ok: true, splashed, captured, result: this.result };
  }

  private addMess(s: Square, amount: number, by: Color) {
    const cell = this.mess.get(s)!;
    this.mess.set(s, { level: Math.min(this.rules.maxPerSquare, cell.level + amount), by });
  }

  /** A capture on a messy square splashes its neighbours. A neighbour pushed past the max splashes too. */
  private splash(origin: Square, by: Color): Square[] {
    const order: Square[] = [];
    const done = new Set<Square>([origin]);
    const queue: Square[] = [origin];
    while (queue.length) {
      const centre = queue.shift()!;
      for (const n of neighbours(centre)) {
        const cell = this.mess.get(n)!;
        const overflow = cell.level >= this.rules.maxPerSquare;
        this.addMess(n, 1, by);
        order.push(n);
        if (overflow && !done.has(n)) {
          done.add(n);
          queue.push(n);
        }
      }
    }
    return order;
  }

  /** Flick and tidy use a turn without moving a piece. */
  private passTurn() {
    const parts = this.chess.fen().split(' ');
    const wasBlack = parts[1] === 'b';
    parts[1] = wasBlack ? 'w' : 'b';
    parts[3] = '-';
    parts[4] = String(Number(parts[4]) + 1);
    if (wasBlack) parts[5] = String(Number(parts[5]) + 1);
    this.chess.load(parts.join(' '), { skipValidation: true });
  }

  private evaluate(mover: Color): Result {
    const other: Color = mover === 'w' ? 'b' : 'w';
    const cap = this.rules.capacity;
    // Burying yourself loses, even if you buried them too.
    if (this.meter(mover) >= cap) return { over: true, winner: other, reason: 'buried' };
    if (this.meter(other) >= cap) return { over: true, winner: mover, reason: 'buried' };

    const hasMove = this.legalMoves().length > 0;
    if (this.chess.inCheck() && !hasMove) return { over: true, winner: mover, reason: 'checkmate' };
    if (!hasMove && !this.canTidy() && this.flickSources().length === 0)
      return { over: true, winner: null, reason: 'stalemate' };
    if (this.chess.isInsufficientMaterial()) return { over: true, winner: null, reason: 'draw' };

    if (this.turns.w >= this.rules.moveLimit && this.turns.b >= this.rules.moveLimit) {
      const w = this.meter('w');
      const b = this.meter('b');
      if (w === b) return { over: true, winner: null, reason: 'draw' };
      return { over: true, winner: w < b ? 'w' : 'b', reason: 'less-mess' };
    }
    return { over: false };
  }
}
