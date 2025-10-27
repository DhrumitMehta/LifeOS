import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Investment } from '../src/types';

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

interface InvestmentGroup {
  name: string;
  type: 'mutual-fund';
  symbol?: string;
  transactions: Array<{
    date: Date;
    amount: number;
    description: string;
  }>;
}

async function extractInvestments() {
  try {
    console.log('Connecting to Supabase...');
    
    // Get all income transactions where category is "Investment"
    const { data: investmentTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'income')
      .eq('category', 'Investment')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (!investmentTransactions || investmentTransactions.length === 0) {
      console.log('No investment transactions found.');
      return;
    }

    console.log(`Found ${investmentTransactions.length} investment income transactions`);

    // Group transactions by fund type based on description
    const fundGroups: Map<string, InvestmentGroup> = new Map();

    investmentTransactions.forEach((transaction: any) => {
      const desc = transaction.description.toLowerCase();
      let fundName = '';
      let fundType: 'mutual-fund' | 'etf' = 'mutual-fund';

      // Determine fund based on description - improved matching
      if (desc.includes('utt') || desc.includes('amis')) {
        fundName = 'UTT Umoja Fund';
        fundType = 'mutual-fund';
      } else if (desc.includes('itrust') || desc.includes('igrowth')) {
        fundName = 'iTrust iGrowth Fund';
        fundType = 'mutual-fund';
      } else if (desc.includes('quiver')) {
        fundName = 'Quiver 15% Fund';
        fundType = 'mutual-fund';
      } else if (desc.includes('investment')) {
        // Any remaining investment transactions
        fundName = 'Other Investment';
        fundType = 'mutual-fund';
      }

      if (!fundName) {
        console.log(`Skipping transaction: ${transaction.description}`);
        return;
      }

      if (!fundGroups.has(fundName)) {
        fundGroups.set(fundName, {
          name: fundName,
          type: fundType,
          transactions: []
        });
      }

      const date = new Date(transaction.date);
      fundGroups.get(fundName)!.transactions.push({
        date,
        amount: transaction.amount,
        description: transaction.description
      });
    });

    console.log(`\nGrouped into ${fundGroups.size} funds:`);
    fundGroups.forEach((group, name) => {
      console.log(`  ${name}: ${group.transactions.length} transactions`);
    });

    // Create investment records
    const investments: Investment[] = [];

    fundGroups.forEach((group) => {
      // Calculate total value (sum of all transactions)
      const totalValue = group.transactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Use first transaction date as purchase date
      const purchaseDate = group.transactions[0].date;
      
      // Calculate average price per unit (assuming 1 unit per transaction for simplicity)
      const quantity = group.transactions.length;
      const averagePrice = totalValue / quantity;

      const investment: Investment = {
        id: `inv-${Date.now()}-${group.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: group.name,
        type: group.type,
        symbol: group.symbol,
        quantity,
        averagePrice,
        currentPrice: averagePrice, // Set as current price for now
        totalValue,
        purchaseDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      investments.push(investment);
    });

    console.log('\n=== Investment Summary ===');
    investments.forEach(inv => {
      console.log(`\n${inv.name}:`);
      console.log(`  Quantity: ${inv.quantity}`);
      console.log(`  Avg Price: ${inv.averagePrice.toLocaleString()} TZS`);
      console.log(`  Total Value: ${inv.totalValue?.toLocaleString()} TZS`);
      console.log(`  Purchase Date: ${inv.purchaseDate.toLocaleDateString()}`);
    });

    // Insert into database
    console.log('\n\nInserting investments into database...');
    
    const formattedInvestments = investments.map(inv => ({
      id: inv.id,
      name: inv.name,
      type: inv.type,
      symbol: inv.symbol || null,
      quantity: inv.quantity,
      average_price: inv.averagePrice,
      current_price: inv.currentPrice,
      total_value: inv.totalValue,
      purchase_date: inv.purchaseDate.toISOString(),
      created_at: inv.createdAt.toISOString(),
      updated_at: inv.updatedAt.toISOString(),
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('investments')
      .insert(formattedInvestments);

    if (insertError) {
      console.error('Error inserting investments:', insertError);
      return;
    }

    console.log(`✓ Successfully inserted ${investments.length} investments`);

    // Verify
    const { count } = await supabase
      .from('investments')
      .select('*', { count: 'exact', head: true });

    console.log(`Total investments in database: ${count}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

extractInvestments().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

