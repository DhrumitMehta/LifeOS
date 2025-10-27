import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../src/types';

// Load Supabase config
const supabaseConfigPath = path.join(__dirname, '..', 'src', 'config', 'supabase.ts');
const supabaseExamplePath = path.join(__dirname, '..', 'src', 'config', 'supabase.example.ts');

let supabaseUrl = '';
let supabaseKey = '';

// Try to read actual config, fallback to example
try {
  const configContent = fs.readFileSync(supabaseConfigPath, 'utf-8');
  // Extract URL and key using regex - match const supabaseUrl = '...' pattern
  const urlMatch = configContent.match(/const supabaseUrl\s*=\s*['"](.+?)['"]/);
  const keyMatch = configContent.match(/const supabaseAnonKey\s*=\s*['"](.+?)['"]/);
  
  if (urlMatch && keyMatch) {
    supabaseUrl = urlMatch[1];
    supabaseKey = keyMatch[1];
  }
} catch (error) {
  console.log('Could not read supabase config:', error);
}

// If still not found, try example
if (!supabaseUrl || !supabaseKey) {
  try {
    const exampleContent = fs.readFileSync(supabaseExamplePath, 'utf-8');
    const urlMatch = exampleContent.match(/const supabaseUrl\s*=\s*['"](.+?)['"]/);
    const keyMatch = exampleContent.match(/const supabaseAnonKey\s*=\s*['"](.+?)['"]/);
    
    if (urlMatch && keyMatch) {
      supabaseUrl = urlMatch[1];
      supabaseKey = keyMatch[1];
    }
  } catch (error) {
    console.error('Could not read Supabase config files');
  }
}

console.log('Supabase URL:', supabaseUrl ? '✓ Configured' : '✗ Not configured');
console.log('Supabase Key:', supabaseKey ? '✓ Configured' : '✗ Not configured');

const dataPath = path.join(__dirname, '..', 'imported-data.json');

console.log('Starting Supabase import...');
console.log('Data file:', dataPath);

// Check if data file exists
if (!fs.existsSync(dataPath)) {
  console.error('Data file not found. Please run import-finances.ts first.');
  process.exit(1);
}

// Load the imported data
const importedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const { transactions } = importedData;

console.log(`Loaded ${transactions.length} transactions`);

// Initialize Supabase client
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('Supabase not configured!');
  console.log('Please configure src/config/supabase.ts with your Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert transaction to Supabase format
function formatTransaction(transaction: any) {
  // Ensure dates are Date objects
  const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
  const createdAt = transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt);
  const updatedAt = transaction.updatedAt instanceof Date ? transaction.updatedAt : new Date(transaction.updatedAt);

  // Ensure tags is an array
  let tags: string[] = [];
  if (Array.isArray(transaction.tags)) {
    tags = transaction.tags;
  } else if (typeof transaction.tags === 'string') {
    try {
      tags = JSON.parse(transaction.tags);
    } catch (e) {
      tags = [];
    }
  }

  return {
    id: transaction.id,
    type: transaction.type,
    category: transaction.category,
    subcategory: transaction.subcategory || null,
    amount: transaction.amount,
    description: transaction.description,
    date: date.toISOString(), // Full timestamp
    account: transaction.account || null,
    tags: tags, // Pass as array for PostgreSQL TEXT[]
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
  };
}

async function importToSupabase() {
  try {
    console.log('\nTesting Supabase connection...');
    const { data, error } = await supabase.from('transactions').select('count').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      console.log('\nTrying to continue anyway...');
    } else {
      console.log('✓ Connected to Supabase');
    }

    console.log('\nStarting import...');
    console.log('This may take a few minutes for large datasets.');
    
    // Batch insert to avoid overwhelming the API
    const batchSize = 100;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const formattedBatch = batch.map(formatTransaction);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('transactions')
        .insert(formattedBatch);

      if (insertError) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, insertError.message);
        failed += batch.length;
      } else {
        imported += batch.length;
        console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(transactions.length / batchSize)} (${imported}/${transactions.length})`);
      }

      // Rate limiting - wait 100ms between batches
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total transactions: ${transactions.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Failed: ${failed}`);
    
    // Verify the import
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nTotal transactions in database: ${count}`);

  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

// Run the import
importToSupabase().then(() => {
  console.log('\n✓ Import complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

