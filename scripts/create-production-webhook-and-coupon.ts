/**
 * Create Production Webhook and Discount Coupon
 * Run with: npx tsx scripts/create-production-webhook-and-coupon.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

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

const PRODUCTION_URL = 'https://agiagentautomation.com';
const WEBHOOK_URL = `${PRODUCTION_URL}/.netlify/functions/stripe-webhook`;
const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

async function createOrUpdateWebhook() {
  log('\n🔗 Creating/Updating Production Webhook...\n', 'cyan');

  try {
    // List existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });

    // Check if production webhook already exists
    const existingProdWebhook = existingWebhooks.data.find(
      (w) => w.url === WEBHOOK_URL
    );

    if (existingProdWebhook) {
      log(`✅ Production webhook already exists!`, 'green');
      log(`   ID: ${existingProdWebhook.id}`, 'blue');
      log(`   URL: ${existingProdWebhook.url}`, 'blue');
      log(`   Status: ${existingProdWebhook.status}`, 'blue');

      // Check if all required events are enabled
      const missingEvents = REQUIRED_EVENTS.filter(
        (e) => !existingProdWebhook.enabled_events.includes(e)
      );

      if (missingEvents.length > 0) {
        log(`\n⚠️  Missing events: ${missingEvents.join(', ')}`, 'yellow');
        log(`   Updating webhook to include all required events...`, 'yellow');

        // Update webhook to include all events
        const updated = await stripe.webhookEndpoints.update(
          existingProdWebhook.id,
          {
            enabled_events: REQUIRED_EVENTS,
          }
        );

        log(`   ✅ Webhook updated with all required events`, 'green');
        return updated;
      }

      return existingProdWebhook;
    }

    // Create new webhook
    log(`Creating new production webhook...`, 'blue');
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: REQUIRED_EVENTS,
      description: 'AGI Agent Automation - Production Webhook',
    });

    log(`✅ Production webhook created!`, 'green');
    log(`   ID: ${webhook.id}`, 'blue');
    log(`   URL: ${webhook.url}`, 'blue');
    log(`   Status: ${webhook.status}`, 'blue');
    log(
      `   Events: ${webhook.enabled_events.length} events configured`,
      'blue'
    );

    return webhook;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      log(`❌ Stripe Error: ${error.message}`, 'red');
    } else {
      log(`❌ Error: ${error}`, 'red');
    }
    throw error;
  }
}

async function createDiscountCoupon() {
  log('\n💰 Creating Discount Coupon...\n', 'cyan');

  try {
    const couponCode = 'BETATESTER100OFF';

    // Check if coupon already exists
    try {
      const existing = await stripe.coupons.retrieve(couponCode);
      log(`⚠️  Coupon "${couponCode}" already exists!`, 'yellow');
      log(`   ID: ${existing.id}`, 'blue');
      log(`   Percent Off: ${existing.percent_off}%`, 'blue');
      log(`   Duration: ${existing.duration}`, 'blue');
      log(`   Valid: ${existing.valid ? 'Yes' : 'No'}`, 'blue');

      // Check if it's 100% off
      if (existing.percent_off === 100) {
        log(`   ✅ Already configured as 100% off`, 'green');
        return existing;
      } else {
        log(
          `   ⚠️  Current discount is ${existing.percent_off}%, not 100%`,
          'yellow'
        );
        log(`   Creating new coupon with 100% off...`, 'yellow');
      }
    } catch (error) {
      // Coupon doesn't exist, create it
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === 'resource_missing'
      ) {
        log(`Creating new coupon "${couponCode}"...`, 'blue');
      } else {
        throw error;
      }
    }

    // Create new coupon with 100% off
    const coupon = await stripe.coupons.create({
      id: couponCode,
      percent_off: 100,
      duration: 'once', // One-time use
      name: 'Beta Tester 100% Off',
      metadata: {
        description: '100% discount for beta testers',
        created_by: 'setup-script',
      },
    });

    log(`✅ Discount coupon created!`, 'green');
    log(`   Code: ${couponCode}`, 'blue');
    log(`   Percent Off: ${coupon.percent_off}%`, 'blue');
    log(`   Duration: ${coupon.duration}`, 'blue');
    log(`   Valid: ${coupon.valid ? 'Yes' : 'No'}`, 'blue');

    return coupon;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_already_exists') {
        log(
          `⚠️  Coupon "${couponCode}" already exists with different settings`,
          'yellow'
        );
        log(`   You may need to delete it first in Stripe Dashboard`, 'yellow');
      } else {
        log(`❌ Stripe Error: ${error.message}`, 'red');
      }
    } else {
      log(`❌ Error: ${error}`, 'red');
    }
    throw error;
  }
}

async function main() {
  console.log('\n');
  log('🚀 Creating Production Webhook & Discount Coupon', 'cyan');
  console.log('='.repeat(70) + '\n');

  // Check if using LIVE keys
  const isLive = stripeSecretKey.startsWith('sk_live_');
  const isTest = stripeSecretKey.startsWith('sk_test_');

  if (isLive) {
    log('✅ Using LIVE Stripe keys (Production mode)', 'green');
  } else if (isTest) {
    log('⚠️  Using TEST Stripe keys', 'yellow');
    log('   Switch to LIVE keys (sk_live_...) for production', 'yellow');
  } else {
    log('⚠️  Stripe key format unrecognized', 'yellow');
  }

  try {
    // Create webhook
    const webhook = await createOrUpdateWebhook();

    // Get webhook signing secret
    log('\n🔑 Webhook Signing Secret:', 'cyan');
    log(`   ${webhook.secret || 'Click "Reveal" in Stripe Dashboard'}`, 'blue');
    log('\n💡 Set this in Netlify as: STRIPE_WEBHOOK_SECRET', 'yellow');

    // Create coupon
    const coupon = await createDiscountCoupon();

    // Summary
    console.log('\n' + '='.repeat(70));
    log('\n✅ Setup Complete!\n', 'green');

    log('📋 Summary:', 'cyan');
    log(`   Webhook URL: ${WEBHOOK_URL}`, 'blue');
    log(`   Webhook ID: ${webhook.id}`, 'blue');
    log(
      `   Webhook Secret: ${webhook.secret || 'Get from Stripe Dashboard'}`,
      'blue'
    );
    log(`   Discount Code: BETATESTER100OFF`, 'blue');
    log(`   Discount: 100% off (one-time use)`, 'blue');

    log('\n🔧 Next Steps:', 'cyan');
    log('   1. Copy webhook signing secret from Stripe Dashboard', 'yellow');
    log(
      '   2. Set STRIPE_WEBHOOK_SECRET in Netlify environment variables',
      'yellow'
    );
    log('   3. Test the discount code in checkout', 'yellow');
    log('   4. Verify webhook receives events', 'yellow');

    console.log('\n');
  } catch (error) {
    log(`\n❌ Setup failed: ${error}`, 'red');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
