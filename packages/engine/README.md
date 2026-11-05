# A Mess of Chess: rules engine

The Mess Meter rules on top of chess.js. Pure TypeScript, no UI, so the Expo app, a web build and the server can all share it.

## Rules (V1 defaults, all tunable in `DEFAULT_RULES`)
- Normal chess, plus mess.
- Every move leaves 1 mess on the square the piece left (max 3 per square).
- **Sticky:** sliders, pawn double steps and castling can't pass *through* a messy square. They can stop on one. Knights jump over.
- **Flick** (uses your turn): pick a blob on your half that holds or touches one of your pieces and fling the whole blob up to 3 squares onto the enemy half (never onto a king). You start with 2 flicks and earn 1 per capture.
- **Tidy** (uses your turn): your king cleans his square and the 8 around him. Then he rests for 4 of your turns.
- No flicking or tidying while in check.
- **Splash chains:** a capture on a messy square adds 1 mess to every neighbour. A neighbour that was already full splashes on too.
- **Mess Meter:** the total mess on your half (white ranks 1-4, black ranks 5-8). Reach 20 and you're buried. If you bury yourself, you lose even if you buried them too.
- **Wins:** checkmate (including "mess-mate", where mess blocks every escape), burying, or less mess after 40 moves each.

## Commands
- `npm test`: rules tests
- `npm run sim`: 300 random games (random play gets buried around move 19, so the capacity is the main tuning knob)
