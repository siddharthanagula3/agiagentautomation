-- Add token balance system for token pack purchases
-- Migration: 20250111000003_add_token_system.sql

-- Add token_balance column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'token_balance'
  ) THEN
    ALTER TABLE public.users ADD COLUMN token_balance BIGINT DEFAULT 0 NOT NULL;
    ALTER TABLE public.users ADD CONSTRAINT users_token_balance_non_negative CHECK (token_balance >= 0);
  END IF;
END $$;

-- Create token_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  tokens BIGINT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),

  -- Balance tracking
  previous_balance BIGINT NOT NULL DEFAULT 0,
  new_balance BIGINT NOT NULL,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT token_transactions_type_valid CHECK (
    transaction_type IN ('purchase', 'usage', 'refund', 'adjustment', 'bonus', 'subscription_grant')
  ),
  CONSTRAINT token_transactions_new_balance_non_negative CHECK (new_balance >= 0)
);

-- Add indexes for better query performance
CREATE INDEX idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_type ON public.token_transactions(transaction_type);
CREATE INDEX idx_token_transactions_transaction_id ON public.token_transactions(transaction_id);

-- Composite index for user transaction history
CREATE INDEX idx_token_transactions_user_created ON public.token_transactions(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own transaction history
CREATE POLICY "Users can view their own token transactions"
  ON public.token_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system (service role) can insert/update/delete transactions
-- No INSERT/UPDATE/DELETE policies for regular users - transactions are system-controlled

-- Create function to safely update token balance (prevents race conditions)
CREATE OR REPLACE FUNCTION update_user_token_balance(
  p_user_id UUID,
  p_tokens BIGINT,
  p_transaction_type VARCHAR(50),
  p_transaction_id VARCHAR(255) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BIGINT AS $$
DECLARE
  v_current_balance BIGINT;
  v_new_balance BIGINT;
BEGIN
  -- Lock the user row to prevent race conditions
  SELECT token_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_tokens;

  -- Ensure balance doesn't go negative
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient token balance. Current: %, Requested: %', v_current_balance, -p_tokens;
  END IF;

  -- Update user balance
  UPDATE public.users
  SET token_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.token_transactions (
    user_id,
    tokens,
    transaction_type,
    transaction_id,
    previous_balance,
    new_balance,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_tokens,
    p_transaction_type,
    p_transaction_id,
    v_current_balance,
    v_new_balance,
    p_description,
    p_metadata,
    NOW()
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user token balance
CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT token_balance INTO v_balance
  FROM public.users
  WHERE id = p_user_id;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user transaction history
CREATE OR REPLACE FUNCTION get_user_transaction_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tokens BIGINT,
  transaction_type VARCHAR(50),
  transaction_id VARCHAR(255),
  previous_balance BIGINT,
  new_balance BIGINT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.tokens,
    t.transaction_type,
    t.transaction_id,
    t.previous_balance,
    t.new_balance,
    t.description,
    t.metadata,
    t.created_at
  FROM public.token_transactions t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.token_transactions IS 'Audit trail for all token balance changes (purchases, usage, refunds, adjustments)';
COMMENT ON COLUMN public.users.token_balance IS 'Current token balance for the user';
COMMENT ON FUNCTION update_user_token_balance IS 'Safely updates user token balance with automatic transaction logging and race condition prevention';
COMMENT ON FUNCTION get_user_token_balance IS 'Returns the current token balance for a user';
COMMENT ON FUNCTION get_user_transaction_history IS 'Returns paginated transaction history for a user';
