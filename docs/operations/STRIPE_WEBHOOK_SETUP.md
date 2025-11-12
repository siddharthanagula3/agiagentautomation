# Stripe Webhook Setup Guide

## Overview

This guide explains how to configure Stripe webhooks for the AGI Agent Automation platform. The webhook handler is located at `netlify/functions/stripe-webhook.ts` and handles all subscription and payment events.

## Required Events

The webhook must listen for these events:

1. **checkout.session.completed** - Handles subscription purchases and token pack purchases
2. **invoice.payment_succeeded** - Updates subscription status to active
3. **invoice.payment_failed** - Updates subscription status to past_due
4. **customer.subscription.updated** - Handles subscription changes
5. **customer.subscription.deleted** - Handles subscription cancellations

## Production Setup

### Step 1: Get Production URL

Your production webhook URL will be:
```
https://yourdomain.com/.netlify/functions/stripe-webhook
```

Replace `yourdomain.com` with your actual Netlify domain.

### Step 2: Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/.netlify/functions/stripe-webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"

### Step 3: Get Webhook Signing Secret

1. After creating the webhook, click on it in the Stripe Dashboard
2. Find the "Signing secret" section
3. Click "Reveal" to show the secret (starts with `whsec_`)
4. Copy the secret

### Step 4: Set Environment Variable in Netlify

1. Go to your Netlify site dashboard
2. Navigate to Site Settings → Environment Variables
3. Add or update:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxxxxxxx` (your webhook signing secret)
4. Save and redeploy if needed

## Using Setup Script (Recommended)

For automated webhook creation, use the setup script:

```bash
export PRODUCTION_URL=https://your-site.netlify.app
export STRIPE_SECRET_KEY=sk_live_...
npx tsx scripts/setup-stripe-webhook.ts
```

The script will:
- List existing webhooks
- Create webhook endpoint for production
- Display the webhook signing secret
- Show you what to set in Netlify

## Verification

### Check Webhook Events in Stripe Dashboard

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. View the "Events" tab to see all received events
4. Check for any failed events (red status)

### Check Webhook Audit Log

The webhook handler logs all events to the `webhook_audit_log` table in Supabase. Query it to verify events are being processed:

```sql
SELECT * FROM webhook_audit_log 
WHERE event_type = 'checkout.session.completed' 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Test Token Pack Purchase

1. Navigate to `/billing` in your app
2. Click "Buy" on a token pack
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify:
   - Webhook receives `checkout.session.completed` event
   - Tokens are added to user balance
   - Transaction is logged in `token_transactions` table
   - Success redirect works

## Troubleshooting

### Webhook Not Receiving Events

1. **Check URL is correct**: Verify the webhook URL in Stripe Dashboard matches your production URL
2. **Check environment variable**: Ensure `STRIPE_WEBHOOK_SECRET` is set correctly in Netlify
3. **Check Netlify function logs**: View logs in Netlify Dashboard → Functions → stripe-webhook
4. **Verify webhook is enabled**: Check Stripe Dashboard to ensure webhook status is "Enabled"

### Signature Verification Fails

- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- Verify the secret is set correctly in Netlify environment variables
- Check that the request body is not being modified (e.g., by a proxy or CDN)

### Events Not Processing

- Check Netlify function logs for errors
- Verify database connection (Supabase environment variables)
- Check `webhook_audit_log` table for error details
- Ensure RLS policies allow the service role to insert into audit log

### Token Balance Not Updating

1. Check if `update_user_token_balance` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'update_user_token_balance';
   ```

2. Test the function manually:
   ```sql
   SELECT update_user_token_balance(
     'user-id'::uuid, 
     1000::bigint, 
     'purchase', 
     'test-123', 
     'Manual test', 
     '{}'::jsonb
   );
   ```

3. Check transaction log:
   ```sql
   SELECT * FROM token_transactions 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## Security Notes

- **Never commit webhook secrets** to version control
- **Use environment variables** for all secrets
- **Verify webhook signatures** - the handler already does this
- **Rate limiting** - the handler includes rate limiting to prevent abuse
- **Idempotency** - events are tracked to prevent duplicate processing

## API Version

The webhook handler uses Stripe API version `2024-12-18.acacia`. Ensure this is a valid pinned API version. If not, update the `apiVersion` in `netlify/functions/stripe-webhook.ts`.

## Next Steps

After setting up webhooks:

1. ✅ Test token pack purchase flow
2. ✅ Test subscription purchase flow
3. ✅ Monitor webhook events in Stripe Dashboard
4. ✅ Check `webhook_audit_log` table regularly
5. ✅ Set up alerts for failed webhook events

