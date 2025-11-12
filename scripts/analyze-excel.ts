import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = path.join(__dirname, '..', 'Personal Finances Sheet.xlsx');

console.log('Analyzing Excel file:', excelPath);

// Check if file exists
if (!fs.existsSync(excelPath)) {
  console.error('File not found:', excelPath);
  process.exit(1);
}

// Read the workbook
const workbook = XLSX.readFile(excelPath);

console.log('\n=== Workbook Analysis ===');
console.log('Sheet names:', workbook.SheetNames);

// Analyze each sheet
workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Analyzing sheet: "${sheetName}" ---`);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  console.log(`Range: ${worksheet['!ref']}`);
  console.log(`Total rows: ${range.e.r + 1}, Total columns: ${range.e.c + 1}`);
  
  // Read the data
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '' // Default value for empty cells
  });
  
  console.log(`\nFirst 5 rows:`);
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
  }
  
  // Check for "Input" sheet specifically
  if (sheetName === 'Input') {
    console.log('\n=== Input Sheet Structure ===');
    if (data.length > 0) {
      console.log('Column headers (Row 1):');
      if (Array.isArray(data[0])) {
        data[0].forEach((header, index) => {
          console.log(`  Column ${index}: ${header}`);
        });
      }
      
      console.log('\nSample rows (first 3 data rows):');
      for (let i = 1; i < Math.min(4, data.length); i++) {
        console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
      }
    }
  }
});

console.log('\n=== Analysis Complete ===');

