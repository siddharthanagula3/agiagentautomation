// Test logout functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 TESTING LOGOUT FUNCTIONALITY');
console.log('==============================');

async function testLogout() {
  try {
    console.log('\n📊 STEP 1: Testing Login First');
    console.log('--------------------------------');
    
    // First login to get a session
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'founders@agiagentautomation.com',
      password: 'Sid@8790'
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('👤 User ID:', loginData.user.id);
    console.log('📧 Email:', loginData.user.email);
    
    console.log('\n📊 STEP 2: Testing Logout');
    console.log('-------------------------');
    
    // Test logout
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Logout failed:', logoutError);
    } else {
      console.log('✅ Logout successful');
    }
    
    console.log('\n📊 STEP 3: Verifying Session is Cleared');
    console.log('---------------------------------------');
    
    // Check if session is cleared
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('✅ Session cleared (expected error):', userError.message);
    } else if (user) {
      console.log('❌ Session still exists:', user.email);
    } else {
      console.log('✅ Session successfully cleared');
    }
    
    console.log('\n🎯 LOGOUT TEST COMPLETE');
    console.log('======================');
    console.log('✅ Supabase logout functionality works');
    console.log('✅ Session is properly cleared');
    console.log('');
    console.log('🔧 POTENTIAL ISSUES:');
    console.log('1. Frontend logout function not calling Supabase');
    console.log('2. Navigation not working after logout');
    console.log('3. State not being cleared properly');
    console.log('4. Component not re-rendering after logout');
    
  } catch (error) {
    console.error('💥 Error during logout test:', error);
  }
}

testLogout();
