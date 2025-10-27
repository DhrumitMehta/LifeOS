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

async function compareBalances() {
  try {
    const { data: transactions } = await supabase.from('transactions').select('*');
    
    // Calculate balances
    const accounts = ['Cash', 'Bank', 'Mobile'];
    const balances: any = {};
    
    accounts.forEach(acc => {
      const txs = transactions?.filter(t => t.account === acc) || [];
      let balance = 0;
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      txs.forEach(t => {
        balance += t.type === 'income' ? t.amount : -t.amount;
      });
      balances[acc] = balance;
    });
    
    console.log('=== Calculated Balances from Transactions ===');
    console.log(`Cash: ${balances.Cash.toLocaleString()}`);
    console.log(`Bank: ${balances.Bank.toLocaleString()}`);
    console.log(`Mobile: ${balances.Mobile.toLocaleString()}`);
    console.log(`Total: ${(balances.Cash + balances.Bank + balances.Mobile).toLocaleString()}`);
    
    console.log('\n=== Expected Balances from Excel ===');
    console.log(`Cash: 173,500`);
    console.log(`Bank: 451,802.45`);
    console.log(`Mobile: 305,653`);
    console.log(`Total: 930,955.45`);
    
    console.log('\n=== Differences ===');
    console.log(`Cash: ${balances.Cash - 173500 > 0 ? '+' : ''}${(balances.Cash - 173500).toLocaleString()}`);
    console.log(`Bank: ${balances.Bank - 451802.45 > 0 ? '+' : ''}${(balances.Bank - 451802.45).toLocaleString()}`);
    console.log(`Mobile: ${balances.Mobile - 305653 > 0 ? '+' : ''}${(balances.Mobile - 305653).toLocaleString()}`);
    
    // Check for Inv account transactions
    const invTxs = transactions?.filter(t => t.account === 'Inv') || [];
    console.log(`\n=== Investment Account Transactions ===`);
    console.log(`Total Inv transactions: ${invTxs.length}`);
    if (invTxs.length > 0) {
      console.log('Sample Inv transactions:');
      invTxs.slice(0, 5).forEach((t: any) => {
        console.log(`  ${t.date.split('T')[0]}: ${t.type} ${t.amount} - ${t.description}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

compareBalances().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

