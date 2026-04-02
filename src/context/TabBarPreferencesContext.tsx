import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scopedStorageKey } from '../services/userSession';

const STORAGE_KEY = 'tab_bar_visibility_v1';

export type TabBarOptionalTab = 'Habits' | 'Journal' | 'Finance' | 'Visualization';

export type TabBarVisibility = Record<TabBarOptionalTab, boolean>;

export const DEFAULT_TAB_BAR_VISIBILITY: TabBarVisibility = {
  Habits: true,
  Journal: true,
  Finance: true,
  Visualization: true,
};

type Ctx = {
  visibility: TabBarVisibility;
  setTabVisible: (tab: TabBarOptionalTab, visible: boolean) => void;
};

const TabBarPreferencesContext = createContext<Ctx | null>(null);

export function TabBarPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [visibility, setVisibility] = useState<TabBarVisibility>(DEFAULT_TAB_BAR_VISIBILITY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(scopedStorageKey(STORAGE_KEY));
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<TabBarVisibility>;
          setVisibility({ ...DEFAULT_TAB_BAR_VISIBILITY, ...parsed });
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTabVisible = useCallback((tab: TabBarOptionalTab, visible: boolean) => {
    setVisibility((v) => {
      const next = { ...v, [tab]: visible };
      AsyncStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ visibility, setTabVisible }),
    [visibility, setTabVisible]
  );

  return (
    <TabBarPreferencesContext.Provider value={value}>{children}</TabBarPreferencesContext.Provider>
  );
}

export function useTabBarPreferences(): Ctx {
  const ctx = useContext(TabBarPreferencesContext);
  if (!ctx) {
    throw new Error('useTabBarPreferences must be used within TabBarPreferencesProvider');
  }
  return ctx;
}
