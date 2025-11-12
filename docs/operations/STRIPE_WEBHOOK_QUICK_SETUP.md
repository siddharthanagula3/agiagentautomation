# Quick Stripe Webhook Setup Guide

## Using Stripe MCP (Recommended)

Since you have Stripe MCP connected, you can create webhooks programmatically.

### Option 1: Use the Setup Script

1. **Set your production URL**:
   ```bash
   export PRODUCTION_URL=https://your-site.netlify.app
   # OR
   export NETLIFY_SITE_URL=https://your-site.netlify.app
   ```

2. **Set your Stripe secret key**:
   ```bash
   export STRIPE_SECRET_KEY=sk_live_...  # Use live key for production
   ```

3. **Run the setup script**:
   ```bash
   npx tsx scripts/setup-stripe-webhook.ts
   ```

3. **The script will**:
   - List existing webhooks
   - Create webhook endpoint for production
   - Display the webhook signing secret
   - Show you what to set in Netlify

### Option 2: Manual Setup via Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production webhook URL:
   - `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Set it in Netlify as `STRIPE_WEBHOOK_SECRET`

## Required Environment Variables

### In Netlify Dashboard:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (whsec_...)

## Testing

### Production Testing:
1. Make a test purchase in your app
2. Check Stripe Dashboard → Webhooks → Your endpoint → Events
3. Verify the event was received and processed
4. Check Netlify function logs for any errors

## Verification

After setup, verify:
- ✅ Webhook endpoint shows as "Enabled" in Stripe Dashboard
- ✅ All 5 required events are selected
- ✅ `STRIPE_WEBHOOK_SECRET` is set in Netlify
- ✅ Test event is received and processed successfully

