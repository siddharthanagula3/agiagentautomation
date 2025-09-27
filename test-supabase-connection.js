import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Basic connection
  try {
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Basic connection successful');
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }

  // Test 2: Check required tables
  const requiredTables = [
    'users',
    'ai_agents', 
    'jobs',
    'subscriptions',
    'billing',
    'usage_tracking',
    'notifications',
    'activity_logs',
    'mcp_tools'
  ];

  console.log('\n2. Checking required tables...');
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' - Error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' - OK`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}' - Error:`, err.message);
    }
  }

  // Test 3: Check RLS policies
  console.log('\n3. Testing Row Level Security...');
  try {
    const { data, error } = await supabase.from('ai_agents').select('*');
    if (error && error.message.includes('RLS')) {
      console.log('⚠️  RLS is enabled (this is good for security)');
    } else if (error) {
      console.log('❌ RLS test error:', error.message);
    } else {
      console.log('✅ RLS test passed');
    }
  } catch (err) {
    console.log('❌ RLS test error:', err.message);
  }

  // Test 4: Check auth functionality
  console.log('\n4. Testing authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('⚠️  No authenticated user (expected for anonymous access)');
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('✅ Auth system working (no user logged in)');
    }
  } catch (err) {
    console.log('❌ Auth test error:', err.message);
  }

  // Test 5: Check real-time functionality
  console.log('\n5. Testing real-time subscriptions...');
  try {
    const channel = supabase.channel('test-channel');
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time subscription working');
        subscription.unsubscribe();
      }
    });
  } catch (err) {
    console.log('❌ Real-time test error:', err.message);
  }

  // Test 6: Check database functions
  console.log('\n6. Testing database functions...');
  try {
    const { data, error } = await supabase.rpc('get_user_stats', { user_id: '00000000-0000-0000-0000-000000000000' });
    if (error) {
      console.log('⚠️  get_user_stats function:', error.message);
    } else {
      console.log('✅ get_user_stats function working');
    }
  } catch (err) {
    console.log('❌ Function test error:', err.message);
  }

  console.log('\n🎯 Supabase Health Check Complete!');
  console.log('\n📋 Summary:');
  console.log('- If you see ✅ for most items, your Supabase is working correctly');
  console.log('- If you see ❌ for tables, you may need to run the SQL setup script');
  console.log('- If you see ⚠️  for RLS, that\'s normal and good for security');
}

// Run the test
testSupabaseConnection().catch(console.error);
