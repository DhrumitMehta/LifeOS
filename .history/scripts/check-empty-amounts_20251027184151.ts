import * as XLSX from 'xlsx';

const excelPath = 'Personal Finances Sheet.xlsx';
const inputSheet = XLSX.readFile(excelPath).Sheets['Input'];

const data = XLSX.utils.sheet_to_json(inputSheet, {
  header: ['entryNo','year','month','dateSerial','description','category','income','expenses','source','cashBalance','bankBalance','mobileBalance','invBalance','col14','col15'],
  defval: ''
});

console.log('Checking rows with no income/expense amounts but have descriptions...\n');

let found = 0;
data.forEach((r: any, i: number) => {
  if (r.description && r.category && !r.income && !r.expenses && r.dateSerial && 
      (r.cashBalance || r.bankBalance || r.mobileBalance)) {
    console.log(`Row ${i+1}, Entry ${r.entryNo}: ${r.description}`);
    console.log(`  Category: ${r.category}, Date: ${r.dateSerial}`);
    console.log(`  Source: ${r.source || 'none'}`);
    console.log(`  Cash: ${r.cashBalance}, Bank: ${r.bankBalance}, Mobile: ${r.mobileBalance}\n`);
    found++;
  }
});

console.log(`\nTotal rows with no amounts but balance info: ${found}`);

