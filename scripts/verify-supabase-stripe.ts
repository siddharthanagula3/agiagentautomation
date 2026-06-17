/**
 * Verify Supabase and Stripe Configuration
 * Run with: npx tsx scripts/verify-supabase-stripe.ts
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Colors for console output
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

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function verifySupabase() {
  logSection('🔍 SUPABASE VERIFICATION');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase environment variables', 'red');
    log('   Required: VITE_SUPABASE_URL or SUPABASE_URL', 'yellow');
    log(
      '   Required: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY',
      'yellow'
    );
    return false;
  }

  log(`✅ Supabase URL: ${supabaseUrl}`, 'green');
  log(`✅ Supabase Key: ${supabaseKey.substring(0, 20)}...`, 'green');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check subscription_plans table and pricing
    log('\n📊 Checking subscription_plans table...', 'blue');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'pro');

    if (plansError) {
      log(`❌ Error querying subscription_plans: ${plansError.message}`, 'red');
      return false;
    }

    if (!plans || plans.length === 0) {
      log('⚠️  Pro plan not found in subscription_plans table', 'yellow');
      log(
        '   Run migration: supabase/migrations/20250112000001_update_pro_pricing.sql',
        'yellow'
      );
    } else {
      const proPlan = plans[0];
      log(`✅ Pro plan found:`, 'green');
      log(`   Name: ${proPlan.name}`, 'green');
      log(`   Monthly Price: $${proPlan.price_monthly}`, 'green');
      log(`   Yearly Price: $${proPlan.price_yearly}`, 'green');

      if (proPlan.price_monthly === 29 && proPlan.price_yearly === 299.88) {
        log('   ✅ Pricing is correct!', 'green');
      } else {
        log('   ⚠️  Pricing mismatch!', 'yellow');
        log(`   Expected: $29/month, $299.88/year`, 'yellow');
        log(
          `   Actual: $${proPlan.price_monthly}/month, $${proPlan.price_yearly}/year`,
          'yellow'
        );
        log(
          '   Run migration: supabase/migrations/20250112000001_update_pro_pricing.sql',
          'yellow'
        );
      }
    }

    // 2. Check required tables
    log('\n📋 Checking required tables...', 'blue');
    const requiredTables = [
      'user_shortcuts',
      'public_artifacts',
      'token_transactions',
    ];
    const { data: tables, error: tablesError } = await supabase.rpc(
      'exec_sql',
      {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN (${requiredTables.map((t) => `'${t}'`).join(', ')})
          ORDER BY table_name;
        `,
      }
    );

    // Alternative: Check each table individually
    for (const table of requiredTables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found
        log(`   ⚠️  ${table}: ${error.message}`, 'yellow');
      } else if (error && error.code === 'PGRST116') {
        log(`   ❌ ${table}: Table does not exist`, 'red');
      } else {
        log(`   ✅ ${table}: Table exists`, 'green');
      }
    }

    // 3. Check users table columns
    log('\n👤 Checking users table columns...', 'blue');
    const { data: userColumns, error: userColumnsError } = await supabase
      .from('users')
      .select('token_balance, subscription_start_date')
      .limit(1);

    if (userColumnsError && userColumnsError.code === 'PGRST202') {
      // Column doesn't exist
      log(
        '   ❌ token_balance or subscription_start_date columns missing',
        'red'
      );
      log(
        '   Run migrations: 20250111000003_add_token_system.sql and 20250111000004_add_subscription_start_date.sql',
        'yellow'
      );
    } else if (userColumnsError) {
      log(
        `   ⚠️  Error checking columns: ${userColumnsError.message}`,
        'yellow'
      );
    } else {
      log('   ✅ token_balance column exists', 'green');
      log('   ✅ subscription_start_date column exists', 'green');
    }

    log('\n✅ Supabase verification complete!', 'green');
    return true;
  } catch (error) {
    log(`❌ Supabase verification failed: ${error}`, 'red');
    return false;
  }
}

async function verifyStripe() {
  logSection('💳 STRIPE VERIFICATION');

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    log('❌ STRIPE_SECRET_KEY environment variable is required', 'red');
    log('   Set it in your .env file or as an environment variable', 'yellow');
    return false;
  }

  // Check if using live or test key
  const isLive = stripeSecretKey.startsWith('sk_live_');
  const isTest = stripeSecretKey.startsWith('sk_test_');

  if (isLive) {
    log('✅ Using LIVE Stripe keys (Production mode)', 'green');
  } else if (isTest) {
    log('⚠️  Using TEST Stripe keys (Test mode)', 'yellow');
    log(
      '   Switch to LIVE keys (sk_live_...) for production payments',
      'yellow'
    );
  } else {
    log('⚠️  Stripe key format unrecognized', 'yellow');
  }

  log(`   Key: ${stripeSecretKey.substring(0, 20)}...`, 'green');

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // 1. Get account info
    log('\n📊 Checking Stripe account...', 'blue');
    const account = await stripe.accounts.retrieve();
    log(`✅ Account ID: ${account.id}`, 'green');
    log(`✅ Account Name: ${account.display_name || 'N/A'}`, 'green');
    log(`✅ Country: ${account.country || 'N/A'}`, 'green');
    log(
      `✅ Charges Enabled: ${account.charges_enabled ? 'Yes' : 'No'}`,
      account.charges_enabled ? 'green' : 'yellow'
    );
    log(
      `✅ Payouts Enabled: ${account.payouts_enabled ? 'Yes' : 'No'}`,
      account.payouts_enabled ? 'green' : 'yellow'
    );

    // 2. Check webhooks
    log('\n🔗 Checking webhooks...', 'blue');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

    if (webhooks.data.length === 0) {
      log('   ⚠️  No webhooks found', 'yellow');
      log('   Create webhook: https://dashboard.stripe.com/webhooks', 'yellow');
    } else {
      log(`   Found ${webhooks.data.length} webhook(s):\n`, 'green');

      const productionWebhooks = webhooks.data.filter(
        (w) =>
          w.url.includes('agiagentautomation.vercel.app') &&
          !w.url.includes('localhost') &&
          !w.url.includes('test')
      );

      if (productionWebhooks.length > 0) {
        log('   ✅ Production webhooks found:\n', 'green');
        productionWebhooks.forEach((webhook, index) => {
          log(`   ${index + 1}. ${webhook.url}`, 'green');
          log(`      ID: ${webhook.id}`, 'green');
          log(
            `      Status: ${webhook.status}`,
            webhook.status === 'enabled' ? 'green' : 'yellow'
          );
          log(`      Events: ${webhook.enabled_events.length} events`, 'green');

          const requiredEvents = [
            'checkout.session.completed',
            'invoice.payment_succeeded',
            'invoice.payment_failed',
            'customer.subscription.updated',
            'customer.subscription.deleted',
          ];

          const missingEvents = requiredEvents.filter(
            (e) => !webhook.enabled_events.includes(e)
          );
          if (missingEvents.length > 0) {
            log(
              `      ⚠️  Missing events: ${missingEvents.join(', ')}`,
              'yellow'
            );
          } else {
            log(`      ✅ All required events configured`, 'green');
          }
          console.log('');
        });
      } else {
        log('   ⚠️  No production webhooks found', 'yellow');
        log(
          '   Create webhook for: https://agiagentautomation.vercel.app/.netlify/functions/payments/stripe-webhook',
          'yellow'
        );
      }

      // Check for sandbox/test webhooks
      const sandboxWebhooks = webhooks.data.filter(
        (w) =>
          w.url.includes('localhost') ||
          w.url.includes('test') ||
          w.url.includes('sandbox') ||
          w.url.includes('127.0.0.1')
      );

      if (sandboxWebhooks.length > 0) {
        log(
          '   ⚠️  Found sandbox/test webhooks (should be removed):\n',
          'yellow'
        );
        sandboxWebhooks.forEach((webhook, index) => {
          log(`   ${index + 1}. ${webhook.url} (ID: ${webhook.id})`, 'yellow');
        });
        log(
          '\n   Delete these in Stripe Dashboard: https://dashboard.stripe.com/webhooks',
          'yellow'
        );
      }
    }

    // 3. Check products/prices
    log('\n💰 Checking products and prices...', 'blue');
    const products = await stripe.products.list({ limit: 10, active: true });
    log(`   Found ${products.data.length} active product(s)`, 'green');

    if (products.data.length > 0) {
      for (const product of products.data) {
        log(`   Product: ${product.name} (${product.id})`, 'green');
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });
        prices.data.forEach((price) => {
          const amount = price.unit_amount
            ? (price.unit_amount / 100).toFixed(2)
            : 'N/A';
          const interval = price.recurring?.interval || 'one-time';
          log(`      Price: $${amount}/${interval} (${price.id})`, 'green');
        });
      }
    }

    log('\n✅ Stripe verification complete!', 'green');
    return true;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      log(`❌ Stripe API Error: ${error.message}`, 'red');
      if (
        error.code === 'api_key_expired' ||
        error.code === 'invalid_api_key'
      ) {
        log('   Check your STRIPE_SECRET_KEY is correct', 'yellow');
      }
    } else {
      log(`❌ Stripe verification failed: ${error}`, 'red');
    }
    return false;
  }
}

async function main() {
  console.log('\n');
  log('🚀 Supabase & Stripe Configuration Verification', 'cyan');
  console.log('\n');

  const supabaseOk = await verifySupabase();
  const stripeOk = await verifyStripe();

  logSection('📋 SUMMARY');

  if (supabaseOk) {
    log('✅ Supabase: Configuration looks good', 'green');
  } else {
    log('❌ Supabase: Issues found - see details above', 'red');
  }

  if (stripeOk) {
    log('✅ Stripe: Configuration looks good', 'green');
  } else {
    log('❌ Stripe: Issues found - see details above', 'red');
  }

  console.log('\n');
  log('💡 Next Steps:', 'cyan');
  log('   1. Fix any issues identified above', 'yellow');
  log('   2. Apply missing migrations if needed', 'yellow');
  log('   3. Update Stripe keys to LIVE if in production', 'yellow');
  log('   4. Create/update webhook if missing', 'yellow');
  console.log('\n');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
