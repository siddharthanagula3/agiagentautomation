/**
 * Setup Stripe Webhook Endpoint
 *
 * This script creates a Stripe webhook endpoint for the production and local environments.
 * Run with: npx tsx scripts/setup-stripe-webhook.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('   Set it in your .env file or as an environment variable');
  console.error('   Example: STRIPE_SECRET_KEY=sk_test_...');
  console.error('\n   Or run: export STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

// Required events for the webhook
const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

async function listExistingWebhooks() {
  console.log('🔍 Listing existing webhooks...\n');

  const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

  if (webhooks.data.length === 0) {
    console.log('No webhooks found.\n');
    return [];
  }

  console.log(`Found ${webhooks.data.length} webhook(s):\n`);
  console.log('='.repeat(70));

  webhooks.data.forEach((webhook, index) => {
    const isLocalhost =
      webhook.url.includes('localhost') || webhook.url.includes('127.0.0.1');
    const isTest =
      webhook.url.includes('test') ||
      webhook.url.includes('sandbox') ||
      webhook.url.includes('stripe-mcp');
    const isProduction = !isLocalhost && !isTest;

    let type = '❓ Unknown';
    if (isLocalhost) type = '🔧 Local/Dev';
    else if (isTest) type = '🧪 Test/Sandbox';
    else if (isProduction) type = '🚀 Production';

    console.log(`\n${index + 1}. ${type}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.length} events`);
    if (webhook.enabled_events.length > 0) {
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
    }
    console.log(
      `   Created: ${new Date(webhook.created * 1000).toISOString()}`
    );
  });

  console.log('\n' + '='.repeat(70) + '\n');

  return webhooks.data;
}

async function deleteWebhook(webhookId: string) {
  console.log(`🗑️  Deleting webhook: ${webhookId}\n`);

  try {
    await stripe.webhookEndpoints.del(webhookId);
    console.log(`✅ Webhook ${webhookId} deleted successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting webhook:`, error);
    return false;
  }
}

function isSandboxWebhook(webhook: Stripe.WebhookEndpoint): boolean {
  const url = webhook.url.toLowerCase();
  return (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('test') ||
    url.includes('sandbox') ||
    url.includes('stripe-mcp') ||
    url.includes('local')
  );
}

async function createWebhookEndpoint(url: string, description: string) {
  console.log(`📝 Creating webhook endpoint for: ${url}\n`);

  try {
    const webhook = await stripe.webhookEndpoints.create({
      url,
      description,
      enabled_events: REQUIRED_EVENTS,
      api_version: '2024-12-18.acacia',
    });

    console.log('✅ Webhook created successfully!\n');
    console.log('Webhook Details:');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
    console.log(
      `   Signing Secret: ${webhook.secret || 'Not available (check Stripe Dashboard)'}\n`
    );

    if (webhook.secret) {
      console.log('🔑 WEBHOOK SIGNING SECRET:');
      console.log(`   ${webhook.secret}\n`);
      console.log(
        '⚠️  IMPORTANT: Save this secret and set it as STRIPE_WEBHOOK_SECRET in Netlify!\n'
      );
    } else {
      console.log(
        '⚠️  Note: Signing secret not returned. Get it from Stripe Dashboard:\n'
      );
      console.log(`   https://dashboard.stripe.com/webhooks/${webhook.id}\n`);
    }

    return webhook;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_already_exists') {
        console.log('⚠️  Webhook endpoint already exists for this URL.\n');
        return null;
      }
      console.error(`❌ Stripe API Error: ${error.message}\n`);
    } else {
      console.error('❌ Error creating webhook:', error);
    }
    throw error;
  }
}

async function findOrCreateWebhook(url: string, description: string) {
  const existingWebhooks = await listExistingWebhooks();

  // Identify sandbox/test webhooks
  const sandboxWebhooks = existingWebhooks.filter((w) => isSandboxWebhook(w));
  const productionWebhooks = existingWebhooks.filter(
    (w) => !isSandboxWebhook(w)
  );

  if (sandboxWebhooks.length > 0) {
    console.log('🧪 Found test/sandbox webhooks:\n');
    sandboxWebhooks.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} (ID: ${webhook.id})`);
    });
    console.log(
      '\n⚠️  Recommendation: These should be removed for production.\n'
    );
    console.log(
      '💡 Would you like to delete them? (This script will skip deletion for safety)'
    );
    console.log('   To delete manually, go to Stripe Dashboard → Webhooks\n');
  }

  // Check if webhook already exists for this URL
  const existing = existingWebhooks.find((w) => w.url === url);

  if (existing) {
    console.log(`✅ Webhook already exists for ${url}\n`);
    console.log('Webhook Details:');
    console.log(`   ID: ${existing.id}`);
    console.log(`   URL: ${existing.url}`);
    console.log(`   Status: ${existing.status}`);
    console.log(`   Events: ${existing.enabled_events.join(', ')}\n`);

    // Check if all required events are enabled
    const missingEvents = REQUIRED_EVENTS.filter(
      (event) => !existing.enabled_events.includes(event)
    );

    if (missingEvents.length > 0) {
      console.log('⚠️  Missing required events:', missingEvents.join(', '));
      console.log(
        '   Update the webhook in Stripe Dashboard to include all required events.\n'
      );
    } else {
      console.log('✅ All required events are enabled.\n');
    }

    // Get the signing secret
    console.log('🔑 To get the signing secret:');
    console.log(
      `   1. Go to: https://dashboard.stripe.com/webhooks/${existing.id}`
    );
    console.log('   2. Click "Reveal" in the "Signing secret" section');
    console.log('   3. Copy the secret (starts with whsec_)');
    console.log('   4. Set it as STRIPE_WEBHOOK_SECRET in Netlify\n');

    return existing;
  }

  // Create new webhook
  return await createWebhookEndpoint(url, description);
}

async function main() {
  console.log('🚀 Stripe Webhook Setup (Production)\n');
  console.log('='.repeat(50) + '\n');

  // Get production URL from environment
  const productionUrl =
    process.env.NETLIFY_SITE_URL || process.env.PRODUCTION_URL;

  if (!productionUrl) {
    console.error('❌ Production URL not found in environment variables.');
    console.error('   Set NETLIFY_SITE_URL or PRODUCTION_URL');
    console.error(
      '   Example: export PRODUCTION_URL=https://your-site.netlify.app\n'
    );
    process.exit(1);
  }

  // Setup production webhook only
  console.log('📝 Setting up PRODUCTION webhook endpoint...\n');
  const prodWebhookUrl = `${productionUrl}/.netlify/functions/payments/stripe-webhook`;
  await findOrCreateWebhook(
    prodWebhookUrl,
    'AGI Agent Automation - Production Webhook'
  );

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('✅ Webhook setup complete!\n');
  console.log('📋 Summary:');
  console.log(`   Production URL: ${prodWebhookUrl}`);
  console.log(`   Required Events: ${REQUIRED_EVENTS.join(', ')}`);
  console.log('   Webhook Handler: netlify/functions/stripe-webhook.ts');
  console.log('\n🔑 Next Steps:');
  console.log('   1. Get the webhook signing secret from Stripe Dashboard');
  console.log(
    '   2. Set STRIPE_WEBHOOK_SECRET in Netlify environment variables'
  );
  console.log('   3. Test the webhook with a test purchase\n');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
