import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Screen, Header, Pop, Body, Chip } from '../ui/Screen';
import { Bouncy } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { Bob } from '../ui/Bob';
import { LockIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { PLAYER_SETS, SETS, type PieceType } from '../pieces';
import { C, F } from '../theme';

const ORDER: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];

export function Pieces() {
  const nav = useNav();
  const store = useStore();
  const { width } = useWindowDimensions();
  const cur = SETS[store.save.equipped];
  const cardW = (width - 40 - 12) / 2;
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
        <View style={s.showcase}>
          <View style={s.showSplat}>
            <Splat color={cur.paint} size={width * 0.95} seed={12} arms={7} />
          </View>
          <View style={s.showRow}>
            {ORDER.map((t, i) => (
              <Bob key={`${cur.id}${t}`} delay={i * 120} amount={5} tilt={5}>
                <Animated.View entering={ZoomIn.delay(i * 60).springify().damping(8)}>
                  <Image source={cur.art[t]} style={{ width: (width - 64) / 6 + (t === 'k' || t === 'q' ? 8 : 0), height: (width - 64) / 6 + 14 }} resizeMode="contain" />
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
                <View style={[s.card, { width: cardW }, on && { borderColor: C.ink }]}>
                  <View style={[s.swatch, { backgroundColor: have ? set.paint : C.track }]}>
                    <Image source={set.art.k} style={[s.cardImg, !have && { tintColor: C.gray, opacity: 0.35 }]} />
                  </View>
                  <Text style={s.cardName} numberOfLines={1}>
                    {set.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {!have && <LockIcon size={12} />}
                    {on && <View style={[s.onDot, { backgroundColor: set.paint }]} />}
                    <Text style={[s.cardSub, on && { color: C.ink, fontFamily: F.bold }]}>{on ? 'Playing' : have ? 'Tap to use' : 'Fill the meter'}</Text>
                  </View>
                </View>
              </Bouncy>
            </Pop>
          );
        })}
      </ScrollView>
      <Body style={{ textAlign: 'center', marginTop: 8, fontSize: 14 }}>
        Fill the Messy Meter to unlock the next set ({Math.round((store.save.meter / METER_MAX) * 100)}% now)
      </Body>
    </Screen>
  );
}

const s = StyleSheet.create({
  showcase: { backgroundColor: C.white, borderRadius: 28, borderWidth: 1.5, borderColor: C.line, paddingVertical: 18, alignItems: 'center', overflow: 'hidden' },
  showSplat: { position: 'absolute', top: -50, opacity: 0.3 },
  showRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 },
  showName: { fontFamily: F.title, fontSize: 26, color: C.ink, marginTop: 8, letterSpacing: -0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 },
  card: { backgroundColor: C.surface, borderRadius: 24, borderWidth: 2.5, borderColor: C.surface, padding: 8, alignItems: 'center' },
  swatch: { width: '100%', aspectRatio: 1.5, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: '70%', height: '100%', resizeMode: 'contain' },
  cardName: { fontFamily: F.title, color: C.ink, fontSize: 18, marginTop: 8, letterSpacing: -0.4 },
  cardSub: { fontFamily: F.body, color: C.gray, fontSize: 13 },
  onDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
});
