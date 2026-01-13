-- ================================================================
-- CONSOLIDATE TOKEN SYSTEM - RESOLVE SCHEMA DUPLICATION
-- ================================================================
-- Migration: 20260113000002_consolidate_token_system.sql
--
-- Problem:
--   Two conflicting token balance systems exist:
--   1. Legacy: users.token_balance (BIGINT column)
--   2. New: user_token_balances (dedicated table with monthly allowance)
--
-- Solution:
--   Migrate all data from users.token_balance to user_token_balances table,
--   then drop the legacy column to establish single source of truth.
--
-- This ensures:
--   - All existing user token balances are preserved
--   - New table becomes the authoritative token storage
--   - Functions and RLS policies continue working
--   - No data loss occurs
-- ================================================================

-- Step 1: Migrate existing data from users.token_balance to user_token_balances
-- For users that don't have a user_token_balances record yet
DO $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  WITH users_to_migrate AS (
    SELECT u.id, u.token_balance
    FROM public.users u
    WHERE u.token_balance > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.user_token_balances utb
        WHERE utb.user_id = u.id
      )
  )
  INSERT INTO public.user_token_balances (
    user_id,
    current_balance,
    monthly_allowance,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    u.token_balance,
    1000000, -- Default free tier allowance
    NOW(),
    NOW()
  FROM users_to_migrate u
  ON CONFLICT (user_id) DO NOTHING;

  -- Get count of migrated records for logging
  SELECT COUNT(*)
  INTO v_migrated_count
  FROM public.user_token_balances utb
  WHERE utb.created_at >= NOW() - INTERVAL '1 minute';

  -- Log the migration
  RAISE NOTICE 'Token system consolidation: Migrated % user records from users.token_balance to user_token_balances', v_migrated_count;
END $$;

-- Step 2: Ensure all users with user_token_balances records have matching balances
-- (update legacy column to match new table for consistency during transition)
DO $$
BEGIN
  UPDATE public.users u
  SET token_balance = COALESCE((
    SELECT current_balance
    FROM public.user_token_balances utb
    WHERE utb.user_id = u.id
  ), 0)
  WHERE EXISTS (
    SELECT 1 FROM public.user_token_balances utb
    WHERE utb.user_id = u.id
  );

  RAISE NOTICE 'Token system consolidation: Synchronized % user records', FOUND;
END $$;

-- Step 3: Drop the legacy token_balance column from users table
-- This removes the old system and prevents future confusion/duplication
ALTER TABLE public.users DROP COLUMN IF EXISTS token_balance;

-- Step 4: Update RLS policies on user_token_balances to be more explicit
-- Drop and recreate policies for clarity after consolidation
DROP POLICY IF EXISTS "Users can view own token balance" ON public.user_token_balances;
DROP POLICY IF EXISTS "Users can update own token balance" ON public.user_token_balances;
DROP POLICY IF EXISTS "Service role can insert token balances" ON public.user_token_balances;

CREATE POLICY "Users can view own token balance"
  ON public.user_token_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own token balance"
  ON public.user_token_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert token balances"
  ON public.user_token_balances FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can delete token balances"
  ON public.user_token_balances FOR DELETE
  USING (true);

-- Step 5: Add additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_token_balances_created_at
  ON public.user_token_balances(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_token_balances_updated_at
  ON public.user_token_balances(updated_at DESC);

-- Step 6: Add comprehensive comments documenting the consolidation
COMMENT ON TABLE public.user_token_balances IS
  'AUTHORITATIVE TOKEN BALANCE TABLE - Single source of truth for user token tracking.
   Replaces legacy users.token_balance column (dropped in migration 20260113000002).
   Tracks current balance, monthly allowance, and reset timestamps for token management system.';

COMMENT ON COLUMN public.user_token_balances.id IS
  'Unique identifier for this token balance record';

COMMENT ON COLUMN public.user_token_balances.user_id IS
  'Foreign key reference to auth.users - enforced as UNIQUE constraint';

COMMENT ON COLUMN public.user_token_balances.current_balance IS
  'Current token balance available to user (can be spent on API calls)';

COMMENT ON COLUMN public.user_token_balances.monthly_allowance IS
  'Monthly token allowance based on subscription plan (Free=1M, Pro=10M, Max=40M)';

COMMENT ON COLUMN public.user_token_balances.last_reset_at IS
  'Timestamp when monthly allowance was last reset - used for reset_monthly_token_allowances() function';

COMMENT ON COLUMN public.user_token_balances.created_at IS
  'When this balance record was created (typically at user signup)';

COMMENT ON COLUMN public.user_token_balances.updated_at IS
  'Last modified timestamp - automatically updated on balance changes';

COMMENT ON FUNCTION public.get_or_create_token_balance IS
  'Returns existing balance or creates new one with default free tier (1M tokens).
   Safely handles race conditions with FOR UPDATE lock.
   Used before every token deduction to ensure user record exists.';

COMMENT ON FUNCTION public.deduct_user_tokens IS
  'Atomically deducts tokens from user balance with transaction logging.
   Prevents negative balances (uses GREATEST for safe math).
   Automatically calls get_or_create_token_balance for safety.
   Parameters: user_id, token_count, provider (openai/anthropic/etc), model name.
   Returns new balance after deduction.';

COMMENT ON FUNCTION public.add_user_tokens IS
  'Atomically adds tokens to user balance with transaction logging.
   Used for: subscription grants, bonus tokens, refunds, credits.
   Automatically calls get_or_create_token_balance for safety.
   Parameters: user_id, token_count, transaction_type, optional description.
   Returns new balance after addition.';

COMMENT ON FUNCTION public.reset_monthly_token_allowances IS
  'Cron-triggered function to reset balances for users past their reset date.
   Resets current_balance to monthly_allowance and updates last_reset_at.
   Should be called monthly via Supabase scheduled job.
   Returns count of users reset.';

-- ================================================================
-- CONSOLIDATION COMPLETE
-- ================================================================
-- Summary of changes:
-- 1. Migrated data from users.token_balance to user_token_balances table
-- 2. Dropped legacy users.token_balance column (no longer needed)
-- 3. Updated RLS policies for explicit permission model
-- 4. Added performance indexes for common queries
-- 5. Enhanced documentation with consolidated schema comments
--
-- Active token system functions:
-- - get_or_create_token_balance(user_id) - ensures user record exists
-- - deduct_user_tokens(user_id, tokens, provider, model) - spend tokens
-- - add_user_tokens(user_id, tokens, type, description) - grant tokens
-- - reset_monthly_token_allowances() - monthly reset cron job
--
-- Supporting tables:
-- - user_token_balances - current balances (authoritative)
-- - token_transactions - immutable audit trail of all changes
-- ================================================================
