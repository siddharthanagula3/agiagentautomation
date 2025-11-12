# Remove Sandbox Webhook and Setup Production

## Overview

This guide helps you remove sandbox/test webhooks and set up production webhooks for **real payments**.

## ⚠️ Important

- **Sandbox/Test webhooks** are for testing only
- **Production webhooks** are for real payments
- Make sure you're using **LIVE Stripe keys** (`sk_live_...`) for production

## Quick Setup

### Step 1: Set Environment Variables

```powershell
# Set your Stripe LIVE secret key (for real payments)
$env:STRIPE_SECRET_KEY='sk_live_...'

# Set your production Netlify URL
$env:PRODUCTION_URL='https://your-site.netlify.app'
```

### Step 2: Run the Webhook Manager

```powershell
npx tsx scripts/manage-webhooks.ts
```

The script will:
1. ✅ List all existing webhooks
2. ✅ **Automatically DELETE all sandbox/test webhooks**
3. ✅ Create production webhook for real payments
4. ✅ Show you the signing secret to set in Netlify

## What Gets Deleted

The script identifies and deletes webhooks that contain:
- `localhost`
- `127.0.0.1`
- `test`
- `sandbox`
- `stripe-mcp`
- `local`

## Production Webhook

The production webhook will be created at:
```
https://your-site.netlify.app/.netlify/functions/stripe-webhook
```

With these events:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## After Setup

1. **Get the signing secret** from the script output or Stripe Dashboard
2. **Set in Netlify**: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. **Verify you're using LIVE keys**:
   - `STRIPE_SECRET_KEY=sk_live_...` (not `sk_test_...`)
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...` (not `pk_test_...`)

## Verification

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Verify only production webhook exists
3. Verify it's enabled and receiving events
4. Test with a real payment (small amount)

## Troubleshooting

### Still seeing sandbox webhooks?

Delete them manually:
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on each sandbox webhook
3. Click "Delete endpoint"

### Using test keys by mistake?

Check your environment variables:
- ❌ `sk_test_...` = Test mode (no real payments)
- ✅ `sk_live_...` = Live mode (real payments)

## Security Notes

- **Never commit** Stripe keys to version control
- **Use environment variables** for all secrets
- **Test in test mode first** before going live
- **Monitor webhook events** in Stripe Dashboard

