import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLoginIssue() {
  console.log('🔍 Debugging Login Issue...\n');

  try {
    // 1. Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('✅ Supabase connection successful');
    console.log('Current user:', user ? user.email : 'No user');

    // 2. Test users table access
    console.log('\n2. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      console.log('Error code:', usersError.code);
    } else {
      console.log('✅ Users table accessible');
      console.log('Sample user:', users[0] || 'No users found');
    }

    // 3. Test RLS policies
    console.log('\n3. Testing RLS policies...');
    
    // Try to create a test user profile (this will fail if RLS is too restrictive)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: testProfile, error: testError } = await supabase
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
      .select()
      .single();

    if (testError) {
      console.log('❌ RLS policy issue:', testError.message);
      console.log('Error code:', testError.code);
      console.log('This means user profile creation is blocked by RLS policies');
    } else {
      console.log('✅ RLS policies allow profile creation');
      // Clean up test data
      await supabase.from('users').delete().eq('id', testUserId);
    }

    // 4. Test authentication flow
    console.log('\n4. Testing authentication flow...');
    
    // Try to sign in with a test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'testpassword123'
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('This could be the cause of infinite loading');
    } else {
      console.log('✅ Sign in successful');
      console.log('User ID:', signInData.user?.id);
      
      // Test profile fetch after sign in
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile fetch failed:', profileError.message);
        console.log('This is likely the cause of infinite loading');
      } else {
        console.log('✅ Profile fetch successful');
      }
    }

    // 5. Check for missing tables
    console.log('\n5. Checking for missing tables...');
    const tables = ['users', 'ai_agents', 'jobs', 'mcp_tools'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table} error:`, error.message);
      } else {
        console.log(`✅ Table ${table} accessible`);
      }
    }

    // 6. Check environment variables
    console.log('\n6. Checking environment variables...');
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (value) {
        console.log(`✅ ${envVar} is set`);
      } else {
        console.log(`❌ ${envVar} is missing`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLoginIssue().then(() => {
  console.log('\n🏁 Debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug error:', error);
  process.exit(1);
});
