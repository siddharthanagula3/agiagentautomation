# 🚀 Quick Setup Commands

Copy and run these commands in order to set up Stripe and Supabase:

## 1. Install CLI Tools (if not already installed)

### Windows PowerShell:
```powershell
# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Install Stripe CLI
scoop install stripe
```

### macOS/Linux:
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install Stripe CLI
brew install stripe/stripe-cli/stripe
```

---

## 2. Connect to Supabase

```bash
# Login to Supabase
supabase login

# Link to your project (replace YOUR_PROJECT_ID with your actual project ID)
# Find it in: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
supabase link --project-ref YOUR_PROJECT_ID

# Apply the Pro plan migration
supabase db push
```

**Expected output:**
```
Applying migration 20250110000000_add_pro_plan_support.sql...
Migration applied successfully!
```

---

## 3. Verify Database Changes

```bash
# Check if plan columns were added
supabase db execute --query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%plan%' OR column_name LIKE '%stripe%' OR column_name LIKE '%subscription%';"
```

**You should see:**
- plan (text)
- plan_status (text)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- subscription_start_date (timestamp with time zone)
- subscription_end_date (timestamp with time zone)
- billing_period (text)

---

## 4. Connect to Stripe

```bash
# Login to Stripe
stripe login
```

This will open your browser - log in with your Stripe account.

---

## 5. Start Local Development with Webhook Testing

### Terminal 1 - Start Stripe Webhook Listener:
```bash
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

**Copy the webhook signing secret** from the output:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Terminal 2 - Add Webhook Secret to .env:
Create or update `.env` file:
```env
# Add the webhook secret from Terminal 1
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Add your Stripe keys from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### Terminal 2 - Start Netlify Dev Server:
```bash
netlify dev
```

---

## 6. Test the Pro Plan Upgrade

1. Open http://localhost:8888
2. Sign in with your account
3. Go to http://localhost:8888/billing
4. Click "Upgrade to Pro - $20/month"
5. Use test card: `4242 4242 4242 4242`
6. Complete payment

**Watch Terminal 1** for webhook events:
```
[Stripe Webhook] Event received: checkout.session.completed
[Stripe Webhook] Processing Pro plan subscription for user: xxx
[Stripe Webhook] Successfully upgraded user to Pro plan
```

---

## 7. Verify Upgrade in Database

```bash
# Check user's plan
supabase db execute --query "SELECT id, email, plan, plan_status, stripe_customer_id FROM users WHERE plan = 'pro';"
```

---

## 8. Test Token Limit Functions

```bash
# Get your user ID first
supabase db execute --query "SELECT id, email, plan FROM users WHERE email = 'your-email@example.com';"

# Check token stats (replace USER_ID_HERE)
supabase db execute --query "SELECT * FROM get_user_token_stats('USER_ID_HERE');"
```

---

## 9. Setup Production Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter webhook URL: `https://agiagentautomation.netlify.app/.netlify/functions/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret**

### Add to Netlify:
```bash
# Option 1: Using Netlify CLI
netlify env:set STRIPE_WEBHOOK_SECRET whsec_your_production_secret

# Option 2: Manually in Netlify Dashboard
# Go to: Site settings → Environment variables → Add variable
# Name: STRIPE_WEBHOOK_SECRET
# Value: whsec_your_production_secret
```

---

## 🎯 Quick Test Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Stripe CLI installed and logged in  
- [ ] Database migration applied (run `supabase db push`)
- [ ] Webhook listener running in Terminal 1
- [ ] Netlify dev server running in Terminal 2
- [ ] Test payment completed successfully
- [ ] User plan shows as 'pro' in database
- [ ] Token limits updated to 2.5M per LLM

---

## 🐛 Common Issues

### "Migration already applied"
**Solution:** This is fine! The migration is idempotent.

### "Webhook signature verification failed"
**Solution:** Make sure the `STRIPE_WEBHOOK_SECRET` in `.env` matches the output from `stripe listen`

### "Cannot connect to Supabase"
**Solution:** 
```bash
supabase logout
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

---

## 📝 What You Need

Before starting, have these ready:

1. **Supabase Project ID**
   - From: https://supabase.com/dashboard
   - Format: `abcdefghijklmnop`

2. **Stripe API Keys**
   - From: https://dashboard.stripe.com/test/apikeys
   - `sk_test_...` (Secret key)
   - `pk_test_...` (Publishable key)

3. **Your Supabase Anon Key**
   - From: Settings → API → Project API keys
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Your Supabase Service Role Key** 
   - From: Settings → API → Project API keys → service_role
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ✅ Success!

If everything is set up correctly, you should be able to:
- Upgrade to Pro plan from billing page
- See webhook events in Terminal 1
- Verify plan upgrade in database
- See 2.5M token limits per LLM instead of 250k

For detailed explanations, see `STRIPE_SUPABASE_SETUP.md`

Happy testing! 🎉

