-- Complete Supabase Setup Script
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING POLICIES (if any)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own billing" ON billing;
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON ai_agents;

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users table policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Jobs table policies
CREATE POLICY "Users can view their own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Billing table policies
CREATE POLICY "Users can view their own billing" ON billing FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking table policies
CREATE POLICY "Users can view their own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Activity logs table policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

-- AI agents table policies (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view agents" ON ai_agents FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 4. CREATE DATABASE FUNCTIONS
-- ============================================

-- Drop existing function first (if it exists)
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_jobs BIGINT,
  active_jobs BIGINT,
  completed_jobs BIGINT,
  total_spent DECIMAL,
  tokens_used BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.status = 'in_progress' THEN 1 END) as active_jobs,
    COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
    COALESCE(SUM(j.cost), 0) as total_spent,
    COALESCE(SUM(j.tokens_used), 0) as tokens_used
  FROM jobs j
  WHERE j.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'ai_agents', 'jobs', 'subscriptions', 'billing', 'usage_tracking', 'notifications', 'activity_logs');

-- Check if policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check if function exists
SELECT proname, proargnames, prorettype 
FROM pg_proc 
WHERE proname = 'get_user_stats';

-- ============================================
-- 6. SUCCESS MESSAGE
-- ============================================
SELECT 'Supabase setup completed successfully!' as status;
