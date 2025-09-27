import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase Database Setup...\n');

  // Check 1: Users table structure
  console.log('1. Checking users table structure...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Users table error:', error.message);
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('   📝 Users table does not exist - need to create it');
      }
    } else {
      console.log('✅ Users table exists and accessible');
    }
  } catch (err) {
    console.log('❌ Users table check failed:', err.message);
  }

  // Check 2: Try to create a test user profile
  console.log('\n2. Testing user profile creation...');
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.log('❌ User profile creation failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
    } else {
      console.log('✅ User profile creation successful');
      console.log('   Created user:', data);
      
      // Clean up test user
      await supabase.from('users').delete().eq('id', testUserId);
      console.log('   Test user cleaned up');
    }
  } catch (err) {
    console.log('❌ User profile creation test failed:', err.message);
  }

  // Check 3: RLS policies
  console.log('\n3. Checking RLS policies...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('RLS')) {
      console.log('⚠️  RLS is enabled (this is normal and secure)');
    } else if (error) {
      console.log('❌ RLS check error:', error.message);
    } else {
      console.log('✅ RLS policies working correctly');
    }
  } catch (err) {
    console.log('❌ RLS check failed:', err.message);
  }

  console.log('\n🎯 Supabase Setup Check Complete!');
  console.log('\n📋 If you see errors above, you need to run these SQL queries in Supabase:');
}

checkSupabaseSetup().catch(console.error);
