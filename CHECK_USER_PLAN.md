# 🔍 Debugging Pro Plan Token Limits

## Issue
After paying for Pro subscription, token limits are not increasing from 250k to 2.5M per LLM.

## Root Causes to Check

### 1. **Database Migration Not Applied**
The `users` table needs the `plan` column and related fields.

**Check if migration was applied:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('plan', 'plan_status', 'stripe_customer_id', 'stripe_subscription_id', 'subscription_start_date', 'subscription_end_date', 'billing_period');
```

**Expected Result:** Should show all 7 columns.

**If missing, run migration:**
```bash
supabase db push
```

---

### 2. **Stripe Webhook Not Receiving Events**

**Check Netlify Function Logs:**
1. Go to Netlify Dashboard → Functions
2. Find `stripe-webhook` function
3. Check recent logs for:
   - `[Stripe Webhook] Event received: checkout.session.completed`
   - `[Stripe Webhook] Processing Pro plan subscription for user: <user_id>`
   - `[Stripe Webhook] Successfully upgraded user to Pro plan`

**If no logs:**
- Verify webhook endpoint is configured in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set in Netlify env variables

---

### 3. **Check Current User Plan in Database**

**Query to check your plan:**
```sql
-- Replace with your actual user email
SELECT id, email, plan, plan_status, stripe_customer_id, stripe_subscription_id, subscription_start_date, subscription_end_date, billing_period
FROM auth.users
JOIN public.users ON auth.users.id = public.users.id
WHERE auth.users.email = 'your-email@example.com';
```

**Expected for Pro users:**
- `plan` should be `'pro'`
- `plan_status` should be `'active'`
- `stripe_subscription_id` should have a value
- `subscription_end_date` should be in the future

---

### 4. **Force Update User Plan (Temporary Fix)**

If the webhook didn't fire, manually update:

```sql
-- Replace <user_id> with your actual user ID
-- Replace <subscription_id> with your Stripe subscription ID (sub_xxx)
-- Replace <customer_id> with your Stripe customer ID (cus_xxx)

UPDATE public.users
SET 
  plan = 'pro',
  plan_status = 'active',
  stripe_customer_id = '<customer_id>',
  stripe_subscription_id = '<subscription_id>',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 month',  -- Change to '1 year' if yearly
  billing_period = 'monthly',  -- Change to 'yearly' if yearly
  updated_at = NOW()
WHERE id = '<user_id>';
```

---

### 5. **Verify Billing Page Shows Updated Plan**

After fixing the database:

1. **Refresh the billing page** (may need to clear browser cache)
2. **Force reload:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Check console logs:**
   - Open DevTools → Console
   - Look for: `[Billing] User plan: pro`

---

### 6. **Stripe Webhook Configuration**

**Verify in Stripe Dashboard:**

1. Go to: **Developers** → **Webhooks**
2. Find your endpoint: `https://agiagentautomation.netlify.app/.netlify/functions/stripe-webhook`
3. Click on it and verify:
   - Status: **Enabled**
   - Events to send:
     - `checkout.session.completed` ✓
     - `customer.subscription.updated` ✓
     - `customer.subscription.deleted` ✓
     - `invoice.payment_succeeded` ✓
     - `invoice.payment_failed` ✓
4. Check "Events sent" tab for recent successful deliveries

**If webhook is failing:**
- Click on failed event to see error details
- Verify signing secret matches `STRIPE_WEBHOOK_SECRET` in Netlify

---

### 7. **Test Webhook Manually**

Use Stripe CLI to test the webhook:

```bash
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Send test event
stripe trigger checkout.session.completed --override metadata:plan=pro --override metadata:userId=<your_user_id> --override metadata:billingPeriod=monthly
```

---

### 8. **Check Netlify Environment Variables**

Ensure these are set in **Netlify Dashboard → Site settings → Environment variables:**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Quick Fix Steps

### Option A: Re-trigger Webhook (Recommended)

1. Go to Stripe Dashboard → **Payments** → **Subscriptions**
2. Find your Pro subscription
3. Click on it
4. Scroll to **Events and logs**
5. Find the `checkout.session.completed` event
6. Click **Resend**

This will re-trigger the webhook and update your database.

---

### Option B: Manual Database Update

If webhook is not working, manually update your plan:

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Update plan (replace <user_id>)
UPDATE public.users
SET 
  plan = 'pro',
  plan_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 month',
  billing_period = 'monthly',
  updated_at = NOW()
WHERE id = '<user_id>';

-- Verify
SELECT plan, plan_status FROM public.users WHERE id = '<user_id>';
```

Then **refresh your billing page** and the limits should update to 2.5M per LLM.

---

## Expected Behavior After Fix

### Billing Page Should Show:

**Free Tier:**
- Total limit: 1M tokens
- Per LLM: 250k tokens each

**Pro Plan:**
- Total limit: 10M tokens
- Per LLM: 2.5M tokens each
- Price: $20/month

---

## Still Not Working?

If none of the above works:

1. **Check browser console** for any JavaScript errors
2. **Clear browser cache** completely
3. **Try incognito/private mode**
4. **Check Netlify deploy logs** for any build errors
5. **Verify the latest code is deployed** (check git commit hash)

---

## Contact Support

If issue persists, provide:
- Stripe Subscription ID: `sub_xxx`
- Stripe Customer ID: `cus_xxx`
- User email
- Screenshot of Stripe webhook delivery status
- Screenshot of billing page showing incorrect limits

