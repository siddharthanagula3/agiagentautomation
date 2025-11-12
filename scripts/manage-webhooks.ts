/**
 * Manage Stripe Webhooks - Check, identify sandbox, and create production
 * Run with: npx tsx scripts/manage-webhooks.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('   Set it: export STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

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

async function listWebhooks() {
  console.log('🔍 Checking existing webhooks...\n');
  
  const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  
  if (webhooks.data.length === 0) {
    console.log('✅ No webhooks found.\n');
    return { all: [], sandbox: [], production: [] };
  }
  
  console.log(`Found ${webhooks.data.length} webhook(s):\n`);
  console.log('='.repeat(70));
  
  const sandbox: Stripe.WebhookEndpoint[] = [];
  const production: Stripe.WebhookEndpoint[] = [];
  
  webhooks.data.forEach((webhook, index) => {
    const isSandbox = isSandboxWebhook(webhook);
    
    let type = '❓ Unknown';
    if (isSandbox) {
      type = '🧪 Test/Sandbox';
      sandbox.push(webhook);
    } else {
      type = '🚀 Production';
      production.push(webhook);
    }
    
    console.log(`\n${index + 1}. ${type}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.length} events`);
    if (webhook.enabled_events.length > 0 && webhook.enabled_events.length <= 10) {
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
    }
    console.log(`   Created: ${new Date(webhook.created * 1000).toISOString()}`);
  });
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return { all: webhooks.data, sandbox, production };
}

async function deleteWebhook(webhookId: string): Promise<boolean> {
  try {
    await stripe.webhookEndpoints.del(webhookId);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting webhook:`, error);
    return false;
  }
}

async function createProductionWebhook(url: string) {
  console.log(`📝 Creating production webhook: ${url}\n`);
  
  try {
    const webhook = await stripe.webhookEndpoints.create({
      url,
      description: 'AGI Agent Automation - Production Webhook',
      enabled_events: REQUIRED_EVENTS,
      api_version: '2024-12-18.acacia',
    });
    
    console.log('✅ Webhook created successfully!\n');
    console.log('Webhook Details:');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.join(', ')}\n`);
    
    if (webhook.secret) {
      console.log('🔑 WEBHOOK SIGNING SECRET:');
      console.log(`   ${webhook.secret}\n`);
      console.log('⚠️  IMPORTANT: Set this as STRIPE_WEBHOOK_SECRET in Netlify!\n');
    } else {
      console.log('🔑 To get the signing secret:');
      console.log(`   1. Go to: https://dashboard.stripe.com/webhooks/${webhook.id}`);
      console.log('   2. Click "Reveal" in the "Signing secret" section\n');
    }
    
    return webhook;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_already_exists') {
        console.log('⚠️  Webhook already exists for this URL.\n');
        return null;
      }
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Stripe Webhook Manager - PRODUCTION SETUP\n');
  console.log('⚠️  This will DELETE all sandbox/test webhooks and create production webhook\n');
  console.log('='.repeat(70) + '\n');
  
  // List all webhooks
  const { all, sandbox, production } = await listWebhooks();
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Total: ${all.length}`);
  console.log(`   🧪 Test/Sandbox: ${sandbox.length}`);
  console.log(`   🚀 Production: ${production.length}\n`);
  
  // Handle sandbox webhooks - DELETE THEM
  if (sandbox.length > 0) {
    console.log('🧪 Found test/sandbox webhooks - DELETING for production:\n');
    for (const webhook of sandbox) {
      console.log(`   Deleting: ${webhook.url} (ID: ${webhook.id})`);
      const deleted = await deleteWebhook(webhook.id);
      if (deleted) {
        console.log(`   ✅ Deleted successfully\n`);
      } else {
        console.log(`   ❌ Failed to delete\n`);
      }
    }
    console.log('✅ All sandbox webhooks removed.\n');
  }
  
  // Get production URL
  const productionUrl = process.env.NETLIFY_SITE_URL || process.env.PRODUCTION_URL;
  
  if (!productionUrl) {
    console.log('❌ Production URL not found.');
    console.log('   Set PRODUCTION_URL or NETLIFY_SITE_URL');
    console.log('   Example: $env:PRODUCTION_URL="https://your-site.netlify.app"\n');
    process.exit(1);
  }
  
  // Validate it's a production URL (not localhost/test)
  if (productionUrl.includes('localhost') || productionUrl.includes('127.0.0.1') || productionUrl.includes('test')) {
    console.log('❌ ERROR: Production URL appears to be a test/local URL!');
    console.log(`   URL: ${productionUrl}`);
    console.log('   Use your actual Netlify production domain\n');
    process.exit(1);
  }
  
  const prodWebhookUrl = `${productionUrl}/.netlify/functions/stripe-webhook`;
  
  console.log('🎯 Production Webhook URL:');
  console.log(`   ${prodWebhookUrl}\n`);
  
  // Check if production webhook exists
  const existingProd = production.find(w => w.url === prodWebhookUrl);
  
  if (existingProd) {
    console.log(`✅ Production webhook already exists:\n`);
    console.log(`   URL: ${existingProd.url}`);
    console.log(`   ID: ${existingProd.id}`);
    console.log(`   Status: ${existingProd.status}\n`);
    
    // Check events
    const missingEvents = REQUIRED_EVENTS.filter(
      e => !existingProd.enabled_events.includes(e)
    );
    
    if (missingEvents.length > 0) {
      console.log('⚠️  Missing events:', missingEvents.join(', '));
      console.log('   Update in Stripe Dashboard to include all required events.\n');
    } else {
      console.log('✅ All required events are enabled.\n');
    }
    
    console.log('🔑 To get the signing secret:');
    console.log(`   https://dashboard.stripe.com/webhooks/${existingProd.id}\n`);
  } else {
    console.log('📝 Creating production webhook...\n');
    await createProductionWebhook(prodWebhookUrl);
  }
  
  console.log('='.repeat(70));
  console.log('✅ Production webhook setup complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Get the webhook signing secret from Stripe Dashboard');
  console.log('   2. Set STRIPE_WEBHOOK_SECRET in Netlify environment variables');
  console.log('   3. Ensure you are using LIVE keys (sk_live_...) for production payments\n');
  console.log('⚠️  IMPORTANT: Make sure you are using LIVE Stripe keys for real payments!');
  console.log('   Check: https://dashboard.stripe.com/apikeys\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

