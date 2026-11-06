# A Mess of Chess

Chess, but messy. Normal chess rules, with every capture a splat, every check a pie in the face and checkmate a bucket of slime.

One extra rule, **Paint Chess**: every square your pieces land on gets painted your color. Checkmate wins; otherwise the most paint after 30 moves wins.

## Layout
- `packages/engine`: the rules engine (TypeScript on chess.js), shared by the app and the server
- `apps/mobile`: the Expo app (iPhone, Android and web)

## Engine
```
cd packages/engine
npm install
npm test
```

## App
```
cd apps/mobile
npm install
npx expo start
```
Scan the QR code with the Expo Go app on your phone to play.

### What's in the app
- **Home**: Play, Side Games, Pieces, and the Messy Meter.
- **Play**: Paint Chess against the Goo Bot (Easy, Messy or Mean) or pass-and-play with a friend.
- **Captures**: a big splat hits the screen, the captured piece's name slams on top, then it all slides down the glass and fades. Checks throw a pie, checkmate gets the biggest splat.
- **Messy Meter**: fills as you play (game +15, win +30, each splat +3, side games up to +20). When it's full, tap the jar until it bursts to unlock the next piece set. New players start at 50%.
- **Pieces**: 7 Paint Supplies sets to collect (Slime, Ocean, Tangerine, Grape Jelly, Liquid Gold, Marshmallow, Midnight Ink). Goo is always the opponent. Cosmetic only, never pay-to-win.
- **Side games**: Splat Attack (tap the pink pieces popping out of paint pots), Knight Paint (hop a knight to paint a 5x5 board) and Paint Match (memory pairs).

Every screen change is a paint-splat wipe, and every button squishes, wobbles and pops a little splat. Animations use Reanimated; splats are drawn with react-native-svg so they stay crisp at any size.

Code map: `App.tsx` (fonts and routes), `src/nav.tsx` (screen stack and splat transition), `src/screens`, `src/games` (side games), `src/ui` (buttons, splats, capture effect), `src/store.tsx` (saved progress), `src/pieces.ts` (piece sets).
