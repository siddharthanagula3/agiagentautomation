/**
 * Apply pricing migration to Supabase
 * Run with: npx tsx scripts/apply-pricing-migration.ts
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPricingMigration() {
  console.log('🔧 Applying pricing migration...\n');

  try {
    // Update Pro plan pricing
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        price_monthly: 29.0,
        price_yearly: 299.88,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', 'pro')
      .select();

    if (error) {
      console.error('❌ Error updating pricing:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error('❌ Pro plan not found');
      return false;
    }

    console.log('✅ Pricing updated successfully!');
    console.log(`   Monthly: $${data[0].price_monthly}`);
    console.log(
      `   Yearly: $${data[0].price_yearly} ($${(data[0].price_yearly / 12).toFixed(2)}/month)\n`
    );

    // Verify
    const { data: verify, error: verifyError } = await supabase
      .from('subscription_plans')
      .select('price_monthly, price_yearly')
      .eq('slug', 'pro')
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return false;
    }

    if (verify.price_monthly === 29 && verify.price_yearly === 299.88) {
      console.log('✅ Verification passed - pricing is correct!\n');
      return true;
    } else {
      console.error('❌ Verification failed - pricing mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function checkMissingMigrations() {
  console.log('📋 Checking for missing migrations...\n');

  const checks = [
    {
      name: 'user_shortcuts table',
      check: async () => {
        const { error } = await supabase
          .from('user_shortcuts')
          .select('*')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
      migration: '20250111000001_add_user_shortcuts_table.sql',
    },
    {
      name: 'public_artifacts table',
      check: async () => {
        const { error } = await supabase
          .from('public_artifacts')
          .select('*')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
      migration: '20250111000002_add_public_artifacts_table.sql',
    },
    {
      name: 'token_transactions table',
      check: async () => {
        const { error } = await supabase
          .from('token_transactions')
          .select('*')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
      migration: '20250111000003_add_token_system.sql',
    },
    {
      // NOTE: users.token_balance column was dropped in migration 20260113000002
      // The authoritative token balance is now stored in user_token_balances table
      name: 'user_token_balances table (authoritative)',
      check: async () => {
        const { error } = await supabase
          .from('user_token_balances')
          .select('current_balance')
          .limit(1);
        return !error || error.code !== 'PGRST116';
      },
      migration: '20260106000002_add_user_token_balances.sql',
    },
    {
      name: 'users.subscription_start_date column',
      check: async () => {
        const { error } = await supabase
          .from('users')
          .select('subscription_start_date')
          .limit(1);
        return !error || error.code !== 'PGRST202';
      },
      migration: '20250111000004_add_subscription_start_date.sql',
    },
  ];

  const missing: string[] = [];

  for (const check of checks) {
    const exists = await check.check();
    if (exists) {
      console.log(`✅ ${check.name}: Exists`);
    } else {
      console.log(`❌ ${check.name}: Missing`);
      missing.push(check.migration);
    }
  }

  if (missing.length > 0) {
    console.log('\n⚠️  Missing migrations detected:');
    missing.forEach((m) => console.log(`   - ${m}`));
    console.log(
      '\n💡 Apply these migrations via Supabase Dashboard SQL Editor or CLI'
    );
  } else {
    console.log('\n✅ All migrations appear to be applied!');
  }

  return missing.length === 0;
}

async function main() {
  console.log('🚀 Supabase Migration Application\n');
  console.log('='.repeat(70) + '\n');

  const pricingOk = await applyPricingMigration();
  const migrationsOk = await checkMissingMigrations();

  console.log('\n' + '='.repeat(70));
  if (pricingOk && migrationsOk) {
    console.log('✅ All checks passed!\n');
  } else {
    console.log('⚠️  Some issues found - see above\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
