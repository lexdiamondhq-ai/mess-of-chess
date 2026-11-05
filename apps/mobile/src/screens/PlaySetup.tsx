import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { BotLevel } from 'mess-of-chess-engine';
import { Screen, Header, Pop, Card, Body } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { Bouncy } from '../ui/Bouncy';
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
            <Body style={{ flex: 1, color: C.light }}>
              Normal chess, but every square you land on gets <Text style={{ color: mine.paint }}>your paint</Text>.
            </Body>
          </View>
          <Body>Checkmate wins. No checkmate after 30 moves? The most paint wins.</Body>
        </Card>
      </Pop>

      <Pop i={1} style={{ marginTop: 22 }}>
        <Text style={s.section}>VS THE GOO BOT</Text>
        <View style={s.levels}>
          {LEVELS.map((l, i) => (
            <Bouncy key={l.id} onPress={() => setLevel(l.id)} splash={l.color} tilt={i - 1} style={{ flex: 1 }} accessibilityLabel={`${l.label} bot`}>
              <View style={[s.level, level === l.id && { backgroundColor: l.color, borderColor: C.ink }]}>
                <Text style={[s.levelName, level === l.id && { color: C.ink }]}>{l.label}</Text>
                <Text style={[s.levelBlurb, level === l.id && { color: C.ink }]}>{l.blurb}</Text>
              </View>
            </Bouncy>
          ))}
        </View>
        <MessyButton label="PLAY THE BOT" size="lg" drips style={{ marginTop: 14 }} onPress={() => nav.go({ name: 'game', mode: 'bot', level })} />
      </Pop>

      <View style={{ flex: 1 }} />

      <Pop i={2}>
        <Text style={s.section}>SAME PHONE</Text>
        <MessyButton
          label="PASS & PLAY"
          sub="Take turns with a friend"
          color={C.goo}
          size="lg"
          tilt={2}
          onPress={() => nav.go({ name: 'game', mode: 'friend', level })}
        />
      </Pop>
    </Screen>
  );
}

const s = StyleSheet.create({
  rules: { gap: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleImg: { width: 58, height: 58 },
  section: { fontFamily: F.display, color: C.muted, fontSize: 16, letterSpacing: 1.5, marginBottom: 10 },
  levels: { flexDirection: 'row', gap: 10 },
  level: { borderRadius: 20, borderWidth: 3, borderColor: C.cardHi, backgroundColor: C.card, padding: 12, minHeight: 92, justifyContent: 'center' },
  levelName: { fontFamily: F.display, fontSize: 22, color: C.light },
  levelBlurb: { fontFamily: F.bold, fontSize: 12, color: C.muted, marginTop: 2 },
});
