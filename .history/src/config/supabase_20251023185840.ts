import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://dskmeqmjsrxknqcnwjhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza21lcW1qc3J4a25xY253amh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzAxNDAsImV4cCI6MjA3NjgwNjE0MH0.xkfn-JaHYTxmALJrYwnBlSm-_Z-zN-qn5Qlkxs-E9ls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
