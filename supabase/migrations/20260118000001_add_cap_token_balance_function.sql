-- ================================================================
-- ADD CAP TOKEN BALANCE FUNCTION FOR SUBSCRIPTION CANCELLATION
-- ================================================================
-- Migration: 20260118000001_add_cap_token_balance_function.sql
--
-- Purpose:
--   When a user cancels their subscription, their token balance should be
--   capped at the free tier limit (1,000,000 tokens) to prevent abuse.
--   Users who cancel with more tokens than the free tier allows should not
--   retain those excess tokens.
--
-- Security:
--   - Prevents users from stockpiling tokens before cancellation
--   - Ensures fair token usage across subscription tiers
--   - Maintains audit trail of all token capping operations
-- ================================================================

-- Add 'subscription_downgrade' as a valid transaction type
ALTER TABLE public.token_transactions
  DROP CONSTRAINT IF EXISTS token_transactions_type_valid;

ALTER TABLE public.token_transactions
  ADD CONSTRAINT token_transactions_type_valid CHECK (
    transaction_type IN (
      'purchase',
      'usage',
      'refund',
      'adjustment',
      'bonus',
      'subscription_grant',
      'subscription_downgrade',
      'chargeback'
    )
  );

-- Create function to cap user token balance at free tier limit
-- This is called when a subscription is cancelled
CREATE OR REPLACE FUNCTION cap_user_token_balance(
  p_user_id UUID,
  p_cap_amount BIGINT DEFAULT 1000000,  -- Free tier limit: 1M tokens
  p_reason TEXT DEFAULT 'Subscription cancelled - balance capped to free tier limit'
)
RETURNS TABLE(
  previous_balance BIGINT,
  new_balance BIGINT,
  tokens_removed BIGINT,
  was_capped BOOLEAN
) AS $$
DECLARE
  v_current_balance BIGINT;
  v_new_balance BIGINT;
  v_tokens_removed BIGINT;
  v_was_capped BOOLEAN;
BEGIN
  -- Ensure the user has a balance record first
  PERFORM get_or_create_token_balance(p_user_id);

  -- Lock the user's token balance row to prevent race conditions
  SELECT current_balance INTO v_current_balance
  FROM public.user_token_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record found, create one with free tier defaults
  IF NOT FOUND THEN
    INSERT INTO public.user_token_balances (
      user_id,
      current_balance,
      monthly_allowance,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_cap_amount,
      p_cap_amount,
      NOW(),
      NOW()
    )
    RETURNING user_token_balances.current_balance INTO v_current_balance;
  END IF;

  -- Determine if capping is needed
  IF v_current_balance > p_cap_amount THEN
    v_new_balance := p_cap_amount;
    v_tokens_removed := v_current_balance - p_cap_amount;
    v_was_capped := TRUE;

    -- Update the token balance
    UPDATE public.user_token_balances
    SET
      current_balance = v_new_balance,
      monthly_allowance = p_cap_amount,  -- Also update monthly allowance to free tier
      updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record the transaction for audit trail
    INSERT INTO public.token_transactions (
      user_id,
      tokens,
      transaction_type,
      previous_balance,
      new_balance,
      description,
      metadata,
      created_at
    ) VALUES (
      p_user_id,
      -v_tokens_removed,  -- Negative because tokens are being removed
      'subscription_downgrade',
      v_current_balance,
      v_new_balance,
      p_reason,
      jsonb_build_object(
        'cap_amount', p_cap_amount,
        'tokens_removed', v_tokens_removed,
        'capped_at', NOW(),
        'action', 'subscription_cancellation_cap'
      ),
      NOW()
    );
  ELSE
    -- No capping needed, but still update monthly allowance to free tier
    v_new_balance := v_current_balance;
    v_tokens_removed := 0;
    v_was_capped := FALSE;

    UPDATE public.user_token_balances
    SET
      monthly_allowance = p_cap_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_current_balance, v_new_balance, v_tokens_removed, v_was_capped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add documentation comment
COMMENT ON FUNCTION cap_user_token_balance IS
  'Caps a user''s token balance at the specified amount (default: free tier 1M tokens).
   Called during subscription cancellation to prevent token hoarding.
   Records the operation in token_transactions for audit trail.
   Returns previous_balance, new_balance, tokens_removed, and was_capped flag.
   Idempotent - safe to call multiple times.';

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Usage from Netlify Functions (stripe-webhook.ts):
--
--   const { data, error } = await supabase.rpc('cap_user_token_balance', {
--     p_user_id: userId,
--     p_cap_amount: 1000000,  // Optional, defaults to 1M
--     p_reason: 'Subscription cancelled'  // Optional
--   });
--
-- Returns:
--   { previous_balance: 5000000, new_balance: 1000000, tokens_removed: 4000000, was_capped: true }
-- ================================================================
