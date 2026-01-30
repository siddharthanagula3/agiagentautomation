-- =====================================================
-- Fix INSERT Policies Migration
-- =====================================================
-- Migration: 20260130000002_fix_insert_policies.sql
-- Description: Fix INSERT policies that use WITH CHECK (true)
-- Risk Level: MEDIUM - Changes who can insert data
-- Rollback: See ROLLBACK section at end
-- =====================================================

-- =====================================================
-- 1. Fix: vibe_agent_actions - Only service role should insert
-- =====================================================
DROP POLICY IF EXISTS "Service role can insert agent actions" ON public.vibe_agent_actions;

-- Service role bypasses RLS, so this policy effectively blocks authenticated users from inserting
CREATE POLICY "Backend only can insert agent actions"
  ON public.vibe_agent_actions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 2. Fix: user_token_balances - Only service role should insert
-- =====================================================
DROP POLICY IF EXISTS "Service role can insert token balances" ON public.user_token_balances;

-- Authenticated users should not create their own token balance records
-- This is done by the backend via get_or_create_token_balance() function
CREATE POLICY "Backend only can insert token balances"
  ON public.user_token_balances
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Add comments for documentation
-- =====================================================
COMMENT ON POLICY "Backend only can insert agent actions" ON public.vibe_agent_actions
  IS 'RLS: Only backend (service_role) can insert agent actions - prevents client manipulation';

COMMENT ON POLICY "Backend only can insert token balances" ON public.user_token_balances
  IS 'RLS: Only backend (service_role) can insert token balances - prevents balance manipulation';

-- =====================================================
-- ROLLBACK SECTION
-- To rollback, run these commands:
-- =====================================================
-- DROP POLICY IF EXISTS "Backend only can insert agent actions" ON public.vibe_agent_actions;
-- CREATE POLICY "Service role can insert agent actions"
--   ON public.vibe_agent_actions FOR INSERT
--   WITH CHECK (true);
--
-- DROP POLICY IF EXISTS "Backend only can insert token balances" ON public.user_token_balances;
-- CREATE POLICY "Service role can insert token balances"
--   ON public.user_token_balances FOR INSERT
--   WITH CHECK (true);
