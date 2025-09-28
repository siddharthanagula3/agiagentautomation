// Test Services Functionality
import { createClient } from '@supabase/supabase-js';

console.log('🧪 TESTING SERVICES FUNCTIONALITY');
console.log('==================================');

const supabaseUrl = 'https://lywdzvfibhzbljrgovvwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('\n📊 STEP 1: Testing Database Connection');
  console.log('---------------------------------------');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function testTablesExist() {
  console.log('\n📊 STEP 2: Testing Table Existence');
  console.log('----------------------------------');
  
  const tables = [
    'users',
    'ai_agents',
    'jobs',
    'notifications',
    'analytics',
    'billing',
    'settings',
    'team_members',
    'reports',
    'api_keys',
    'webhooks',
    'logs',
    'processing_jobs'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        results[table] = false;
      } else {
        console.log(`✅ Table ${table}: exists`);
        results[table] = true;
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

async function testServiceCalls() {
  console.log('\n📊 STEP 3: Testing Service Calls');
  console.log('----------------------------------');
  
  const testUserId = 'test-user-id';
  
  // Test agents service
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Agents service test failed:', error.message);
    } else {
      console.log('✅ Agents service test passed');
    }
  } catch (error) {
    console.log('❌ Agents service test error:', error.message);
  }
  
  // Test jobs service
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Jobs service test failed:', error.message);
    } else {
      console.log('✅ Jobs service test passed');
    }
  } catch (error) {
    console.log('❌ Jobs service test error:', error.message);
  }
  
  // Test analytics service
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Analytics service test failed:', error.message);
    } else {
      console.log('✅ Analytics service test passed');
    }
  } catch (error) {
    console.log('❌ Analytics service test error:', error.message);
  }
}

async function main() {
  try {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('\n❌ Cannot proceed - database connection failed');
      return;
    }
    
    const tableResults = await testTablesExist();
    const existingTables = Object.values(tableResults).filter(Boolean).length;
    const totalTables = Object.keys(tableResults).length;
    
    console.log(`\n📊 Table Results: ${existingTables}/${totalTables} tables exist`);
    
    await testServiceCalls();
    
    console.log('\n🎯 SERVICE TEST COMPLETED!');
    console.log('==========================');
    
    if (existingTables < totalTables) {
      console.log('⚠️  Some tables are missing - this explains why pages show loading symbols');
      console.log('💡 Solution: Create the missing database tables in Supabase');
    } else {
      console.log('✅ All tables exist - services should work');
    }
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
  }
}

main();
