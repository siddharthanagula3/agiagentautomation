import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing Supabase Auth Connection...')

// Test basic auth functionality
try {
  // Test sign up
  console.log('📝 Testing sign up...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (signUpError) {
    console.log('❌ Sign Up Error:', signUpError.message)
  } else {
    console.log('✅ Sign Up Successful:', signUpData.user?.email)
  }
} catch (err) {
  console.log('❌ Sign Up Failed:', err.message)
}

// Test sign in
try {
  console.log('🔐 Testing sign in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (signInError) {
    console.log('❌ Sign In Error:', signInError.message)
  } else {
    console.log('✅ Sign In Successful:', signInData.user?.email)
  }
} catch (err) {
  console.log('❌ Sign In Failed:', err.message)
}

// Test demo credentials
try {
  console.log('🎯 Testing demo credentials...')
  const { data: demoData, error: demoError } = await supabase.auth.signInWithPassword({
    email: 'demo@example.com',
    password: 'demo123'
  })
  
  if (demoError) {
    console.log('❌ Demo Login Error:', demoError.message)
  } else {
    console.log('✅ Demo Login Successful:', demoData.user?.email)
  }
} catch (err) {
  console.log('❌ Demo Login Failed:', err.message)
}
