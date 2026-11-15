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
import { Screen, Header, Pop, Card, Body } from '../ui/Screen';
import { OutlineText } from '../ui/OutlineText';
import { MessyButton } from '../ui/MessyButton';
import { Bouncy, buzz } from '../ui/Bouncy';
import { Splat } from '../ui/Splat';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { SETS, type PieceType, type SetId } from '../pieces';
import { C, F, edge, fill, hard } from '../theme';

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
  // The jar fills with the paint you are about to win.
  const paint = SETS[next ?? 'gold'].paint;
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
            <View style={s.jar}>
              <Animated.View style={[s.fill, fill]}>
                <Animated.View style={[s.waveRow, waveStyle]}>
                  <Svg width={jarW + 80} height={22} viewBox={`0 0 ${jarW + 80} 22`}>
                    <Path d={wavePath(jarW + 80)} fill={paint} />
                  </Svg>
                </Animated.View>
                <View style={[StyleSheet.absoluteFill, { top: 18, backgroundColor: paint }]} />
              </Animated.View>
              <View style={s.mystery}>
                {next ? (
                  <Image source={SETS[next].art.k} style={{ width: jarW * 0.48, height: jarW * 0.48, tintColor: full ? undefined : C.ink, opacity: full ? 1 : 0.28 }} />
                ) : (
                  <Image source={SETS.gold.art.k} style={{ width: jarW * 0.48, height: jarW * 0.48 }} />
                )}
              </View>
              {/* Cracks appear as you tap */}
              <Svg width="100%" height="100%" viewBox="0 0 100 110" style={StyleSheet.absoluteFill} pointerEvents="none">
                {CRACKS.slice(0, Math.ceil((taps / TAPS) * CRACKS.length)).map((d, i) => (
                  <Path key={i} d={d} stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </Svg>
              <View style={s.jarGloss} />
            </View>
            <View style={s.lid} />
            {taps > 0 && !won && <MiniSplats taps={taps} size={jarW} />}
          </Animated.View>
        </Bouncy>
        <Text style={s.pct}>{full ? (taps ? `${TAPS - taps} more taps!` : 'Full! Tap the jar!') : `${Math.round(pct * 100)}% full`}</Text>
      </Pop>

      {full ? (
        <Pop i={1}>
          <Body style={{ textAlign: 'center', color: C.ink }}>
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
          <MessyButton label="Go make a mess" size="lg" style={{ marginTop: 18 }} onPress={() => nav.replace({ name: 'play' })} />
        </Pop>
      )}

      {won && (
        <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, s.revealWrap]}>
          <Animated.View entering={ZoomIn.springify().damping(8)} style={s.revealSplat}>
            <Splat color={reward?.paint ?? C.goo} size={width * 2.9} seed={77} arms={9} dots={10} outline={1.5} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(250).springify().damping(10)} style={{ width: '100%', paddingHorizontal: 22 }}>
            <Card raised style={{ alignItems: 'center', gap: 8, paddingVertical: 26, paddingHorizontal: 20 }}>
              <OutlineText size={42} color={reward?.paint ?? C.goo} stroke={2.5} drop={4} align="center" style={{ alignSelf: 'stretch' }}>
                {reward ? 'New pieces!' : 'Splat!'}
              </OutlineText>
              {reward ? (
                <>
                  <View style={[s.rewardName, { backgroundColor: reward.paint }]}>
                    <Text style={[s.rewardNameText, { color: reward.on }]}>{reward.name}</Text>
                  </View>
                  <Body style={{ textAlign: 'center' }}>{reward.blurb}</Body>
                  <View style={s.pieceRow}>
                    {(['p', 'n', 'b', 'r', 'q', 'k'] as PieceType[]).map((t, i) => (
                      <Animated.View key={t} entering={ZoomIn.delay(450 + i * 90).springify().damping(7)}>
                        <Image source={reward.art[t]} style={{ width: 48, height: 48 }} />
                      </Animated.View>
                    ))}
                  </View>
                  <MessyButton
                    label="Use them"
                    size="md"
                    color={reward.paint}
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
              <MessyButton label="Keep playing" size="md" color={C.surface} style={{ alignSelf: 'stretch', marginTop: 4 }} onPress={nav.home} />
            </Card>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

function MiniSplats({ taps, size }: { taps: number; size: number }) {
  const colors = [C.slime, C.goo, C.white, C.sky, C.orange];
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
            <Splat color={colors[i % colors.length]} size={70} seed={i * 17 + 5} outline={7} />
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
  jar: { flex: 1, marginTop: 18, borderRadius: 40, backgroundColor: C.white, overflow: 'hidden', justifyContent: 'flex-end', ...edge(3.5), ...hard(7) },
  fill: { width: '100%' },
  waveRow: { position: 'absolute', top: 0, left: 0 },
  mystery: { ...fill, alignItems: 'center', justifyContent: 'center' },
  jarGloss: { position: 'absolute', left: 14, top: 26, width: 12, height: '42%', borderRadius: 99, backgroundColor: C.white, opacity: 0.6 },
  lid: { position: 'absolute', top: 0, left: '16%', right: '16%', height: 32, borderRadius: 12, backgroundColor: C.goo, ...edge(3.5), ...hard(4) },
  pct: { fontFamily: F.title, fontSize: 30, lineHeight: 36, color: C.ink, marginTop: 22 },
  cardTitle: { fontFamily: F.title, color: C.ink, fontSize: 19, lineHeight: 23 },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnWhat: { fontFamily: F.body, color: C.ink, fontSize: 16 },
  earnAmt: { fontFamily: F.title, color: C.ink, fontSize: 17 },
  revealWrap: { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center' },
  revealSplat: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  rewardName: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, transform: [{ rotate: '-2deg' }], ...edge(2.5), ...hard(3) },
  rewardNameText: { fontFamily: F.title, fontSize: 24, lineHeight: 30 },
  pieceRow: { flexDirection: 'row', gap: 2, marginVertical: 6 },
});
