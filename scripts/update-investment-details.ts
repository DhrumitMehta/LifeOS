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

// Unit selling prices from the images - used to calculate units
// Dates are stored as YYYY-MM-DD format
const unitPrices: { [key: string]: { [date: string]: number } } = {
  'UTT Umoja Fund': {
    '2023-12-21': 982.1081,
    '2024-01-23': 985.4846,
    '2024-02-21': 997.1772,
    '2024-03-24': 992.0184,
    '2024-04-30': 909.0813,
    '2024-05-29': 1019.6664,
    '2024-06-20': 1024.24822,
    '2024-07-20': 1039.4727,
    '2024-08-20': 1050,
    '2024-09-30': 1062.8877,
    '2024-10-17': 1076.0633,
    '2024-11-26': 1087.467,
    '2024-12-23': 1092.6426,
    '2025-01-17': 1103.1501,
    '2025-04-10': 1138.035,
    '2025-04-15': 1138.9863,
    '2025-05-24': 1165.8923,
    '2025-08-02': 1200.9734,
    '2025-09-11': 1210.0677,
    '2025-10-20': 1198.2962,
    // Also add dates that might be off by a day due to timezone
    '2023-12-20': 982.1081,
    '2024-01-22': 985.4846,
    '2024-02-20': 997.1772,
    '2024-03-23': 992.0184,
    '2024-04-29': 909.0813,
    '2024-05-28': 1019.6664,
    '2024-06-19': 1024.24822,
    '2024-07-19': 1039.4727,
    '2024-08-19': 1050,
    '2024-09-29': 1062.8877,
    '2024-10-16': 1076.0633,
    '2024-11-25': 1087.467,
    '2024-12-22': 1092.6426,
    '2025-01-16': 1103.1501,
    '2025-04-09': 1138.035,
    '2025-04-14': 1138.9863,
    '2025-05-23': 1165.8923,
    '2025-08-01': 1200.9734,
    '2025-09-10': 1210.0677,
    '2025-10-19': 1198.2962,
  },
  'iTrust iGrowth Fund': {
    // Updated with correct NAV/unit prices from user's transaction data
    '2025-04-11': 108.2959,
    '2025-04-16': 108.3515,
    '2025-05-27': 114.2518,
    '2025-08-02': 129.2080,
    '2025-09-12': 137.1312,
    '2025-10-21': 134.4131,
    // Also add dates that might be off by a day due to timezone
    '2025-04-10': 108.2959,
    '2025-04-15': 108.3515,
    '2025-05-26': 114.2518,
    '2025-08-01': 129.2080,
    '2025-09-11': 137.1312,
    '2025-10-20': 134.4131,
  },
  'Quiver 15% Fund': {
    '2025-09-18': 0, // Missing in image - will use average
    '2025-09-17': 0, // Missing in image - will use average
  },
};

function formatDateForKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function updateInvestmentDetails() {
  try {
    console.log('Updating investment details from transaction history...\n');
    
    // Get all investments
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('*');
    
    if (invError) {
      console.error('Error fetching investments:', invError);
      return;
    }
    
    if (!investments || investments.length === 0) {
      console.log('No investments found.');
      return;
    }
    
    // Get all investment transactions
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Investment')
      .order('date', { ascending: true });
    
    if (txnError) {
      console.error('Error fetching transactions:', txnError);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('No investment transactions found.');
      return;
    }
    
    console.log(`Found ${investments.length} investments and ${transactions.length} transactions\n`);
    
    // Process each investment
    for (const investment of investments) {
      console.log(`\nProcessing: ${investment.name}`);
      
      // Find all transactions for this investment
      const investmentTransactions = transactions.filter(t => {
        if (t.description.includes(investment.name)) return true;
        if (investment.fund_name && (t.description.includes(investment.fund_name) || t.subcategory === investment.fund_name)) return true;
        return false;
      });
      
      if (investmentTransactions.length === 0) {
        console.log(`  No transactions found for ${investment.name}`);
        continue;
      }
      
      console.log(`  Found ${investmentTransactions.length} transactions`);
      
      // Calculate total amount invested
      const totalAmount = investmentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Find first and latest investment dates
      const dates = investmentTransactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
      const firstInvestmentDate = dates[0];
      const latestInvestmentDate = dates[dates.length - 1];
      
      // Calculate total units from transactions using unit prices
      let totalUnits = 0;
      let transactionsWithUnits = 0;
      let totalAmountForUnits = 0;
      
      // First pass: calculate units for transactions with known unit prices
      for (const txn of investmentTransactions) {
        const txnDate = new Date(txn.date);
        const dateKey = formatDateForKey(txnDate);
        const amount = parseFloat(txn.amount);
        
        // Try to get unit price from our data
        const unitPrice = unitPrices[investment.name]?.[dateKey];
        
        if (unitPrice && unitPrice > 0) {
          const units = amount / unitPrice;
          totalUnits += units;
          totalAmountForUnits += amount;
          transactionsWithUnits++;
        }
      }
      
      // Second pass: if we have some unit prices but not all, calculate average unit price and use it for missing ones
      if (transactionsWithUnits > 0 && transactionsWithUnits < investmentTransactions.length) {
        const avgUnitPrice = totalAmountForUnits / totalUnits;
        for (const txn of investmentTransactions) {
          const txnDate = new Date(txn.date);
          const dateKey = formatDateForKey(txnDate);
          const amount = parseFloat(txn.amount);
          const unitPrice = unitPrices[investment.name]?.[dateKey];
          
          if (!unitPrice || unitPrice === 0) {
            const units = amount / avgUnitPrice;
            totalUnits += units;
          }
        }
      } else if (totalUnits === 0) {
        // If no unit prices available, estimate using average price from investment
        if (investment.average_price && investment.average_price > 0) {
          totalUnits = totalAmount / investment.average_price;
        } else {
          // Fallback: use existing quantity if available
          totalUnits = investment.quantity || 0;
        }
      }
      
      // Calculate average price
      const averagePrice = totalAmount > 0 && totalUnits > 0 ? totalAmount / totalUnits : investment.average_price || 0;
      
      // Update investment
      const updates: any = {
        quantity: totalUnits,
        average_price: averagePrice,
        amount_purchased: totalAmount,
        purchase_date: firstInvestmentDate.toISOString(), // Store first investment date in purchase_date
        updated_at: latestInvestmentDate.toISOString(), // Store latest investment date in updated_at (temporarily)
        // Note: We'll calculate these dynamically in the UI instead of storing separately
      };
      
      const { error: updateError } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', investment.id);
      
      if (updateError) {
        console.error(`  Error updating ${investment.name}:`, updateError);
      } else {
        console.log(`  ✓ Updated ${investment.name}:`);
        console.log(`    - Total Units: ${totalUnits.toFixed(4)}`);
        console.log(`    - Total Amount: ${totalAmount.toLocaleString()} TZS`);
        console.log(`    - Average Price: ${averagePrice.toFixed(2)} TZS`);
        console.log(`    - First Investment: ${firstInvestmentDate.toLocaleDateString()}`);
        console.log(`    - Latest Investment: ${latestInvestmentDate.toLocaleDateString()}`);
      }
    }
    
    console.log('\n✅ Investment details update completed!');
    
  } catch (error) {
    console.error('Error updating investment details:', error);
  }
}

// Run the update
updateInvestmentDetails();
