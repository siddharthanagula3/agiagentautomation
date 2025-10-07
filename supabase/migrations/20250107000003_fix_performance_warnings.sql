-- =====================================================
-- FIX ALL SUPABASE PERFORMANCE ADVISOR WARNINGS
-- =====================================================
-- This migration addresses:
-- 1. Auth RLS Initialization Plan warnings (50+ policies)
-- 2. Multiple Permissive Policies warnings
--
-- Strategy: Replace auth.uid() with (select auth.uid()) in all RLS policies
-- to prevent re-evaluation for each row at scale.
-- =====================================================

-- =====================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN WARNINGS
-- =====================================================
-- These policies will be dropped and recreated with optimized auth checks

-- ============ TABLE: public.users ============
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ============ TABLE: public.chat_sessions ============
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "owner_can_select" ON public.chat_sessions;
DROP POLICY IF EXISTS "owner_can_insert" ON public.chat_sessions;
DROP POLICY IF EXISTS "owner_can_update" ON public.chat_sessions;

-- Consolidated policies for chat_sessions
CREATE POLICY "chat_sessions_select" ON public.chat_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "chat_sessions_insert" ON public.chat_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "chat_sessions_delete" ON public.chat_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.chat_messages ============
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages from their chat sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chat sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete messages from their chat sessions" ON public.chat_messages;

-- Consolidated policies for chat_messages
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = (select auth.uid())
    )
  );

-- ============ TABLE: public.automation_workflows ============
DROP POLICY IF EXISTS "Users can view own workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Users can create own workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Users can insert own workflows" ON public.automation_workflows;

-- Consolidated policies for automation_workflows
CREATE POLICY "automation_workflows_select" ON public.automation_workflows
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "automation_workflows_insert" ON public.automation_workflows
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "automation_workflows_update" ON public.automation_workflows
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "automation_workflows_delete" ON public.automation_workflows
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.purchased_employees ============
DROP POLICY IF EXISTS "Users can view their own purchased employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can insert their own purchased employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can update their own purchased employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can delete their own purchased employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can view own employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can create own employees" ON public.purchased_employees;

-- Consolidated policies for purchased_employees
CREATE POLICY "purchased_employees_select" ON public.purchased_employees
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "purchased_employees_insert" ON public.purchased_employees
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "purchased_employees_update" ON public.purchased_employees
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "purchased_employees_delete" ON public.purchased_employees
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.notifications ============
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Consolidated policies for notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.user_profiles ============
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Consolidated policies for user_profiles
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ============ TABLE: public.user_settings ============
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;

-- Consolidated policies for user_settings
CREATE POLICY "user_settings_select" ON public.user_settings
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "user_settings_update" ON public.user_settings
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "user_settings_insert" ON public.user_settings
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ============ TABLE: public.user_api_keys ============
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.user_api_keys;

-- Consolidated policies for user_api_keys
CREATE POLICY "user_api_keys_select" ON public.user_api_keys
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "user_api_keys_insert" ON public.user_api_keys
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_api_keys_update" ON public.user_api_keys
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "user_api_keys_delete" ON public.user_api_keys
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.user_sessions ============
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

-- Consolidated policies for user_sessions
CREATE POLICY "user_sessions_select" ON public.user_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "user_sessions_delete" ON public.user_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.audit_logs ============
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

-- Consolidated policy for audit_logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.user_credits ============
-- Check if there are existing policies to update
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

CREATE POLICY "user_credits_select" ON public.user_credits
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.credit_transactions ============
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;

CREATE POLICY "credit_transactions_select" ON public.credit_transactions
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.user_subscriptions ============
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.integration_configs ============
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integration_configs;
DROP POLICY IF EXISTS "Users can create own integrations" ON public.integration_configs;
DROP POLICY IF EXISTS "Users can update own integrations" ON public.integration_configs;
DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integration_configs;

CREATE POLICY "integration_configs_select" ON public.integration_configs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "integration_configs_insert" ON public.integration_configs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "integration_configs_update" ON public.integration_configs
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "integration_configs_delete" ON public.integration_configs
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.scheduled_tasks ============
DROP POLICY IF EXISTS "Users can view own tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.scheduled_tasks;

CREATE POLICY "scheduled_tasks_select" ON public.scheduled_tasks
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "scheduled_tasks_insert" ON public.scheduled_tasks
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "scheduled_tasks_update" ON public.scheduled_tasks
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "scheduled_tasks_delete" ON public.scheduled_tasks
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.automation_executions ============
DROP POLICY IF EXISTS "Users can view own executions" ON public.automation_executions;
DROP POLICY IF EXISTS "Users can create own executions" ON public.automation_executions;

CREATE POLICY "automation_executions_select" ON public.automation_executions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "automation_executions_insert" ON public.automation_executions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============ TABLE: public.webhook_configs ============
DROP POLICY IF EXISTS "Users can view own webhooks" ON public.webhook_configs;
DROP POLICY IF EXISTS "Users can create own webhooks" ON public.webhook_configs;
DROP POLICY IF EXISTS "Users can update own webhooks" ON public.webhook_configs;
DROP POLICY IF EXISTS "Users can delete own webhooks" ON public.webhook_configs;

CREATE POLICY "webhook_configs_select" ON public.webhook_configs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "webhook_configs_insert" ON public.webhook_configs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "webhook_configs_update" ON public.webhook_configs
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "webhook_configs_delete" ON public.webhook_configs
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.api_rate_limits ============
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Users can create own rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Users can update own rate limits" ON public.api_rate_limits;

CREATE POLICY "api_rate_limits_select" ON public.api_rate_limits
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "api_rate_limits_insert" ON public.api_rate_limits
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "api_rate_limits_update" ON public.api_rate_limits
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============ TABLE: public.cache_entries ============
-- Cache entries typically don't have user-specific RLS, but if they do:
DROP POLICY IF EXISTS "cache_public_read" ON public.cache_entries;

-- ============ TABLE: public.sales_leads ============
DROP POLICY IF EXISTS "Assigned users can view leads" ON public.sales_leads;

CREATE POLICY "sales_leads_assigned_select" ON public.sales_leads
  FOR SELECT USING ((select auth.uid()) = assigned_to);

-- ============ TABLE: public.support_tickets ============
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Assigned users can view tickets" ON public.support_tickets;

CREATE POLICY "support_tickets_owner_select" ON public.support_tickets
  FOR SELECT USING ((select auth.uid()) = user_id OR (select auth.uid()) = assigned_to);

CREATE POLICY "support_tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============ TABLE: public.support_ticket_messages ============
DROP POLICY IF EXISTS "Users can view ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Users can create ticket messages" ON public.support_ticket_messages;

CREATE POLICY "support_ticket_messages_select" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE support_tickets.id = support_ticket_messages.ticket_id 
      AND (support_tickets.user_id = (select auth.uid()) OR support_tickets.assigned_to = (select auth.uid()))
    )
  );

CREATE POLICY "support_ticket_messages_insert" ON public.support_ticket_messages
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============ TABLE: public.resource_downloads ============
DROP POLICY IF EXISTS "Users can view own downloads" ON public.resource_downloads;

CREATE POLICY "resource_downloads_select" ON public.resource_downloads
  FOR SELECT USING ((select auth.uid()) = user_id);

-- =====================================================
-- 2. REMOVE ADMIN/SERVICE ROLE PERMISSIVE POLICIES
-- =====================================================
-- These are the "Multiple Permissive Policies" warnings
-- Service role policies are often redundant as service role bypasses RLS

-- Note: Be careful when removing policies for roles like 'authenticator', 'dashboard_user'
-- Only remove if you're certain they're redundant in your use case

-- For anon role policies (if they exist and are truly permissive without conditions)
DROP POLICY IF EXISTS "anon_select_all" ON public.api_rate_limits;
DROP POLICY IF EXISTS "anon_select_all" ON public.cache_entries;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- 
-- Check for duplicate policies:
-- SELECT tablename, policyname, COUNT(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename, policyname HAVING COUNT(*) > 1;

