import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(__dirname, '..', 'imported-data.json');
const importedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const { transactions } = importedData;

console.log(`Total transactions: ${transactions.length}`);

// Check for duplicate IDs
const idMap = new Map();
const duplicates: any[] = [];

transactions.forEach((t: any, index: number) => {
  if (idMap.has(t.id)) {
    duplicates.push({ index, id: t.id, description: t.description });
  }
  idMap.set(t.id, t);
});

console.log(`Unique IDs: ${idMap.size}`);
console.log(`Duplicate IDs found: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\nFirst 10 duplicates:');
  duplicates.slice(0, 10).forEach(dup => {
    console.log(`  ID: ${dup.id}, Description: ${dup.description}`);
  });
}

// Check for entries with the same description and date
const descriptionDateMap = new Map();
transactions.forEach((t: any, index: number) => {
  const key = `${t.description}_${t.date}`;
  if (!descriptionDateMap.has(key)) {
    descriptionDateMap.set(key, []);
  }
  descriptionDateMap.get(key).push({ index, id: t.id, t });
});

const sameDescriptionDate = Array.from(descriptionDateMap.values()).filter(arr => arr.length > 1);
console.log(`\nEntries with same description and date: ${sameDescriptionDate.length}`);

if (sameDescriptionDate.length > 0) {
  console.log('\nSample duplicate entries:');
  sameDescriptionDate.slice(0, 5).forEach((arr, idx) => {
    console.log(`  ${arr[0].t.description} (${arr[0].t.date}): ${arr.length} entries`);
    arr.forEach((entry: any) => {
      console.log(`    - ${entry.id}: amount=${entry.t.amount}, type=${entry.t.type}`);
    });
  });
}

