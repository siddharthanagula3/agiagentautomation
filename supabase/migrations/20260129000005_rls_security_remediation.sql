-- =====================================================
-- RLS Security Remediation Migration
-- =====================================================
-- Migration: 20260129000005_rls_security_remediation.sql
-- Description: Critical security fixes for tables missing RLS
-- Risk Level: CRITICAL - Fixes cross-user data access vulnerabilities
-- Rollback: See ROLLBACK section at end
-- =====================================================

-- =====================================================
-- PHASE 1: CRITICAL FIXES (automation_nodes, connections, api_rate_limits)
-- =====================================================

-- 1. Fix: automation_nodes - Enable RLS and add policies
ALTER TABLE IF EXISTS public.automation_nodes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view nodes in their workflows" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can create nodes in their workflows" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can update nodes in their workflows" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can delete nodes in their workflows" ON public.automation_nodes;

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

-- =====================================================
-- 2. Fix: automation_connections - Enable RLS and add policies
-- =====================================================
ALTER TABLE IF EXISTS public.automation_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view connections in their workflows" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can create connections in their workflows" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can update connections in their workflows" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can delete connections in their workflows" ON public.automation_connections;

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

-- =====================================================
-- 3. Fix: api_rate_limits - Enable RLS and add policies
-- =====================================================
ALTER TABLE IF EXISTS public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can create rate limit records" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can update rate limit records" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can delete rate limit records" ON public.api_rate_limits;

CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create rate limit records"
  ON public.api_rate_limits
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update rate limit records"
  ON public.api_rate_limits
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete rate limit records"
  ON public.api_rate_limits
  FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- 4. Fix: vibe_agent_actions - Fix overly permissive INSERT/UPDATE
-- =====================================================
DROP POLICY IF EXISTS "Service role can insert agent actions" ON public.vibe_agent_actions;
DROP POLICY IF EXISTS "Service role can update agent actions" ON public.vibe_agent_actions;
DROP POLICY IF EXISTS "Users and service role can insert agent actions" ON public.vibe_agent_actions;
DROP POLICY IF EXISTS "Users and service role can update agent actions" ON public.vibe_agent_actions;

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

-- =====================================================
-- PHASE 2: HIGH PRIORITY FIXES
-- =====================================================

-- 5. Fix: scheduled_tasks - Enable RLS
ALTER TABLE IF EXISTS public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scheduled tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can create their own scheduled tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can update their own scheduled tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can delete their own scheduled tasks" ON public.scheduled_tasks;

CREATE POLICY "Users can view their own scheduled tasks"
  ON public.scheduled_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update their own scheduled tasks"
  ON public.scheduled_tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tasks"
  ON public.scheduled_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. Fix: resource_downloads - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.resource_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resource downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Service role can log resource downloads" ON public.resource_downloads;

CREATE POLICY "Users can view their own resource downloads"
  ON public.resource_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can log resource downloads"
  ON public.resource_downloads
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. Fix: help_articles - Enable RLS (Admin-controlled)
-- =====================================================
ALTER TABLE IF EXISTS public.help_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read published help articles" ON public.help_articles;
DROP POLICY IF EXISTS "Service role can manage all help articles" ON public.help_articles;

CREATE POLICY "Everyone can read published help articles"
  ON public.help_articles
  FOR SELECT
  USING (published = true);

CREATE POLICY "Service role can manage all help articles"
  ON public.help_articles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. Fix: support_categories - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.support_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read support categories" ON public.support_categories;
DROP POLICY IF EXISTS "Service role can manage support categories" ON public.support_categories;

CREATE POLICY "Everyone can read support categories"
  ON public.support_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage support categories"
  ON public.support_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PHASE 3: MEDIUM PRIORITY FIXES
-- =====================================================

-- 9. Fix: contact_submissions - Enable RLS (PII Protection)
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous users can submit contact forms" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can manage contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can delete contact submissions" ON public.contact_submissions;

CREATE POLICY "Anonymous users can submit contact forms"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

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

-- =====================================================
-- 10. Fix: sales_leads - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.sales_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage all sales leads" ON public.sales_leads;

CREATE POLICY "Service role can manage all sales leads"
  ON public.sales_leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 11. Fix: newsletter_subscribers - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Service role can manage newsletter subscribers"
  ON public.newsletter_subscribers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 12. Fix: cache_entries - Enable RLS (System-Only)
-- =====================================================
ALTER TABLE IF EXISTS public.cache_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage cache entries" ON public.cache_entries;

CREATE POLICY "Service role can manage cache entries"
  ON public.cache_entries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 13. Fix: blog_authors - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.blog_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read blog author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Authors can update their own profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Service role can manage all author profiles" ON public.blog_authors;

CREATE POLICY "Everyone can read blog author profiles"
  ON public.blog_authors
  FOR SELECT
  USING (true);

CREATE POLICY "Authors can update their own profiles"
  ON public.blog_authors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all author profiles"
  ON public.blog_authors
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Add comments for documentation
-- =====================================================
COMMENT ON POLICY "Users can view nodes in their workflows" ON public.automation_nodes
  IS 'RLS: Users can only see workflow nodes they own';
COMMENT ON POLICY "Users can view connections in their workflows" ON public.automation_connections
  IS 'RLS: Users can only see workflow connections they own';
COMMENT ON POLICY "Users can view their own rate limits" ON public.api_rate_limits
  IS 'RLS: Users can only see their own rate limit records';
COMMENT ON POLICY "Users can view their own scheduled tasks" ON public.scheduled_tasks
  IS 'RLS: Users can only see their own scheduled tasks';
COMMENT ON POLICY "Users can view their own resource downloads" ON public.resource_downloads
  IS 'RLS: Users can only see their own download history';

-- =====================================================
-- ROLLBACK SECTION
-- To rollback, run these commands:
-- =====================================================
-- ALTER TABLE public.automation_nodes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.automation_connections DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.api_rate_limits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.scheduled_tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.resource_downloads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.help_articles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.support_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sales_leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cache_entries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.blog_authors DISABLE ROW LEVEL SECURITY;
-- Then DROP all policies created above
