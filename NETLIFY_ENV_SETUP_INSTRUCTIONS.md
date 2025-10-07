# Netlify Environment Variables Setup - Missing Keys

## ✅ Already Configured
You've already added these (great job!):
- VITE_ANTHROPIC_API_KEY
- VITE_GOOGLE_API_KEY  
- VITE_JWT_SECRET
- VITE_OPENAI_API_KEY
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_URL

---

## 🔴 CRITICAL - Must Add These for Stripe Payments

### 1. STRIPE_SECRET_KEY (Backend)
**Purpose**: Allows Netlify functions to create checkout sessions and manage subscriptions

**How to get it**:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Find the **Secret key** (starts with `sk_test_`)
3. Click "Reveal test key"
4. Copy the key

**Add to Netlify**:
- Key name: `STRIPE_SECRET_KEY`
- Value: `sk_test_...` (paste your key)
- ⚠️ **Important**: Do NOT use `VITE_` prefix (this is backend-only)

---

### 2. STRIPE_WEBHOOK_SECRET
**Purpose**: Verifies webhook requests are actually from Stripe (security)

**How to get it**:
1. First, get your Netlify site URL (e.g., `https://your-app.netlify.app`)
2. Go to https://dashboard.stripe.com/test/webhooks
3. Click **"+ Add endpoint"**
4. Set **Endpoint URL** to:
   ```
   https://your-app.netlify.app/.netlify/functions/stripe-webhook
   ```
5. Under **"Select events to listen to"**, choose:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. Click **"Add endpoint"**
7. On the next page, click **"Reveal"** under "Signing secret"
8. Copy the secret (starts with `whsec_`)

**Add to Netlify**:
- Key name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_...` (paste your key)

---

### 3. SUPABASE_SERVICE_ROLE_KEY
**Purpose**: Allows webhooks to write to database (bypasses RLS for server operations)

**How to get it**:
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Scroll to **Project API keys**
4. Find **`service_role`** key (marked as "secret")
5. Click the eye icon to reveal it
6. Copy the key

**Add to Netlify**:
- Key name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJh...` (paste your service role key)
- ⚠️ **Warning**: This is a sensitive key - keep it secret!

---

## 🟡 OPTIONAL - Add if You Want Perplexity AI

### 4. VITE_PERPLEXITY_API_KEY
**Purpose**: Enables Perplexity AI employees in your marketplace

**How to get it**:
1. Go to https://www.perplexity.ai/
2. Sign up or log in
3. Navigate to Settings → API
4. Generate an API key
5. Copy the key (starts with `pplx-`)

**Add to Netlify**:
- Key name: `VITE_PERPLEXITY_API_KEY`
- Value: `pplx-...` (paste your key)

---

## 📋 Quick Checklist

Copy this checklist and check off as you add each key:

### Critical (Must Have):
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard API keys
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe webhook endpoint
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase project settings

### Optional:
- [ ] `VITE_PERPLEXITY_API_KEY` - From Perplexity settings

---

## 🧪 After Adding Keys - Test Checklist

Once you've added the keys:

1. **Trigger Netlify Redeploy**:
   - Netlify Dashboard → Deploys → Trigger deploy → Deploy site
   - Or push a small change to Git

2. **Test Stripe Payment**:
   - Go to your marketplace
   - Click "Hire Now" on any AI employee
   - Should redirect to Stripe checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry, any CVC, any ZIP

3. **Verify Webhook**:
   - After test payment, check Stripe Dashboard → Webhooks
   - Should see successful events with green checkmarks
   - Check Netlify Functions logs for webhook processing

4. **Check Database**:
   - Open Supabase → Table Editor → `purchased_employees`
   - Your test purchase should appear with:
     - `stripe_subscription_id` filled
     - `stripe_customer_id` filled
     - `is_active` = true

---

## ⚡ Quick Add Commands

For easy copy-paste, here's what you need:

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
VITE_PERPLEXITY_API_KEY=pplx_YOUR_KEY_HERE (optional)
```

---

## 🆘 Troubleshooting

### "Stripe not configured" message
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` starts with `pk_test_` or `pk_live_`
- Make sure you added it without typos

### Webhook events not working
- Verify webhook URL is exactly: `https://[your-site].netlify.app/.netlify/functions/stripe-webhook`
- Check `STRIPE_WEBHOOK_SECRET` is correct (starts with `whsec_`)
- Check Netlify function logs for errors

### Database records not created
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key, not anon key
- Check Supabase logs for permission errors
- Make sure database migration was applied

---

## 📞 Support Resources

- **Stripe Docs**: https://stripe.com/docs/keys
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Supabase API Keys**: https://supabase.com/docs/guides/api/api-keys
- **Perplexity API**: https://docs.perplexity.ai/

---

**Once you add these 3 critical keys, your Stripe integration will be fully functional! 🎉**

