import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { BotLevel } from 'mess-of-chess-engine';
import { Screen, Header, Pop, Card, Body } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { Bouncy } from '../ui/Bouncy';
import { ArrowIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { useStore } from '../store';
import { SETS } from '../pieces';
import { C, F } from '../theme';

const LEVELS: { id: BotLevel; label: string; blurb: string; color: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Tips paint everywhere', color: C.slime },
  { id: 'messy', label: 'Messy', blurb: 'Grabs what it can', color: C.yellow },
  { id: 'mean', label: 'Mean', blurb: 'Thinks a move ahead', color: C.goo },
];

export function PlaySetup() {
  const nav = useNav();
  const { save } = useStore();
  const [level, setLevel] = useState<BotLevel>('messy');
  const mine = SETS[save.equipped];

  return (
    <Screen>
      <Header title="Pick your mess" />

      <Pop i={0}>
        <Card style={s.rules}>
          <View style={s.ruleRow}>
            <Image source={mine.art.n} style={s.ruleImg} />
            <Text style={s.ruleBig}>
              Normal chess, but every square you land on gets <Text style={{ backgroundColor: mine.paint, color: mine.on }}>{'\u00A0your\u00A0paint\u00A0'}</Text>.
            </Text>
          </View>
          <Body>Checkmate wins. No checkmate after 30 moves? The most paint wins.</Body>
        </Card>
      </Pop>

      <Pop i={1} style={{ marginTop: 26 }}>
        <Text style={s.section}>Play the Goo Bot</Text>
        <View style={s.levels}>
          {LEVELS.map((l, i) => {
            const on = level === l.id;
            return (
              <Bouncy key={l.id} onPress={() => setLevel(l.id)} splash={l.color} tilt={i - 1} style={{ flex: 1 }} accessibilityLabel={`${l.label} bot${on ? ', picked' : ''}`}>
                <View style={[s.level, on && { backgroundColor: C.ink }]}>
                  <View style={[s.levelDot, { backgroundColor: l.color }]} />
                  <Text style={[s.levelName, on && { color: C.white }]}>{l.label}</Text>
                  <Text style={[s.levelBlurb, on && { color: C.white, opacity: 0.75 }]}>{l.blurb}</Text>
                </View>
              </Bouncy>
            );
          })}
        </View>
        <MessyButton label="Play the bot" size="lg" icon={<ArrowIcon size={22} color={mine.paint} />} style={{ marginTop: 14 }} onPress={() => nav.go({ name: 'game', mode: 'bot', level })} />
      </Pop>

      <View style={{ flex: 1 }} />

      <Pop i={2}>
        <Text style={s.section}>Same phone</Text>
        <MessyButton label="Pass and play" sub="Take turns with a friend" color={C.surface} size="lg" tilt={1.5} onPress={() => nav.go({ name: 'game', mode: 'friend', level })} />
      </Pop>
    </Screen>
  );
}

const s = StyleSheet.create({
  rules: { gap: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleImg: { width: 62, height: 62 },
  ruleBig: { flex: 1, fontFamily: F.title, color: C.ink, fontSize: 18, lineHeight: 25, letterSpacing: -0.3 },
  section: { fontFamily: F.title, color: C.ink, fontSize: 16, marginBottom: 10 },
  levels: { flexDirection: 'row', gap: 10 },
  level: { borderRadius: 20, backgroundColor: C.surface, padding: 12, minHeight: 104, justifyContent: 'flex-end', gap: 2 },
  levelDot: { position: 'absolute', top: 12, left: 12, width: 14, height: 14, borderRadius: 7 },
  levelName: { fontFamily: F.title, fontSize: 20, color: C.ink, letterSpacing: -0.4 },
  levelBlurb: { fontFamily: F.body, fontSize: 12, lineHeight: 15, color: C.gray },
});
