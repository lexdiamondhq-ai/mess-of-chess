import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one/400Regular';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { Navigator, type Route } from './src/nav';
import { StoreProvider, useStore } from './src/store';
import { setHaptics } from './src/ui/Bouncy';
import { C } from './src/theme';
import { Home } from './src/screens/Home';
import { PlaySetup } from './src/screens/PlaySetup';
import { Game } from './src/screens/Game';
import { SideGames } from './src/screens/SideGames';
import { MeterScreen } from './src/screens/Meter';
import { Pieces } from './src/screens/Pieces';
import { SplatAttack } from './src/games/SplatAttack';
import { KnightPaint } from './src/games/KnightPaint';
import { PaintMatch } from './src/games/PaintMatch';

function screen(r: Route) {
  switch (r.name) {
    case 'home':
      return <Home />;
    case 'play':
      return <PlaySetup />;
    case 'game':
      return <Game mode={r.mode} level={r.level} />;
    case 'sidegames':
      return <SideGames />;
    case 'meter':
      return <MeterScreen />;
    case 'pieces':
      return <Pieces />;
    case 'splat-attack':
      return <SplatAttack />;
    case 'knight-paint':
      return <KnightPaint />;
    case 'paint-match':
      return <PaintMatch />;
  }
}

function Root() {
  const { ready, save } = useStore();
  useEffect(() => setHaptics(save.haptics), [save.haptics]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.grape }} />;
  return <Navigator render={(r, key) => <View key={key} style={{ flex: 1 }}>{screen(r)}</View>} />;
}

export default function App() {
  const [fonts] = useFonts({ LilitaOne_400Regular, Nunito_800ExtraBold, Nunito_900Black });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>{fonts ? <Root /> : <View style={{ flex: 1, backgroundColor: C.grape }} />}</StoreProvider>
    </SafeAreaProvider>
  );
}
