import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://dskmeqmjsrxknqcnwjhx.supabase.co';
const supabaseAnonKey = 'xkfn-JaHYTxmALJrYwnBlSm-_Z-zN-qn5Qlkxs-E9ls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
