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

async function checkAccounts() {
  try {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('account')
      .not('account', 'is', null);

    const accounts = [...new Set(transactions?.map(t => t.account).filter(a => a))];
    
    console.log('Unique account values:');
    accounts.forEach(acc => console.log(`  - "${acc}"`));
    
    // Count transactions per account
    console.log('\nTransaction counts:');
    accounts.forEach(acc => {
      const count = transactions?.filter(t => t.account === acc).length || 0;
      console.log(`  ${acc}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAccounts().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

