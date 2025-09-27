import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking if founders@agiagentautomation.com exists...')

async function checkUser() {
  try {
    // Check if user exists in auth.users
    console.log('🔐 Step 1: Checking auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Cannot access auth.users:', authError.message)
    } else {
      const foundersUser = authUsers.users.find(user => user.email === 'founders@agiagentautomation.com')
      if (foundersUser) {
        console.log('✅ User exists in auth.users')
        console.log('- ID:', foundersUser.id)
        console.log('- Email:', foundersUser.email)
        console.log('- Created:', foundersUser.created_at)
        console.log('- Confirmed:', foundersUser.email_confirmed_at ? 'Yes' : 'No')
        
        // Check if profile exists in users table
        console.log('👤 Step 2: Checking users table...')
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', foundersUser.id)
          .single()
        
        if (profileError) {
          console.log('❌ Profile not found:', profileError.message)
          console.log('This is why login is timing out!')
          
          // Try to create the profile
          console.log('🔧 Step 3: Creating missing profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: foundersUser.id,
              email: foundersUser.email,
              name: foundersUser.user_metadata?.name || foundersUser.email?.split('@')[0] || 'User',
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
        } else {
          console.log('✅ Profile exists in users table')
          console.log('- Name:', profile.name)
          console.log('- Role:', profile.role)
          console.log('- Active:', profile.is_active)
        }
      } else {
        console.log('❌ User not found in auth.users')
        console.log('Available users:')
        authUsers.users.forEach(user => {
          console.log(`- ${user.email} (${user.id})`)
        })
      }
    }
    
  } catch (err) {
    console.log('❌ Check failed:', err.message)
  }
}

checkUser()
