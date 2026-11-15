import { useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Screen, Pop, Chip } from '../ui/Screen';
import { MessyButton } from '../ui/MessyButton';
import { MeterBar } from '../ui/MeterBar';
import { Bouncy } from '../ui/Bouncy';
import { Brush, Splat } from '../ui/Splat';
import { Bob } from '../ui/Bob';
import { ArrowIcon, CrownIcon, DropIcon } from '../ui/Icons';
import { useNav } from '../nav';
import { METER_MAX, useStore } from '../store';
import { PLAYER_SETS, SETS } from '../pieces';
import { C, F, tight } from '../theme';

// The hero art is drawn on a 350x290 sketch and scaled to fit the space it gets.
const ART_W = 350;
const ART_H = 290;

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
  const word = Math.min(compact ? 58 : 70, (width - 40) / 5);
  const next = store.nextReward();

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

      <Pop i={1} style={{ marginTop: compact ? 14 : 22 }}>
        <View accessible accessibilityRole="header" accessibilityLabel="A Mess of Chess">
          <View style={s.wordRow}>
            <Text style={[s.word, { fontSize: word, lineHeight: word }, tight(word)]}>A </Text>
            <View>
              <View style={s.brush}>
                <Brush color={mine.paint} />
              </View>
              <Text style={[s.word, { fontSize: word, lineHeight: word }, tight(word)]}>Mess</Text>
            </View>
          </View>
          <Text style={[s.word, { fontSize: word, lineHeight: word, marginTop: -word * 0.1 }, tight(word)]}>of Chess</Text>
        </View>
      </Pop>

      <View style={s.hero} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {k > 0 && (
          <>
            <Pop i={2} style={at(-52, 14, 290)}>
              <Splat color={mine.paint} size={290 * k} seed={107} arms={5} />
            </Pop>
            <Pop i={3} style={at(146, 40, 272)}>
              <Splat color={SETS.goo.paint} size={272 * k} seed={16} arms={6} style={{ transform: [{ rotate: '40deg' }] }} />
            </Pop>
            <FloorShadow style={{ position: 'absolute', left: ox + 34 * k, top: oy + 244 * k }} width={156 * k} height={34 * k} />
            <FloorShadow style={{ position: 'absolute', left: ox + 204 * k, top: oy + 254 * k }} width={142 * k} height={30 * k} />
            <Bob style={at(-12, 12, 258)} amount={7} tilt={3}>
              <Image source={mine.art.k} accessibilityLabel={`Your ${mine.name} king`} style={{ width: 258 * k, height: 258 * k, transform: [{ rotate: '-7deg' }] }} />
            </Bob>
            <Bob style={at(166, 54, 222)} amount={7} tilt={-3} delay={500}>
              <Image source={SETS.goo.art.q} accessibilityLabel="The Goo queen" style={{ width: 222 * k, height: 222 * k, transform: [{ rotate: '8deg' }] }} />
            </Bob>
          </>
        )}
      </View>

      <Pop i={4}>
        <Bouncy onPress={() => nav.go({ name: 'meter' })} splash={mine.paint} accessibilityLabel={`Messy Meter, ${pct}% full`}>
          <View style={s.meter}>
            <View style={s.meterRow}>
              <Text style={s.meterLabel}>Messy Meter</Text>
              <Text style={[s.meterHint, full && { color: C.ink, fontFamily: F.bold }]}>{full ? 'Full! Tap to open it' : `${pct}% of the way to new pieces`}</Text>
            </View>
            <MeterBar value={save.meter / METER_MAX} delay={500} color={mine.paint} />
          </View>
        </Bouncy>
      </Pop>

      <Pop i={5} style={{ marginTop: 20 }}>
        <MessyButton label="Play" size="xl" icon={<ArrowIcon color={mine.paint} />} onPress={() => nav.go({ name: 'play' })} />
      </Pop>

      <View style={s.tiles}>
        <Pop i={6} style={{ flex: 1 }}>
          <Tile title="Side games" sub="3 quick ones" art={SETS.goo.art.n} tilt={10} splash={SETS.goo.paint} onPress={() => nav.go({ name: 'sidegames' })} compact={compact} />
        </Pop>
        <Pop i={7} style={{ flex: 1 }}>
          <Tile
            title="Pieces"
            sub={`${save.owned.length} of ${PLAYER_SETS.length} sets`}
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

function Tile({ title, sub, art, tilt, splash, onPress, compact }: { title: string; sub: string; art: any; tilt: number; splash: string; onPress: () => void; compact: boolean }) {
  return (
    <Bouncy onPress={onPress} splash={splash} tilt={tilt > 0 ? 1.5 : -1.5} accessibilityLabel={`${title}, ${sub}`}>
      <View style={[s.tile, { height: compact ? 80 : 92 }]}>
        <Text style={s.tileTitle}>{title}</Text>
        <Text style={s.tileSub}>{sub}</Text>
        <Image source={art} style={[s.tileArt, { transform: [{ rotate: `${tilt}deg` }] }]} />
      </View>
    </Bouncy>
  );
}

/** A soft blurry oval so the pieces look like they stand on the paper. */
function FloorShadow({ width, height, style }: { width: number; height: number; style: any }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id="floor" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={C.ink} stopOpacity={0.22} />
          <Stop offset="1" stopColor={C.ink} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={50} cy={50} rx={50} ry={50} fill="url(#floor)" />
    </Svg>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', gap: 8, minHeight: 44, alignItems: 'center' },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end' },
  word: { fontFamily: F.display, color: C.ink },
  brush: { position: 'absolute', left: -8, right: -14, top: '4%', bottom: '2%', transform: [{ rotate: '-3deg' }] },
  hero: { flex: 1, minHeight: 150 },
  meter: { gap: 8 },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meterLabel: { fontFamily: F.title, color: C.ink, fontSize: 16 },
  meterHint: { fontFamily: F.body, color: C.gray, fontSize: 14 },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tile: { borderRadius: 24, backgroundColor: C.surface, paddingLeft: 16, justifyContent: 'center', gap: 2, overflow: 'hidden' },
  tileTitle: { fontFamily: F.title, color: C.ink, fontSize: 18, letterSpacing: -0.4 },
  tileSub: { fontFamily: F.body, color: C.gray, fontSize: 13 },
  tileArt: { position: 'absolute', right: -14, bottom: -18, width: 78, height: 78 },
});
