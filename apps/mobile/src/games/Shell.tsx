import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Screen, Header, Card, Title, Body } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Splat } from '../ui/Splat';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { C, F } from '../theme';

export type Phase = 'intro' | 'play' | 'done';

interface Props {
  id: string;
  title: string;
  rule: string;
  color: string;
  phase: Phase;
  score: number;
  /** Shown top right while playing, e.g. a timer. */
  hud?: ReactNode;
  scoreLabel?: string;
  /** Mess earned for this score, 0..20. */
  mess: (score: number) => number;
  lowerIsBetter?: boolean;
  onStart: () => void;
  children: ReactNode;
}

/** Shared frame for side games: intro card, HUD, and a results card that feeds the Messy Meter. */
export function Shell(p: Props) {
  const nav = useNav();
  const store = useStore();
  const { width } = useWindowDimensions();
  const [result, setResult] = useState<{ gained: number; before: number; best: boolean } | null>(null);
  // Record the result once each time a round ends.
  useEffect(() => {
    if (p.phase !== 'done') return setResult(null);
    const before = store.save.meter;
    const gained = store.addMess(p.mess(p.score));
    const prev = store.save.best[p.id];
    const best = prev === undefined || (p.lowerIsBetter ? p.score < prev : p.score > prev);
    if (best) store.update((s) => ({ best: { ...s.best, [p.id]: p.score } }));
    setResult({ gained, before, best });
  }, [p.phase]);

  const best = store.save.best[p.id];

  return (
    <Screen tint={p.color}>
      <Header
        title={p.title}
        right={
          <View style={[s.score, { backgroundColor: p.color }]}>
            <Text style={s.scoreText}>{p.score}</Text>
          </View>
        }
      />
      <View style={s.hud}>
        <Text style={s.hudText}>{p.scoreLabel ?? 'SCORE'}</Text>
        {p.hud}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{p.children}</View>

      {p.phase === 'intro' && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, s.overlay]}>
          <Animated.View entering={ZoomIn.springify().damping(10)} style={{ width: '100%' }}>
            <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
              <Title size={40} color={p.color} style={{ textAlign: 'center' }}>
                {p.title}
              </Title>
              <Body style={{ textAlign: 'center', color: C.light, fontSize: 19, lineHeight: 26 }}>{p.rule}</Body>
              {best !== undefined && <Body>Best: {best}</Body>}
              <MessyButton label="GO!" size="lg" color={p.color} style={{ alignSelf: 'stretch', marginTop: 8 }} onPress={p.onStart} drips />
            </Card>
          </Animated.View>
        </Animated.View>
      )}

      {p.phase === 'done' && result && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, s.overlay]}>
          <Animated.View entering={ZoomIn.springify().damping(8)} style={s.splat}>
            <Splat color={p.color} size={width * 1.3} seed={p.score * 7 + 3} arms={10} dots={14} drips={4} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(150).springify().damping(10)} style={{ width: '100%' }}>
            <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
              <Text style={s.label}>{result.best ? 'NEW BEST!' : 'NICE MESS'}</Text>
              <Title size={72} color={p.color}>
                {p.score}
              </Title>
              <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.label}>MESSY METER</Text>
                  <Text style={[s.label, { color: C.slime }]}>+{result.gained}</Text>
                </View>
                <MeterBar value={(result.before + result.gained) / METER_MAX} delay={300} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
                <MessyButton label="AGAIN" size="md" color={p.color} style={{ flex: 1 }} onPress={p.onStart} />
                <MessyButton label="DONE" size="md" color={C.cardHi} textColor={C.light} tilt={2} style={{ flex: 1 }} onPress={nav.back} />
              </View>
            </Card>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  score: { minWidth: 56, height: 48, borderRadius: 16, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  scoreText: { fontFamily: F.display, fontSize: 26, color: C.ink },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudText: { fontFamily: F.black, color: C.muted, fontSize: 13, letterSpacing: 1.5 },
  overlay: { backgroundColor: 'rgba(20,10,40,0.6)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  splat: { position: 'absolute', alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  label: { fontFamily: F.display, color: C.light, fontSize: 18, letterSpacing: 1 },
});
