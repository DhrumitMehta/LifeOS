import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Transaction, Investment, Budget, Account } from '../src/types';

const excelPath = path.join(__dirname, '..', 'Personal Finances Sheet.xlsx');
const outputPath = path.join(__dirname, '..', 'imported-data.json');

interface ExcelTransaction {
  entryNo: number;
  year: number;
  month: string;
  dateSerial: number; // Excel serial date
  description: string;
  category: string;
  income?: number;
  expenses?: number;
  source: string; // Account source
  cashBalance?: number;
  bankBalance?: number;
  mobileBalance?: number;
  invBalance?: number;
}

interface BalanceInfo {
  cash: number;
  bank: number;
  mobile: number;
  date: Date;
}

// Store balance information for each transaction
const balanceRecords: Array<{ date: Date, cash: number, bank: number, mobile: number, description: string }> = [];

console.log('Starting import process...');
console.log('Reading Excel file:', excelPath);

// Check if file exists
if (!fs.existsSync(excelPath)) {
  console.error('File not found:', excelPath);
  process.exit(1);
}

// Read the workbook
const workbook = XLSX.readFile(excelPath);

// Get the Input sheet
const inputSheet = workbook.Sheets['Input'];
if (!inputSheet) {
  console.error('Input sheet not found!');
  process.exit(1);
}

// Parse the data
const data = XLSX.utils.sheet_to_json(inputSheet, {
  header: [
    'entryNo',
    'year',
    'month',
    'dateSerial',
    'description',
    'category',
    'income',
    'expenses',
    'source',
    'cashBalance',
    'bankBalance',
    'mobileBalance',
    'invBalance',
    'col14',
    'col15'
  ],
  defval: '',
  range: 1 // Start from row 1 (header row)
});

console.log(`Found ${data.length} rows in Input sheet`);

// Extract current balances from the Excel
let currentCashBalance = 0;
let currentBankBalance = 0;
let currentMobileBalance = 0;

// Find the last row with balance information
for (let i = data.length - 1; i >= 0; i--) {
  const row: any = data[i];
  if (row.cashBalance && !isNaN(row.cashBalance) && currentCashBalance === 0) {
    currentCashBalance = row.cashBalance;
  }
  if (row.bankBalance && !isNaN(row.bankBalance) && currentBankBalance === 0) {
    currentBankBalance = row.bankBalance;
  }
  if (row.mobileBalance && !isNaN(row.mobileBalance) && currentMobileBalance === 0) {
    currentMobileBalance = row.mobileBalance;
  }
  // Once we have all three, we can break
  if (currentCashBalance !== 0 && currentBankBalance !== 0 && currentMobileBalance !== 0) break;
}

console.log('\n=== Current Balances from Excel ===');
console.log(`Cash Balance: ${currentCashBalance.toLocaleString()} TZS`);
console.log(`Bank Balance: ${currentBankBalance.toLocaleString()} TZS`);
console.log(`Mobile Balance: ${currentMobileBalance.toLocaleString()} TZS`);
console.log(`Total: ${(currentCashBalance + currentBankBalance + currentMobileBalance).toLocaleString()} TZS`);

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
  const days = Math.floor(serial);
  const milliseconds = (serial - days) * 86400000;
  const date = new Date(excelEpoch.getTime() + days * 86400000 + milliseconds);
  return date;
}

// Process and transform data
const transactions: Transaction[] = [];
const initialAccounts: Map<string, Account> = new Map();

// Track unique accounts
const accountNames = new Set<string>();
const accountTypes = new Map<string, string>();

console.log('\nProcessing data...');

data.forEach((row: any, index: number) => {
  // Skip rows without proper date or description
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
  accountNames.add(account);
  
  if (!accountTypes.has(account)) {
    const accountType = 
      account.toLowerCase().includes('bank') ? 'checking' :
      account.toLowerCase().includes('cash') ? 'cash' :
      account.toLowerCase().includes('mobile') ? 'cash' :
      account.toLowerCase().includes('inv') ? 'investment' :
      'other';
    accountTypes.set(account, accountType);
  }

  // Create transaction with unique ID based on transaction data
  const uniqueId = `${row.entryNo || index}-${date.toISOString()}-${type}-${amount}-${row.description.substring(0, 20)}`;
  const transaction: Transaction = {
    id: uniqueId.replace(/[^a-zA-Z0-9-_]/g, '_'),
    type,
    category: row.category,
    amount,
    description: row.description,
    date,
    account: account,
    tags: [],
    createdAt: date,
    updatedAt: date,
  };

  // Add subcategory from month if available
  if (row.month) {
    transaction.subcategory = row.month;
  }

  transactions.push(transaction);

  // Track initial account balances
  if (row.cashBalance && row.cashBalance > 0 && !initialAccounts.has('Cash')) {
    initialAccounts.set('Cash', {
      id: 'cash-account',
      name: 'Cash',
      type: 'cash',
      balance: row.cashBalance,
      currency: 'TZS',
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
  }

  if (row.bankBalance && row.bankBalance > 0 && !initialAccounts.has('Bank')) {
    initialAccounts.set('Bank', {
      id: 'bank-account',
      name: 'Bank',
      type: 'checking',
      balance: row.bankBalance,
      currency: 'TZS',
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
  }

  if (row.invBalance && row.invBalance > 0 && !initialAccounts.has('Investments')) {
    initialAccounts.set('Investments', {
      id: 'investment-account',
      name: 'Investment Account',
      type: 'investment',
      balance: row.invBalance,
      currency: 'TZS',
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
  }
});

console.log(`Processed ${transactions.length} transactions`);
console.log(`Found ${initialAccounts.size} initial account balances`);

// Extract unique categories
const categories = new Set<string>();
transactions.forEach(t => {
  categories.add(t.category);
});

console.log('\nUnique categories found:');
Array.from(categories).sort().forEach(cat => console.log(`  - ${cat}`));

// Save to JSON file
const outputData = {
  transactions,
  accounts: Array.from(initialAccounts.values()),
  currentBalances: {
    cash: currentCashBalance,
    bank: currentBankBalance,
    mobile: currentMobileBalance,
  },
  metadata: {
    totalTransactions: transactions.length,
    dateRange: {
      from: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
      to: transactions.length > 0 ? transactions[0].date : null,
    },
    categories: Array.from(categories),
    accounts: Array.from(accountNames),
  }
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(`\nData saved to: ${outputPath}`);

// Print summary statistics
const incomeTotal = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);

const expenseTotal = transactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0);

console.log('\n=== Import Summary ===');
console.log(`Total Transactions: ${transactions.length}`);
console.log(`Income Transactions: ${transactions.filter(t => t.type === 'income').length}`);
console.log(`Expense Transactions: ${transactions.filter(t => t.type === 'expense').length}`);
console.log(`Total Income: ${incomeTotal.toLocaleString()} TZS`);
console.log(`Total Expenses: ${expenseTotal.toLocaleString()} TZS`);
console.log(`Net: ${(incomeTotal - expenseTotal).toLocaleString()} TZS`);
console.log(`Date Range: ${transactions[transactions.length - 1]?.date.toLocaleDateString()} to ${transactions[0]?.date.toLocaleDateString()}`);

console.log('\nImport complete!');

