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

async function checkLatestBalances() {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    console.log('=== Latest Balance Transactions ===');
    
    // Find latest transaction for each account
    const seenAccounts = new Set();
    transactions?.forEach((t: any) => {
      const account = t.account;
      if (account && !seenAccounts.has(account) && 
          (t.description.toLowerCase().includes('balance') || 
           t.description.toLowerCase().includes('cash') ||
           t.description.toLowerCase().includes('bank'))) {
        seenAccounts.add(account);
        console.log(`${account}: ${t.description} - ${t.amount} TZS (${t.date})`);
      }
    });

    // Also show some cash transactions to understand the pattern
    console.log('\n=== Sample Cash Transactions (latest 10) ===');
    transactions?.filter(t => t.account === 'Cash').slice(0, 10).forEach(t => {
      console.log(`${t.date.split('T')[0]}: ${t.type} ${t.amount} - ${t.description}`);
    });

    console.log('\n=== Sample Bank Transactions (latest 10) ===');
    transactions?.filter(t => t.account === 'Bank').slice(0, 10).forEach(t => {
      console.log(`${t.date.split('T')[0]}: ${t.type} ${t.amount} - ${t.description}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLatestBalances().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

