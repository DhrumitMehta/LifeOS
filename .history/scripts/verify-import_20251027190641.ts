import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = 'Personal Finances Sheet.xlsx';
const inputSheet = XLSX.readFile(excelPath).Sheets['Input'];

const data = XLSX.utils.sheet_to_json(inputSheet, {
  header: ['entryNo','year','month','dateSerial','description','category','income','expenses','source','cashBalance','bankBalance','mobileBalance','invBalance','col14','col15'],
  defval: ''
});

// Convert Excel serial date to JS Date
function excelSerialToDate(serial: number): Date {
  const epoch = new Date(1899, 11, 30).getTime();
  return new Date(epoch + (serial - 1) * 86400000);
}

// Read Supabase config
const configPath = 'src/config/supabase.ts';
const configExamplePath = 'src/config/supabase.example.ts';
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const urlMatch = configContent.match(/SUPABASE_URL:\s*["']([^"']+)["']/);
  const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*["']([^"']+)["']/);
  if (urlMatch) supabaseUrl = urlMatch[1];
  if (keyMatch) supabaseKey = keyMatch[1];
} else if (fs.existsSync(configExamplePath)) {
  const configContent = fs.readFileSync(configExamplePath, 'utf-8');
  const urlMatch = configContent.match(/SUPABASE_URL:\s*["']([^"']+)["']/);
  const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*["']([^"']+)["']/);
  if (urlMatch) supabaseUrl = urlMatch[1];
  if (keyMatch) supabaseKey = keyMatch[1];
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImport() {
  console.log('=== Verifying Import ===\n');

  // Calculate balances from Excel
  const transactions: Array<{account: string, type: 'income' | 'expense', amount: number, date: Date}> = [];

  data.forEach((row: any, index: number) => {
    if (!row.dateSerial || !row.description || !row.category) {
      return;
    }

    const date = excelSerialToDate(row.dateSerial);
    
    let type: 'income' | 'expense' = 'expense';
    let amount = 0;
    
    if (row.income && row.income > 0) {
      type = 'income';
      amount = row.income;
    } else if (row.expenses) {
      if (row.expenses < 0) {
        type = 'income';
        amount = Math.abs(row.expenses);
      } else if (row.expenses > 0) {
        type = 'expense';
        amount = row.expenses;
      }
    }
    
    if (amount <= 0) {
      return;
    }

    const account = row.source || 'Cash';
    
    transactions.push({
      account,
      type,
      amount,
      date
    });
  });

  // Calculate balances from Excel transactions
  const accountBalances: {[key: string]: {income: number, expense: number, balance: number}} = {
    Cash: { income: 0, expense: 0, balance: 0 },
    Bank: { income: 0, expense: 0, balance: 0 },
    Mobile: { income: 0, expense: 0, balance: 0 },
  };

  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  transactions.forEach(t => {
    if (accountBalances[t.account]) {
      if (t.type === 'income') {
        accountBalances[t.account].income += t.amount;
        accountBalances[t.account].balance += t.amount;
      } else {
        accountBalances[t.account].expense += t.amount;
        accountBalances[t.account].balance -= t.amount;
      }
    }
  });

  console.log('Calculated from Excel transactions:');
  console.log(`Cash: ${accountBalances.Cash.balance.toLocaleString()} TZS`);
  console.log(`Bank: ${accountBalances.Bank.balance.toLocaleString()} TZS`);
  console.log(`Mobile: ${accountBalances.Mobile.balance.toLocaleString()} TZS`);
  console.log(`Total: ${(accountBalances.Cash.balance + accountBalances.Bank.balance + accountBalances.Mobile.balance).toLocaleString()} TZS`);

  // Get last row balances from Excel
  const lastRow: any = data[data.length - 1];
  console.log('\nLast row running balances from Excel:');
  console.log(`Cash: ${lastRow.cashBalance || '0'} TZS`);
  console.log(`Bank: ${lastRow.bankBalance || '0'} TZS`);
  console.log(`Mobile: ${lastRow.mobileBalance || '0'} TZS`);
  console.log(`Total: ${((lastRow.cashBalance || 0) + (lastRow.bankBalance || 0) + (lastRow.mobileBalance || 0)).toLocaleString()} TZS`);

  // Now fetch from Supabase
  console.log('\n=== Fetching from Supabase ===');
  const { data: supabaseTransactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log(`Fetched ${supabaseTransactions?.length || 0} transactions from Supabase`);

  // Calculate balances from Supabase transactions
  const supabaseBalances: {[key: string]: {income: number, expense: number, balance: number}} = {
    Cash: { income: 0, expense: 0, balance: 0 },
    Bank: { income: 0, expense: 0, balance: 0 },
    Mobile: { income: 0, expense: 0, balance: 0 },
  };

  if (supabaseTransactions) {
    supabaseTransactions
      .filter((t: any) => ['Cash', 'Bank', 'Mobile'].includes(t.account))
      .forEach((t: any) => {
        if (!supabaseBalances[t.account]) {
          supabaseBalances[t.account] = { income: 0, expense: 0, balance: 0 };
        }
        
        if (t.type === 'income') {
          supabaseBalances[t.account].income += parseFloat(t.amount);
          supabaseBalances[t.account].balance += parseFloat(t.amount);
        } else {
          supabaseBalances[t.account].expense += parseFloat(t.amount);
          supabaseBalances[t.account].balance -= parseFloat(t.amount);
        }
      });
  }

  console.log('\nCalculated from Supabase transactions:');
  console.log(`Cash: ${supabaseBalances.Cash.balance.toLocaleString()} TZS`);
  console.log(`Bank: ${supabaseBalances.Bank.balance.toLocaleString()} TZS`);
  console.log(`Mobile: ${supabaseBalances.Mobile.balance.toLocaleString()} TZS`);
  console.log(`Total: ${(supabaseBalances.Cash.balance + supabaseBalances.Bank.balance + supabaseBalances.Mobile.balance).toLocaleString()} TZS`);
}

verifyImport();

