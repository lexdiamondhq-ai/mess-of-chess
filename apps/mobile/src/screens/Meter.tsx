import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Screen, Header, Pop, Card, Body, Title } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { Bouncy, buzz } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F, chunky, fill } from '../theme';

const TAPS = 8;
const EARN = [
  ['Play a game', '+15'],
  ['Win a game', '+30'],
  ['Splat a piece', '+3'],
  ['Side games', 'up to +20'],
];

export function MeterScreen() {
  const nav = useNav();
  const store = useStore();
  const { width } = useWindowDimensions();
  const [taps, setTaps] = useState(0);
  const [won, setWon] = useState<SetId | 'none' | null>(null);
  const full = store.save.meter >= METER_MAX;
  const next = store.nextReward();
  const pct = store.save.meter / METER_MAX;
  const jarW = Math.min(width * 0.7, 300);
  const jarH = jarW * 1.12;

  const level = useSharedValue(0);
  const wave = useSharedValue(0);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    level.value = withDelay(350, withTiming(pct, { duration: 1100, easing: Easing.out(Easing.back(1.1)) }));
    wave.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    if (full) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1);
  }, [pct, full]);

  const fill = useAnimatedStyle(() => ({ height: `${Math.min(1, level.value) * 100}%` }));
  const waveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -wave.value * 40 }] }));
  const jar = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shake.value * 7}deg` }, { scale: 1 + pulse.value * 0.03 + Math.abs(shake.value) * 0.05 }],
  }));

  function smash() {
    if (!full || won) return;
    const n = taps + 1;
    setTaps(n);
    buzz(n >= TAPS ? 'heavy' : 'medium');
    const dir = n % 2 ? 1 : -1;
    shake.value = withSequence(withTiming(dir, { duration: 50 }), withTiming(-dir * 0.7, { duration: 70 }), withSpring(0, { damping: 5 }));
    if (n >= TAPS) {
      const id = store.claimReward();
      buzz('success');
      setWon(id ?? 'none');
    }
  }

  const reward = won && won !== 'none' ? SETS[won] : null;

  return (
    <Screen>
      <Header title="Messy Meter" />

      <Pop i={0} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Bouncy onPress={smash} disabled={!full || !!won} accessibilityLabel={full ? 'Splat the meter open' : 'Messy Meter jar'}>
          <Animated.View style={[{ width: jarW, height: jarH }, jar]}>
            <View style={[s.jar, chunky(8)]}>
              <Animated.View style={[s.fill, fill]}>
                <Animated.View style={[s.waveRow, waveStyle]}>
                  <Svg width={jarW + 80} height={22} viewBox={`0 0 ${jarW + 80} 22`}>
                    <Path d={wavePath(jarW + 80)} fill={C.goo} />
                  </Svg>
                </Animated.View>
                <View style={[StyleSheet.absoluteFill, { top: 18, backgroundColor: C.goo }]} />
                <View style={[StyleSheet.absoluteFill, { top: '45%', backgroundColor: C.orange, opacity: 0.55 }]} />
                <View style={[StyleSheet.absoluteFill, { top: '75%', backgroundColor: C.yellow, opacity: 0.6 }]} />
              </Animated.View>
              <View style={s.mystery}>
                {next ? (
                  <Image source={SETS[next].art.k} style={{ width: jarW * 0.48, height: jarW * 0.48, tintColor: full ? undefined : C.ink, opacity: full ? 1 : 0.55 }} />
                ) : (
                  <Image source={SETS.gold.art.k} style={{ width: jarW * 0.48, height: jarW * 0.48 }} />
                )}
              </View>
              {/* Cracks appear as you tap */}
              <Svg width="100%" height="100%" viewBox="0 0 100 110" style={StyleSheet.absoluteFill} pointerEvents="none">
                {CRACKS.slice(0, Math.ceil((taps / TAPS) * CRACKS.length)).map((d, i) => (
                  <Path key={i} d={d} stroke={C.ink} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </Svg>
              <View style={s.jarGloss} />
            </View>
            <View style={[s.lid, chunky(4)]} />
            {taps > 0 && !won && <MiniSplats taps={taps} size={jarW} />}
          </Animated.View>
        </Bouncy>
        <Text style={s.pct}>{full ? (taps ? `${TAPS - taps} more taps!` : 'FULL! TAP THE JAR!') : `${Math.round(pct * 100)}% full`}</Text>
      </Pop>

      {full ? (
        <Pop i={1}>
          <Body style={{ textAlign: 'center', color: C.light }}>
            {next ? `Smash it open to win the ${SETS[next].name} pieces.` : 'You own every set. Smash it for fun, more sets are coming!'}
          </Body>
        </Pop>
      ) : (
        <Pop i={1}>
          <Card style={{ gap: 10 }}>
            <Text style={s.cardTitle}>{next ? `Fill it to win the next piece set` : 'You own every set!'}</Text>
            {EARN.map(([what, amt]) => (
              <View key={what} style={s.earnRow}>
                <Text style={s.earnWhat}>{what}</Text>
                <Text style={s.earnAmt}>{amt}</Text>
              </View>
            ))}
          </Card>
          <MessyButton label="GO MAKE A MESS" size="lg" style={{ marginTop: 16 }} onPress={() => nav.replace({ name: 'play' })} />
        </Pop>
      )}

      {won && (
        <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, s.revealWrap]}>
          <Animated.View entering={ZoomIn.springify().damping(8)} style={s.revealSplat}>
            <Splat color={reward?.paint ?? C.yellow} size={width * 2.6} seed={77} arms={11} dots={18} drips={5} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(250).springify().damping(10)} style={{ width: '100%', paddingHorizontal: 22 }}>
            <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
              <Title size={44} color={reward?.paint ?? C.yellow} style={{ textAlign: 'center' }}>
                {reward ? 'NEW PIECES!' : 'SPLAT!'}
              </Title>
              {reward ? (
                <>
                  <Title size={28} style={{ textAlign: 'center' }}>
                    {reward.name}
                  </Title>
                  <Body style={{ textAlign: 'center' }}>{reward.blurb}</Body>
                  <View style={s.pieceRow}>
                    {(['p', 'n', 'b', 'r', 'q', 'k'] as PieceType[]).map((t, i) => (
                      <Animated.View key={t} entering={ZoomIn.delay(450 + i * 90).springify().damping(7)}>
                        <Image source={reward.art[t]} style={{ width: 48, height: 48 }} />
                      </Animated.View>
                    ))}
                  </View>
                  <MessyButton
                    label="USE THEM"
                    size="md"
                    color={reward.paint}
                    textColor={reward.on}
                    style={{ alignSelf: 'stretch', marginTop: 8 }}
                    onPress={() => {
                      store.update(() => ({ equipped: reward.id }));
                      nav.replace({ name: 'pieces' });
                    }}
                  />
                </>
              ) : (
                <Body style={{ textAlign: 'center' }}>Every set is yours already. More are on the way.</Body>
              )}
              <MessyButton label="KEEP PLAYING" size="sm" color={C.cardHi} textColor={C.light} style={{ alignSelf: 'stretch', marginTop: 6 }} onPress={nav.home} />
            </Card>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

function MiniSplats({ taps, size }: { taps: number; size: number }) {
  const colors = [C.slime, C.goo, C.yellow, C.sky, C.orange];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: taps }, (_, i) => {
        const a = i * 2.3;
        return (
          <Animated.View
            key={i}
            entering={ZoomIn.springify().damping(6)}
            style={{ position: 'absolute', left: size / 2 + Math.cos(a) * size * 0.55 - 30, top: size * 0.55 + Math.sin(a) * size * 0.55 - 30 }}
          >
            <Splat color={colors[i % colors.length]} size={60} seed={i * 17 + 5} drips={0} />
          </Animated.View>
        );
      })}
    </View>
  );
}

function wavePath(w: number) {
  let d = 'M0,10 ';
  for (let x = 0; x <= w; x += 40) d += `Q${x + 10},0 ${x + 20},10 T${x + 40},10 `;
  return d + `L${w},22 L0,22 Z`;
}

const CRACKS = [
  'M50,0 L46,14 L53,22 L47,34',
  'M100,40 L88,44 L84,56 L74,58',
  'M0,60 L12,62 L18,72 L30,74',
  'M70,110 L66,96 L72,86 L64,76',
  'M20,0 L24,10 L18,20',
  'M100,85 L90,82 L86,92',
  'M0,25 L9,30 L8,40 L16,46',
  'M35,110 L38,100 L32,92 L36,82',
];

const s = StyleSheet.create({
  jar: { flex: 1, marginTop: 18, borderRadius: 46, borderWidth: 4, borderColor: C.ink, backgroundColor: C.grapeDeep, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%' },
  waveRow: { position: 'absolute', top: 0, left: 0 },
  mystery: { ...fill, alignItems: 'center', justifyContent: 'center' },
  jarGloss: { position: 'absolute', left: 16, top: 20, width: 16, height: '55%', borderRadius: 99, backgroundColor: '#FFFFFF', opacity: 0.25 },
  lid: { position: 'absolute', top: 0, left: '18%', right: '18%', height: 30, borderRadius: 12, backgroundColor: C.yellow, borderWidth: 4, borderColor: C.ink },
  pct: { fontFamily: F.display, fontSize: 30, color: C.light, marginTop: 18, textShadowColor: C.ink, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  cardTitle: { fontFamily: F.display, color: C.light, fontSize: 20 },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnWhat: { fontFamily: F.bold, color: C.muted, fontSize: 16 },
  earnAmt: { fontFamily: F.display, color: C.slime, fontSize: 18 },
  revealWrap: { backgroundColor: 'rgba(20,10,40,0.55)', alignItems: 'center', justifyContent: 'center' },
  revealSplat: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pieceRow: { flexDirection: 'row', gap: 2, marginVertical: 6 },
});
