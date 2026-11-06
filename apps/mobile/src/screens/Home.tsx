import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Screen, Pop, Title, Card } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Bouncy } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { Bob } from '../ui/Bob';
import { CrownIcon, DropIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { SETS } from '../pieces';
import { C, F, chunky } from '../theme';

export function Home() {
  const nav = useNav();
  const { save } = useStore();
  const { width, height } = useWindowDimensions();
  const mine = SETS[save.equipped];
  const full = save.meter >= METER_MAX;
  const compact = height < 760;
  const hero = Math.min(width * 0.4, compact ? 130 : 170);

  return (
    <Screen tint={mine.paint}>
      <View style={s.top}>
        <Pop i={0} style={s.pill}>
          <CrownIcon />
          <Text style={s.pillText}>{save.wins} wins</Text>
        </Pop>
        <Pop i={0} style={s.pill}>
          <DropIcon />
          <Text style={s.pillText}>{save.splats} splats</Text>
        </Pop>
      </View>

      <View style={s.hero}>
        <View style={s.titleSplat}>
          <Splat color={C.yellow} size={width * 0.95} seed={23} arms={8} dots={12} drips={4} />
        </View>
        <Bob style={[s.heroPiece, { left: -6 }]} amount={10} tilt={8}>
          <Image source={mine.art.k} style={{ width: hero, height: hero, transform: [{ rotate: '-12deg' }] }} />
        </Bob>
        <Bob style={[s.heroPiece, { right: -6 }]} amount={10} tilt={-8} delay={500}>
          <Image source={SETS.goo.art.q} style={{ width: hero, height: hero, transform: [{ rotate: '12deg' }] }} />
        </Bob>
        <Pop i={1} style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center', transform: [{ rotate: '-5deg' }] }}>
          <Title size={compact ? 52 : 62} color={C.ink} style={s.titleA}>
            A MESS
          </Title>
          <Title size={compact ? 44 : 52} color={C.light} style={s.titleB}>
            OF CHESS
          </Title>
          </View>
        </Pop>
      </View>

      <Pop i={2}>
        <Bouncy onPress={() => nav.go({ name: 'meter' })} splash={C.goo} accessibilityLabel="Messy Meter">
          <Card style={{ gap: 10 }}>
            <View style={s.meterRow}>
              <Text style={s.meterLabel}>MESSY METER</Text>
              <Text style={[s.meterPct, full && { color: C.yellow }]}>{full ? 'READY!' : `${Math.round((save.meter / METER_MAX) * 100)}%`}</Text>
            </View>
            <MeterBar value={save.meter / METER_MAX} delay={500} />
            {full ? <ReadyNudge /> : <Text style={s.meterHint}>Make a mess to fill it and win new pieces</Text>}
          </Card>
        </Bouncy>
      </Pop>

      <Pop i={3} style={{ marginTop: 18 }}>
        <MessyButton label="PLAY" sub="Paint the board. Splat their pieces." size="xl" drips onPress={() => nav.go({ name: 'play' })} />
      </Pop>

      <View style={s.row}>
        <Pop i={4} style={{ flex: 1 }}>
          <MessyButton label="SIDE GAMES" color={C.goo} size="md" tilt={2} onPress={() => nav.go({ name: 'sidegames' })} />
        </Pop>
        <Pop i={5} style={{ flex: 1 }}>
          <MessyButton label="PIECES" color={C.sky} size="md" onPress={() => nav.go({ name: 'pieces' })} />
        </Pop>
      </View>
    </Screen>
  );
}

function ReadyNudge() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 420 })), -1);
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * 0.06 }] }));
  return (
    <Animated.View style={st}>
      <Text style={[s.meterHint, { color: C.yellow }]}>It’s full! Tap to splat it open!</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 99, borderWidth: 2, borderColor: C.ink, paddingHorizontal: 14, paddingVertical: 6, ...chunky(3) },
  pillText: { fontFamily: F.black, color: C.light, fontSize: 14 },
  hero: { flex: 1, minHeight: 230, alignItems: 'center', justifyContent: 'center' },
  titleSplat: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  heroPiece: { position: 'absolute', bottom: '6%' },
  titleA: { textShadowColor: C.light, letterSpacing: 1 },
  titleB: { letterSpacing: 1, marginTop: -4 },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterLabel: { fontFamily: F.display, color: C.light, fontSize: 22, letterSpacing: 0.5 },
  meterPct: { fontFamily: F.display, color: C.slime, fontSize: 22 },
  meterHint: { fontFamily: F.bold, color: C.muted, fontSize: 14 },
  row: { flexDirection: 'row', gap: 12, marginTop: 22 },
});
