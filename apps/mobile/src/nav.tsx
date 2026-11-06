import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { BotLevel } from 'mess-of-chess-engine';
import { Splat } from './ui/Splat';
import { C } from './theme';

export type Route =
  | { name: 'home' }
  | { name: 'play' }
  | { name: 'game'; mode: 'bot' | 'friend'; level: BotLevel }
  | { name: 'sidegames' }
  | { name: 'splat-attack' }
  | { name: 'knight-paint' }
  | { name: 'paint-match' }
  | { name: 'meter' }
  | { name: 'pieces' };

interface Nav {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  /** Swap the current screen without adding to history. */
  replace: (r: Route) => void;
  home: () => void;
}

const Ctx = createContext<Nav | null>(null);
export const useNav = () => {
  const n = useContext(Ctx);
  if (!n) throw new Error('useNav outside Navigator');
  return n;
};

const WIPES = [C.slime, C.goo, C.yellow, C.sky, C.orange];

/**
 * A tiny stack navigator. Every screen change is a paint splat that
 * slaps across the screen, then slides down the glass to reveal the next screen.
 */
export function Navigator({ render }: { render: (r: Route, key: number) => ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [key, setKey] = useState(0);
  const [wipe, setWipe] = useState({ color: C.slime, seed: 3 });
  const busy = useRef(false);
  const n = useRef(0);
  const { width, height } = useWindowDimensions();
  const size = Math.hypot(width, height) * 2.6;

  const grow = useSharedValue(0);
  const fall = useSharedValue(0);

  const finish = useCallback(() => {
    busy.current = false;
  }, []);

  const swap = useCallback(
    (fn: (s: Route[]) => Route[]) => {
      setStack(fn);
      setKey((k) => k + 1);
      fall.value = withTiming(1, { duration: 620, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) {
          grow.value = 0;
          fall.value = 0;
          runOnJS(finish)();
        }
      });
    },
    [finish],
  );

  const transition = useCallback(
    (fn: (s: Route[]) => Route[]) => {
      if (busy.current) return;
      busy.current = true;
      n.current += 1;
      setWipe({ color: WIPES[n.current % WIPES.length], seed: 11 + n.current * 13 });
      fall.value = 0;
      grow.value = 0;
      grow.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) runOnJS(swap)(fn);
      });
    },
    [swap],
  );

  const nav: Nav = {
    route: stack[stack.length - 1],
    go: (r) => transition((s) => [...s, r]),
    replace: (r) => transition((s) => [...s.slice(0, -1), r]),
    back: () => transition((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    home: () => transition(() => [{ name: 'home' }]),
  };

  const navRef = useRef(nav);
  navRef.current = nav;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      navRef.current.back();
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  const splatStyle = useAnimatedStyle(() => ({
    opacity: grow.value === 0 ? 0 : 1 - fall.value * 0.35,
    transform: [
      { translateY: fall.value * height * 1.25 },
      { scaleY: 1 + fall.value * 0.35 },
      { scale: 0.04 + grow.value * 0.96 },
      { rotate: `${(1 - grow.value) * -40}deg` },
    ],
  }));

  return (
    <Ctx.Provider value={nav}>
      <View style={{ flex: 1, backgroundColor: C.grape }}>
        {render(nav.route, key)}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
          <Animated.View style={[{ width: size, height: size }, splatStyle]}>
            <Splat color={wipe.color} size={size} seed={wipe.seed} arms={9} dots={14} drips={5} shine={false} />
          </Animated.View>
        </View>
      </View>
    </Ctx.Provider>
  );
}
