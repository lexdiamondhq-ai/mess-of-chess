// A Mess of Chess: Paint Chess rules.
// Normal chess (chess.js), plus one rule: every square a piece lands on is painted that player's colour.
// Checkmate wins. If the game hits the move limit or would end in a draw, the most paint wins.

import { Chess, type Square, type Move } from 'chess.js';

export type Color = 'w' | 'b';
export type { Square, Move };

export interface PaintRules {
  /** Moves per player before paint decides the game. */
  moveLimit: number;
}

export const DEFAULT_RULES: PaintRules = { moveLimit: 30 };

export type EndReason = 'checkmate' | 'most-paint' | 'draw';

export type Result =
  | { over: false }
  | { over: true; winner: Color | null; reason: EndReason };

/** What just happened, so the app can play the right messy effect. */
export interface MoveReport {
  ok: boolean;
  move?: Move;
  /** Squares that got painted (or repainted) this move. */
  painted: Square[];
  /** Squares taken from the other player. */
  stolen: Square[];
  capture: boolean;
  check: boolean;
  result: Result;
}

const FILES = 'abcdefgh';
export const ALL_SQUARES: Square[] = Array.from(
  { length: 64 },
  (_, i) => (FILES[i % 8] + (Math.floor(i / 8) + 1)) as Square,
);

export class PaintGame {
  readonly rules: PaintRules;
  private chess: Chess;
  private paint = new Map<Square, Color>();
  result: Result = { over: false };

  constructor(rules: Partial<PaintRules> = {}, fen?: string) {
    this.rules = { ...DEFAULT_RULES, ...rules };
    this.chess = new Chess(fen);
  }

  get turn(): Color {
    return this.chess.turn();
  }
  /** Full moves completed by black, which is the move number shown to players. */
  get moveNumber(): number {
    return this.chess.moveNumber();
  }
  fen(): string {
    return this.chess.fen();
  }
  pieceAt(s: Square) {
    return this.chess.get(s) ?? null;
  }
  paintAt(s: Square): Color | null {
    return this.paint.get(s) ?? null;
  }
  inCheck(): boolean {
    return this.chess.inCheck();
  }
  score(color: Color): number {
    let n = 0;
    for (const c of this.paint.values()) if (c === color) n++;
    return n;
  }
  legalMoves(from?: Square): Move[] {
    if (this.result.over) return [];
    return this.chess.moves({ verbose: true, ...(from ? { square: from } : {}) });
  }

  move(from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q'): MoveReport {
    const fail: MoveReport = { ok: false, painted: [], stolen: [], capture: false, check: false, result: this.result };
    if (this.result.over) return fail;
    const legal = this.legalMoves(from).find((m) => m.to === to);
    if (!legal) return fail;
    const me = this.turn;
    const move = this.chess.move({ from, to, promotion: legal.promotion ? promotion : undefined });

    // Paint every square a piece landed on. Castling moves the rook too.
    const landed: Square[] = [move.to];
    if (move.isKingsideCastle()) landed.push((me === 'w' ? 'f1' : 'f8') as Square);
    if (move.isQueensideCastle()) landed.push((me === 'w' ? 'd1' : 'd8') as Square);
    const stolen = landed.filter((s) => this.paint.get(s) && this.paint.get(s) !== me);
    for (const s of landed) this.paint.set(s, me);

    this.result = this.evaluate(me);
    return {
      ok: true,
      move,
      painted: landed,
      stolen,
      capture: Boolean(move.captured),
      check: this.chess.inCheck(),
      result: this.result,
    };
  }

  private byPaint(): Result {
    const w = this.score('w');
    const b = this.score('b');
    if (w === b) return { over: true, winner: null, reason: 'draw' };
    return { over: true, winner: w > b ? 'w' : 'b', reason: 'most-paint' };
  }

  private evaluate(mover: Color): Result {
    if (this.chess.isCheckmate()) return { over: true, winner: mover, reason: 'checkmate' };
    // No boring draws: stalemate, repetition and the like are settled by paint.
    if (this.chess.isDraw() || this.chess.isStalemate()) return this.byPaint();
    // Move limit: both players have made their last move.
    if (mover === 'b' && this.chess.moveNumber() > this.rules.moveLimit) return this.byPaint();
    return { over: false };
  }
}
