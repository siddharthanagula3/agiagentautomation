# Stripe Integration Setup Guide

## Overview
This guide will help you set up Stripe payments for AI employee subscriptions in your AGI Workforce application.

## Prerequisites
- A Stripe account (sign up at https://dashboard.stripe.com/register)
- Netlify account for deploying serverless functions
- Supabase project for database

---

## Step 1: Get Stripe API Keys

### Development (Test Mode)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Production (Live Mode)
1. Activate your Stripe account (requires business verification)
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Copy your **Secret key** (starts with `sk_live_`)

---

## Step 2: Configure Webhook

### Create Webhook Endpoint
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-app-name.netlify.app/.netlify/functions/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 3: Set Environment Variables

### Local Development (.env)
Create or update your `.env` file:

```env
# Stripe Keys (Test Mode for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (for webhook to store data)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Netlify Production
1. Go to your Netlify dashboard
2. Navigate to **Site settings → Environment variables**
3. Add the following variables:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Use live key for production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Use live key for production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From webhook endpoint |
| `VITE_SUPABASE_URL` | `https://...` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `...` | Supabase service role key |

---

## Step 4: Database Setup

### Run Migration
The migration has already been created. To apply it:

```bash
npx supabase db push --include-all
```

This adds the following to your database:
- `stripe_subscription_id` column to `purchased_employees`
- `stripe_customer_id` column to `purchased_employees`
- `subscription_status` column with status tracking
- `stripe_invoices` table for invoice history
- Indexes for fast Stripe lookups
- Trigger to auto-sync subscription status

---

## Step 5: Test the Integration

### Test Cards
Stripe provides test cards for development:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | 3D Secure required |

Use any future expiry date, any 3-digit CVC, and any billing ZIP code.

### Testing Flow
1. Go to your marketplace page
2. Click "Hire Now" on an AI employee
3. You should be redirected to Stripe Checkout
4. Use test card `4242 4242 4242 4242`
5. After successful payment, you'll be redirected back
6. Check your Supabase `purchased_employees` table
7. The employee should appear in your workforce

### Verify Webhooks
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. You should see events being received (checkmark ✓)
4. Check logs to verify events are processed successfully

---

## Step 6: Go Live

### Before Launching
1. ✅ Test all payment flows with test cards
2. ✅ Verify webhook events are processed correctly
3. ✅ Test subscription cancellation and reactivation
4. ✅ Verify access control (users only see their hired employees)
5. ✅ Test billing portal access

### Activate Production
1. Complete Stripe account verification
2. Update environment variables with live keys
3. Create production webhook endpoint
4. Update `STRIPE_WEBHOOK_SECRET` with production secret
5. Test with a real card (your own, small amount)
6. Monitor Stripe Dashboard for first transactions

---

## Pricing Structure

### Current Pricing
- **Standard Roles**: $10/month (shown as 50% off from $20)
- **Premium Roles**: $20/month (shown as 50% off from $40)

### Stripe Fees
- **Transaction Fee**: 2.9% + $0.30 per charge
- **Monthly Subscription**: Charged automatically
- **Your Net Revenue**:
  - Standard: ~$9.41/employee/month
  - Premium: ~$18.91/employee/month

---

## Key Features Implemented

### Frontend
- ✅ Stripe Checkout integration in marketplace
- ✅ Fallback to direct purchase if Stripe not configured
- ✅ Loading states and error handling
- ✅ Redirect to success/cancel pages

### Backend (Netlify Functions)
- ✅ `create-checkout-session`: Creates Stripe Checkout
- ✅ `stripe-webhook`: Handles payment events
- ✅ `get-billing-portal`: Opens subscription management

### Database
- ✅ Stripe subscription tracking
- ✅ Invoice history
- ✅ Auto-sync subscription status
- ✅ RLS policies for security

---

## Troubleshooting

### Common Issues

**Issue**: "Stripe not configured" warning
- **Solution**: Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set and starts with `pk_`

**Issue**: Webhook events not received
- **Solution**: 
  - Verify webhook URL is correct
  - Check Netlify function logs
  - Ensure `STRIPE_WEBHOOK_SECRET` matches dashboard

**Issue**: Database connection error in webhook
- **Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify env vars

**Issue**: Payment succeeds but employee not hired
- **Solution**: 
  - Check webhook logs in Stripe Dashboard
  - Check Netlify function logs
  - Verify database migration was applied

---

## Support

### Resources
- Stripe Documentation: https://stripe.com/docs
- Stripe Test Cards: https://stripe.com/docs/testing
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Supabase: https://supabase.com/docs

### Testing Webhooks Locally
To test webhooks locally, use Stripe CLI:

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events to local endpoint
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

---

## Security Best Practices

1. ✅ Never expose `STRIPE_SECRET_KEY` in client code
2. ✅ Always verify webhook signatures
3. ✅ Use HTTPS in production
4. ✅ Store minimal payment data (IDs only, not card details)
5. ✅ Implement idempotency for critical operations
6. ✅ Enable Stripe Radar for fraud detection
7. ✅ Use Row Level Security (RLS) in Supabase
8. ✅ Log all payment events for audit trail

---

## Next Steps

1. Get Stripe API keys from dashboard
2. Set environment variables in Netlify
3. Test checkout flow with test cards
4. Verify webhook events
5. Complete Stripe verification for production
6. Go live!

**Ready to accept payments! 🎉**

