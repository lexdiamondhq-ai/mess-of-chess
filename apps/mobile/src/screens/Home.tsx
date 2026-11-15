import { useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Screen, Pop, Chip } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Bouncy } from '../ui/Bouncy';
import { OutlineText } from '../ui/OutlineText';
import { Splat } from '../ui/Splat';
import { Bob } from '../ui/Bob';
import { CrownIcon, DropIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { PLAYER_SETS, SETS } from '../pieces';
import { C, F, edge, hard } from '../theme';

// The hero art is drawn on a 350x270 sketch and scaled to fit the space it gets.
const ART_W = 350;
const ART_H = 270;

export function Home() {
  const nav = useNav();
  const store = useStore();
  const { save } = store;
  const { width, height } = useWindowDimensions();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const mine = SETS[save.equipped];
  const full = save.meter >= METER_MAX;
  const pct = Math.round((save.meter / METER_MAX) * 100);
  const compact = height < 760;
  const word = Math.min(compact ? 62 : 76, (width - 40) / 4.5);
  const next = store.nextReward();
  // The spotlight behind the pieces should never match the paint on your king.
  const spot = mine.id === 'ocean' ? C.orange : C.sky;

  const k = Math.min(box.w / ART_W, box.h / ART_H) || 0;
  const ox = (box.w - ART_W * k) / 2;
  const oy = (box.h - ART_H * k) / 2;
  const at = (x: number, y: number, size: number) => ({ position: 'absolute', left: ox + x * k, top: oy + y * k, width: size * k, height: size * k }) as const;

  return (
    <Screen>
      <View style={s.top}>
        <Pop i={0}>
          <Chip icon={<CrownIcon />}>{save.wins} wins</Chip>
        </Pop>
        <Pop i={0}>
          <Chip icon={<DropIcon />}>{save.splats} splats</Chip>
        </Pop>
      </View>

      <Pop i={1} style={{ marginTop: compact ? 14 : 22, marginLeft: 4 }}>
        <View style={{ transform: [{ rotate: '-4deg' }], transformOrigin: 'left center' }} accessible accessibilityRole="header" accessibilityLabel="A Mess of Chess">
          <OutlineText size={word}>A Mess</OutlineText>
          <OutlineText size={word} style={{ marginTop: -word * 0.2 }}>
            of Chess
          </OutlineText>
        </View>
      </Pop>

      <View style={s.hero} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {k > 0 && (
          <>
            <Pop i={2} style={at(60, 26, 236)}>
              <View style={[s.spot, { backgroundColor: spot, borderRadius: 236 * k }]} />
            </Pop>
            <Pop i={3} style={at(224, -8, 132)}>
              <Splat color={SETS.goo.paint} size={132 * k} seed={16} arms={6} dots={0} outline={9} />
            </Pop>
            <Bob style={at(6, 18, 240)} amount={7} tilt={3}>
              <Image source={mine.art.k} accessibilityLabel={`Your ${mine.name} king`} style={{ width: 240 * k, height: 240 * k, transform: [{ rotate: '-8deg' }] }} />
            </Bob>
            <Bob style={at(162, 54, 206)} amount={7} tilt={-3} delay={500}>
              <Image source={SETS.goo.art.q} accessibilityLabel="The Goo queen" style={{ width: 206 * k, height: 206 * k, transform: [{ rotate: '9deg' }] }} />
            </Bob>
          </>
        )}
      </View>

      <Pop i={4}>
        <Bouncy onPress={() => nav.go({ name: 'meter' })} splash={C.goo} accessibilityLabel={`Messy Meter, ${pct}% full`}>
          <View style={s.meter}>
            <View style={s.meterRow}>
              <Text style={s.meterLabel}>Messy Meter</Text>
              <Text style={s.meterHint}>{full ? 'Full! Tap to open' : `${pct}%`}</Text>
            </View>
            <MeterBar value={save.meter / METER_MAX} delay={500} />
          </View>
        </Bouncy>
      </Pop>

      <Pop i={5} style={{ marginTop: 14 }}>
        <MessyButton label="Play" size="xl" color={mine.paint} onPress={() => nav.go({ name: 'play' })} />
      </Pop>

      <View style={s.tiles}>
        <Pop i={6} style={{ flex: 1 }}>
          <Tile title={'Side\ngames'} color={C.pink} art={SETS.slime.art.n} tilt={8} splash={SETS.goo.paint} onPress={() => nav.go({ name: 'sidegames' })} compact={compact} />
        </Pop>
        <Pop i={7} style={{ flex: 1 }}>
          <Tile
            title="Pieces"
            sub={`${save.owned.length} of ${PLAYER_SETS.length} sets`}
            color={C.blue}
            art={SETS[next ?? 'gold'].art.k}
            tilt={-8}
            splash={SETS[next ?? 'gold'].paint}
            onPress={() => nav.go({ name: 'pieces' })}
            compact={compact}
          />
        </Pop>
      </View>
    </Screen>
  );
}

function Tile({ title, sub, color, art, tilt, splash, onPress, compact }: { title: string; sub?: string; color: string; art: any; tilt: number; splash: string; onPress: () => void; compact: boolean }) {
  return (
    <Bouncy onPress={onPress} splash={splash} tilt={tilt > 0 ? 1.5 : -1.5} accessibilityLabel={[title.replace('\n', ' '), sub].filter(Boolean).join(', ')}>
      <View style={[s.tile, { height: compact ? 76 : 86, backgroundColor: color }]}>
        <Text style={s.tileTitle}>{title}</Text>
        {sub ? <Text style={s.tileSub}>{sub}</Text> : null}
        <Image source={art} style={[s.tileArt, { transform: [{ rotate: `${tilt}deg` }] }]} />
      </View>
    </Bouncy>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', gap: 10, minHeight: 44, alignItems: 'center' },
  hero: { flex: 1, minHeight: 140, marginTop: 4 },
  spot: { width: '100%', height: '100%', ...edge(3), ...hard(6) },
  meter: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 13, gap: 8, ...edge(3), ...hard(4) },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterLabel: { fontFamily: F.title, color: C.ink, fontSize: 20, lineHeight: 24 },
  meterHint: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  tiles: { flexDirection: 'row', gap: 14, marginTop: 18 },
  tile: { borderRadius: 20, paddingLeft: 14, justifyContent: 'center', overflow: 'hidden', ...edge(3), ...hard(4) },
  tileTitle: { fontFamily: F.title, color: C.ink, fontSize: 20, lineHeight: 23 },
  tileSub: { fontFamily: F.bold, color: C.ink, fontSize: 13 },
  tileArt: { position: 'absolute', right: -12, bottom: -18, width: 80, height: 80 },
});
