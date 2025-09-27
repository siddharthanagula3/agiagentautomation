import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')

try {
  // Test basic connection
  const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1)
  
  if (error) {
    console.log('❌ Connection Error:', error.message)
  } else {
    console.log('✅ Connection Successful!')
    console.log('Data:', data)
  }
} catch (err) {
  console.log('❌ Connection Failed:', err.message)
}

// Test auth
try {
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('🔐 Auth Status:', error ? 'Error: ' + error.message : 'Connected')
} catch (err) {
  console.log('❌ Auth Error:', err.message)
}