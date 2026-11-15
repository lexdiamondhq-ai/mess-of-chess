import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Pop, Body } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { useNav, type Route } from '../nav';
import { useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F, edge, hard } from '../theme';

const GAMES: { route: Route['name']; id: string; title: string; rule: string; color: string; art: [SetId, PieceType] }[] = [
  { route: 'splat-attack', id: 'splat-attack', title: 'Splat Attack', rule: 'Tap the pink pieces as they pop up. 30 seconds.', color: C.pink, art: ['goo', 'p'] },
  { route: 'knight-paint', id: 'knight-paint', title: 'Knight Paint', rule: 'Hop the knight to paint every square. Don’t get stuck.', color: C.slime, art: ['slime', 'n'] },
  { route: 'paint-match', id: 'paint-match', title: 'Paint Match', rule: 'Flip two cards. Find all the matching pieces.', color: C.blue, art: ['ocean', 'q'] },
];

export function SideGames() {
  const nav = useNav();
  const { save } = useStore();
  return (
    <Screen>
      <Header title="Side games" />
      <Pop i={0}>
        <Body style={{ marginBottom: 18, color: C.ink }}>Quick little messes. Every one fills your Messy Meter.</Body>
      </Pop>
      <View style={{ gap: 16 }}>
        {GAMES.map((g, i) => (
          <Pop key={g.id} i={i + 1}>
            <Bouncy onPress={() => nav.go({ name: g.route } as Route)} splash={g.color} tilt={i % 2 ? 1.5 : -1.5} accessibilityLabel={`${g.title}. ${g.rule}`}>
              <View style={s.card}>
                <View style={[s.art, { backgroundColor: g.color }]}>
                  <Image source={SETS[g.art[0]].art[g.art[1]]} style={s.img} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderRadius: 22, padding: 10, ...edge(3), ...hard(5) },
  art: { width: 92, height: 92, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...edge(2.5) },
  img: { width: 82, height: 82 },
  title: { fontFamily: F.title, fontSize: 23, lineHeight: 27, color: C.ink },
  rule: { fontFamily: F.body, fontSize: 14, color: C.gray, lineHeight: 19 },
  best: { fontFamily: F.bold, fontSize: 13, color: C.ink, marginTop: 2 },
});
