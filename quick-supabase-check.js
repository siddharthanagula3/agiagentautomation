import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Quick Supabase Health Check...\n');

// Test basic connection
supabase.from('users').select('count').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection working');
    }
  })
  .catch(err => console.log('❌ Error:', err.message));

// Test if mcp_tools table exists
supabase.from('mcp_tools').select('*').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ mcp_tools table missing:', error.message);
      console.log('📝 You need to run the SQL script in Supabase dashboard');
    } else {
      console.log('✅ mcp_tools table exists');
    }
  })
  .catch(err => console.log('❌ mcp_tools error:', err.message));
