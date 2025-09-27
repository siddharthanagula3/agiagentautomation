import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing Login Process...')

async function testLogin() {
  try {
    // Test 1: Try to sign in with the credentials
    console.log('🔐 Step 1: Testing login with founders@agiagentautomation.com...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'founders@agiagentautomation.com',
      password: 'your-password-here' // You'll need to provide the actual password
    })
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      console.log('Error code:', loginError.status)
      return
    }
    
    console.log('✅ Login successful')
    console.log('- User ID:', loginData.user?.id)
    console.log('- Email:', loginData.user?.email)
    console.log('- Session:', loginData.session ? 'Active' : 'No session')
    
    // Test 2: Check if user profile exists
    console.log('👤 Step 2: Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message)
      console.log('This might be why login is timing out')
    } else {
      console.log('✅ Profile exists')
      console.log('- Name:', profile.name)
      console.log('- Role:', profile.role)
      console.log('- Active:', profile.is_active)
    }
    
    // Test 3: Check current session
    console.log('🔍 Step 3: Checking current session...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Session check failed:', userError.message)
    } else {
      console.log('✅ Session check successful')
      console.log('- Current user:', user?.email)
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message)
  }
}

testLogin()
