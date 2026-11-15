import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { BotLevel } from 'mess-of-chess-engine';
import { Screen, Header, Pop, Card, Body } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { Bouncy } from '../ui/Bouncy';
import { useNav } from '../nav';
import { useStore } from '../store';
import { SETS } from '../pieces';
import { C, F, edge, hard } from '../theme';

const LEVELS: { id: BotLevel; label: string; blurb: string; color: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Tips paint everywhere', color: C.slime },
  { id: 'messy', label: 'Messy', blurb: 'Grabs what it can', color: C.orange },
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
              Normal chess, but every square you land on gets <Text style={{ backgroundColor: mine.paint, color: mine.on }}>{' your paint '}</Text>.
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
                <View style={[s.level, on ? [{ backgroundColor: l.color }, hard(5)] : hard(3)]}>
                  <View style={[s.levelDot, { backgroundColor: on ? C.white : l.color }]} />
                  <Text style={s.levelName}>{l.label}</Text>
                  <Text style={s.levelBlurb}>{l.blurb}</Text>
                </View>
              </Bouncy>
            );
          })}
        </View>
        <MessyButton label="Play the bot" size="lg" color={mine.paint} style={{ marginTop: 18 }} onPress={() => nav.go({ name: 'game', mode: 'bot', level })} />
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
  ruleBig: { flex: 1, fontFamily: F.bold, color: C.ink, fontSize: 18, lineHeight: 25 },
  section: { fontFamily: F.title, color: C.ink, fontSize: 20, marginBottom: 10 },
  levels: { flexDirection: 'row', gap: 12 },
  level: { borderRadius: 18, backgroundColor: C.surface, padding: 11, minHeight: 108, justifyContent: 'flex-end', gap: 2, ...edge(3) },
  levelDot: { position: 'absolute', top: 11, left: 11, width: 16, height: 16, borderRadius: 8, ...edge(2.5) },
  levelName: { fontFamily: F.title, fontSize: 21, lineHeight: 24, color: C.ink },
  levelBlurb: { fontFamily: F.bold, fontSize: 12, lineHeight: 15, color: C.ink },
});
