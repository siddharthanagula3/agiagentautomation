/**
 * Verify Multi-Agent Chat Tables on Remote Supabase
 * Quick script to check if migration was successful
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from .env
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTables() {
  console.log('🔍 Verifying Multi-Agent Chat Tables on Remote Supabase...\n');
  console.log(`📍 Database: ${supabaseUrl}\n`);

  const tablesToVerify = [
    'multi_agent_conversations',
    'conversation_participants',
    'agent_collaborations',
    'message_reactions',
    'conversation_metadata'
  ];

  const results = {};

  for (const table of tablesToVerify) {
    try {
      // Try to query the table (limit 0 to just check existence)
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results[table] = { exists: false, error: 'Table does not exist' };
        } else {
          results[table] = { exists: false, error: error.message };
        }
      } else {
        results[table] = { exists: true, count: data?.length || 0 };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }

  // Print results
  console.log('📊 Verification Results:\n');
  console.log('═'.repeat(80));

  let allTablesExist = true;
  for (const [table, result] of Object.entries(results)) {
    const status = result.exists ? '✅' : '❌';
    const details = result.exists
      ? `EXISTS`
      : `MISSING - ${result.error}`;

    console.log(`${status} ${table.padEnd(35)} ${details}`);

    if (!result.exists) {
      allTablesExist = false;
    }
  }

  console.log('═'.repeat(80));

  if (allTablesExist) {
    console.log('\n✅ SUCCESS: All multi-agent chat tables exist on remote database!');
    console.log('\n✨ Migration Status: COMPLETE ✨\n');
    process.exit(0);
  } else {
    console.log('\n❌ INCOMPLETE: Some tables are missing from remote database');
    console.log('\n📝 Action Required: Run `supabase db push --linked` to apply migrations\n');
    process.exit(1);
  }
}

verifyTables().catch((err) => {
  console.error('\n💥 Error verifying tables:', err);
  process.exit(1);
});
