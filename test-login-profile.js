import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginProfile() {
  console.log('🔐 Testing Login Profile Issue...\n');

  // Test 1: Check if test user exists in users table
  console.log('1. Checking if test user exists in users table...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'testuser@example.com');
    
    if (error) {
      console.log('❌ Users table query failed:', error.message);
    } else {
      console.log('✅ Users table query successful');
      console.log('   User found:', data?.length > 0);
      if (data?.length > 0) {
        console.log('   User data:', data[0]);
      } else {
        console.log('   ⚠️  No user profile found - this is the issue!');
      }
    }
  } catch (err) {
    console.log('❌ Users table test failed:', err.message);
  }

  // Test 2: Check auth user
  console.log('\n2. Checking auth user...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('❌ Auth user check failed:', error.message);
    } else if (user) {
      console.log('✅ Auth user exists:', user.email);
      console.log('   User ID:', user.id);
    } else {
      console.log('⚠️  No auth user found');
    }
  } catch (err) {
    console.log('❌ Auth user test failed:', err.message);
  }

  // Test 3: Try to create a user profile
  console.log('\n3. Testing user profile creation...');
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No auth user to create profile for');
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: 'Test User',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.log('❌ User profile creation failed:', error.message);
      } else {
        console.log('✅ User profile created successfully');
        console.log('   Profile data:', data);
      }
    }
  } catch (err) {
    console.log('❌ User profile creation test failed:', err.message);
  }

  console.log('\n🎯 Login Profile Test Complete!');
  console.log('\n📋 The issue is likely:');
  console.log('1. User can authenticate with Supabase Auth');
  console.log('2. But no profile exists in the users table');
  console.log('3. Login fails when trying to fetch user profile');
  console.log('4. This causes infinite loading');
  
  console.log('\n🔧 Solution:');
  console.log('1. Create user profile when user signs up');
  console.log('2. Or handle missing profile gracefully in login');
}

testLoginProfile().catch(console.error);
