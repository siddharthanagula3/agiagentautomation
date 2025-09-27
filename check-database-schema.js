import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking Database Schema...')

try {
  // Check what tables exist
  const { data, error } = await supabase.rpc('get_schema_tables')
  
  if (error) {
    console.log('❌ Schema Error:', error.message)
    
    // Try alternative approach
    console.log('🔄 Trying alternative schema check...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ Tables Error:', tablesError.message)
    } else {
      console.log('✅ Available Tables:', tables)
    }
  } else {
    console.log('✅ Schema Tables:', data)
  }
} catch (err) {
  console.log('❌ Schema Check Failed:', err.message)
}

// Test auth tables specifically
try {
  console.log('🔐 Testing Auth Tables...')
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.log('❌ Users Error:', usersError.message)
  } else {
    console.log('✅ Users Table Accessible:', users.users?.length || 0, 'users')
  }
} catch (err) {
  console.log('❌ Auth Tables Error:', err.message)
}
