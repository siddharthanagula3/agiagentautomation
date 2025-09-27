// Check the actual structure of the users table
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 CHECKING USERS TABLE STRUCTURE');
console.log('=================================');

async function checkTableStructure() {
  try {
    // Try to get table structure by querying information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'users' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (columnsError) {
      console.log('ℹ️  exec_sql RPC not available, trying direct query');
      
      // Try a different approach - query the table with a limit to see structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Cannot query users table:', sampleError);
        return;
      }
      
      console.log('✅ Users table is accessible');
      if (sampleData && sampleData.length > 0) {
        console.log('📋 Sample record structure:');
        Object.keys(sampleData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleData[0][key]} (${sampleData[0][key]})`);
        });
      } else {
        console.log('ℹ️  Table is empty, but accessible');
      }
    } else {
      console.log('📋 Users table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Test with a proper UUID
    console.log('\n🔧 Testing with proper UUID format...');
    const testUuid = uuidv4();
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUuid,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert with UUID failed:', insertError);
    } else {
      console.log('✅ Insert with UUID successful');
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUuid);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking table structure:', error);
  }
}

checkTableStructure();
