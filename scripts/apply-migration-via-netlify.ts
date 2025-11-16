/**
 * Apply VIBE Migration via Netlify Function
 *
 * Uses the run-sql Netlify function to apply the migration
 * This works even without local Docker/Supabase running
 */

const NETLIFY_FUNCTION_URL = process.env.NETLIFY_DEV
  ? 'http://localhost:8888/.netlify/functions/run-sql'
  : 'https://agiagentautomation.com/.netlify/functions/run-sql';

// Migration SQL
const MIGRATION_SQL = `
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

-- Return success message
SELECT 'Migration applied successfully' as message, COUNT(*) as messages_updated
FROM vibe_messages
WHERE user_id IS NOT NULL;
`;

async function applyMigration() {
  console.log('🚀 Applying VIBE migration via Netlify function...\n');

  try {
    // Call Netlify function to execute SQL
    console.log('📡 Calling run-sql function...');
    console.log(`   URL: ${NETLIFY_FUNCTION_URL}`);

    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: MIGRATION_SQL,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!\n');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

    // Verify the schema
    console.log('\n🔍 Verifying schema changes...');

    const verifySQL = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vibe_messages'
      ORDER BY ordinal_position;
    `;

    const verifyResponse = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: verifySQL,
      }),
    });

    if (verifyResponse.ok) {
      const schemaResult = await verifyResponse.json();
      console.log('✅ Schema verification:');
      console.log(JSON.stringify(schemaResult, null, 2));

      // Check if user_id column exists
      const hasUserId = schemaResult.some(
        (col: any) => col.column_name === 'user_id'
      );
      if (hasUserId) {
        console.log('\n✅ user_id column confirmed in vibe_messages table');
      } else {
        console.log(
          '\n⚠️  user_id column not found - migration may need manual application'
        );
      }
    }

    // Get statistics
    console.log('\n📊 Getting database statistics...');

    const statsSQL = `
      SELECT
        (SELECT COUNT(*) FROM vibe_messages) as total_messages,
        (SELECT COUNT(*) FROM vibe_messages WHERE user_id IS NOT NULL) as messages_with_user_id,
        (SELECT COUNT(*) FROM vibe_sessions) as total_sessions,
        (SELECT COUNT(*) FROM vibe_agent_actions) as total_actions;
    `;

    const statsResponse = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: statsSQL,
      }),
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Statistics:', JSON.stringify(stats, null, 2));
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n💡 Alternative methods:');
    console.error('   1. Run locally: supabase db reset');
    console.error('   2. Apply via Supabase Dashboard SQL Editor');
    console.error(
      '   3. Use migration script: tsx scripts/apply-vibe-migration.ts'
    );
    process.exit(1);
  }
}

// Run migration
applyMigration();
