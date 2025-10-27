import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function verifyTable() {
  try {
    console.log('Connecting to Supabase...');
    
    // Check if table exists and get structure
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing transactions table:', error.message);
      console.log('\nThe table might not exist or there might be a permission issue.');
      console.log('Please check your Supabase project and run the schema SQL.');
      return;
    }

    // Get row count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    console.log(`✓ Transactions table exists`);
    console.log(`  Current row count: ${count}`);
    
    if (count && count > 0) {
      // Get a sample of IDs
      const { data: samples } = await supabase
        .from('transactions')
        .select('id, description, date')
        .limit(5)
        .order('created_at', { ascending: false });
      
      console.log('\n  Recent transactions:');
      samples?.forEach(t => {
        console.log(`    - ${t.id}: ${t.description} (${t.date})`);
      });
      
      console.log('\n⚠️  There are existing transactions in the database.');
      console.log('You can either:');
      console.log('  1. Delete all existing transactions before import');
      console.log('  2. Skip duplicate IDs');
      console.log('  3. Update existing transactions with new data');
    } else {
      console.log('  Table is empty - ready for import');
    }

    console.log('\n✓ Table verification complete');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyTable().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

