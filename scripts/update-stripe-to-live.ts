/**
 * Update Stripe Configuration to LIVE Mode
 * This script helps you switch from TEST to LIVE Stripe keys
 * Run with: npx tsx scripts/update-stripe-to-live.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

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

async function checkStripeKeys() {
  log('\n🔍 Checking Stripe Configuration...\n', 'cyan');

  const testKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!testKey) {
    log('❌ STRIPE_SECRET_KEY not found in environment', 'red');
    return false;
  }

  const isTest = testKey.startsWith('sk_test_');
  const isLive = testKey.startsWith('sk_live_');

  if (isTest) {
    log('⚠️  Currently using TEST Stripe keys', 'yellow');
    log(`   Secret Key: ${testKey.substring(0, 20)}...`, 'yellow');
    if (publishableKey) {
      log(`   Publishable Key: ${publishableKey.substring(0, 20)}...`, 'yellow');
    }
  } else if (isLive) {
    log('✅ Already using LIVE Stripe keys!', 'green');
    log(`   Secret Key: ${testKey.substring(0, 20)}...`, 'green');
    return true;
  } else {
    log('⚠️  Stripe key format unrecognized', 'yellow');
    return false;
  }

  return false;
}

async function listWebhooks(stripe: Stripe) {
  log('\n🔗 Current Webhooks:\n', 'blue');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    if (webhooks.data.length === 0) {
      log('   No webhooks found', 'yellow');
      return;
    }

    webhooks.data.forEach((webhook, index) => {
      const isProduction = webhook.url.includes('agiagentautomation.com') && 
                          !webhook.url.includes('localhost') && 
                          !webhook.url.includes('test');
      
      const status = isProduction ? '✅ Production' : '🧪 Test/Sandbox';
      log(`   ${index + 1}. ${status}`, isProduction ? 'green' : 'yellow');
      log(`      URL: ${webhook.url}`, 'blue');
      log(`      ID: ${webhook.id}`, 'blue');
      log(`      Status: ${webhook.status}`, webhook.status === 'enabled' ? 'green' : 'yellow');
      log(`      Events: ${webhook.enabled_events.length}`, 'blue');
      console.log('');
    });
  } catch (error) {
    log(`   ❌ Error listing webhooks: ${error}`, 'red');
  }
}

async function main() {
  console.log('\n');
  log('🚀 Stripe LIVE Mode Setup Guide', 'cyan');
  console.log('='.repeat(70) + '\n');

  const usingTest = await checkStripeKeys();

  if (!usingTest) {
    log('\n📋 Steps to Switch to LIVE Mode:\n', 'cyan');
    
    log('1. Get LIVE Keys from Stripe:', 'yellow');
    log('   a. Go to: https://dashboard.stripe.com', 'blue');
    log('   b. Toggle from "Test mode" to "Live mode" (top right)', 'blue');
    log('   c. Go to Developers → API keys', 'blue');
    log('   d. Copy the LIVE keys:', 'blue');
    log('      - Publishable key (pk_live_...)', 'blue');
    log('      - Secret key (sk_live_...)\n', 'blue');

    log('2. Update Netlify Environment Variables:', 'yellow');
    log('   a. Go to: https://app.netlify.com', 'blue');
    log('   b. Select your site', 'blue');
    log('   c. Go to Site Settings → Environment Variables', 'blue');
    log('   d. Update or add:', 'blue');
    log('      - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...', 'blue');
    log('      - STRIPE_SECRET_KEY = sk_live_...\n', 'blue');

    log('3. Update Webhook Signing Secret:', 'yellow');
    log('   a. In Stripe Dashboard → Webhooks', 'blue');
    log('   b. Click on your production webhook', 'blue');
    log('   c. Copy the "Signing secret" (whsec_...)', 'blue');
    log('   d. Update in Netlify:', 'blue');
    log('      - STRIPE_WEBHOOK_SECRET = whsec_...\n', 'blue');

    log('4. Redeploy Site:', 'yellow');
    log('   - Netlify will auto-deploy, or trigger manual deploy', 'blue');
    log('   - After deploy, checkout will show LIVE mode\n', 'blue');
  }

  // Check current webhook status
  const testKey = process.env.STRIPE_SECRET_KEY;
  if (testKey) {
    try {
      const stripe = new Stripe(testKey, {
        apiVersion: '2024-12-18.acacia',
      });
      await listWebhooks(stripe);
    } catch (error) {
      log(`\n⚠️  Could not connect to Stripe: ${error}`, 'yellow');
    }
  }

  console.log('='.repeat(70));
  log('\n✅ Setup complete! After updating keys, verify with:', 'cyan');
  log('   npx tsx scripts/verify-supabase-stripe.ts\n', 'cyan');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

