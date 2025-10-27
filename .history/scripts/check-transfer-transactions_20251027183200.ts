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

async function checkTransfers() {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .like('description', '%to%')
      .order('date', { ascending: false });

    console.log(`Found ${transactions?.length || 0} transfer-related transactions\n`);
    
    transactions?.forEach((t: any) => {
      console.log(`${t.date.split('T')[0]}: ${t.account} - ${t.type} ${t.amount} - ${t.description}`);
    });

    // Now calculate balances
    console.log('\n=== Calculating Balances ===');
    
    const allTxns = await supabase.from('transactions').select('*');
    const cash = allTxns.data?.filter(t => t.account === 'Cash') || [];
    const bank = allTxns.data?.filter(t => t.account === 'Bank') || [];
    const mobile = allTxns.data?.filter(t => t.account === 'Mobile') || [];

    const calcBalance = (txns: any[]) => {
      return txns.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);
    };

    const cashBalance = calcBalance(cash);
    const bankBalance = calcBalance(bank);
    const mobileBalance = calcBalance(mobile);

    console.log(`Cash Balance: ${cashBalance.toLocaleString()} TZS`);
    console.log(`Bank Balance: ${bankBalance.toLocaleString()} TZS`);
    console.log(`Mobile Balance: ${mobileBalance.toLocaleString()} TZS`);
    console.log(`Total: ${(cashBalance + bankBalance + mobileBalance).toLocaleString()} TZS`);
    console.log(`\nExpected: Cash=173,500, Bank=451,802.45, Mobile=305,653`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTransfers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

