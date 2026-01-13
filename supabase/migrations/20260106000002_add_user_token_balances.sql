-- Create user_token_balances table for persistent token tracking
-- This table provides a dedicated token balance tracking separate from the users table
-- Migration: 20260106000002_add_user_token_balances.sql

-- Create user_token_balances table
CREATE TABLE IF NOT EXISTS user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance BIGINT NOT NULL DEFAULT 0,
  monthly_allowance BIGINT NOT NULL DEFAULT 1000000,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_token_balances_user_id ON user_token_balances(user_id);

-- Enable RLS
ALTER TABLE user_token_balances ENABLE ROW LEVEL SECURITY;

-- Users can only see their own balance
CREATE POLICY "Users can view own token balance"
  ON user_token_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own balance (for deductions)
CREATE POLICY "Users can update own token balance"
  ON user_token_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert new balances
CREATE POLICY "Service role can insert token balances"
  ON user_token_balances FOR INSERT
  WITH CHECK (true);

-- Function to get or create user token balance
CREATE OR REPLACE FUNCTION get_or_create_token_balance(p_user_id UUID)
RETURNS TABLE(current_balance BIGINT, monthly_allowance BIGINT) AS $$
DECLARE
  v_balance BIGINT;
  v_allowance BIGINT;
BEGIN
  -- Try to get existing balance
  SELECT utb.current_balance, utb.monthly_allowance
  INTO v_balance, v_allowance
  FROM user_token_balances utb
  WHERE utb.user_id = p_user_id;

  -- If not found, create with default free tier allowance
  IF NOT FOUND THEN
    INSERT INTO user_token_balances (user_id, current_balance, monthly_allowance)
    VALUES (p_user_id, 1000000, 1000000)
    RETURNING user_token_balances.current_balance, user_token_balances.monthly_allowance
    INTO v_balance, v_allowance;
  END IF;

  RETURN QUERY SELECT v_balance, v_allowance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct tokens with transaction logging
CREATE OR REPLACE FUNCTION deduct_user_tokens(
  p_user_id UUID,
  p_tokens BIGINT,
  p_provider VARCHAR(50),
  p_model VARCHAR(100)
)
RETURNS BIGINT AS $$
DECLARE
  v_new_balance BIGINT;
  v_current_balance BIGINT;
BEGIN
  -- Ensure the user has a balance record first
  PERFORM get_or_create_token_balance(p_user_id);

  -- Get current balance for transaction logging
  SELECT current_balance INTO v_current_balance
  FROM user_token_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate new balance (never go below 0)
  v_new_balance := GREATEST(0, v_current_balance - p_tokens);

  -- Update balance
  UPDATE user_token_balances
  SET
    current_balance = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the transaction in token_transactions table
  INSERT INTO token_transactions (
    user_id,
    tokens,
    transaction_type,
    previous_balance,
    new_balance,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    -p_tokens,
    'usage',
    v_current_balance,
    v_new_balance,
    p_provider || ' ' || p_model || ' API call deduction',
    jsonb_build_object('provider', p_provider, 'model', p_model, 'deducted_at', NOW())
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add tokens (for purchases, bonuses, etc.)
CREATE OR REPLACE FUNCTION add_user_tokens(
  p_user_id UUID,
  p_tokens BIGINT,
  p_transaction_type VARCHAR(50),
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_new_balance BIGINT;
  v_current_balance BIGINT;
BEGIN
  -- Ensure the user has a balance record first
  PERFORM get_or_create_token_balance(p_user_id);

  -- Get current balance for transaction logging
  SELECT current_balance INTO v_current_balance
  FROM user_token_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_tokens;

  -- Update balance
  UPDATE user_token_balances
  SET
    current_balance = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO token_transactions (
    user_id,
    tokens,
    transaction_type,
    previous_balance,
    new_balance,
    description
  )
  VALUES (
    p_user_id,
    p_tokens,
    p_transaction_type,
    v_current_balance,
    v_new_balance,
    COALESCE(p_description, p_transaction_type || ' - ' || p_tokens || ' tokens')
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly allowance (can be called by a cron job)
CREATE OR REPLACE FUNCTION reset_monthly_token_allowances()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Reset balances for users whose last reset was more than a month ago
  WITH reset_users AS (
    UPDATE user_token_balances
    SET
      current_balance = monthly_allowance,
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE last_reset_at < NOW() - INTERVAL '1 month'
    RETURNING user_id
  )
  SELECT COUNT(*) INTO v_reset_count FROM reset_users;

  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE user_token_balances IS 'Dedicated table for tracking user token balances with monthly allowances';
COMMENT ON FUNCTION get_or_create_token_balance IS 'Returns existing balance or creates a new one with default free tier allowance';
COMMENT ON FUNCTION deduct_user_tokens IS 'Safely deducts tokens from user balance with transaction logging';
COMMENT ON FUNCTION add_user_tokens IS 'Adds tokens to user balance with transaction logging';
COMMENT ON FUNCTION reset_monthly_token_allowances IS 'Resets token balances to monthly allowance for users past reset date';
