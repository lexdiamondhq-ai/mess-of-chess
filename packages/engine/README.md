# A Mess of Chess: rules engine

Normal chess (via chess.js) plus one rule, **Paint Chess**:

> Every square a piece lands on gets painted your color.

- Checkmate wins, as normal.
- After 30 moves each, the most paint wins.
- A game that would end in a draw (stalemate, repetition and so on) is settled by paint instead.
- Landing on the other player's paint steals it. Castling paints both the king's and the rook's squares.

Everything else that's messy (splats, pies, slime) is visual and lives in the app.

`npm test` runs the rules tests.
