import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Screen, Header, Card, Body } from '../ui/Screen';
import { OutlineText } from '../ui/OutlineText';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Splat } from '../ui/Splat';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { C, F, edge, hard } from '../theme';

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
    <Screen>
      <Header
        title={p.title}
        right={
          <View style={[s.score, { backgroundColor: p.color }]}>
            <Text style={s.scoreText}>{p.score}</Text>
          </View>
        }
      />
      <View style={s.hud}>
        <Text style={s.hudText}>{p.scoreLabel ?? 'Score'}</Text>
        {p.hud}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{p.children}</View>

      {p.phase === 'intro' && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, s.overlay]}>
          <Animated.View entering={ZoomIn.springify().damping(10)} style={{ width: '100%' }}>
            <Card raised style={{ alignItems: 'center', gap: 10, paddingVertical: 26, paddingHorizontal: 20 }}>
              <OutlineText size={38} color={p.color} stroke={2.5} drop={4} align="center" style={{ alignSelf: 'stretch' }}>
                {p.title}
              </OutlineText>
              <Body style={{ textAlign: 'center', color: C.ink, fontSize: 18, lineHeight: 25 }}>{p.rule}</Body>
              {best !== undefined && <Body>Best: {best}</Body>}
              <MessyButton label="Go!" size="lg" color={p.color} style={{ alignSelf: 'stretch', marginTop: 10 }} onPress={p.onStart} />
            </Card>
          </Animated.View>
        </Animated.View>
      )}

      {p.phase === 'done' && result && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, s.overlay]}>
          <Animated.View entering={ZoomIn.springify().damping(8)} style={s.splat}>
            <Splat color={p.color} size={width * 1.5} seed={p.score * 7 + 3} arms={8} dots={8} outline={3} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(150).springify().damping(10)} style={{ width: '100%' }}>
            <Card raised style={{ alignItems: 'center', gap: 8, paddingVertical: 24, paddingHorizontal: 20 }}>
              <Text style={s.label}>{result.best ? 'New best!' : 'Nice mess'}</Text>
              <OutlineText size={76} color={p.color} stroke={3} drop={5} align="center" style={{ alignSelf: 'stretch' }}>
                {String(p.score)}
              </OutlineText>
              <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.label}>Messy Meter</Text>
                  <Text style={s.label}>+{result.gained}</Text>
                </View>
                <MeterBar value={(result.before + result.gained) / METER_MAX} delay={300} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
                <MessyButton label="Again" size="md" color={p.color} style={{ flex: 1 }} onPress={p.onStart} />
                <MessyButton label="Done" size="md" color={C.surface} tilt={1.5} style={{ flex: 1 }} onPress={nav.back} />
              </View>
            </Card>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  score: { minWidth: 52, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, ...edge(2.5), ...hard(3) },
  scoreText: { fontFamily: F.title, fontSize: 22, lineHeight: 26, color: C.ink },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 34, paddingRight: 3 },
  hudText: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  overlay: { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center', padding: 22 },
  splat: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.title, color: C.ink, fontSize: 18 },
});
