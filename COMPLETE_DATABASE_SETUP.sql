-- ========================================
-- COMPLETE DATABASE SETUP FOR FREE HIRING
-- ========================================
-- Run this script in Supabase SQL Editor to set up the complete database
-- This includes: purchased_employees table, RLS policies, indexes, and token_usage table

-- 1. Create purchased_employees table for free AI Employee hiring
-- ========================================
DROP TABLE IF EXISTS purchased_employees CASCADE;

CREATE TABLE purchased_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, employee_id)
);

-- 2. Create indexes for performance
-- ========================================
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees (user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees (employee_id);
CREATE INDEX idx_purchased_employees_is_active ON purchased_employees (is_active);

-- 3. Enable Row Level Security
-- ========================================
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- ========================================
CREATE POLICY "Users can view their own purchased employees" ON purchased_employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased employees" ON purchased_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased employees" ON purchased_employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchased employees" ON purchased_employees
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Grant permissions
-- ========================================
GRANT ALL ON purchased_employees TO authenticated;
GRANT ALL ON purchased_employees TO service_role;

-- 6. Create token_usage table if it doesn't exist
-- ========================================
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  llm_provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create indexes for token_usage
-- ========================================
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_llm_provider ON token_usage (llm_provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage (created_at);

-- 8. Enable RLS for token_usage
-- ========================================
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for token_usage
-- ========================================
CREATE POLICY "Users can view their own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all token usage" ON token_usage
  FOR ALL USING (auth.role() = 'service_role');

-- 10. Grant permissions for token_usage
-- ========================================
GRANT ALL ON token_usage TO authenticated;
GRANT ALL ON token_usage TO service_role;

-- 11. Create function to get user token limits based on plan
-- ========================================
CREATE OR REPLACE FUNCTION get_user_token_limits(user_uuid UUID)
RETURNS TABLE (
  plan TEXT,
  total_limit BIGINT,
  per_llm_limit BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.plan, 'free')::TEXT as plan,
    CASE 
      WHEN COALESCE(u.plan, 'free') = 'max' THEN 40000000  -- 40M total
      WHEN COALESCE(u.plan, 'free') = 'pro' THEN 10000000  -- 10M total
      ELSE 1000000  -- 1M total for free
    END as total_limit,
    CASE 
      WHEN COALESCE(u.plan, 'free') = 'max' THEN 10000000  -- 10M per LLM
      WHEN COALESCE(u.plan, 'free') = 'pro' THEN 2500000   -- 2.5M per LLM
      ELSE 250000  -- 250K per LLM for free
    END as per_llm_limit
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permission on the function
-- ========================================
GRANT EXECUTE ON FUNCTION get_user_token_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_token_limits(UUID) TO service_role;

-- 13. Create function to get user token usage summary
-- ========================================
CREATE OR REPLACE FUNCTION get_user_token_usage_summary(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  llm_provider TEXT,
  total_tokens BIGINT,
  total_cost DECIMAL(10, 6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.llm_provider,
    SUM(tu.total_tokens)::BIGINT as total_tokens,
    SUM(tu.cost_usd) as total_cost
  FROM token_usage tu
  WHERE tu.user_id = user_uuid
    AND tu.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY tu.llm_provider
  ORDER BY total_tokens DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission on the function
-- ========================================
GRANT EXECUTE ON FUNCTION get_user_token_usage_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_token_usage_summary(UUID, INTEGER) TO service_role;

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- The database is now ready for:
-- 1. Free AI Employee hiring (purchased_employees table)
-- 2. Token usage tracking (token_usage table)
-- 3. Pro/Max subscription plans with proper limits
-- 4. Row Level Security for data protection
-- 5. Performance indexes for fast queries

-- Test the setup by running:
-- SELECT * FROM get_user_token_limits('your-user-id-here');
-- SELECT * FROM get_user_token_usage_summary('your-user-id-here', 30);
