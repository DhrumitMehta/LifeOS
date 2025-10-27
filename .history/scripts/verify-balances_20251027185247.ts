import * as XLSX from 'xlsx';

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

// Process transactions
const transactions: Array<{account: string, type: 'income' | 'expense', amount: number, date: Date}> = [];

data.forEach((row: any, index: number) => {
  if (!row.dateSerial || !row.description || !row.category) {
    return;
  }

  const date = excelSerialToDate(row.dateSerial);
  
  // Determine transaction type
  let type: 'income' | 'expense' = 'expense';
  let amount = 0;
  
  if (row.income && row.income > 0) {
    type = 'income';
    amount = row.income;
  } else if (row.expenses) {
    // Handle negative expenses (corrections) as income
    if (row.expenses < 0) {
      type = 'income';
      amount = Math.abs(row.expenses);
    } else if (row.expenses > 0) {
      type = 'expense';
      amount = row.expenses;
    }
  }
  
  // Skip if no amount
  if (amount <= 0) {
    return;
  }

  // Get account information
  const account = row.source || 'Cash';
  
  transactions.push({
    account,
    type,
    amount,
    date
  });
});

// Calculate balances for each account
console.log('=== Calculating Account Balances ===\n');

const accountBalances: {[key: string]: {income: number, expense: number, balance: number}} = {
  Cash: { income: 0, expense: 0, balance: 0 },
  Bank: { income: 0, expense: 0, balance: 0 },
  Mobile: { income: 0, expense: 0, balance: 0 },
  Inv: { income: 0, expense: 0, balance: 0 },
};

// Sort by date
transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

// Calculate running balances
transactions.forEach(t => {
  if (!accountBalances[t.account]) {
    accountBalances[t.account] = { income: 0, expense: 0, balance: 0 };
  }
  
  if (t.type === 'income') {
    accountBalances[t.account].income += t.amount;
    accountBalances[t.account].balance += t.amount;
  } else {
    accountBalances[t.account].expense += t.amount;
    accountBalances[t.account].balance -= t.amount;
  }
});

console.log('Calculated Balances:');
console.log(`Cash: ${accountBalances.Cash.balance.toLocaleString()} TZS`);
console.log(`Bank: ${accountBalances.Bank.balance.toLocaleString()} TZS`);
console.log(`Mobile: ${accountBalances.Mobile.balance.toLocaleString()} TZS`);
console.log(`Investment: ${accountBalances.Inv.balance.toLocaleString()} TZS`);
console.log(`\nTotal: ${(accountBalances.Cash.balance + accountBalances.Bank.balance + accountBalances.Mobile.balance).toLocaleString()} TZS`);

console.log('\n=== Excel Running Balances ===');
const lastRow: any = data[data.length - 1];
console.log(`Cash Balance: ${lastRow.cashBalance || '0'} TZS`);
console.log(`Bank Balance: ${lastRow.bankBalance || '0'} TZS`);
console.log(`Mobile Balance: ${lastRow.mobileBalance || '0'} TZS`);

