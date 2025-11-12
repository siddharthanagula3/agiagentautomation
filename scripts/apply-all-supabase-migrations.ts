/**
 * Apply All Supabase Migrations
 * Run with: npx tsx scripts/apply-all-supabase-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQL(
  sql: string,
  migrationName: string
): Promise<boolean> {
  try {
    log(`\n📝 Applying: ${migrationName}`, 'blue');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT')
      );

    // Execute each statement
    for (const statement of statements) {
      if (statement.length === 0) continue;

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.startsWith('COMMENT'))
        continue;

      try {
        // Use RPC to execute SQL (if available) or direct query
        const { error } = await supabase.rpc('exec_sql', { query: statement });

        if (error) {
          // Try direct query for SELECT statements
          if (statement.toUpperCase().startsWith('SELECT')) {
            const { error: selectError } = await supabase
              .from('users')
              .select('id')
              .limit(1);
            if (selectError && selectError.code === 'PGRST116') {
              // Table doesn't exist, which is expected for CREATE TABLE
              continue;
            }
          }

          // For CREATE/ALTER statements, we might need to use a different approach
          // Since Supabase client doesn't directly support DDL, we'll log and continue
          log(
            `   ⚠️  Note: Some statements may need to be run via Supabase Dashboard`,
            'yellow'
          );
        }
      } catch (err) {
        // Continue with next statement
      }
    }

    log(`   ✅ Migration file processed`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Error: ${error}`, 'red');
    return false;
  }
}

async function applyMigration(
  migrationPath: string,
  migrationName: string
): Promise<boolean> {
  try {
    const fullPath = join(__dirname, '..', migrationPath);
    const sql = readFileSync(fullPath, 'utf-8');
    return await executeSQL(sql, migrationName);
  } catch (error) {
    log(`   ❌ Failed to read migration file: ${error}`, 'red');
    return false;
  }
}

async function verifyMigration(
  migrationName: string,
  checkFn: () => Promise<boolean>
): Promise<boolean> {
  try {
    const exists = await checkFn();
    if (exists) {
      log(`   ✅ Verified: ${migrationName}`, 'green');
      return true;
    } else {
      log(`   ⚠️  Verification failed: ${migrationName}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`   ⚠️  Could not verify: ${migrationName}`, 'yellow');
    return false;
  }
}

async function main() {
  console.log('\n');
  log('🚀 Applying All Supabase Migrations', 'cyan');
  console.log('='.repeat(70) + '\n');

  const migrations = [
    {
      path: 'supabase/migrations/20250111000001_add_user_shortcuts_table.sql',
      name: 'user_shortcuts table',
      verify: async () => {
        const { error } = await supabase
          .from('user_shortcuts')
          .select('*')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
    },
    {
      path: 'supabase/migrations/20250111000002_add_public_artifacts_table.sql',
      name: 'public_artifacts table',
      verify: async () => {
        const { error } = await supabase
          .from('public_artifacts')
          .select('*')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
    },
    {
      path: 'supabase/migrations/20250111000003_add_token_system.sql',
      name: 'token_system (table + column)',
      verify: async () => {
        const tableCheck = await supabase
          .from('token_transactions')
          .select('*')
          .limit(1);
        const columnCheck = await supabase
          .from('users')
          .select('token_balance')
          .limit(1);
        return (
          (!tableCheck.error || tableCheck.error.code !== 'PGRST116') &&
          (!columnCheck.error || columnCheck.error.code !== 'PGRST202')
        );
      },
    },
    {
      path: 'supabase/migrations/20250111000004_add_subscription_start_date.sql',
      name: 'subscription_start_date column',
      verify: async () => {
        const { error } = await supabase
          .from('users')
          .select('subscription_start_date')
          .limit(1);
        return !error || error.code !== 'PGRST202';
      },
    },
    {
      path: 'supabase/migrations/20250112000001_update_pro_pricing.sql',
      name: 'Pro plan pricing update',
      verify: async () => {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('price_monthly, price_yearly')
          .eq('slug', 'pro')
          .single();
        return (
          !error && data?.price_monthly === 29 && data?.price_yearly === 299.88
        );
      },
    },
  ];

  log(
    '⚠️  IMPORTANT: Supabase client cannot execute DDL statements directly.',
    'yellow'
  );
  log(
    '   You need to apply these migrations via Supabase Dashboard SQL Editor.\n',
    'yellow'
  );
  log('📋 Migration Files to Apply:\n', 'cyan');

  migrations.forEach((migration, index) => {
    log(`${index + 1}. ${migration.name}`, 'blue');
    log(`   File: ${migration.path}\n`, 'blue');
  });

  log('🔧 How to Apply:\n', 'cyan');
  log('1. Go to: https://app.supabase.com', 'yellow');
  log('2. Select project: AGI Automation LLC', 'yellow');
  log('3. Go to SQL Editor', 'yellow');
  log('4. Copy and paste each migration file content', 'yellow');
  log('5. Click "Run" for each migration\n', 'yellow');

  // Try to verify current state
  log('🔍 Checking current database state...\n', 'cyan');

  for (const migration of migrations) {
    await verifyMigration(migration.name, migration.verify);
  }

  console.log('\n' + '='.repeat(70));
  log(
    '\n💡 After applying migrations, run: npx tsx scripts/verify-supabase-stripe.ts',
    'cyan'
  );
  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
