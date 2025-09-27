import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow...\n');

  // Test 1: Try to sign in with a non-existent user
  console.log('1. Testing login with non-existent user...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    
    if (error) {
      console.log('✅ Login correctly rejected:', error.message);
    } else {
      console.log('⚠️  Unexpected: Login succeeded with wrong credentials');
    }
  } catch (err) {
    console.log('❌ Login test error:', err.message);
  }

  // Test 2: Check if we can create a test user
  console.log('\n2. Testing user creation...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'testuser@example.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ User creation failed:', error.message);
    } else {
      console.log('✅ User creation successful');
      console.log('   User ID:', data.user?.id);
      console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    }
  } catch (err) {
    console.log('❌ User creation error:', err.message);
  }

  // Test 3: Try to sign in with the test user
  console.log('\n3. Testing login with test user...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
    } else {
      console.log('✅ Login successful');
      console.log('   User ID:', data.user?.id);
      console.log('   Session valid:', !!data.session);
    }
  } catch (err) {
    console.log('❌ Login error:', err.message);
  }

  // Test 4: Check current session
  console.log('\n4. Checking current session...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Session check failed:', error.message);
    } else {
      console.log('✅ Session check successful');
      console.log('   Session exists:', !!session);
      if (session) {
        console.log('   User ID:', session.user.id);
        console.log('   Email:', session.user.email);
      }
    }
  } catch (err) {
    console.log('❌ Session check error:', err.message);
  }

  console.log('\n🎯 Auth Flow Test Complete!');
  console.log('\n📋 If login is still showing infinite loading:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify the LoginForm component is using the correct parameters');
  console.log('3. Check if the auth context is properly wrapping the app');
  console.log('4. Ensure the loading state is being managed correctly');
}

testAuthFlow().catch(console.error);
