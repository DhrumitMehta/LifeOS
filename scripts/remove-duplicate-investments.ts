import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load Supabase config
const supabaseConfigPath = path.join(__dirname, '..', 'src', 'config', 'supabase.ts');
const configContent = fs.readFileSync(supabaseConfigPath, 'utf-8');
const urlMatch = configContent.match(/const supabaseUrl\s*=\s*['"](.+?)['"]/);
const keyMatch = configContent.match(/const supabaseAnonKey\s*=\s*['"](.+?)['"]/);

if (!urlMatch || !keyMatch) {
  console.error('Could not read Supabase config');
  process.exit(1);
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicateInvestments() {
  try {
    console.log('Finding duplicate investment transactions...\n');
    
    // Get all investment transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('No investment transactions found.');
      return;
    }
    
    console.log(`Found ${transactions.length} investment transactions\n`);
    
    // Group by unique key (description, date, amount)
    const seen = new Map<string, any[]>();
    
    transactions.forEach(txn => {
      const dateStr = new Date(txn.date).toISOString().split('T')[0];
      const key = `${txn.description}_${dateStr}_${txn.amount}`;
      
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(txn);
    });
    
    // Find duplicates
    const duplicates: any[] = [];
    seen.forEach((txns, key) => {
      if (txns.length > 1) {
        console.log(`Found ${txns.length} duplicates for: ${key}`);
        // Keep the first one, mark others for deletion
        for (let i = 1; i < txns.length; i++) {
          duplicates.push(txns[i]);
        }
      }
    });
    
    if (duplicates.length === 0) {
      console.log('\n✓ No duplicates found!');
      return;
    }
    
    console.log(`\nFound ${duplicates.length} duplicate transactions to delete`);
    console.log('\nDeleting duplicates...');
    
    // Delete duplicates
    for (const dup of duplicates) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', dup.id);
      
      if (error) {
        console.error(`Error deleting transaction ${dup.id}:`, error);
      } else {
        console.log(`✓ Deleted duplicate: ${dup.description} on ${new Date(dup.date).toLocaleDateString()}`);
      }
    }
    
    console.log(`\n✅ Removed ${duplicates.length} duplicate transactions!`);
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
  }
}

// Run the cleanup
removeDuplicateInvestments();

