import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://dskmeqmjsrxknqcnwjhx.supabase.co';

export const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza21lcW1qc3J4a25xY253amh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzAxNDAsImV4cCI6MjA3NjgwNjE0MH0.xkfn-JaHYTxmALJrYwnBlSm-_Z-zN-qn5Qlkxs-E9ls';

/** True when real project credentials are present (enables Supabase Auth + cloud DB). */
export function isSupabaseConfigured(): boolean {
  const url = (supabaseUrl || '').trim();
  const key = (supabaseAnonKey || '').trim();
  if (!url || !key) return false;
  if (url.includes('YOUR_SUPABASE') || key.includes('YOUR_SUPABASE')) return false;
  if (url === 'https://placeholder.supabase.co') return false;
  return true;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
