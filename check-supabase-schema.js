// Comprehensive Supabase schema and database check
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 COMPREHENSIVE SUPABASE SCHEMA CHECK');
console.log('=====================================');

async function checkDatabaseSchema() {
  try {
    console.log('\n📊 STEP 1: Testing Basic Connection');
    console.log('-----------------------------------');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    console.log('\n📊 STEP 2: Checking Users Table Structure');
    console.log('---------------------------------------');
    
    // Check if users table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'users' });
    
    if (tableError) {
      console.log('ℹ️  get_table_info RPC not available, trying alternative method');
      
      // Try to get table info by querying the table
      const { data: sampleData, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Users table error:', sampleError);
        console.log('🔧 This suggests the users table may not exist or have permission issues');
        return;
      }
      
      console.log('✅ Users table exists and is accessible');
      if (sampleData && sampleData.length > 0) {
        console.log('📋 Sample data structure:', Object.keys(sampleData[0]));
      }
    } else {
      console.log('✅ Table info retrieved:', tableInfo);
    }
    
    console.log('\n📊 STEP 3: Testing Row Level Security (RLS)');
    console.log('------------------------------------------');
    
    // Test RLS by trying to insert a test record
    const testUserId = 'test-user-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.log('🔧 This may indicate RLS policy issues');
    } else {
      console.log('✅ Insert test successful');
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n📊 STEP 4: Testing Authentication');
    console.log('---------------------------------');
    
    // Test auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (this is normal for this test)');
    } else {
      console.log('✅ Authenticated user found:', user.email);
    }
    
    console.log('\n📊 STEP 5: Checking Database Permissions');
    console.log('----------------------------------------');
    
    // Test different permission levels
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Select query failed:', selectError);
    } else {
      console.log('✅ Select query successful');
      console.log('📊 Found', selectData.length, 'users in database');
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    console.log('If you see any ❌ errors above, those need to be fixed.');
    console.log('If all tests pass ✅, the database schema is correct.');
    
  } catch (error) {
    console.error('💥 Unexpected error during schema check:', error);
  }
}

// Run the check
checkDatabaseSchema();
