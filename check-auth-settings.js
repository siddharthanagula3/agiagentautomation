import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking Supabase Auth Settings...')

// Test registration to see what happens
try {
  console.log('📝 Testing registration...')
  const { data, error } = await supabase.auth.signUp({
    email: 'test-registration@example.com',
    password: 'testpassword123'
  })
  
  console.log('Registration result:')
  console.log('- User:', data.user ? 'Created' : 'Not created')
  console.log('- Session:', data.session ? 'Active' : 'No session')
  console.log('- Error:', error ? error.message : 'None')
  
  if (data.user && !data.session) {
    console.log('⚠️  Email confirmation is required')
    console.log('💡 User needs to check email and click confirmation link')
  } else if (data.user && data.session) {
    console.log('✅ User is automatically logged in (no email confirmation required)')
  }
  
} catch (err) {
  console.log('❌ Registration test failed:', err.message)
}
