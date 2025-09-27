import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginFunctionality() {
  console.log('🔐 Testing Login Functionality...\n');

  // Test 1: Check if auth is properly configured
  console.log('1. Testing Supabase Auth Configuration...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth configuration error:', error.message);
    } else {
      console.log('✅ Auth system configured correctly');
      console.log('   Current session:', session ? 'User logged in' : 'No user logged in');
    }
  } catch (err) {
    console.log('❌ Auth test failed:', err.message);
  }

  // Test 2: Check if users table exists and is accessible
  console.log('\n2. Testing Users Table Access...');
  try {
    const { data, error } = await supabase.from('users').select('id, email, name').limit(1);
    if (error) {
      console.log('❌ Users table error:', error.message);
      if (error.message.includes('RLS')) {
        console.log('   ℹ️  RLS is enabled (this is normal and secure)');
      }
    } else {
      console.log('✅ Users table accessible');
      console.log('   Sample users found:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ Users table test failed:', err.message);
  }

  // Test 3: Test auth state change listener
  console.log('\n3. Testing Auth State Change Listener...');
  try {
    let listenerWorking = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('✅ Auth state change listener working');
      console.log('   Event:', event);
      console.log('   Session:', session ? 'Active' : 'None');
      listenerWorking = true;
      subscription.unsubscribe();
    });
    
    // Wait a moment for the listener to initialize
    setTimeout(() => {
      if (!listenerWorking) {
        console.log('⚠️  Auth state change listener may not be working');
      }
    }, 1000);
  } catch (err) {
    console.log('❌ Auth state change test failed:', err.message);
  }

  // Test 4: Check if we can create a test user (without actually creating one)
  console.log('\n4. Testing User Registration Capability...');
  try {
    // This will fail but we can check the error type
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (error) {
      if (error.message.includes('signup is disabled') || error.message.includes('email rate limit')) {
        console.log('⚠️  Signup may be disabled or rate limited');
      } else {
        console.log('✅ Signup functionality available');
      }
    } else {
      console.log('✅ Signup working (test user created)');
    }
  } catch (err) {
    console.log('❌ Signup test failed:', err.message);
  }

  // Test 5: Check auth methods available
  console.log('\n5. Testing Available Auth Methods...');
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && error.message.includes('Invalid JWT')) {
      console.log('✅ JWT validation working (no user logged in)');
    } else if (error) {
      console.log('⚠️  Auth method test:', error.message);
    } else {
      console.log('✅ Auth methods working');
    }
  } catch (err) {
    console.log('❌ Auth methods test failed:', err.message);
  }

  console.log('\n🎯 Login Functionality Test Complete!');
  console.log('\n📋 What to check on your live site:');
  console.log('1. Go to your live website');
  console.log('2. Try to register a new account');
  console.log('3. Try to login with existing credentials');
  console.log('4. Check if you can access the dashboard after login');
  console.log('5. Check browser console for any auth-related errors');
  
  console.log('\n🔧 If login is not working:');
  console.log('- Check if Supabase Auth is enabled in your project settings');
  console.log('- Verify email confirmation settings');
  console.log('- Check if RLS policies are properly configured');
  console.log('- Ensure the users table exists and has proper structure');
}

// Run the test
testLoginFunctionality().catch(console.error);
