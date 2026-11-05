import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Pop, Body } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { useNav, type Route } from '../nav';
import { useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F, chunky } from '../theme';

const GAMES: { route: Route['name']; id: string; title: string; rule: string; color: string; art: [SetId, PieceType]; seed: number }[] = [
  { route: 'splat-attack', id: 'splat-attack', title: 'Splat Attack', rule: 'Tap the pink pieces as they pop up. 30 seconds.', color: C.goo, art: ['goo', 'p'], seed: 8 },
  { route: 'knight-paint', id: 'knight-paint', title: 'Knight Paint', rule: 'Hop the knight to paint every square. Don’t get stuck.', color: C.slime, art: ['slime', 'n'], seed: 21 },
  { route: 'paint-match', id: 'paint-match', title: 'Paint Match', rule: 'Flip two cards. Find all the matching pieces.', color: C.sky, art: ['ocean', 'q'], seed: 34 },
];

export function SideGames() {
  const nav = useNav();
  const { save } = useStore();
  return (
    <Screen>
      <Header title="Side games" />
      <Pop i={0}>
        <Body style={{ marginBottom: 16 }}>Quick little messes. Every one fills your Messy Meter.</Body>
      </Pop>
      <View style={{ gap: 16 }}>
        {GAMES.map((g, i) => (
          <Pop key={g.id} i={i + 1}>
            <Bouncy onPress={() => nav.go({ name: g.route } as Route)} splash={g.color} tilt={i % 2 ? 2 : -2} accessibilityLabel={g.title}>
              <View style={[s.card, chunky(7)]}>
                <View style={[s.art, { backgroundColor: g.color }]}>
                  <View style={s.artSplat}>
                    <Splat color="#FFFFFF" size={150} seed={g.seed} shine={false} drips={0} />
                  </View>
                  <Image source={SETS[g.art[0]].art[g.art[1]]} style={s.img} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.title}>{g.title}</Text>
                  <Text style={s.rule}>{g.rule}</Text>
                  {save.best[g.id] !== undefined && <Text style={[s.best, { color: g.color }]}>BEST {save.best[g.id]}</Text>}
                </View>
              </View>
            </Bouncy>
          </Pop>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 26, borderWidth: 3, borderColor: C.ink, padding: 12 },
  art: { width: 92, height: 92, borderRadius: 20, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artSplat: { position: 'absolute', opacity: 0.35 },
  img: { width: 84, height: 84 },
  title: { fontFamily: F.display, fontSize: 26, color: C.light },
  rule: { fontFamily: F.bold, fontSize: 14, color: C.muted, lineHeight: 19 },
  best: { fontFamily: F.black, fontSize: 12, letterSpacing: 1, marginTop: 2 },
});
