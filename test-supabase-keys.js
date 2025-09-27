import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Keys...\n');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing connection...');
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', authError ? `❌ ${authError.message}` : '✅ Success');
    
    // Test table access
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('Table test:', error ? `❌ ${error.message}` : '✅ Success');
    
    if (error) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check if the Supabase project is active');
      console.log('2. Verify the API key is correct');
      console.log('3. Check if RLS policies are properly configured');
      console.log('4. Run the SQL scripts in Supabase dashboard');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
