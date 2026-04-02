import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { AppAuthUser } from '../types';
import { setActiveUserId } from './userSession';

const AUTH_USERS_KEY = 'lifeos_auth_users_v1';
const AUTH_SESSION_KEY = 'lifeos_auth_session_v1';

export interface AuthUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

const LEGACY_ASYNC_KEYS: { legacy: string; short: string }[] = [
  { legacy: 'lifeos_habits', short: 'habits' },
  { legacy: 'lifeos_habit_entries', short: 'habit_entries' },
  { legacy: 'lifeos_journal_entries', short: 'journal_entries' },
  { legacy: 'lifeos_transactions', short: 'transactions' },
  { legacy: 'lifeos_investments', short: 'investments' },
  { legacy: 'lifeos_budgets', short: 'budgets' },
  { legacy: 'lifeos_accounts', short: 'accounts' },
  { legacy: 'lifeos_subscriptions', short: 'subscriptions' },
  { legacy: 'lifeos_reviews', short: 'reviews' },
];

async function randomHex(byteLength: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

async function loadUsers(): Promise<AuthUser[]> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: AuthUser[]): Promise<void> {
  await AsyncStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

async function persistSession(userId: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ userId }));
  setActiveUserId(userId);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  setActiveUserId(null);
}

/** Copy pre–multi-user AsyncStorage keys into this account, then remove legacy keys. */
export async function migrateLegacyDeviceDataIfAny(userId: string): Promise<boolean> {
  let migrated = false;
  const prefix = `lifeos_u_${userId}_`;

  for (const { legacy, short } of LEGACY_ASYNC_KEYS) {
    const data = await AsyncStorage.getItem(legacy);
    if (!data) continue;
    const nextKey = `${prefix}${short}`;
    const existing = await AsyncStorage.getItem(nextKey);
    if (!existing) {
      await AsyncStorage.setItem(nextKey, data);
      migrated = true;
    }
    await AsyncStorage.removeItem(legacy);
  }

  const cat = await AsyncStorage.getItem('transactionCategories');
  if (cat) {
    const nk = `${prefix}transaction_categories`;
    if (!(await AsyncStorage.getItem(nk))) {
      await AsyncStorage.setItem(nk, cat);
      migrated = true;
    }
    await AsyncStorage.removeItem('transactionCategories');
  }

  for (const legacy of ['lifeos_profile', 'lifeos_financial_goals']) {
    const data = await AsyncStorage.getItem(legacy);
    if (!data) continue;
    const short = legacy === 'lifeos_profile' ? 'profile' : 'financial_goals';
    const nk = `${prefix}${short}`;
    if (!(await AsyncStorage.getItem(nk))) {
      await AsyncStorage.setItem(nk, data);
      migrated = true;
    }
    await AsyncStorage.removeItem(legacy);
  }

  return migrated;
}

export async function registerUser(username: string, password: string): Promise<AuthUser> {
  const trimmed = username.trim();
  if (trimmed.length < 2) {
    throw new Error('Username must be at least 2 characters');
  }
  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const users = await loadUsers();
  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('That username is already taken');
  }

  const salt = await randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const id = `u_${Date.now()}_${(await randomHex(6))}`;
  const user: AuthUser = {
    id,
    username: trimmed,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  await migrateLegacyDeviceDataIfAny(id);
  await persistSession(id);
  return user;
}

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const trimmed = username.trim();
  const users = await loadUsers();
  const user = users.find((u) => u.username.toLowerCase() === trimmed.toLowerCase());
  if (!user) {
    throw new Error('Invalid username or password');
  }
  const check = await hashPassword(password, user.salt);
  if (check !== user.passwordHash) {
    throw new Error('Invalid username or password');
  }
  await persistSession(user.id);
  return user;
}

export async function restoreSession(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      setActiveUserId(null);
      return null;
    }
    const { userId } = JSON.parse(raw) as { userId: string };
    const users = await loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      await clearSession();
      return null;
    }
    setActiveUserId(user.id);
    return user;
  } catch {
    await clearSession();
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await clearSession();
}

export function localAuthUserToApp(u: AuthUser): AppAuthUser {
  return {
    id: u.id,
    email: null,
    displayName: u.username,
    provider: 'local',
  };
}

export async function listUsernames(): Promise<string[]> {
  const users = await loadUsers();
  return users.map((u) => u.username);
}
