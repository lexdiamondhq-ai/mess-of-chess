import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Pop, Body } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { useNav, type Route } from '../nav';
import { useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F } from '../theme';

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
        <Body style={{ marginBottom: 18 }}>Quick little messes. Every one fills your Messy Meter.</Body>
      </Pop>
      <View style={{ gap: 12 }}>
        {GAMES.map((g, i) => (
          <Pop key={g.id} i={i + 1}>
            <Bouncy onPress={() => nav.go({ name: g.route } as Route)} splash={g.color} tilt={i % 2 ? 1.5 : -1.5} accessibilityLabel={`${g.title}. ${g.rule}`}>
              <View style={s.card}>
                <View style={[s.art, { backgroundColor: g.color }]}>
                  <View style={s.artSplat}>
                    <Splat color={C.white} size={150} seed={g.seed} />
                  </View>
                  <Image source={SETS[g.art[0]].art[g.art[1]]} style={s.img} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.title}>{g.title}</Text>
                  <Text style={s.rule}>{g.rule}</Text>
                  {save.best[g.id] !== undefined && <Text style={s.best}>Best {save.best[g.id]}</Text>}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderRadius: 26, padding: 12 },
  art: { width: 92, height: 92, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artSplat: { position: 'absolute', opacity: 0.4 },
  img: { width: 84, height: 84 },
  title: { fontFamily: F.title, fontSize: 22, color: C.ink, letterSpacing: -0.5 },
  rule: { fontFamily: F.body, fontSize: 14, color: C.gray, lineHeight: 19 },
  best: { fontFamily: F.bold, fontSize: 13, color: C.ink, marginTop: 2 },
});
