# Quick Fix Guide - Supabase & Stripe

## 🚀 Quick Steps to Fix Everything

### Part 1: Apply Supabase Migrations (5 minutes)

1. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com
   - Select project: **AGI Automation LLC**
   - Click **SQL Editor**

2. **Copy and Paste**:
   - Open file: `supabase/migrations/ALL_MIGRATIONS_CONSOLIDATED.sql`
   - Copy **ALL** the SQL content
   - Paste into Supabase SQL Editor
   - Click **Run** (or Ctrl+Enter)

3. **Verify**:
   - Should see success messages
   - Check for any errors (most should be OK if tables already exist)

### Part 2: Switch Stripe to LIVE Keys (5 minutes)

1. **Get LIVE Keys**:
   - Go to: https://dashboard.stripe.com
   - **Toggle to LIVE mode** (top right)
   - **Developers** → **API keys**
   - Copy LIVE keys:
     - `pk_live_...` (Publishable key)
     - `sk_live_...` (Secret key)

2. **Get Webhook Secret**:
   - **Webhooks** → Click on production webhook
   - Copy **Signing secret** (`whsec_...`)

3. **Update Netlify**:
   - Go to: https://app.netlify.com
   - **Site Settings** → **Environment Variables**
   - Update:
     - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
     - `STRIPE_SECRET_KEY` = `sk_live_...`
     - `STRIPE_WEBHOOK_SECRET` = `whsec_...`

4. **Redeploy**:
   - Netlify will auto-deploy, or trigger manual deploy

### Part 3: Verify Everything (2 minutes)

Run verification:
```bash
npx tsx scripts/verify-supabase-stripe.ts
```

Should show all ✅ green checks!

## ✅ Expected Results

After fixes:
- ✅ All Supabase tables exist
- ✅ All columns exist
- ✅ Pro plan pricing: $29/month, $299.88/year
- ✅ Stripe using LIVE keys
- ✅ Webhook configured correctly
- ✅ Ready for production

## 📝 Files Created

- `supabase/migrations/ALL_MIGRATIONS_CONSOLIDATED.sql` - All migrations in one file
- `docs/operations/APPLY_MIGRATIONS_GUIDE.md` - Detailed migration guide
- `docs/operations/STRIPE_LIVE_SETUP.md` - Stripe LIVE setup guide
- `scripts/verify-supabase-stripe.ts` - Verification script

