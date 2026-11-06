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
Scan the QR code with the Expo Go app on your phone to play. Right now it's a pass-and-play Paint Chess match: Slime vs Goo on one phone.
