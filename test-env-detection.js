console.log('🔍 Testing Environment Variable Detection...')

// Simulate the same environment variable detection as in AuthContext
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment Variables:')
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')

const hasValidCredentials = supabaseUrl && 
                          supabaseKey && 
                          !supabaseUrl.includes('your_supabase_url_here') && 
                          !supabaseKey.includes('your_supabase_anon_key_here');

console.log('Valid Credentials:', hasValidCredentials ? 'Yes' : 'No')

if (!hasValidCredentials) {
  console.log('⚠️  This would trigger demo mode in AuthContext')
  console.log('🔧 Make sure Netlify environment variables are set:')
  console.log('   - VITE_SUPABASE_URL=https://lywdzvfibhzbljrgovwr.supabase.co')
  console.log('   - VITE_SUPABASE_ANON_KEY=eyJ...')
} else {
  console.log('✅ Environment variables look correct')
}

// Test the actual values we're using
const actualUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const actualKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

console.log('\nActual Values:')
console.log('- URL:', actualUrl)
console.log('- Key:', actualKey.substring(0, 20) + '...')

const actualHasValidCredentials = actualUrl && 
                                actualKey && 
                                !actualUrl.includes('your_supabase_url_here') && 
                                !actualKey.includes('your_supabase_anon_key_here');

console.log('Actual Valid Credentials:', actualHasValidCredentials ? 'Yes' : 'No')
