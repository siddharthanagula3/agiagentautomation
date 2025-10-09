-- =====================================================
-- ADD PRO PLAN SUPPORT TO USERS TABLE
-- =====================================================
-- This migration adds subscription plan support for the Pro plan
-- Free tier: 1M tokens (250k per LLM)
-- Pro tier: 10M tokens (2.5M per LLM) - $20/month
-- =====================================================

-- Add plan-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' 
  CHECK (plan IN ('free', 'pro', 'enterprise'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active' 
  CHECK (plan_status IN ('active', 'cancelled', 'past_due', 'unpaid'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly' 
  CHECK (billing_period IN ('monthly', 'yearly'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
  ON public.users(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id 
  ON public.users(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_users_plan 
  ON public.users(plan);

-- Add comment for documentation
COMMENT ON COLUMN public.users.plan IS 'Subscription plan: free (1M tokens), pro (10M tokens), enterprise (custom)';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.users.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';

-- =====================================================
-- TOKEN LIMIT ENFORCEMENT FUNCTION
-- =====================================================
-- Function to check if user has exceeded token limit
CREATE OR REPLACE FUNCTION public.check_token_limit(
  p_user_id UUID,
  p_provider TEXT,
  p_tokens_to_use INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_plan TEXT;
  v_provider_limit INTEGER;
  v_total_limit INTEGER;
  v_current_provider_usage INTEGER;
  v_current_total_usage INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_user_plan
  FROM public.users
  WHERE id = p_user_id;

  -- Set limits based on plan
  IF v_user_plan = 'pro' THEN
    v_provider_limit := 2500000; -- 2.5M per provider
    v_total_limit := 10000000;   -- 10M total
  ELSIF v_user_plan = 'enterprise' THEN
    v_provider_limit := 999999999; -- Unlimited
    v_total_limit := 999999999;
  ELSE
    v_provider_limit := 250000;  -- 250k per provider (free)
    v_total_limit := 1000000;    -- 1M total (free)
  END IF;

  -- Get current month's usage for this provider
  SELECT COALESCE(SUM(total_tokens), 0)
  INTO v_current_provider_usage
  FROM public.token_usage
  WHERE user_id = p_user_id
    AND provider = p_provider
    AND created_at >= date_trunc('month', NOW());

  -- Get current month's total usage across all providers
  SELECT COALESCE(SUM(total_tokens), 0)
  INTO v_current_total_usage
  FROM public.token_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW());

  -- Check if adding new tokens would exceed limits
  IF (v_current_provider_usage + p_tokens_to_use > v_provider_limit) OR
     (v_current_total_usage + p_tokens_to_use > v_total_limit) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET USER TOKEN STATS FUNCTION
-- =====================================================
-- Function to get user's token usage stats for current month
CREATE OR REPLACE FUNCTION public.get_user_token_stats(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  provider TEXT,
  tokens_used INTEGER,
  token_limit INTEGER,
  percentage_used NUMERIC,
  total_cost NUMERIC
) AS $$
DECLARE
  v_user_plan TEXT;
  v_provider_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT users.plan INTO v_user_plan
  FROM public.users
  WHERE id = p_user_id;

  -- Set provider limit based on plan
  IF v_user_plan = 'pro' THEN
    v_provider_limit := 2500000;
  ELSIF v_user_plan = 'enterprise' THEN
    v_provider_limit := 999999999;
  ELSE
    v_user_plan := 'free';
    v_provider_limit := 250000;
  END IF;

  -- Return stats for each provider
  RETURN QUERY
  SELECT
    v_user_plan as plan,
    tu.provider,
    COALESCE(SUM(tu.total_tokens), 0)::INTEGER as tokens_used,
    v_provider_limit as token_limit,
    ROUND((COALESCE(SUM(tu.total_tokens), 0) * 100.0 / v_provider_limit), 2) as percentage_used,
    COALESCE(SUM(tu.total_cost), 0)::NUMERIC as total_cost
  FROM (
    SELECT 'openai' as provider
    UNION SELECT 'anthropic'
    UNION SELECT 'google'
    UNION SELECT 'perplexity'
  ) providers
  LEFT JOIN public.token_usage tu 
    ON tu.provider = providers.provider
    AND tu.user_id = p_user_id
    AND tu.created_at >= date_trunc('month', NOW())
  GROUP BY providers.provider
  ORDER BY providers.provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_token_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_token_stats(UUID) TO authenticated;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- Uncomment to test with sample plan upgrades
-- UPDATE public.users SET plan = 'pro', billing_period = 'monthly' WHERE email = 'test@example.com';

COMMENT ON FUNCTION public.check_token_limit IS 'Check if user can use more tokens based on their plan limits';
COMMENT ON FUNCTION public.get_user_token_stats IS 'Get current month token usage stats for a user across all providers';

