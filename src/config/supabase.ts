import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables or use defaults
// For EAS builds, set these as secrets: eas secret:create --scope project --name SUPABASE_URL --value YOUR_URL
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://dskmeqmjsrxknqcnwjhx.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza21lcW1qc3J4a25xY253amh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzAxNDAsImV4cCI6MjA3NjgwNjE0MH0.xkfn-JaHYTxmALJrYwnBlSm-_Z-zN-qn5Qlkxs-E9ls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
