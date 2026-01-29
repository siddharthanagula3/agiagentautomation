-- =====================================================
-- RLS Remediation Script for AGI Agent Automation
-- =====================================================
-- This script fixes all identified RLS security issues
-- Run with service_role credentials
-- Date: 2026-01-29
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: CRITICAL FIXES (Immediate)
-- =====================================================

-- =====================================================
-- 1. Fix: automation_nodes - Add RLS
-- =====================================================
ALTER TABLE public.automation_nodes ENABLE ROW LEVEL SECURITY;

-- Users can view nodes only for their own workflows
CREATE POLICY "Users can view nodes in their workflows"
  ON public.automation_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_nodes.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can insert nodes only into their workflows
CREATE POLICY "Users can create nodes in their workflows"
  ON public.automation_nodes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_nodes.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can update nodes only in their workflows
CREATE POLICY "Users can update nodes in their workflows"
  ON public.automation_nodes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_nodes.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can delete nodes only from their workflows
CREATE POLICY "Users can delete nodes in their workflows"
  ON public.automation_nodes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_nodes.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view nodes in their workflows" ON public.automation_nodes
  IS 'Ensures users can only view workflow nodes they own';

-- =====================================================
-- 2. Fix: automation_connections - Add RLS
-- =====================================================
ALTER TABLE public.automation_connections ENABLE ROW LEVEL SECURITY;

-- Users can view connections only for their workflows
CREATE POLICY "Users can view connections in their workflows"
  ON public.automation_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_connections.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can insert connections only into their workflows
CREATE POLICY "Users can create connections in their workflows"
  ON public.automation_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_connections.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can update connections only in their workflows
CREATE POLICY "Users can update connections in their workflows"
  ON public.automation_connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_connections.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can delete connections only from their workflows
CREATE POLICY "Users can delete connections in their workflows"
  ON public.automation_connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = automation_connections.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view connections in their workflows" ON public.automation_connections
  IS 'Ensures users can only view workflow connections they own';

-- =====================================================
-- 3. Fix: api_rate_limits - Add RLS
-- =====================================================
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limit records
CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert rate limit records
CREATE POLICY "Service role can create rate limit records"
  ON public.api_rate_limits
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update rate limit records
CREATE POLICY "Service role can update rate limit records"
  ON public.api_rate_limits
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can delete rate limit records
CREATE POLICY "Service role can delete rate limit records"
  ON public.api_rate_limits
  FOR DELETE
  USING (auth.role() = 'service_role');

COMMENT ON POLICY "Users can view their own rate limits" ON public.api_rate_limits
  IS 'Users can only see their own rate limit status';

-- =====================================================
-- 4. Fix: vibe_agent_actions - Fix overly permissive INSERT/UPDATE
-- =====================================================
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert agent actions" ON public.vibe_agent_actions;
DROP POLICY IF EXISTS "Service role can update agent actions" ON public.vibe_agent_actions;

-- Create secure replacement policies
CREATE POLICY "Users and service role can insert agent actions"
  ON public.vibe_agent_actions FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_actions.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users and service role can update agent actions"
  ON public.vibe_agent_actions FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_actions.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_actions.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users and service role can insert agent actions" ON public.vibe_agent_actions
  IS 'Restricts agent action creation to session owner and service role';

-- =====================================================
-- 5. Fix: message_reactions - Restrict SELECT to conversation participants
-- =====================================================
-- Note: This assumes the old table exists from multi_agent_chat migration
-- If it conflicts with the newer message_reactions (20260129), drop this
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.message_reactions;

-- Create restricted policy for message_reactions from multi_agent_conversations
CREATE POLICY "Authenticated users can view reactions on messages"
  ON public.message_reactions
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_sessions cs ON cm.session_id = cs.id
      WHERE cm.id = message_reactions.message_id
      AND cs.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Authenticated users can view reactions on messages" ON public.message_reactions
  IS 'Restricts reaction visibility to participants in the conversation';

-- =====================================================
-- PHASE 2: HIGH PRIORITY FIXES (Next Sprint)
-- =====================================================

-- =====================================================
-- 6. Add RLS: scheduled_tasks
-- =====================================================
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view only their own scheduled tasks
CREATE POLICY "Users can view their own scheduled tasks"
  ON public.scheduled_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create scheduled tasks for their workflows
CREATE POLICY "Users can create their own scheduled tasks"
  ON public.scheduled_tasks
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
      SELECT 1 FROM public.automation_workflows
      WHERE automation_workflows.id = scheduled_tasks.workflow_id
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Users can update only their own scheduled tasks
CREATE POLICY "Users can update their own scheduled tasks"
  ON public.scheduled_tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own scheduled tasks
CREATE POLICY "Users can delete their own scheduled tasks"
  ON public.scheduled_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view their own scheduled tasks" ON public.scheduled_tasks
  IS 'Users can only see their own scheduled automation tasks';

-- =====================================================
-- 7. Add RLS: resource_downloads
-- =====================================================
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view only their own downloads
CREATE POLICY "Users can view their own resource downloads"
  ON public.resource_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert download records
CREATE POLICY "Service role can log resource downloads"
  ON public.resource_downloads
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users cannot modify their download history
-- (Downloads are immutable for audit purposes)

COMMENT ON POLICY "Users can view their own resource downloads" ON public.resource_downloads
  IS 'Users can only see their own download history';

-- =====================================================
-- 8. Add RLS: help_articles (Admin-controlled content)
-- =====================================================
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read published help articles
CREATE POLICY "Everyone can read published help articles"
  ON public.help_articles
  FOR SELECT
  USING (published = true);

-- Service role can manage all articles
CREATE POLICY "Service role can manage all help articles"
  ON public.help_articles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY "Everyone can read published help articles" ON public.help_articles
  IS 'Help articles are publicly readable when published';

-- =====================================================
-- 9. Add RLS: support_categories (Admin-controlled)
-- =====================================================
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read support categories
CREATE POLICY "Everyone can read support categories"
  ON public.support_categories
  FOR SELECT
  USING (true);

-- Service role can manage categories
CREATE POLICY "Service role can manage support categories"
  ON public.support_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY "Everyone can read support categories" ON public.support_categories
  IS 'Support categories are public reference data';

-- =====================================================
-- PHASE 3: MEDIUM PRIORITY FIXES (Following Sprint)
-- =====================================================

-- =====================================================
-- 10. Add RLS: contact_submissions (PII Protection)
-- =====================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert contact submissions (no SELECT)
CREATE POLICY "Anonymous users can submit contact forms"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Service role can view and manage submissions
CREATE POLICY "Service role can manage contact submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  USING (auth.role() = 'service_role');

COMMENT ON POLICY "Anonymous users can submit contact forms" ON public.contact_submissions
  IS 'Public-facing contact form - no authentication required for submission';

-- =====================================================
-- 11. Add RLS: sales_leads (Sales Team Only)
-- =====================================================
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

-- Service role can manage all leads
CREATE POLICY "Service role can manage all sales leads"
  ON public.sales_leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can view leads assigned to them (future enhancement)
-- CREATE POLICY "Sales reps can view assigned leads"
--   ON public.sales_leads
--   FOR SELECT
--   USING (assigned_to = auth.uid() OR auth.role() = 'admin');

COMMENT ON POLICY "Service role can manage all sales leads" ON public.sales_leads
  IS 'Sales leads are managed by backend service role only';

-- =====================================================
-- 12. Add RLS: newsletter_subscribers (Compliance)
-- =====================================================
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role can manage subscribers
CREATE POLICY "Service role can manage newsletter subscribers"
  ON public.newsletter_subscribers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anonymous can subscribe (INSERT only)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

COMMENT ON POLICY "Service role can manage newsletter subscribers" ON public.newsletter_subscribers
  IS 'Email list is protected - management by service role only';

-- =====================================================
-- 13. Fix: cache_entries (System-Only)
-- =====================================================
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- Service role can manage cache
CREATE POLICY "Service role can manage cache entries"
  ON public.cache_entries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- No SELECT policy for users (internal system only)

COMMENT ON POLICY "Service role can manage cache entries" ON public.cache_entries
  IS 'Cache is system-only - no user access';

-- =====================================================
-- 14. Add RLS: blog_authors (Creator/Admin)
-- =====================================================
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- Everyone can read author profiles
CREATE POLICY "Everyone can read blog author profiles"
  ON public.blog_authors
  FOR SELECT
  USING (true);

-- Authors can update their own profiles
CREATE POLICY "Authors can update their own profiles"
  ON public.blog_authors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all author records
CREATE POLICY "Service role can manage all author profiles"
  ON public.blog_authors
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY "Authors can update their own profiles" ON public.blog_authors
  IS 'Authors can only update their own profile information';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all user-data tables have RLS enabled
-- SELECT schemaname, tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND NOT EXISTS (
--   SELECT 1 FROM pg_policies
--   WHERE pg_policies.tablename = pg_tables.tablename
-- );

-- Count RLS policies per table
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY policy_count ASC;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- If needed, rollback the entire transaction:
-- ROLLBACK;

-- =====================================================
-- VERIFICATION STEPS (Run after deployment)
-- =====================================================
-- 1. Connect as test_user_a and verify cannot see test_user_b's data
-- 2. Run RLS policy tests in CI/CD
-- 3. Check application logs for "permission denied" errors
-- 4. Monitor performance impact of RLS policies (should be minimal)
-- 5. Verify service role functions still work correctly

-- =====================================================
-- ADDITIONAL SECURITY RECOMMENDATIONS
-- =====================================================
-- 1. Add SECURITY DEFINER functions for complex RLS logic
-- 2. Implement field-level security for sensitive columns
-- 3. Add audit logging triggers for sensitive table modifications
-- 4. Set up automated RLS policy tests in your CI/CD pipeline
-- 5. Schedule quarterly RLS audits
-- 6. Document RLS architecture in your security runbook
