-- Migration: Fix All Remaining Performance Warnings
-- Date: 2025-01-07
-- Description: Fixes all auth_rls_initplan and multiple_permissive_policies warnings

-- ============================================
-- PART 1: Fix auth_rls_initplan warnings
-- Replace auth.uid() with (select auth.uid())
-- ============================================

-- automation_executions
DROP POLICY IF EXISTS "Users can update own executions" ON public.automation_executions;
CREATE POLICY "Users can update own executions" ON public.automation_executions
  FOR UPDATE USING (user_id = (select auth.uid()));

-- webhook_configs
DROP POLICY IF EXISTS "Users can manage own webhook configs" ON public.webhook_configs;
CREATE POLICY "Users can manage own webhook configs" ON public.webhook_configs
  FOR ALL USING (user_id = (select auth.uid()));

-- scheduled_tasks
DROP POLICY IF EXISTS "Users can manage own scheduled tasks" ON public.scheduled_tasks;
CREATE POLICY "Users can manage own scheduled tasks" ON public.scheduled_tasks
  FOR ALL USING (user_id = (select auth.uid()));

-- integration_configs
DROP POLICY IF EXISTS "Users can manage own integration configs" ON public.integration_configs;
CREATE POLICY "Users can manage own integration configs" ON public.integration_configs
  FOR ALL USING (user_id = (select auth.uid()));

-- users table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (id = (select auth.uid()));

-- purchased_employees
DROP POLICY IF EXISTS "Users can update own employees" ON public.purchased_employees;
CREATE POLICY "Users can update own employees" ON public.purchased_employees
  FOR UPDATE USING (user_id = (select auth.uid()));

-- blog_comments
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.blog_comments;
CREATE POLICY "Authenticated users can comment" ON public.blog_comments
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own comments" ON public.blog_comments;
CREATE POLICY "Users can update own comments" ON public.blog_comments
  FOR UPDATE USING (user_id = (select auth.uid()));

-- chat_sessions
DROP POLICY IF EXISTS "owner_can_delete" ON public.chat_sessions;
CREATE POLICY "owner_can_delete" ON public.chat_sessions
  FOR DELETE USING (user_id = (select auth.uid()));

-- notifications
DROP POLICY IF EXISTS "owner_can_select" ON public.notifications;
DROP POLICY IF EXISTS "owner_can_insert" ON public.notifications;
DROP POLICY IF EXISTS "owner_can_update" ON public.notifications;
DROP POLICY IF EXISTS "owner_can_delete" ON public.notifications;

CREATE POLICY "owner_can_select" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.notifications
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.notifications
  FOR DELETE USING (user_id = (select auth.uid()));

-- purchased_employees (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.purchased_employees;
DROP POLICY IF EXISTS "owner_can_insert" ON public.purchased_employees;
DROP POLICY IF EXISTS "owner_can_update" ON public.purchased_employees;
DROP POLICY IF EXISTS "owner_can_delete" ON public.purchased_employees;

CREATE POLICY "owner_can_select" ON public.purchased_employees
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.purchased_employees
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.purchased_employees
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.purchased_employees
  FOR DELETE USING (user_id = (select auth.uid()));

-- contact_submissions
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (user_id = (select auth.uid()));

-- credit_transactions (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.credit_transactions;
DROP POLICY IF EXISTS "owner_can_insert" ON public.credit_transactions;
DROP POLICY IF EXISTS "owner_can_update" ON public.credit_transactions;
DROP POLICY IF EXISTS "owner_can_delete" ON public.credit_transactions;

CREATE POLICY "owner_can_select" ON public.credit_transactions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.credit_transactions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.credit_transactions
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.credit_transactions
  FOR DELETE USING (user_id = (select auth.uid()));

-- integration_configs (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.integration_configs;
DROP POLICY IF EXISTS "owner_can_insert" ON public.integration_configs;
DROP POLICY IF EXISTS "owner_can_update" ON public.integration_configs;
DROP POLICY IF EXISTS "owner_can_delete" ON public.integration_configs;

CREATE POLICY "owner_can_select" ON public.integration_configs
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.integration_configs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.integration_configs
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.integration_configs
  FOR DELETE USING (user_id = (select auth.uid()));

-- scheduled_tasks (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "owner_can_insert" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "owner_can_update" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "owner_can_delete" ON public.scheduled_tasks;

CREATE POLICY "owner_can_select" ON public.scheduled_tasks
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.scheduled_tasks
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.scheduled_tasks
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.scheduled_tasks
  FOR DELETE USING (user_id = (select auth.uid()));

-- sales_leads
DROP POLICY IF EXISTS "Admins can manage sales leads" ON public.sales_leads;
DROP POLICY IF EXISTS "owner_can_select" ON public.sales_leads;
DROP POLICY IF EXISTS "owner_can_insert" ON public.sales_leads;
DROP POLICY IF EXISTS "owner_can_update" ON public.sales_leads;
DROP POLICY IF EXISTS "owner_can_delete" ON public.sales_leads;

CREATE POLICY "Admins can manage sales leads" ON public.sales_leads
  FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- support_tickets
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- support_ticket_messages
DROP POLICY IF EXISTS "Users can view own ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Users can view own ticket messages" ON public.support_ticket_messages
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- newsletter_subscribers
DROP POLICY IF EXISTS "Users can update own subscription" ON public.newsletter_subscribers;
CREATE POLICY "Users can update own subscription" ON public.newsletter_subscribers
  FOR UPDATE USING (email = (SELECT email FROM auth.users WHERE id = (select auth.uid())));

-- webhook_configs (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.webhook_configs;
DROP POLICY IF EXISTS "owner_can_insert" ON public.webhook_configs;
DROP POLICY IF EXISTS "owner_can_update" ON public.webhook_configs;
DROP POLICY IF EXISTS "owner_can_delete" ON public.webhook_configs;

CREATE POLICY "owner_can_select" ON public.webhook_configs
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.webhook_configs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.webhook_configs
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.webhook_configs
  FOR DELETE USING (user_id = (select auth.uid()));

-- user_api_keys (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.user_api_keys;
DROP POLICY IF EXISTS "owner_can_insert" ON public.user_api_keys;
DROP POLICY IF EXISTS "owner_can_update" ON public.user_api_keys;
DROP POLICY IF EXISTS "owner_can_delete" ON public.user_api_keys;

CREATE POLICY "owner_can_select" ON public.user_api_keys
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.user_api_keys
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.user_api_keys
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.user_api_keys
  FOR DELETE USING (user_id = (select auth.uid()));

-- users table (more policies)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (id = (select auth.uid()));
CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (id = (select auth.uid()));

-- user_credits (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.user_credits;
DROP POLICY IF EXISTS "owner_can_insert" ON public.user_credits;
DROP POLICY IF EXISTS "owner_can_update" ON public.user_credits;
DROP POLICY IF EXISTS "owner_can_delete" ON public.user_credits;

CREATE POLICY "owner_can_select" ON public.user_credits
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.user_credits
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.user_credits
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.user_credits
  FOR DELETE USING (user_id = (select auth.uid()));

-- user_subscriptions (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.user_subscriptions;
DROP POLICY IF EXISTS "owner_can_insert" ON public.user_subscriptions;
DROP POLICY IF EXISTS "owner_can_update" ON public.user_subscriptions;
DROP POLICY IF EXISTS "owner_can_delete" ON public.user_subscriptions;

CREATE POLICY "owner_can_select" ON public.user_subscriptions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.user_subscriptions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.user_subscriptions
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.user_subscriptions
  FOR DELETE USING (user_id = (select auth.uid()));

-- user_sessions (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.user_sessions;
DROP POLICY IF EXISTS "owner_can_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "owner_can_update" ON public.user_sessions;
DROP POLICY IF EXISTS "owner_can_delete" ON public.user_sessions;

CREATE POLICY "owner_can_select" ON public.user_sessions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.user_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.user_sessions
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.user_sessions
  FOR DELETE USING (user_id = (select auth.uid()));

-- automation_executions (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.automation_executions;
DROP POLICY IF EXISTS "owner_can_insert" ON public.automation_executions;
DROP POLICY IF EXISTS "owner_can_update" ON public.automation_executions;
DROP POLICY IF EXISTS "owner_can_delete" ON public.automation_executions;

CREATE POLICY "owner_can_select" ON public.automation_executions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.automation_executions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.automation_executions
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.automation_executions
  FOR DELETE USING (user_id = (select auth.uid()));

-- automation_workflows (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.automation_workflows;
DROP POLICY IF EXISTS "owner_can_insert" ON public.automation_workflows;
DROP POLICY IF EXISTS "owner_can_update" ON public.automation_workflows;
DROP POLICY IF EXISTS "owner_can_delete" ON public.automation_workflows;

CREATE POLICY "owner_can_select" ON public.automation_workflows
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.automation_workflows
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.automation_workflows
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.automation_workflows
  FOR DELETE USING (user_id = (select auth.uid()));

-- api_rate_limits (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.api_rate_limits;
DROP POLICY IF EXISTS "owner_can_insert" ON public.api_rate_limits;
DROP POLICY IF EXISTS "owner_can_update" ON public.api_rate_limits;
DROP POLICY IF EXISTS "owner_can_delete" ON public.api_rate_limits;

CREATE POLICY "owner_can_select" ON public.api_rate_limits
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.api_rate_limits
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.api_rate_limits
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.api_rate_limits
  FOR DELETE USING (user_id = (select auth.uid()));

-- audit_logs (owner policies)
DROP POLICY IF EXISTS "owner_can_select" ON public.audit_logs;
DROP POLICY IF EXISTS "owner_can_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "owner_can_update" ON public.audit_logs;
DROP POLICY IF EXISTS "owner_can_delete" ON public.audit_logs;

CREATE POLICY "owner_can_select" ON public.audit_logs
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "owner_can_update" ON public.audit_logs
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "owner_can_delete" ON public.audit_logs
  FOR DELETE USING (user_id = (select auth.uid()));

-- chat_messages
DROP POLICY IF EXISTS "session_owner_can_all" ON public.chat_messages;
CREATE POLICY "session_owner_can_all" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = (select auth.uid())
    )
  );

-- token_usage
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;
CREATE POLICY "Users can view their own token usage" ON public.token_usage
  FOR SELECT USING (user_id = (select auth.uid()));

-- automation_connections and automation_nodes - Skip if tables don't exist or have different schema
DO $$
BEGIN
  -- Only update if table exists with user_id column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automation_connections' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own automation connections" ON public.automation_connections;
    DROP POLICY IF EXISTS "Users can create their own automation connections" ON public.automation_connections;
    DROP POLICY IF EXISTS "Users can update their own automation connections" ON public.automation_connections;
    DROP POLICY IF EXISTS "Users can delete their own automation connections" ON public.automation_connections;

    CREATE POLICY "Users can view their own automation connections" ON public.automation_connections
      FOR SELECT USING (user_id = (select auth.uid()));
    CREATE POLICY "Users can create their own automation connections" ON public.automation_connections
      FOR INSERT WITH CHECK (user_id = (select auth.uid()));
    CREATE POLICY "Users can update their own automation connections" ON public.automation_connections
      FOR UPDATE USING (user_id = (select auth.uid()));
    CREATE POLICY "Users can delete their own automation connections" ON public.automation_connections
      FOR DELETE USING (user_id = (select auth.uid()));
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automation_nodes' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own automation nodes" ON public.automation_nodes;
    DROP POLICY IF EXISTS "Users can create their own automation nodes" ON public.automation_nodes;
    DROP POLICY IF EXISTS "Users can update their own automation nodes" ON public.automation_nodes;
    DROP POLICY IF EXISTS "Users can delete their own automation nodes" ON public.automation_nodes;

    CREATE POLICY "Users can view their own automation nodes" ON public.automation_nodes
      FOR SELECT USING (user_id = (select auth.uid()));
    CREATE POLICY "Users can create their own automation nodes" ON public.automation_nodes
      FOR INSERT WITH CHECK (user_id = (select auth.uid()));
    CREATE POLICY "Users can update their own automation nodes" ON public.automation_nodes
      FOR UPDATE USING (user_id = (select auth.uid()));
    CREATE POLICY "Users can delete their own automation nodes" ON public.automation_nodes
      FOR DELETE USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- ============================================
-- PART 2: Fix multiple_permissive_policies
-- Remove duplicate policies (keep only one)
-- ============================================

-- api_rate_limits - Remove system policies, keep owner policies
DROP POLICY IF EXISTS "System can manage rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "api_rate_limits_insert" ON public.api_rate_limits;
DROP POLICY IF EXISTS "api_rate_limits_select" ON public.api_rate_limits;
DROP POLICY IF EXISTS "api_rate_limits_update" ON public.api_rate_limits;

-- audit_logs - Remove select policy, keep owner
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;

-- automation_executions - Remove system/specific policies
DROP POLICY IF EXISTS "System can insert executions" ON public.automation_executions;
DROP POLICY IF EXISTS "automation_executions_insert" ON public.automation_executions;
DROP POLICY IF EXISTS "automation_executions_select" ON public.automation_executions;

-- automation_workflows - Remove specific policies
DROP POLICY IF EXISTS "automation_workflows_delete" ON public.automation_workflows;
DROP POLICY IF EXISTS "automation_workflows_insert" ON public.automation_workflows;
DROP POLICY IF EXISTS "automation_workflows_select" ON public.automation_workflows;
DROP POLICY IF EXISTS "automation_workflows_update" ON public.automation_workflows;

-- cache_entries - Keep one policy
DROP POLICY IF EXISTS "System can manage cache" ON public.cache_entries;

-- chat_messages - Remove specific policies
DROP POLICY IF EXISTS "chat_messages_delete" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;

-- chat_sessions - Remove specific policies
DROP POLICY IF EXISTS "chat_sessions_delete" ON public.chat_sessions;

-- credit_transactions - Remove specific policies
DROP POLICY IF EXISTS "credit_transactions_select" ON public.credit_transactions;

-- integration_configs - Remove specific policies
DROP POLICY IF EXISTS "integration_configs_delete" ON public.integration_configs;
DROP POLICY IF EXISTS "integration_configs_insert" ON public.integration_configs;
DROP POLICY IF EXISTS "integration_configs_select" ON public.integration_configs;
DROP POLICY IF EXISTS "integration_configs_update" ON public.integration_configs;

-- notifications - Remove specific policies
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

-- purchased_employees - Remove specific policies
DROP POLICY IF EXISTS "purchased_employees_delete" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_insert" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_select" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_update" ON public.purchased_employees;

-- sales_leads - Remove specific policies
DROP POLICY IF EXISTS "sales_leads_assigned_select" ON public.sales_leads;

-- scheduled_tasks - Remove specific policies
DROP POLICY IF EXISTS "scheduled_tasks_delete" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "scheduled_tasks_insert" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "scheduled_tasks_select" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "scheduled_tasks_update" ON public.scheduled_tasks;

-- support_ticket_messages - Remove specific policies
DROP POLICY IF EXISTS "support_ticket_messages_select" ON public.support_ticket_messages;

-- support_tickets - Remove specific policies
DROP POLICY IF EXISTS "support_tickets_insert" ON public.support_tickets;

-- token_usage - Remove one of the duplicate policies
DROP POLICY IF EXISTS "Users can view session token usage" ON public.token_usage;

-- user_api_keys - Remove specific policies
DROP POLICY IF EXISTS "user_api_keys_delete" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_insert" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_select" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_update" ON public.user_api_keys;

-- user_credits - Remove specific/system policies
DROP POLICY IF EXISTS "System can insert credits" ON public.user_credits;
DROP POLICY IF EXISTS "user_credits_select" ON public.user_credits;

-- user_sessions - Remove specific policies
DROP POLICY IF EXISTS "user_sessions_delete" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_select" ON public.user_sessions;

-- user_subscriptions - Remove specific policies
DROP POLICY IF EXISTS "user_subscriptions_select" ON public.user_subscriptions;

-- users - Remove duplicate policies, keep essential ones
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- webhook_configs - Remove specific policies
DROP POLICY IF EXISTS "webhook_configs_delete" ON public.webhook_configs;
DROP POLICY IF EXISTS "webhook_configs_insert" ON public.webhook_configs;
DROP POLICY IF EXISTS "webhook_configs_select" ON public.webhook_configs;
DROP POLICY IF EXISTS "webhook_configs_update" ON public.webhook_configs;

-- ============================================
-- VERIFICATION
-- ============================================

-- This migration should eliminate all:
-- 1. auth_rls_initplan warnings (by using (select auth.uid()))
-- 2. multiple_permissive_policies warnings (by removing duplicates)

