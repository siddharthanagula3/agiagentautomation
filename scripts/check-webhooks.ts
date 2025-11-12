/**
 * Check existing Stripe webhooks
 * Run with: npx tsx scripts/check-webhooks.ts
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
  console.error('   Set it in your .env file or as an environment variable');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

async function listWebhooks() {
  console.log('🔍 Checking existing Stripe webhooks...\n');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    if (webhooks.data.length === 0) {
      console.log('✅ No webhooks found.\n');
      return [];
    }
    
    console.log(`Found ${webhooks.data.length} webhook(s):\n`);
    console.log('='.repeat(70));
    
    webhooks.data.forEach((webhook, index) => {
      const isLocalhost = webhook.url.includes('localhost');
      const isTest = webhook.url.includes('test') || webhook.url.includes('sandbox');
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
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
      console.log(`   Created: ${new Date(webhook.created * 1000).toISOString()}`);
      
      if (isLocalhost || isTest) {
        console.log(`   ⚠️  This appears to be a ${isLocalhost ? 'local' : 'test/sandbox'} webhook`);
      }
    });
    
    console.log('\n' + '='.repeat(70) + '\n');
    
    return webhooks.data;
  } catch (error) {
    console.error('❌ Error listing webhooks:', error);
    throw error;
  }
}

async function deleteWebhook(webhookId: string) {
  console.log(`🗑️  Deleting webhook: ${webhookId}\n`);
  
  try {
    await stripe.webhookEndpoints.del(webhookId);
    console.log(`✅ Webhook ${webhookId} deleted successfully\n`);
  } catch (error) {
    console.error(`❌ Error deleting webhook:`, error);
    throw error;
  }
}

async function main() {
  console.log('🔍 Stripe Webhook Checker\n');
  console.log('='.repeat(70) + '\n');
  
  const webhooks = await listWebhooks();
  
  if (webhooks.length === 0) {
    console.log('No webhooks to manage.\n');
    return;
  }
  
  // Identify sandbox/test webhooks
  const sandboxWebhooks = webhooks.filter(w => 
    w.url.includes('localhost') || 
    w.url.includes('test') || 
    w.url.includes('sandbox') ||
    w.url.includes('127.0.0.1')
  );
  
  const productionWebhooks = webhooks.filter(w => 
    !w.url.includes('localhost') && 
    !w.url.includes('test') && 
    !w.url.includes('sandbox') &&
    !w.url.includes('127.0.0.1')
  );
  
  console.log('📊 Summary:');
  console.log(`   Total webhooks: ${webhooks.length}`);
  console.log(`   🧪 Test/Sandbox: ${sandboxWebhooks.length}`);
  console.log(`   🚀 Production: ${productionWebhooks.length}\n`);
  
  if (sandboxWebhooks.length > 0) {
    console.log('⚠️  Found test/sandbox webhooks:\n');
    sandboxWebhooks.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} (ID: ${webhook.id})`);
    });
    console.log('\n💡 Recommendation: Delete test/sandbox webhooks and create production webhook.\n');
  }
  
  if (productionWebhooks.length > 0) {
    console.log('✅ Found production webhooks:\n');
    productionWebhooks.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} (ID: ${webhook.id})`);
    });
    console.log('\n💡 These production webhooks are good to keep.\n');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

