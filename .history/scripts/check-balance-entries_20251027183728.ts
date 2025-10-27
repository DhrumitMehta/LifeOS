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

async function checkBalanceEntries() {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .ilike('description', '%Balance%')
      .order('date', { ascending: true });

    console.log(`Found ${transactions?.length || 0} balance-related transactions:\n`);
    
    transactions?.forEach((t: any) => {
      console.log(`${t.date.split('T')[0]}: ${t.account} - ${t.type} ${t.amount} - ${t.description}`);
    });

    // Now check the difference in balances
    console.log('\n=== Balance Calculation ===');
    
    // Calculate excluding balance-setting entries
    const allTxns = await supabase.from('transactions').select('*');
    const cash = allTxns.data?.filter(t => t.account === 'Cash' && !t.description.toLowerCase().includes('balance')) || [];
    const bank = allTxns.data?.filter(t => t.account === 'Bank' && !t.description.toLowerCase().includes('balance')) || [];
    const mobile = allTxns.data?.filter(t => t.account === 'Mobile' && !t.description.toLowerCase().includes('balance')) || [];

    const calcBalance = (txns: any[]) => {
      return txns.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);
    };

    const cashBalance = calcBalance(cash);
    const bankBalance = calcBalance(bank);
    const mobileBalance = calcBalance(mobile);

    console.log(`Without balance entries:`);
    console.log(`Cash: ${cashBalance.toLocaleString()} TZS`);
    console.log(`Bank: ${bankBalance.toLocaleString()} TZS`);
    console.log(`Mobile: ${mobileBalance.toLocaleString()} TZS`);
    console.log(`Total: ${(cashBalance + bankBalance + mobileBalance).toLocaleString()} TZS`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalanceEntries().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

