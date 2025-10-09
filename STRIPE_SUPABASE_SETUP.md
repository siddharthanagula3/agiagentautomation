# 🚀 Stripe & Supabase CLI Setup Guide

This guide will help you set up Stripe and Supabase CLI for local development and testing of the Pro plan subscription system.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- A Stripe account (https://stripe.com)
- A Supabase project (https://supabase.com)

---

## 1️⃣ Install Supabase CLI

### Windows (PowerShell)
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS
```bash
brew install supabase/tap/supabase
```

### Linux
```bash
brew install supabase/tap/supabase
# or
npm install -g supabase
```

### Verify Installation
```bash
supabase --version
```

---

## 2️⃣ Connect to Supabase Project

### Login to Supabase
```bash
supabase login
```

This will open your browser. Log in with your Supabase account.

### Link to Your Project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

**To find your project ID:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Look in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

### Test Connection
```bash
supabase db pull
```

---

## 3️⃣ Run Database Migration

Apply the Pro plan migration to add necessary columns:

```bash
# Push the migration to your Supabase database
supabase db push

# Or run the specific migration file
supabase db execute --file supabase/migrations/20250110000000_add_pro_plan_support.sql
```

### Verify Migration
```bash
# Check if columns were added
supabase db execute --query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('plan', 'stripe_customer_id', 'stripe_subscription_id');"
```

You should see:
- `plan` (text)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `plan_status` (text)
- `subscription_start_date` (timestamp with time zone)
- `subscription_end_date` (timestamp with time zone)
- `billing_period` (text)

---

## 4️⃣ Install Stripe CLI

### Windows
```powershell
scoop install stripe
```

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Linux
```bash
# Download the latest release
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Verify Installation
```bash
stripe --version
```

---

## 5️⃣ Configure Stripe CLI

### Login to Stripe
```bash
stripe login
```

This will open your browser. Log in to your Stripe dashboard.

### Get Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Add to Environment Variables

Create or update your `.env` file:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY

# Supabase Keys
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Netlify URL (for webhooks)
URL=https://agiagentautomation.netlify.app
```

---

## 6️⃣ Set Up Stripe Webhooks (Local Testing)

### Start Webhook Forwarding
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Copy the Webhook Secret

Add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Start Your Netlify Dev Server
In a **new terminal**:
```bash
netlify dev
```

Now Stripe webhooks will forward to your local server!

---

## 7️⃣ Set Up Production Webhooks

### Create Webhook Endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Enter your webhook URL:
   ```
   https://agiagentautomation.netlify.app/.netlify/functions/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### Add Webhook Secret to Netlify

```bash
netlify env:set STRIPE_WEBHOOK_SECRET whsec_your_production_secret
```

Or manually in Netlify dashboard:
1. Go to your site → Site settings → Environment variables
2. Add `STRIPE_WEBHOOK_SECRET` with the production secret

---

## 8️⃣ Test the Pro Plan Upgrade

### Test Payment Flow

1. **Start local development:**
   ```bash
   # Terminal 1: Stripe webhook listener
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   
   # Terminal 2: Netlify dev server
   netlify dev
   ```

2. **Open your app:**
   ```
   http://localhost:8888
   ```

3. **Navigate to Billing:**
   ```
   http://localhost:8888/billing
   ```

4. **Click "Upgrade to Pro - $20/month"**

5. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. **Complete payment**

7. **Check webhook logs** in Terminal 1 - you should see:
   ```
   [Stripe Webhook] Event received: checkout.session.completed
   [Stripe Webhook] Processing Pro plan subscription for user: xxx
   [Stripe Webhook] Successfully upgraded user to Pro plan
   ```

8. **Verify in Supabase:**
   ```bash
   supabase db execute --query "SELECT id, email, plan, plan_status, stripe_customer_id FROM users WHERE plan = 'pro';"
   ```

---

## 9️⃣ Test Token Limit Functions

### Check Token Usage
```bash
supabase db execute --query "SELECT * FROM get_user_token_stats('YOUR_USER_ID');"
```

### Test Token Limit Check
```bash
supabase db execute --query "SELECT check_token_limit('YOUR_USER_ID', 'openai', 100000);"
```

Should return `true` if under limit, `false` if over.

---

## 🔟 Common Commands Reference

### Supabase CLI
```bash
# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Pull remote schema
supabase db pull

# Push migrations
supabase db push

# Reset local database
supabase db reset

# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View logs
supabase functions serve
```

### Stripe CLI
```bash
# Login
stripe login

# List products
stripe products list

# List customers
stripe customers list

# List subscriptions
stripe subscriptions list

# Trigger test event
stripe trigger checkout.session.completed

# Listen to webhooks
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# View logs
stripe logs tail
```

---

## 🐛 Troubleshooting

### Issue: "Webhook signature verification failed"
**Solution:** Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the one from `stripe listen` output.

### Issue: "Cannot connect to Supabase project"
**Solution:** 
```bash
supabase logout
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

### Issue: "Migration failed"
**Solution:** Check if columns already exist:
```bash
supabase db execute --query "SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"
```

### Issue: "User plan not updating"
**Solution:** Check webhook logs and ensure Netlify function is running:
```bash
netlify functions:list
netlify functions:invoke stripe-webhook --payload '{"type":"test"}'
```

---

## ✅ Verification Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Stripe CLI installed and logged in
- [ ] Database migration applied successfully
- [ ] `.env` file configured with all keys
- [ ] Webhook listener running locally
- [ ] Netlify dev server running
- [ ] Test payment completed successfully
- [ ] User plan updated in database
- [ ] Token limits working correctly

---

## 📚 Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)

---

## 🎉 Next Steps

Once everything is set up:

1. Test the Pro plan upgrade flow end-to-end
2. Verify token limits are enforced
3. Test subscription cancellation
4. Deploy to production with production Stripe keys
5. Set up production webhook endpoint in Stripe dashboard

Happy coding! 🚀

