import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isSupabaseConfigured, supabase } from '../config/supabase';
import type { AppAuthUser } from '../types';
import {
  localAuthUserToApp,
  loginUser,
  logoutUser,
  migrateLegacyDeviceDataIfAny,
  registerUser,
  restoreSession,
} from '../services/authService';
import {
  mapSessionToAppUser,
  supabaseSignInWithPassword,
  supabaseSignOut,
  supabaseSignUp,
} from '../services/supabaseAuth';
import { setActiveUserId } from '../services/userSession';

export type AuthMode = 'supabase' | 'local';

interface AuthContextValue {
  user: AppAuthUser | null;
  isReady: boolean;
  authMode: AuthMode;
  login: (identifier: string, password: string) => Promise<void>;
  register: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const authMode: AuthMode = useMemo(
    () => (isSupabaseConfigured() ? 'supabase' : 'local'),
    []
  );

  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | undefined;

    const finishReady = () => {
      if (!cancelled) setIsReady(true);
    };

    if (authMode === 'supabase') {
      (async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (cancelled) return;
          if (data.session?.user) {
            setActiveUserId(data.session.user.id);
            setUser(mapSessionToAppUser(data.session));
          } else {
            setActiveUserId(null);
            setUser(null);
          }
        } catch (e) {
          console.error('Supabase getSession failed:', e);
          if (!cancelled) {
            setActiveUserId(null);
            setUser(null);
          }
        } finally {
          finishReady();
        }
      })();

      const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          setActiveUserId(session.user.id);
          setUser(mapSessionToAppUser(session));
        } else {
          setActiveUserId(null);
          setUser(null);
        }
      });
      authSubscription = authData.subscription;
    } else {
      (async () => {
        try {
          const restored = await restoreSession();
          if (!cancelled) {
            setUser(restored ? localAuthUserToApp(restored) : null);
          }
        } catch (e) {
          console.error('Local session restore failed:', e);
          if (!cancelled) setUser(null);
        } finally {
          finishReady();
        }
      })();
    }

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
    };
  }, [authMode]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      if (authMode === 'supabase') {
        const session = await supabaseSignInWithPassword(identifier, password);
        await migrateLegacyDeviceDataIfAny(session.user.id);
        setActiveUserId(session.user.id);
        setUser(mapSessionToAppUser(session));
      } else {
        const u = await loginUser(identifier, password);
        setUser(localAuthUserToApp(u));
      }
    },
    [authMode]
  );

  const register = useCallback(
    async (identifier: string, password: string) => {
      if (authMode === 'supabase') {
        const { session, needsEmailConfirmation } = await supabaseSignUp(identifier, password);
        if (session?.user) {
          await migrateLegacyDeviceDataIfAny(session.user.id);
          setActiveUserId(session.user.id);
          setUser(mapSessionToAppUser(session));
        } else if (needsEmailConfirmation) {
          throw new Error(
            'Check your email to confirm your account, then sign in. (You can disable email confirmation in Supabase → Authentication → Providers → Email.)'
          );
        }
      } else {
        const u = await registerUser(identifier, password);
        setUser(localAuthUserToApp(u));
      }
    },
    [authMode]
  );

  const logout = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch {
        /* ignore */
      }
    }
    if (authMode === 'supabase') {
      await supabaseSignOut();
      setActiveUserId(null);
      setUser(null);
    } else {
      await logoutUser();
      setUser(null);
    }
  }, [authMode]);

  return (
    <AuthContext.Provider value={{ user, isReady, authMode, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
