import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing Actual Login Process...')

async function testLogin() {
  try {
    console.log('🔐 Step 1: Attempting login...')
    
    // This is the exact same login call your app makes
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'founders@agiagentautomation.com',
      password: 'your-actual-password' // You need to provide the real password
    })
    
    if (error) {
      console.log('❌ Login failed:', error.message)
      console.log('Error code:', error.status)
      return
    }
    
    console.log('✅ Login successful')
    console.log('- User ID:', data.user?.id)
    console.log('- Email:', data.user?.email)
    console.log('- Session:', data.session ? 'Active' : 'No session')
    
    if (!data.user) {
      console.log('❌ No user data returned')
      return
    }
    
    console.log('👤 Step 2: Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    console.log('Profile fetch result:', { 
      hasProfile: !!profile, 
      hasError: !!profileError, 
      error: profileError?.message 
    })
    
    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message)
      console.log('Error code:', profileError.code)
      
      // This is the exact logic from your authService
      if (profileError.code === 'PGRST116') {
        console.log('🔧 Creating user profile...')
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
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
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message)
  }
}

testLogin()
