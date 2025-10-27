import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const configPath = 'src/config/supabase.ts';
const configContent = fs.readFileSync(configPath, 'utf-8');
const urlMatch = configContent.match(/supabaseUrl\s*=\s*["']([^"']+)["']/);
const keyMatch = configContent.match(/supabaseAnonKey\s*=\s*["']([^"']+)["']/);

if (!urlMatch || !keyMatch) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function verify() {
  console.log('=== Final Verification ===\n');
  
  // Fetch all transactions with pagination
  let allTransactions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (data && data.length > 0) {
      allTransactions = allTransactions.concat(data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✓ Total transactions in Supabase: ${allTransactions.length}`);
  
  // Calculate account balances
  const balances = {
    Cash: { income: 0, expense: 0, balance: 0 },
    Bank: { income: 0, expense: 0, balance: 0 },
    Mobile: { income: 0, expense: 0, balance: 0 },
  };

  allTransactions
    .filter((t: any) => ['Cash', 'Bank', 'Mobile'].includes(t.account))
    .forEach((t: any) => {
      if (t.type === 'income') {
        balances[t.account].income += parseFloat(t.amount);
        balances[t.account].balance += parseFloat(t.amount);
      } else {
        balances[t.account].expense += parseFloat(t.amount);
        balances[t.account].balance -= parseFloat(t.amount);
      }
    });

  console.log('\n=== Calculated Balances ===');
  console.log(`Cash: ${balances.Cash.balance.toLocaleString()} TZS`);
  console.log(`Bank: ${balances.Bank.balance.toLocaleString()} TZS`);
  console.log(`Mobile: ${balances.Mobile.balance.toLocaleString()} TZS`);
  console.log(`Total: ${(balances.Cash.balance + balances.Bank.balance + balances.Mobile.balance).toLocaleString()} TZS`);
  
  console.log('\n✓ All verification complete!');
}

verify();

