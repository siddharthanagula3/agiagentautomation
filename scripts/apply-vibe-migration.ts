/**
 * Apply VIBE Migration Script
 *
 * This script applies the user_id migration to vibe_messages table
 * and verifies the schema changes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Starting VIBE migration...\n');

  try {
    // Step 1: Check if column already exists
    console.log('Step 1: Checking current schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('vibe_messages')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Failed to check schema:', schemaError.message);
      throw schemaError;
    }

    // Check if user_id column exists
    const hasUserId = columns && columns.length > 0 && 'user_id' in columns[0];

    if (hasUserId) {
      console.log('✅ user_id column already exists');
    } else {
      console.log('⚠️  user_id column not found, will be added');
    }

    // Step 2: Apply migration using raw SQL
    console.log('\nStep 2: Applying migration...');

    const migrationSQL = `
      -- Add user_id column to vibe_messages
      ALTER TABLE vibe_messages
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

      -- Create index for user_id lookups
      CREATE INDEX IF NOT EXISTS idx_vibe_messages_user ON vibe_messages(user_id);

      -- Update existing rows to populate user_id from session
      UPDATE vibe_messages
      SET user_id = (
        SELECT user_id FROM vibe_sessions WHERE vibe_sessions.id = vibe_messages.session_id
      )
      WHERE user_id IS NULL;

      -- Add comment
      COMMENT ON COLUMN vibe_messages.user_id IS 'Direct reference to user for simplified queries and RLS';
    `;

    // Execute migration (Note: Supabase client doesn't support raw SQL from client)
    // This needs to be run via Supabase CLI or Dashboard SQL Editor
    console.log('⚠️  Migration SQL prepared. To apply:');
    console.log('   1. Run: supabase db reset');
    console.log('   2. Or copy SQL to Supabase Dashboard > SQL Editor');
    console.log('\nMigration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

    // Step 3: Verify the migration (if already applied)
    console.log('\nStep 3: Verifying schema...');

    const { data: messages, error: verifyError } = await supabase
      .from('vibe_messages')
      .select('id, session_id, user_id, role, content')
      .limit(5);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Schema verification successful');
      console.log(`   Found ${messages?.length || 0} messages in database`);

      if (messages && messages.length > 0) {
        const withUserId = messages.filter((m) => m.user_id).length;
        console.log(
          `   Messages with user_id: ${withUserId}/${messages.length}`
        );
      }
    }

    // Step 4: Get table info
    console.log('\nStep 4: Checking table statistics...');

    const { count: totalMessages } = await supabase
      .from('vibe_messages')
      .select('*', { count: 'exact', head: true });

    const { count: totalSessions } = await supabase
      .from('vibe_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: totalActions } = await supabase
      .from('vibe_agent_actions')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Database Statistics:');
    console.log(`   Total Messages: ${totalMessages || 0}`);
    console.log(`   Total Sessions: ${totalSessions || 0}`);
    console.log(`   Total Agent Actions: ${totalActions || 0}`);

    console.log('\n✅ Migration check complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration();
