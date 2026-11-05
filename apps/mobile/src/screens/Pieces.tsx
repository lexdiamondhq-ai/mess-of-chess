import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Screen, Header, Pop, Body } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { Bob } from '../ui/Bob';
import { LockIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { PLAYER_SETS, SETS, type PieceType } from '../pieces';
import { C, F, chunky } from '../theme';

const ORDER: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];

export function Pieces() {
  const nav = useNav();
  const store = useStore();
  const { width } = useWindowDimensions();
  const cur = SETS[store.save.equipped];
  const cardW = (width - 36 - 12) / 2;
  const owned = store.save.owned.length;

  return (
    <Screen tint={cur.paint}>
      <Header
        title="Your pieces"
        right={
          <View style={s.count}>
            <Text style={s.countText}>
              {owned}/{PLAYER_SETS.length}
            </Text>
          </View>
        }
      />

      <Pop i={0}>
        <View style={[s.showcase, chunky(7)]}>
          <View style={s.showSplat}>
            <Splat color={cur.paint} size={width * 0.9} seed={12} arms={8} drips={3} />
          </View>
          <View style={s.showRow}>
            {ORDER.map((t, i) => (
              <Bob key={`${cur.id}${t}`} delay={i * 120} amount={5} tilt={5}>
                <Animated.View entering={ZoomIn.delay(i * 60).springify().damping(8)}>
                  <Image source={cur.art[t]} style={{ width: (width - 60) / 6 + (t === 'k' || t === 'q' ? 8 : 0), height: (width - 60) / 6 + 14 }} resizeMode="contain" />
                </Animated.View>
              </Bob>
            ))}
          </View>
          <Text style={s.showName}>{cur.name}</Text>
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
                <View style={[s.card, { width: cardW }, on && { borderColor: set.paint, backgroundColor: C.cardHi }, chunky(5)]}>
                  <View style={[s.swatch, { backgroundColor: have ? set.paint : C.grapeDeep }]}>
                    <Image source={set.art.k} style={[s.cardImg, !have && { tintColor: C.ink, opacity: 0.7 }]} />
                  </View>
                  <Text style={s.cardName} numberOfLines={1}>
                    {set.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {!have && <LockIcon size={12} />}
                    <Text style={[s.cardSub, on && { color: set.paint }]}>{on ? 'PLAYING' : have ? 'Tap to use' : 'Messy Meter'}</Text>
                  </View>
                </View>
              </Bouncy>
            </Pop>
          );
        })}
      </ScrollView>
      <Body style={{ textAlign: 'center', marginTop: 8 }}>
        Fill the Messy Meter to unlock the next set ({Math.round((store.save.meter / METER_MAX) * 100)}% now)
      </Body>
    </Screen>
  );
}

const s = StyleSheet.create({
  count: { backgroundColor: C.card, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: C.ink },
  countText: { fontFamily: F.display, color: C.light, fontSize: 16 },
  showcase: { backgroundColor: C.light, borderRadius: 28, borderWidth: 3, borderColor: C.ink, paddingVertical: 18, alignItems: 'center', overflow: 'hidden' },
  showSplat: { position: 'absolute', top: -40, opacity: 0.35 },
  showRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 },
  showName: { fontFamily: F.display, fontSize: 28, color: C.ink, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 22, borderWidth: 3, borderColor: C.ink, padding: 10, alignItems: 'center' },
  swatch: { width: '100%', aspectRatio: 1.5, borderRadius: 16, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: '70%', height: '100%', resizeMode: 'contain' },
  cardName: { fontFamily: F.display, color: C.light, fontSize: 20, marginTop: 8 },
  cardSub: { fontFamily: F.black, color: C.muted, fontSize: 12, letterSpacing: 0.5 },
});
