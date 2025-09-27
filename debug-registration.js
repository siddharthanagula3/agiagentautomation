import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Debugging Registration Process...')

try {
  // Step 1: Test registration
  console.log('📝 Step 1: Testing registration...')
  const { data, error } = await supabase.auth.signUp({
    email: 'debug-test-2@example.com',
    password: 'testpassword123'
  })
  
  if (error) {
    console.log('❌ Registration failed:', error.message)
    process.exit(1)
  }
  
  console.log('✅ Registration successful')
  console.log('- User ID:', data.user?.id)
  console.log('- Session:', data.session ? 'Active' : 'No session')
  
  if (!data.user) {
    console.log('❌ No user data returned')
    process.exit(1)
  }
  
  // Step 2: Test user profile creation
  console.log('👤 Step 2: Testing user profile creation...')
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email: 'debug-test-2@example.com',
      name: 'Debug Test User',
      phone: '',
      location: '',
      role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (profileError) {
    console.log('❌ Profile creation failed:', profileError.message)
    console.log('Error details:', profileError)
  } else {
    console.log('✅ Profile creation successful')
    console.log('- Profile ID:', profile.id)
    console.log('- Profile Name:', profile.name)
  }
  
  // Step 3: Test login after registration
  console.log('🔐 Step 3: Testing login after registration...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'debug-test-2@example.com',
    password: 'testpassword123'
  })
  
  if (loginError) {
    console.log('❌ Login failed:', loginError.message)
  } else {
    console.log('✅ Login successful')
    console.log('- User:', loginData.user?.email)
    console.log('- Session:', loginData.session ? 'Active' : 'No session')
  }
  
} catch (err) {
  console.log('❌ Debug failed:', err.message)
}
