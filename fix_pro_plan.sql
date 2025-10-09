-- =====================================================
-- FIX PRO PLAN TOKEN LIMITS
-- =====================================================
-- Run this script in Supabase SQL Editor to:
-- 1. Check if migration was applied
-- 2. Check current user plan
-- 3. Manually upgrade to Pro if needed
-- =====================================================

-- STEP 1: Check if plan columns exist
-- =====================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('plan', 'plan_status', 'stripe_customer_id', 'stripe_subscription_id', 'subscription_start_date', 'subscription_end_date', 'billing_period')
ORDER BY column_name;

-- Expected: 7 rows showing all plan-related columns
-- If no rows returned, the migration was not applied!


-- STEP 2: Check your current plan
-- =====================================================
-- Replace 'your-email@example.com' with your actual email

SELECT 
  u.id as user_id,
  au.email,
  u.plan,
  u.plan_status,
  u.stripe_customer_id,
  u.stripe_subscription_id,
  u.subscription_start_date,
  u.subscription_end_date,
  u.billing_period,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your-email@example.com';

-- Expected for Pro users:
-- plan: 'pro'
-- plan_status: 'active'
-- stripe_subscription_id: 'sub_xxx' (not null)


-- STEP 3: Check token usage stats
-- =====================================================
-- Replace '<your-user-id>' with your user ID from STEP 2

SELECT * FROM public.get_user_token_stats('<your-user-id>');

-- Expected for Pro plan:
-- token_limit should be 2500000 (2.5M) for each provider


-- STEP 4: Manual Pro Plan Upgrade (if webhook failed)
-- =====================================================
-- IMPORTANT: Only run this if:
-- 1. You successfully paid for Pro
-- 2. The webhook didn't update your plan
-- 3. You have your Stripe subscription ID

-- Replace these values:
-- <your-user-id>: From STEP 2
-- <stripe-customer-id>: From Stripe Dashboard (cus_xxx)
-- <stripe-subscription-id>: From Stripe Dashboard (sub_xxx)
-- <billing-period>: 'monthly' or 'yearly'

UPDATE public.users
SET 
  plan = 'pro',
  plan_status = 'active',
  stripe_customer_id = '<stripe-customer-id>',
  stripe_subscription_id = '<stripe-subscription-id>',
  subscription_start_date = NOW(),
  subscription_end_date = CASE 
    WHEN '<billing-period>' = 'yearly' THEN NOW() + INTERVAL '1 year'
    ELSE NOW() + INTERVAL '1 month'
  END,
  billing_period = '<billing-period>',
  updated_at = NOW()
WHERE id = '<your-user-id>';

-- Verify the update
SELECT plan, plan_status, subscription_end_date 
FROM public.users 
WHERE id = '<your-user-id>';


-- STEP 5: Verify token limits after upgrade
-- =====================================================
SELECT * FROM public.get_user_token_stats('<your-user-id>');

-- Expected for Pro plan:
-- plan: 'pro'
-- token_limit: 2500000 for each provider (OpenAI, Anthropic, Google, Perplexity)


-- STEP 6: Check recent token usage
-- =====================================================
SELECT 
  provider,
  model,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost) as total_cost,
  COUNT(*) as requests,
  DATE(created_at) as date
FROM public.token_usage
WHERE user_id = '<your-user-id>'
  AND created_at >= date_trunc('month', NOW())
GROUP BY provider, model, DATE(created_at)
ORDER BY date DESC, provider;


-- TROUBLESHOOTING
-- =====================================================

-- If plan column doesn't exist, apply migration:
-- Run this in your terminal:
-- supabase db push

-- If you need to find your Stripe IDs:
-- 1. Go to Stripe Dashboard → Customers
-- 2. Search for your email
-- 3. Click on your customer record
-- 4. Copy the Customer ID (cus_xxx)
-- 5. Go to Subscriptions tab
-- 6. Copy the Subscription ID (sub_xxx)

-- After updating, refresh your browser cache:
-- Windows/Linux: Ctrl + Shift + R
-- Mac: Cmd + Shift + R

