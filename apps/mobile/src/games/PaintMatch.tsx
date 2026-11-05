import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Shell, type Phase } from './Shell';
import { Bouncy, buzz } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F, fill } from '../theme';

type Card = { id: number; face: string; set: SetId; type: PieceType; open: boolean; done: boolean };

const FACES: [SetId, PieceType][] = [
  ['slime', 'k'], ['goo', 'q'], ['ocean', 'n'], ['tangerine', 'r'], ['grape', 'b'], ['gold', 'p'],
];

function deal(): Card[] {
  const cards = FACES.flatMap(([set, type], i) => [0, 1].map((k) => ({ id: i * 2 + k, face: `${set}${type}`, set, type, open: false, done: false })));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Memory pairs with paint-supply pieces. Fewer flips is better. */
export function PaintMatch() {
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('intro');
  const [cards, setCards] = useState<Card[]>(deal);
  const [flips, setFlips] = useState(0);
  const [lock, setLock] = useState(false);
  const w = (width - 36 - 24) / 3;

  function flip(i: number) {
    if (phase !== 'play' || lock || cards[i].open || cards[i].done) return;
    const open = cards.filter((c) => c.open && !c.done);
    const next = cards.map((c, j) => (j === i ? { ...c, open: true } : c));
    setCards(next);
    if (open.length === 1) {
      setFlips((f) => f + 1);
      const a = open[0], b = next[i];
      if (a.face === b.face) {
        buzz('medium');
        const done = next.map((c) => (c.face === a.face ? { ...c, done: true } : c));
        setTimeout(() => {
          setCards(done);
          if (done.every((c) => c.done)) setTimeout(() => setPhase('done'), 700);
        }, 250);
      } else {
        setLock(true);
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.done ? c : { ...c, open: false })));
          setLock(false);
        }, 750);
      }
    }
  }

  return (
    <Shell
      id="paint-match"
      title="Paint Match"
      rule="Flip two cards at a time. Find all six pairs in as few tries as you can."
      color={C.sky}
      phase={phase}
      score={flips}
      scoreLabel="TRIES (FEWER IS BETTER)"
      lowerIsBetter
      mess={(s) => Math.max(6, Math.min(20, 26 - s))}
      hud={<Text style={s.hud}>{cards.filter((c) => c.done).length / 2} / 6 pairs</Text>}
      onStart={() => {
        setCards(deal());
        setFlips(0);
        setLock(false);
        setPhase('play');
      }}
    >
      <View style={s.grid}>
        {cards.map((c, i) => (
          <FlipCard key={c.id} card={c} w={w} onPress={() => flip(i)} />
        ))}
      </View>
    </Shell>
  );
}

function FlipCard({ card, w, onPress }: { card: Card; w: number; onPress: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withSpring(card.open || card.done ? 1 : 0, { damping: 13, stiffness: 180 });
  }, [card.open, card.done]);
  const back = useAnimatedStyle(() => ({ opacity: t.value < 0.5 ? 1 : 0, transform: [{ perspective: 600 }, { rotateY: `${interpolate(t.value, [0, 1], [0, 180])}deg` }] }));
  const front = useAnimatedStyle(() => ({ opacity: t.value >= 0.5 ? 1 : 0, transform: [{ perspective: 600 }, { rotateY: `${interpolate(t.value, [0, 1], [-180, 0])}deg` }] }));
  const set = SETS[card.set];
  const h = w * 1.22;
  return (
    <Bouncy onPress={onPress} accessibilityLabel={card.open || card.done ? `${set.name} piece` : 'Face-down card'}>
      <View style={{ width: w, height: h }}>
        <Animated.View style={[s.card, s.back, back]}>
          <Splat color={C.goo} size={w * 0.9} seed={card.id + 5} drips={1} shine={false} />
          <Text style={s.q}>?</Text>
        </Animated.View>
        <Animated.View style={[s.card, { backgroundColor: card.done ? set.paint : C.light }, front]}>
          {card.done && (
            <View style={{ position: 'absolute', opacity: 0.4 }}>
              <Splat color="#FFFFFF" size={w * 1.1} seed={card.id} drips={0} shine={false} />
            </View>
          )}
          <Image source={set.art[card.type]} style={{ width: w * 0.85, height: w * 0.85 }} />
        </Animated.View>
      </View>
    </Bouncy>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  card: { ...fill, borderRadius: 20, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backfaceVisibility: 'hidden' },
  back: { backgroundColor: C.card },
  q: { position: 'absolute', fontFamily: F.display, fontSize: 40, color: C.ink },
  hud: { fontFamily: F.display, fontSize: 22, color: C.light },
});
