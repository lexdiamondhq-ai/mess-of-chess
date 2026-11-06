import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PLAYER_SETS, type SetId } from './pieces';

export const METER_MAX = 100;

export interface Save {
  meter: number;
  owned: SetId[];
  equipped: SetId;
  wins: number;
  games: number;
  splats: number;
  best: Record<string, number>;
  haptics: boolean;
}

const START: Save = {
  // A welcome splash: the meter starts half full so the first bonus comes quickly.
  meter: 50,
  owned: ['slime'],
  equipped: 'slime',
  wins: 0,
  games: 0,
  splats: 0,
  best: {},
  haptics: true,
};

const KEY = 'mess-of-chess/save/v1';

interface Store {
  save: Save;
  ready: boolean;
  /** Adds mess to the meter (capped at full). Returns how much actually went in. */
  addMess: (amount: number) => number;
  update: (fn: (s: Save) => Partial<Save>) => void;
  /** Empties a full meter and unlocks the next set. Returns it, or null if all are owned. */
  claimReward: () => SetId | null;
  nextReward: () => SetId | null;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(START);
  const [ready, setReady] = useState(false);
  const ref = useRef(save);
  ref.current = save;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setSave({ ...START, ...JSON.parse(raw) });
      } catch {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(save)).catch(() => {});
  }, [save, ready]);

  const store = useMemo<Store>(() => {
    const nextReward = () => PLAYER_SETS.find((id) => !ref.current.owned.includes(id)) ?? null;
    return {
      save,
      ready,
      nextReward,
      addMess(amount) {
        const room = METER_MAX - ref.current.meter;
        const added = Math.max(0, Math.min(room, Math.round(amount)));
        setSave((s) => ({ ...s, meter: Math.min(METER_MAX, s.meter + added) }));
        return added;
      },
      update(fn) {
        setSave((s) => ({ ...s, ...fn(s) }));
      },
      claimReward() {
        const id = nextReward();
        setSave((s) => ({ ...s, meter: 0, owned: id && !s.owned.includes(id) ? [...s.owned, id] : s.owned }));
        return id;
      },
    };
  }, [save, ready]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
