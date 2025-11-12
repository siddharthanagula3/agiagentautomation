# ⚠️ Fixes Required - Supabase & Stripe

## 🔍 Verification Results Summary

### ✅ What's Working:
- ✅ Stripe webhook correctly configured
- ✅ All 5 required webhook events enabled
- ✅ Supabase connection working
- ✅ Pro plan exists with correct monthly price ($29)

### ❌ Issues Found:

## 1. Supabase: Missing Migrations

The following migrations need to be applied to your Supabase database:

### Missing Tables:
- ❌ `user_shortcuts` - Custom prompt shortcuts
- ❌ `public_artifacts` - Artifact gallery  
- ❌ `token_transactions` - Token transaction audit trail

### Missing Columns:
- ❌ `users.token_balance` - User token balance
- ❌ `users.subscription_start_date` - Subscription start date

### Pricing Update Needed:
- ⚠️ Pro plan yearly price: $290 (should be $299.88)

## 2. Stripe: Using Test Keys

- ⚠️ Currently using: `sk_test_...` (TEST mode)
- ✅ Should use: `sk_live_...` (LIVE mode for production)

## 🔧 How to Fix

### Step 1: Apply Supabase Migrations

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **AGI Automation LLC**
3. Navigate to **SQL Editor**
4. Copy and paste each migration file content in order:

**Migration 1**: `supabase/migrations/20250111000001_add_user_shortcuts_table.sql`
**Migration 2**: `supabase/migrations/20250111000002_add_public_artifacts_table.sql`
**Migration 3**: `supabase/migrations/20250111000003_add_token_system.sql`
**Migration 4**: `supabase/migrations/20250111000004_add_subscription_start_date.sql`
**Migration 5**: `supabase/migrations/20250112000001_update_pro_pricing.sql`

5. Click "Run" for each migration
6. Verify success message appears

**Option B: Via Supabase CLI** (if you have it configured)

```bash
supabase db push
```

### Step 2: Update Stripe Keys to LIVE

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to LIVE mode** (top right switch)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)
5. Go to **Netlify Dashboard** → **Site Settings** → **Environment Variables**
6. Update:
   - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - `STRIPE_SECRET_KEY` = `sk_live_...`
7. **Redeploy** your site

### Step 3: Verify Everything

After applying fixes, run:

```bash
npx tsx scripts/verify-supabase-stripe.ts
```

Should show all ✅ green checks.

## 📋 Quick Checklist

- [ ] Applied all 5 Supabase migrations
- [ ] Verified `user_shortcuts` table exists
- [ ] Verified `public_artifacts` table exists
- [ ] Verified `token_transactions` table exists
- [ ] Verified `users.token_balance` column exists
- [ ] Verified `users.subscription_start_date` column exists
- [ ] Verified Pro plan yearly price = $299.88
- [ ] Updated Stripe keys to LIVE in Netlify
- [ ] Redeployed site
- [ ] Re-ran verification script

## 🎯 Expected Results After Fixes

✅ All tables exist
✅ All columns exist
✅ Pro plan pricing: $29/month, $299.88/year
✅ Stripe using LIVE keys
✅ Webhook configured correctly
✅ Ready for production

## 📝 Notes

- The webhook is already correctly configured
- All code changes are complete
- Once migrations are applied and LIVE keys are set, everything will be production-ready
- Test with a small real payment after switching to LIVE keys

