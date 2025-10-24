import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://dskmeqmjsrxknqcnwjhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza21lcW1qc3J4a25xY253amh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIzMDE0MCwiZXhwIjoyMDc2ODA2MTQwfQ.qlWo3WCCMyEsf0cn5YYidAulio8_hdWUe5imyLU7Rpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
