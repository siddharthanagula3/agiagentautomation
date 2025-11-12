# Switch Stripe from TEST to LIVE Mode

## Current Status

✅ **Webhook**: Correctly configured for production
⚠️ **Keys**: Currently using TEST keys (sk_test_...)
⚠️ **Action Required**: Switch to LIVE keys for real payments

## 🔧 Step-by-Step: Switch to LIVE Keys

### Step 1: Get LIVE Keys from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to LIVE mode** (switch in top right corner)
3. Navigate to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

### Step 2: Get Webhook Signing Secret

1. In Stripe Dashboard, go to **Webhooks**
2. Click on your production webhook:
   - URL: `https://agiagentautomation.com/.netlify/functions/stripe-webhook`
   - ID: `we_1SSSqk0atLU7AWGTGfjgmXsi`
3. In the **Signing secret** section, click **Reveal**
4. Copy the secret (starts with `whsec_...`)

### Step 3: Update Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Update or add these variables:

   **Client-side (VITE_*):**
   - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (your LIVE publishable key)

   **Server-side (no VITE_ prefix):**
   - `STRIPE_SECRET_KEY` = `sk_live_...` (your LIVE secret key)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (your webhook signing secret)

5. Click **Save**

### Step 4: Redeploy

1. Netlify will auto-deploy if you have auto-deploy enabled
2. OR manually trigger deploy: **Deploys** → **Trigger deploy** → **Deploy site**

### Step 5: Verify

After deployment:

1. **Test checkout** - Should show "LIVE MODE" instead of "TEST MODE"
2. **Check webhook** - Stripe Dashboard → Webhooks → Your endpoint → Events
3. **Run verification**: `npx tsx scripts/verify-supabase-stripe.ts`

## ⚠️ Important Notes

- **Never commit** LIVE keys to version control
- **Keep secrets secure** - only in Netlify environment variables
- **Test first** - Make a small test purchase to verify everything works
- **Monitor** - Check Stripe Dashboard for live transactions

## ✅ Success Criteria

After switching to LIVE:
- ✅ Checkout shows "LIVE MODE" (not "TEST MODE")
- ✅ Real payments are processed
- ✅ Webhook receives events
- ✅ Subscriptions are created
- ✅ Token balances update correctly

## 🆘 Troubleshooting

### Still showing TEST MODE?
- Check Netlify environment variables are updated
- Verify you redeployed after updating variables
- Clear browser cache and try again

### Webhook not receiving events?
- Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- Check webhook is enabled in Stripe Dashboard
- Check Netlify function logs for errors

### Payments not processing?
- Verify you're using LIVE keys (sk_live_..., not sk_test_...)
- Check Stripe Dashboard → Payments for transaction status
- Verify your Stripe account is activated for live mode

