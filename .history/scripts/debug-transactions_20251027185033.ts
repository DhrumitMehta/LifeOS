import * as XLSX from 'xlsx';

const excelPath = 'Personal Finances Sheet.xlsx';
const inputSheet = XLSX.readFile(excelPath).Sheets['Input'];

const data = XLSX.utils.sheet_to_json(inputSheet, {
  header: ['entryNo','year','month','dateSerial','description','category','income','expenses','source','cashBalance','bankBalance','mobileBalance','invBalance','col14','col15'],
  defval: ''
});

console.log('=== Checking for missing/invalid transactions ===\n');

// Count rows with valid transactions (should be 1068)
const validTransactions = data.filter((r: any) => {
  return r.dateSerial && r.description && r.category && (r.income > 0 || r.expenses > 0 || r.expenses < 0);
});

console.log(`Total valid transaction rows: ${validTransactions.length}`);
console.log(`Expected: 1068\n`);

// Find negative expenses
const negativeExpenses = data.filter((r: any) => r.expenses < 0);
console.log(`Negative expense entries: ${negativeExpenses.length}`);
negativeExpenses.forEach((r: any) => {
  console.log(`  Entry ${r.entryNo}: ${r.description} = ${r.expenses} (Category: ${r.category})`);
});

// Find rows with no amounts
const noAmounts = data.filter((r: any) => {
  return r.dateSerial && r.description && r.category && !r.income && !r.expenses;
});
console.log(`\nRows with no income/expense amounts: ${noAmounts.length}`);
noAmounts.forEach((r: any) => {
  console.log(`  Entry ${r.entryNo}: ${r.description} (${r.category})`);
  console.log(`    CashBal: ${r.cashBalance}, BankBal: ${r.bankBalance}, MobileBal: ${r.mobileBalance}`);
});

// Calculate total income and expenses to find net
let totalIncome = 0;
let totalExpenses = 0;

validTransactions.forEach((r: any) => {
  if (r.income > 0) totalIncome += r.income;
  if (r.expenses > 0) totalExpenses += r.expenses;
  if (r.expenses < 0) totalIncome += Math.abs(r.expenses); // Negative expenses become income
});

console.log(`\n=== Calculation from Excel ===`);
console.log(`Total Income: ${totalIncome.toLocaleString()} TZS`);
console.log(`Total Expenses: ${totalExpenses.toLocaleString()} TZS`);
console.log(`Net: ${(totalIncome - totalExpenses).toLocaleString()} TZS`);
console.log(`Expected Net: 2,070,955 TZS`);

