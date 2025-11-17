-- ================================================================
-- Token Usage RPC Function Migration
-- ================================================================
-- Creates atomic increment function for token usage tracking
-- Fixes Bug #2: Missing RPC Function - increment_token_usage
-- Prevents race conditions when updating token usage
-- ================================================================

-- ================================================================
-- INCREMENT TOKEN USAGE RPC
-- ================================================================
-- Atomically increments token usage for a user subscription
-- This prevents race conditions that can occur with read-modify-write patterns

CREATE OR REPLACE FUNCTION public.increment_token_usage(
  p_user_id UUID,
  p_tokens_used INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Atomic update using PostgreSQL's native increment
  -- This is safe from race conditions unlike read-then-update
  UPDATE public.user_subscriptions
  SET
    used_tokens = used_tokens + p_tokens_used,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no row was updated, log a warning (subscription doesn't exist)
  IF NOT FOUND THEN
    RAISE WARNING 'No subscription found for user_id: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PERMISSIONS
-- ================================================================
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_token_usage(UUID, INTEGER) TO authenticated;

-- ================================================================
-- COMMENTS
-- ================================================================
COMMENT ON FUNCTION public.increment_token_usage IS
  'Atomically increments token usage for a user subscription to prevent race conditions. Called from workforce-database.ts updateSubscriptionUsage()';
