// Apply Database Fix
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🔧 APPLYING DATABASE FIX');
console.log('========================');

class DatabaseFixer {
  constructor() {
    this.supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4MjYwOCwiZXhwIjoyMDc0MzU4NjA4fQ.T_xcrtv_gXqe3tDT64eDT64eHRbbcT7M_y3C_6mQ2FI9mzv8';
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async applySQLScript() {
    console.log('\n📊 STEP 1: Reading SQL Script');
    console.log('------------------------------');
    
    try {
      const sqlScript = fs.readFileSync('create-missing-tables.sql', 'utf8');
      console.log('✅ SQL script loaded successfully');
      console.log(`📄 Script length: ${sqlScript.length} characters`);
      
      console.log('\n📊 STEP 2: Applying SQL Script');
      console.log('------------------------------');
      
      // Split the script into individual statements
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📄 Found ${statements.length} SQL statements to execute`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
            const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
            
            if (error) {
              console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
              // Don't count as error if it's just a "already exists" warning
              if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
                errorCount++;
              } else {
                successCount++;
              }
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
              successCount++;
            }
          } catch (err) {
            console.log(`❌ Statement ${i + 1} failed:`, err.message);
            errorCount++;
          }
        }
      }
      
      console.log(`\n📊 SQL Execution Results:`);
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${errorCount}`);
      
      return { successCount, errorCount };
      
    } catch (error) {
      console.error('❌ Error applying SQL script:', error.message);
      return { successCount: 0, errorCount: 1 };
    }
  }

  async testTables() {
    console.log('\n📊 STEP 3: Testing Created Tables');
    console.log('----------------------------------');
    
    const tablesToTest = [
      'ai_agents',
      'jobs', 
      'subscriptions',
      'analytics',
      'notifications',
      'settings',
      'reports',
      'api_keys',
      'webhooks',
      'logs',
      'processing_jobs'
    ];
    
    let workingTables = 0;
    
    for (const table of tablesToTest) {
      try {
        console.log(`🔍 Testing table: ${table}`);
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Working`);
          workingTables++;
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Table Test Results:`);
    console.log(`✅ Working Tables: ${workingTables}/${tablesToTest.length}`);
    console.log(`❌ Failed Tables: ${tablesToTest.length - workingTables}/${tablesToTest.length}`);
    
    return { workingTables, totalTables: tablesToTest.length };
  }

  async run() {
    try {
      console.log('🚀 Starting database fix...');
      
      const sqlResults = await this.applySQLScript();
      const tableResults = await this.testTables();
      
      console.log('\n🎯 DATABASE FIX COMPLETED!');
      console.log('============================');
      console.log(`📊 SQL Statements: ${sqlResults.successCount} successful, ${sqlResults.errorCount} failed`);
      console.log(`📊 Tables: ${tableResults.workingTables}/${tableResults.totalTables} working`);
      
      if (tableResults.workingTables === tableResults.totalTables) {
        console.log('✅ All tables created successfully!');
        console.log('✅ Database fix is complete!');
      } else {
        console.log('⚠️  Some tables may need manual creation');
        console.log('🔧 Check the Supabase dashboard for any remaining issues');
      }
      
    } catch (error) {
      console.error('❌ Database fix failed:', error.message);
    }
  }
}

// Run the database fixer
const fixer = new DatabaseFixer();
fixer.run().catch(error => {
  console.error('❌ Database fixer crashed:', error);
});
