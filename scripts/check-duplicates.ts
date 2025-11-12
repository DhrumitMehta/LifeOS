import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('imported-data.json', 'utf-8'));
const ids = data.transactions.map((t: any) => t.id);
const unique = [...new Set(ids)];
console.log('Total:', ids.length);
console.log('Unique:', unique.length);
console.log('Duplicates:', ids.length - unique.length);

const dups = ids.filter((id: any, i: number) => ids.indexOf(id) !== i);
console.log('Dup IDs (first 10):', [...new Set(dups)].slice(0, 10));

