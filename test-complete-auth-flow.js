import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing Complete Authentication Flow...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')

async function testCompleteFlow() {
  try {
    // Step 1: Test Supabase connection
    console.log('🔌 Step 1: Testing Supabase connection...')
    const { data: { user: currentUser }, error: currentError } = await supabase.auth.getUser()
    
    if (currentError) {
      console.log('❌ Current user check failed:', currentError.message)
    } else {
      console.log('✅ Supabase connection working')
      console.log('- Current user:', currentUser ? currentUser.email : 'None')
    }
    
    // Step 2: Test login with founders@agiagentautomation.com
    console.log('🔐 Step 2: Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'founders@agiagentautomation.com',
      password: 'your-actual-password' // You need to provide the real password
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
    
    // Step 3: Test user profile fetch
    console.log('👤 Step 3: Testing user profile fetch...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message)
      console.log('Error code:', profileError.code)
      
      // Try to create profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log('🔧 Creating missing profile...')
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: loginData.user.id,
            email: loginData.user.email,
            name: loginData.user.user_metadata?.name || loginData.user.email?.split('@')[0] || 'User',
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createError) {
          console.log('❌ Profile creation failed:', createError.message)
        } else {
          console.log('✅ Profile created successfully')
          console.log('- Profile ID:', newProfile.id)
          console.log('- Name:', newProfile.name)
        }
      }
    } else {
      console.log('✅ Profile exists')
      console.log('- Name:', profile.name)
      console.log('- Role:', profile.role)
      console.log('- Active:', profile.is_active)
    }
    
    // Step 4: Test session persistence
    console.log('🔍 Step 4: Testing session persistence...')
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message)
    } else {
      console.log('✅ Session check successful')
      console.log('- User:', sessionUser?.email)
      console.log('- ID:', sessionUser?.id)
    }
    
    // Step 5: Test logout
    console.log('🚪 Step 5: Testing logout...')
    const { error: logoutError } = await supabase.auth.signOut()
    
    if (logoutError) {
      console.log('❌ Logout failed:', logoutError.message)
    } else {
      console.log('✅ Logout successful')
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message)
  }
}

testCompleteFlow()
