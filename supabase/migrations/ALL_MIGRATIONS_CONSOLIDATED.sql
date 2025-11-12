-- ============================================================================
-- ALL SUPABASE MIGRATIONS - CONSOLIDATED
-- Apply this entire file in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: User Shortcuts Table
-- ============================================================================
-- Create user_shortcuts table for storing custom prompt shortcuts
-- Migration: 20250111000001_add_user_shortcuts_table.sql

CREATE TABLE IF NOT EXISTS public.user_shortcuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT user_shortcuts_label_not_empty CHECK (char_length(trim(label)) > 0),
  CONSTRAINT user_shortcuts_prompt_not_empty CHECK (char_length(trim(prompt)) > 0),
  CONSTRAINT user_shortcuts_category_valid CHECK (
    category IN ('coding', 'writing', 'business', 'creative', 'analysis', 'general')
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_shortcuts_user_id ON public.user_shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shortcuts_category ON public.user_shortcuts(category);
CREATE INDEX IF NOT EXISTS idx_user_shortcuts_created_at ON public.user_shortcuts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_shortcuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own shortcuts
DROP POLICY IF EXISTS "Users can view their own shortcuts" ON public.user_shortcuts;
CREATE POLICY "Users can view their own shortcuts"
  ON public.user_shortcuts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own shortcuts" ON public.user_shortcuts;
CREATE POLICY "Users can create their own shortcuts"
  ON public.user_shortcuts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own shortcuts" ON public.user_shortcuts;
CREATE POLICY "Users can update their own shortcuts"
  ON public.user_shortcuts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own shortcuts" ON public.user_shortcuts;
CREATE POLICY "Users can delete their own shortcuts"
  ON public.user_shortcuts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_shortcuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_shortcuts_updated_at_trigger ON public.user_shortcuts;
CREATE TRIGGER user_shortcuts_updated_at_trigger
  BEFORE UPDATE ON public.user_shortcuts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_shortcuts_updated_at();

-- ============================================================================
-- MIGRATION 2: Public Artifacts Table
-- ============================================================================
-- Create public_artifacts table for community artifact showcase
-- Migration: 20250111000002_add_public_artifacts_table.sql

CREATE TABLE IF NOT EXISTS public.public_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Artifact details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_name VARCHAR(100),

  -- Engagement metrics
  views INTEGER DEFAULT 0 NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  shares INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Status
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,

  -- Constraints
  CONSTRAINT public_artifacts_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT public_artifacts_content_not_empty CHECK (char_length(trim(content)) > 0),
  CONSTRAINT public_artifacts_type_valid CHECK (
    type IN ('html', 'react', 'svg', 'mermaid', 'markdown', 'code', 'document')
  ),
  CONSTRAINT public_artifacts_views_non_negative CHECK (views >= 0),
  CONSTRAINT public_artifacts_likes_non_negative CHECK (likes >= 0),
  CONSTRAINT public_artifacts_shares_non_negative CHECK (shares >= 0)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_public_artifacts_user_id ON public.public_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_public_artifacts_type ON public.public_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_public_artifacts_created_at ON public.public_artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_artifacts_views ON public.public_artifacts(views DESC);
CREATE INDEX IF NOT EXISTS idx_public_artifacts_likes ON public.public_artifacts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_public_artifacts_is_featured ON public.public_artifacts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_public_artifacts_is_public ON public.public_artifacts(is_public) WHERE is_public = TRUE;

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_public_artifacts_search ON public.public_artifacts
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Tags search index
CREATE INDEX IF NOT EXISTS idx_public_artifacts_tags ON public.public_artifacts USING gin(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE public.public_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public artifacts can be viewed by anyone, but only owners can modify
DROP POLICY IF EXISTS "Anyone can view public artifacts" ON public.public_artifacts;
CREATE POLICY "Anyone can view public artifacts"
  ON public.public_artifacts
  FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can view their own artifacts" ON public.public_artifacts;
CREATE POLICY "Users can view their own artifacts"
  ON public.public_artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own artifacts" ON public.public_artifacts;
CREATE POLICY "Users can create their own artifacts"
  ON public.public_artifacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own artifacts" ON public.public_artifacts;
CREATE POLICY "Users can update their own artifacts"
  ON public.public_artifacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own artifacts" ON public.public_artifacts;
CREATE POLICY "Users can delete their own artifacts"
  ON public.public_artifacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_public_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS public_artifacts_updated_at_trigger ON public.public_artifacts;
CREATE TRIGGER public_artifacts_updated_at_trigger
  BEFORE UPDATE ON public.public_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_public_artifacts_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_artifact_views(artifact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.public_artifacts
  SET views = views + 1
  WHERE id = artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment like count
CREATE OR REPLACE FUNCTION increment_artifact_likes(artifact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.public_artifacts
  SET likes = likes + 1
  WHERE id = artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 3: Token System
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_transaction_id ON public.token_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_created ON public.token_transactions(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own transaction history
DROP POLICY IF EXISTS "Users can view their own token transactions" ON public.token_transactions;
CREATE POLICY "Users can view their own token transactions"
  ON public.token_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

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

-- ============================================================================
-- MIGRATION 4: Subscription Start Date
-- ============================================================================
-- Add missing subscription_start_date column to users table
-- Migration: 20250111000004_add_subscription_start_date.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_start_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION 5: Update Pro Plan Pricing
-- ============================================================================
-- Update Pro plan pricing to $29/month and $24.99/month if billed yearly ($299.88/year)
-- Migration: 20250112000001_update_pro_pricing.sql

UPDATE subscription_plans
SET
  price_monthly = 29.00,
  price_yearly = 299.88,  -- $24.99/month if billed yearly
  updated_at = now()
WHERE slug = 'pro';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('user_shortcuts', 'public_artifacts', 'token_transactions');
  
  IF table_count < 3 THEN
    RAISE NOTICE '⚠️  Some tables may be missing. Expected 3, found %', table_count;
  ELSE
    RAISE NOTICE '✅ All tables created successfully';
  END IF;
END $$;

-- Verify Pro plan pricing
DO $$
DECLARE
  pro_plan RECORD;
BEGIN
  SELECT price_monthly, price_yearly INTO pro_plan
  FROM subscription_plans
  WHERE slug = 'pro';
  
  IF pro_plan.price_monthly = 29.00 AND pro_plan.price_yearly = 299.88 THEN
    RAISE NOTICE '✅ Pro plan pricing updated correctly: $29/month, $299.88/year';
  ELSE
    RAISE NOTICE '⚠️  Pro plan pricing: $%/month, $%/year (expected: $29/month, $299.88/year)', 
      pro_plan.price_monthly, pro_plan.price_yearly;
  END IF;
END $$;

-- ============================================================================
-- MIGRATIONS COMPLETE
-- ============================================================================
