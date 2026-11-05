# A Mess of Chess

Chess, but messy. A mobile game where every move leaves mess, you flick it onto your opponent's side, and you lose if your side gets buried.

- **Ranked:** the Mess Meter
- **Campaign:** the Messy Kingdom, starring Mess the clumsy pawn
- **Party:** House Rules, chess on a kitchen table with a cat, a dog and a toddler

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
Scan the QR code with the Expo Go app on your phone to play. Right now it's a pass-and-play Mess Meter match: Slime vs Goo on one phone.
