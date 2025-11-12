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

async function checkBalance() {
  try {
    // Get all transactions
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*');

    // Get all investments
    const { data: investments } = await supabase
      .from('investments')
      .select('*');

    const income = allTransactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const expenses = allTransactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const investmentTotal = investments
      ?.reduce((sum, i) => sum + (i.total_value || 0), 0) || 0;

    console.log('=== Balance Calculation ===');
    console.log(`Total Income: ${income.toLocaleString()} TZS`);
    console.log(`Total Expenses: ${expenses.toLocaleString()} TZS`);
    console.log(`Balance (Income - Expenses): ${(income - expenses).toLocaleString()} TZS`);
    console.log(`Investments: ${investmentTotal.toLocaleString()} TZS`);
    console.log(`Net Worth (Balance + Investments): ${(income - expenses + investmentTotal).toLocaleString()} TZS`);
    console.log('\nExcel shows current balance: 2,070,955 TZS');
    console.log(`Difference: ${((income - expenses + investmentTotal) - 2070955).toLocaleString()} TZS`);

    // Check investment expenses
    const investmentExpenses = allTransactions
      ?.filter(t => t.type === 'expense' && t.category === 'Investment')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const investmentIncomes = allTransactions
      ?.filter(t => t.type === 'income' && t.category === 'Investment')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    console.log('\n=== Investment Transactions ===');
    console.log(`Investment Expenses: ${investmentExpenses.toLocaleString()} TZS`);
    console.log(`Investment Income: ${investmentIncomes.toLocaleString()} TZS`);
    console.log(`Net Investment Transactions: ${(investmentIncomes - investmentExpenses).toLocaleString()} TZS`);

    // The issue is that we're treating investment expenses as regular expenses
    // But in Excel, investment purchases are tracked differently
    console.log('\n=== Corrected Balance ===');
    const correctedBalance = income - (expenses - investmentExpenses);
    console.log(`Balance excluding investment purchases: ${correctedBalance.toLocaleString()} TZS`);
    console.log(`Net Worth with investments: ${(correctedBalance + investmentTotal).toLocaleString()} TZS`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalance().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

