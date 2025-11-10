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

async function removeHistoricalInvestmentTransactions() {
  try {
    console.log('Removing historical investment transactions...\n');
    
    // Get all investment transactions that were imported (they have IDs starting with 'inv-hist-')
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment')
      .like('id', 'inv-hist-%');
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('No historical investment transactions found.');
      return;
    }
    
    console.log(`Found ${transactions.length} historical investment transactions to remove\n`);
    
    // Show summary
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    console.log(`Total amount: ${totalAmount.toLocaleString()} TZS`);
    console.log('\nRemoving transactions...\n');
    
    // Delete transactions in batches
    const batchSize = 10;
    let deleted = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      for (const txn of batch) {
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', txn.id);
        
        if (deleteError) {
          console.error(`Error deleting transaction ${txn.id}:`, deleteError);
        } else {
          deleted++;
          console.log(`✓ Deleted: ${txn.description} - ${parseFloat(txn.amount).toLocaleString()} TZS on ${new Date(txn.date).toLocaleDateString()}`);
        }
      }
    }
    
    console.log(`\n✅ Removed ${deleted} historical investment transactions!`);
    console.log(`\nNote: These transactions were historical and already accounted for in your past balances.`);
    console.log(`They have been removed to prevent double-deduction from your current account balances.`);
    
  } catch (error) {
    console.error('Error removing historical transactions:', error);
  }
}

// Run the cleanup
removeHistoricalInvestmentTransactions();

