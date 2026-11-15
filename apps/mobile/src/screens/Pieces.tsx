import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Screen, Header, Pop, Body, Chip } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { Bob } from '../ui/Bob';
import { LockIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { PLAYER_SETS, SETS, type PieceType } from '../pieces';
import { C, F, edge, hard } from '../theme';

const ORDER: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];

export function Pieces() {
  const nav = useNav();
  const store = useStore();
  const { width } = useWindowDimensions();
  const cur = SETS[store.save.equipped];
  const cardW = (width - 40 - 14 - 6) / 2;
  const owned = store.save.owned.length;

  return (
    <Screen>
      <Header
        title="Your pieces"
        right={
          <Chip>
            {owned} of {PLAYER_SETS.length}
          </Chip>
        }
      />

      <Pop i={0}>
        <View style={[s.showcase, { backgroundColor: cur.paint }]}>
          <View style={s.showRow}>
            {ORDER.map((t, i) => (
              <Bob key={`${cur.id}${t}`} delay={i * 120} amount={5} tilt={5}>
                <Animated.View entering={ZoomIn.delay(i * 60).springify().damping(8)}>
                  <Image source={cur.art[t]} style={{ width: (width - 64) / 6 + (t === 'k' || t === 'q' ? 8 : 0), height: (width - 64) / 6 + 14 }} resizeMode="contain" />
                </Animated.View>
              </Bob>
            ))}
          </View>
          <View style={s.showTag}>
            <Text style={s.showName}>{cur.name}</Text>
          </View>
        </View>
      </Pop>

      <ScrollView style={{ flex: 1, marginTop: 16 }} contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {PLAYER_SETS.map((id, i) => {
          const set = SETS[id];
          const have = store.save.owned.includes(id);
          const on = store.save.equipped === id;
          return (
            <Pop key={id} i={i + 1}>
              <Bouncy
                onPress={() => (have ? store.update(() => ({ equipped: id })) : nav.go({ name: 'meter' }))}
                splash={set.paint}
                tilt={i % 2 ? 2 : -2}
                accessibilityLabel={have ? `Use ${set.name}` : `${set.name}, locked`}
              >
                <View style={[s.card, { width: cardW }, on ? [{ backgroundColor: C.blue }, hard(5)] : hard(3)]}>
                  <View style={[s.swatch, { backgroundColor: have ? set.paint : C.track }]}>
                    <Image source={set.art.k} style={[s.cardImg, !have && { tintColor: C.gray, opacity: 0.35 }]} />
                  </View>
                  <Text style={s.cardName} numberOfLines={1}>
                    {set.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {!have && <LockIcon size={12} color={C.ink} />}
                                        <Text style={s.cardSub}>{on ? 'Playing' : have ? 'Tap to use' : 'Fill the meter'}</Text>
                  </View>
                </View>
              </Bouncy>
            </Pop>
          );
        })}
      </ScrollView>
      <Body style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: C.ink }}>
        Fill the Messy Meter to unlock the next set ({Math.round((store.save.meter / METER_MAX) * 100)}% now)
      </Body>
    </Screen>
  );
}

const s = StyleSheet.create({
  showcase: { borderRadius: 24, paddingTop: 16, paddingBottom: 14, alignItems: 'center', overflow: 'hidden', ...edge(3), ...hard(5) },
  showRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 },
  showTag: { backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, marginTop: 10, transform: [{ rotate: '-2deg' }], ...edge(2.5), ...hard(3) },
  showName: { fontFamily: F.title, fontSize: 22, lineHeight: 28, color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 16, paddingRight: 6 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 7, paddingBottom: 9, alignItems: 'center', ...edge(3) },
  swatch: { width: '100%', aspectRatio: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...edge(2.5) },
  cardImg: { width: '70%', height: '100%', resizeMode: 'contain' },
  cardName: { fontFamily: F.title, color: C.ink, fontSize: 18, lineHeight: 22, marginTop: 6 },
  cardSub: { fontFamily: F.bold, color: C.ink, fontSize: 13 },
});
