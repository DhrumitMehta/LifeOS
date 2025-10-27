import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = path.join(__dirname, '..', 'Personal Finances Sheet.xlsx');
const inputSheet = XLSX.readFile(excelPath).Sheets['Input'];

// Parse all rows
const data = XLSX.utils.sheet_to_json(inputSheet, {
  header: ['entryNo', 'year', 'month', 'dateSerial', 'description', 'category', 'income', 'expenses', 'source', 'cashBalance', 'bankBalance', 'mobileBalance', 'invBalance', 'col14', 'col15'],
  defval: '',
  range: 1
});

console.log(`Total rows in Excel: ${data.length}`);

// Count rows that should be transactions
const transactionRows = data.filter((row: any) => {
  return row.dateSerial && row.description && row.category && (row.income || row.expenses);
});

console.log(`Valid transaction rows: ${transactionRows.length}`);

// Check for rows that might have been skipped
const skippedRows = data.filter((row: any) => {
  // Has date and description but might have been skipped
  return row.dateSerial && row.description && !(row.income || row.expenses);
});

console.log(`\nRows that might have been skipped:`);
console.log(`Total: ${skippedRows.length}`);
skippedRows.forEach((row: any, idx: number) => {
  console.log(`  ${idx + 1}. Entry ${row.entryNo}: ${row.description} (Date: ${row.dateSerial}, Category: ${row.category})`);
});

// Show all rows with Entry no to identify the issue
console.log(`\n=== Sample rows to understand structure ===`);
for (let i = 0; i < Math.min(20, data.length); i++) {
  const row: any = data[i];
  console.log(`Row ${i + 1}: Entry=${row.entryNo}, Date=${row.dateSerial}, Income=${row.income}, Expense=${row.expenses}, Desc=${row.description}`);
}

