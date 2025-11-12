import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load Supabase config
const supabaseConfigPath = path.join(__dirname, '..', 'src', 'config', 'supabase.ts');
const configContent = fs.readFileSync(supabaseConfigPath, 'utf-8');
const urlMatch = configContent.match(/const supabaseUrl\s*=\s*['"](.+?)['"]/);
const keyMatch = configContent.match(/const supabaseAnonKey\s*=\s*['"](.+?)['"]/);

if (!urlMatch || !keyMatch) {
  console.error('Could not read Supabase config');
  process.exit(1);
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  try {
    // Get all investment category transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${transactions?.length || 0} transactions with Investment category\n`);
    console.log('Sample transactions:');
    transactions?.forEach((t: any) => {
      console.log(`  ${t.date}: ${t.type} - ${t.description} (${t.amount} TZS)`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTransactions().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

