import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../src/types';

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

// Helper function to parse dates
function parseDate(dateStr: string, defaultYear?: number): Date {
  // Handle formats like "21/12/2023" or "10-Apr" or "18-Sept"
  if (dateStr.includes('/')) {
    // DD/MM/YYYY format
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (dateStr.includes('-')) {
    // "10-Apr" or "18-Sept" format
    const [day, monthName] = dateStr.split('-');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sept': 8, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = monthMap[monthName];
    if (month === undefined) {
      throw new Error(`Unknown month: ${monthName}`);
    }
    // Use provided year or default to 2024
    const year = defaultYear || 2024;
    return new Date(year, month, parseInt(day));
  }
  throw new Error(`Unknown date format: ${dateStr}`);
}

// Investment history data from the provided images
// Format: { date: string, amount: number, investmentName: string, fundName: string, account: string, year?: number }
// For dates without year (e.g., "10-Apr"), specify the year in the year field
const investmentHistory = [
  // UTT UMOJA FUND - HEALTH FUND (20 transactions total)
  { date: '21/12/2023', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '23/01/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '21/02/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '24/03/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '30/04/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '29/05/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '20/06/2024', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '20/07/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '20/08/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '30/09/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '17/10/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '26/11/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '23/12/2024', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '17/01/2025', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '10/04/2025', amount: 40000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '15/04/2025', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '24/05/2025', amount: 10000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '02/08/2025', amount: 60000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '11/09/2025', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  { date: '20/10/2025', amount: 20000, investmentName: 'UTT Umoja Fund', fundName: 'Health Fund', account: 'Cash' },
  
  // ITRUST IGROWTH - EMERGENCY FUND (all in 2025)
  // Note: Investment name in DB is 'iTrust iGrowth Fund' (with lowercase 'i' and capital 'T')
  // Updated with correct dates and NAV/unit prices from user's transaction data
  { date: '11-Apr', amount: 100000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 108.2959, units: 923 },
  { date: '16-Apr', amount: 10000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 108.3515, units: 92 },
  { date: '27-May', amount: 10000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 114.2518, units: 87 },
  { date: '02-Aug', amount: 60000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 129.2080, units: 464 },
  { date: '12-Sept', amount: 500000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 137.1312, units: 3646 },
  { date: '21-Oct', amount: 20000, investmentName: 'iTrust iGrowth Fund', fundName: 'Emergency Fund', account: 'Cash', year: 2025, navPerUnit: 134.4131, units: 148 },
  
  // QUIVER'S 15% FUND - BEACH HOUSE FUND (in 2025)
  // Note: Investment name in DB is 'Quiver 15% Fund' (without apostrophe and 's')
  { date: '18-Sept', amount: 60000, investmentName: 'Quiver 15% Fund', fundName: 'Beach House Fund', account: 'Cash', year: 2025 },
];

async function importInvestmentHistory() {
  try {
    console.log('Starting investment history import...\n');
    
    // First, delete incorrectly dated transactions (iTrust and Quiver with 2024 dates)
    // Also delete iTrust transactions with incorrect dates (10-Apr, 15-Apr, 23-May, 11-Sept, 20-Oct)
    console.log('Cleaning up incorrectly dated transactions...');
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment');
    
    if (existingTransactions) {
      // Delete iTrust and Quiver transactions with 2024 dates
      const incorrectTransactions = existingTransactions.filter(t => {
        const txnDate = new Date(t.date);
        const is2024 = txnDate.getFullYear() === 2024;
        const isItrust = t.description.includes('iTrust iGrowth Fund');
        const isQuiver = t.description.includes('Quiver 15% Fund');
        return is2024 && (isItrust || isQuiver);
      });
      
      if (incorrectTransactions.length > 0) {
        console.log(`Found ${incorrectTransactions.length} incorrectly dated transactions to delete...`);
        for (const txn of incorrectTransactions) {
          await supabase.from('transactions').delete().eq('id', txn.id);
        }
        console.log(`✓ Deleted ${incorrectTransactions.length} incorrectly dated transactions`);
      }
      
      // Delete ALL iTrust iGrowth Fund transactions to avoid duplicates
      // We'll re-import them with correct dates and prices
      const allItrustTransactions = existingTransactions.filter(t => 
        t.description.includes('iTrust iGrowth Fund')
      );
      
      if (allItrustTransactions.length > 0) {
        console.log(`Found ${allItrustTransactions.length} iTrust iGrowth Fund transactions to delete (will re-import with correct data)...`);
        for (const txn of allItrustTransactions) {
          await supabase.from('transactions').delete().eq('id', txn.id);
        }
        console.log(`✓ Deleted ${allItrustTransactions.length} iTrust iGrowth Fund transactions`);
      }
      
      // Also delete incorrectly named transactions (if any)
      const incorrectlyNamed = existingTransactions.filter(t => 
        t.description.includes('Itrust Igrowth') || 
        t.description.includes("Quiver's 15% Fund")
      );
      
      if (incorrectlyNamed.length > 0) {
        console.log(`Found ${incorrectlyNamed.length} incorrectly named transactions to delete...`);
        for (const txn of incorrectlyNamed) {
          await supabase.from('transactions').delete().eq('id', txn.id);
        }
        console.log(`✓ Deleted ${incorrectlyNamed.length} incorrectly named transactions`);
      }
    }
    
    // Get remaining transactions to avoid duplicates
    const { data: remainingTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment');
    
    // Create a more robust duplicate detection key
    const existingDescriptions = new Set(
      (remainingTransactions || []).map(t => {
        // Normalize date for comparison (remove time component)
        const dateStr = new Date(t.date).toISOString().split('T')[0];
        return `${t.description}_${dateStr}_${t.amount}`;
      })
    );
    
    const transactionsToAdd: any[] = [];
    
    for (const history of investmentHistory) {
      try {
        const date = parseDate(history.date, (history as any).year);
        const description = `Investment: ${history.investmentName}${history.fundName ? ` (${history.fundName})` : ''}`;
        // Normalize date for comparison (remove time component)
        const dateStr = date.toISOString().split('T')[0];
        const uniqueKey = `${description}_${dateStr}_${history.amount}`;
        
        // Skip if already exists
        if (existingDescriptions.has(uniqueKey)) {
          console.log(`Skipping duplicate: ${description} on ${date.toLocaleDateString()}`);
          continue;
        }
        
        const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'expense',
          category: 'Investment',
          subcategory: history.fundName || history.investmentName,
          amount: history.amount,
          description: description,
          date: date,
          account: undefined, // Don't set account for historical transactions - they're already accounted for
          tags: ['investment', 'mutual-fund', 'historical'],
        };
        
        transactionsToAdd.push({
          ...transaction,
          id: `inv-hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          date: date.toISOString(),
        });
        
        console.log(`✓ Prepared: ${description} - ${history.amount.toLocaleString()} TZS on ${date.toLocaleDateString()}`);
      } catch (error) {
        console.error(`Error processing ${history.date}:`, error);
      }
    }
    
    if (transactionsToAdd.length === 0) {
      console.log('\nNo new transactions to import.');
      return;
    }
    
    console.log(`\nImporting ${transactionsToAdd.length} transactions...`);
    
    // Insert transactions in batches
    const batchSize = 10;
    for (let i = 0; i < transactionsToAdd.length; i += batchSize) {
      const batch = transactionsToAdd.slice(i, i + batchSize);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✓ Imported batch ${i / batchSize + 1} (${batch.length} transactions)`);
      }
    }
    
    console.log('\n✅ Investment history import completed!');
    console.log(`Total transactions imported: ${transactionsToAdd.length}`);
    
  } catch (error) {
    console.error('Error importing investment history:', error);
  }
}

// Run the import
importInvestmentHistory();

