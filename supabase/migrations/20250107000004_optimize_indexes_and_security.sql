-- =====================================================
-- OPTIMIZE DATABASE INDEXES AND FINAL SECURITY FIXES
-- =====================================================
-- This migration addresses:
-- 1. Unindexed Foreign Keys (9 instances)
-- 2. Unused Indexes (71 instances - to be evaluated and removed)
-- 3. Final Security Warning (Function Search Path Mutable for _ensure_rls_owned)
--
-- Note: Auth leaked password protection must be enabled in Supabase Dashboard
-- =====================================================

-- =====================================================
-- PART 1: ADD INDEXES FOR FOREIGN KEYS
-- =====================================================
-- These indexes will improve JOIN performance and foreign key constraint checks

-- blog_authors.user_id
CREATE INDEX IF NOT EXISTS idx_blog_authors_user_id 
ON public.blog_authors(user_id);

-- blog_comments.parent_id
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id 
ON public.blog_comments(parent_id);

-- blog_comments.user_id
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id 
ON public.blog_comments(user_id);

-- credit_transactions.user_credit_id
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_credit_id 
ON public.credit_transactions(user_credit_id);

-- sales_leads.contact_submission_id
CREATE INDEX IF NOT EXISTS idx_sales_leads_contact_submission_id 
ON public.sales_leads(contact_submission_id);

-- support_ticket_messages.user_id
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_user_id 
ON public.support_ticket_messages(user_id);

-- support_tickets.assigned_to
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to 
ON public.support_tickets(assigned_to);

-- support_tickets.category_id
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id 
ON public.support_tickets(category_id);

-- user_credits.subscription_id
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription_id 
ON public.user_credits(subscription_id);

-- =====================================================
-- PART 2: REMOVE UNUSED INDEXES
-- =====================================================
-- These indexes have never been used and consume storage and write performance
-- They will be dropped to optimize the database

-- IMPORTANT: Before dropping indexes in production, verify they're truly unused
-- by checking pg_stat_user_indexes over a representative time period

-- Users table - redundant indexes
DROP INDEX IF EXISTS public.idx_users_id; -- Redundant with PRIMARY KEY
DROP INDEX IF EXISTS public.idx_users_email; -- Not used, email lookups handled by auth.users
DROP INDEX IF EXISTS public.idx_users_role; -- Not used in current queries
DROP INDEX IF EXISTS public.idx_users_is_active; -- Not used in current queries

-- User credits - composite index might be more useful
DROP INDEX IF EXISTS public.idx_user_credits_user_id; -- Covered by UNIQUE constraint
DROP INDEX IF EXISTS public.idx_user_credits_next_billing; -- Not actively queried

-- Credit transactions - may become useful with analytics
-- Keep these but monitor usage
-- DROP INDEX IF EXISTS public.idx_credit_transactions_user_id;
-- DROP INDEX IF EXISTS public.idx_credit_transactions_created_at;

-- Chat sessions - keep for now as chat is actively used
-- These will likely be used once the app scales
-- DROP INDEX IF EXISTS public.idx_chat_sessions_user_created;
-- DROP INDEX IF EXISTS public.idx_chat_sessions_employee_id;
-- DROP INDEX IF EXISTS public.idx_chat_sessions_last_message_at;

-- Chat messages
-- DROP INDEX IF EXISTS public.idx_chat_messages_created_at;

-- Purchased employees
DROP INDEX IF EXISTS public.idx_purchased_employees_user; -- Keep the one that's optimized

-- User API keys
DROP INDEX IF EXISTS public.idx_user_api_keys_is_active; -- Not actively filtered by is_active

-- User sessions
DROP INDEX IF EXISTS public.idx_user_sessions_user_id; -- Covered by foreign key

-- Audit logs - may be useful for analytics, keep for now
-- DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
-- DROP INDEX IF EXISTS public.idx_audit_logs_created_at;

-- Notifications - keep for active feature
-- DROP INDEX IF EXISTS public.idx_notifications_user_id;
-- DROP INDEX IF EXISTS public.idx_notifications_is_read;
-- DROP INDEX IF EXISTS public.idx_notifications_created_at;

-- Automation workflows - keep for active feature
-- DROP INDEX IF EXISTS public.idx_automation_workflows_category;
-- DROP INDEX IF EXISTS public.idx_automation_workflows_active;
-- DROP INDEX IF EXISTS public.idx_automation_workflows_tags;

-- Automation executions - keep for monitoring
-- DROP INDEX IF EXISTS public.idx_automation_executions_user;
-- DROP INDEX IF EXISTS public.idx_automation_executions_workflow;
-- DROP INDEX IF EXISTS public.idx_automation_executions_status;
-- DROP INDEX IF EXISTS public.idx_automation_executions_created;

-- Token usage - these will be essential for analytics, keep all
-- DO NOT DROP token_usage indexes

-- Automation nodes and connections - keep for workflow visualization
-- DROP INDEX IF EXISTS public.idx_automation_nodes_workflow;
-- DROP INDEX IF EXISTS public.idx_automation_connections_workflow;

-- Webhooks - keep for active integrations
-- DROP INDEX IF EXISTS public.idx_webhook_configs_user;
-- DROP INDEX IF EXISTS public.idx_webhook_configs_workflow;
-- DROP INDEX IF EXISTS public.idx_webhook_configs_url;

-- Scheduled tasks - keep for cron functionality
-- DROP INDEX IF EXISTS public.idx_scheduled_tasks_user;
-- DROP INDEX IF EXISTS public.idx_scheduled_tasks_workflow;
-- DROP INDEX IF EXISTS public.idx_scheduled_tasks_next_run;

-- Integration configs - keep for active integrations
-- DROP INDEX IF EXISTS public.idx_integration_configs_user;
-- DROP INDEX IF EXISTS public.idx_integration_configs_type;

-- Cache entries
DROP INDEX IF EXISTS public.idx_cache_entries_expires; -- Cache is managed by TTL, this index rarely helps

-- API rate limits - keep for rate limiting functionality
-- DROP INDEX IF EXISTS public.idx_api_rate_limits_user;
-- DROP INDEX IF EXISTS public.idx_api_rate_limits_endpoint;
-- DROP INDEX IF EXISTS public.idx_api_rate_limits_window;

-- Blog and marketing - these tables are likely not heavily used yet
DROP INDEX IF EXISTS public.idx_blog_posts_slug; -- Unique constraint provides index
DROP INDEX IF EXISTS public.idx_blog_posts_published; -- Not actively filtered
DROP INDEX IF EXISTS public.idx_blog_posts_category; -- Low usage
DROP INDEX IF EXISTS public.idx_blog_posts_author; -- Low usage
DROP INDEX IF EXISTS public.idx_blog_comments_post; -- Low usage

-- Resources
DROP INDEX IF EXISTS public.idx_resources_type; -- Not actively filtered
DROP INDEX IF EXISTS public.idx_resources_category; -- Not actively filtered
DROP INDEX IF EXISTS public.idx_resource_downloads_resource; -- Low usage
DROP INDEX IF EXISTS public.idx_resource_downloads_user; -- Low usage

-- Contact and sales
DROP INDEX IF EXISTS public.idx_contact_submissions_email; -- Low query frequency
DROP INDEX IF EXISTS public.idx_contact_submissions_status; -- Low query frequency
DROP INDEX IF EXISTS public.idx_sales_leads_status; -- Low query frequency
DROP INDEX IF EXISTS public.idx_sales_leads_assigned; -- Low query frequency

-- User subscriptions
DROP INDEX IF EXISTS public.idx_user_subscriptions_user; -- Covered by foreign key
DROP INDEX IF EXISTS public.idx_user_subscriptions_status; -- Not actively filtered

-- Help and support
DROP INDEX IF EXISTS public.idx_help_articles_slug; -- Unique constraint provides index
DROP INDEX IF EXISTS public.idx_support_tickets_user; -- Covered by foreign key
DROP INDEX IF EXISTS public.idx_support_tickets_status; -- Not actively filtered
DROP INDEX IF EXISTS public.idx_support_ticket_messages_ticket; -- Covered by foreign key

-- Newsletter
DROP INDEX IF EXISTS public.idx_newsletter_subscribers_email; -- Unique constraint provides index
DROP INDEX IF EXISTS public.idx_newsletter_subscribers_status; -- Not actively filtered

-- =====================================================
-- PART 3: FIX FINAL SECURITY WARNING
-- =====================================================
-- Fix search_path for _ensure_rls_owned function

-- Drop and recreate the function with explicit search_path
DROP FUNCTION IF EXISTS public._ensure_rls_owned() CASCADE;

CREATE OR REPLACE FUNCTION public._ensure_rls_owned()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN 
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'ALTER TABLE')
  LOOP
    -- Enable RLS on newly created tables in public schema
    IF obj.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
        obj.schema_name, obj.object_identity);
    END IF;
  END LOOP;
END;
$$;

-- Recreate the event trigger if it exists
DROP EVENT TRIGGER IF EXISTS ensure_rls_owned;
CREATE EVENT TRIGGER ensure_rls_owned 
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE')
EXECUTE FUNCTION public._ensure_rls_owned();

-- =====================================================
-- PART 4: CREATE COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================
-- These composite indexes will improve common query patterns

-- Chat sessions: user + active + last_message for sorting
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active_last_msg 
ON public.chat_sessions(user_id, is_active, last_message_at DESC)
WHERE is_active = true;

-- Purchased employees: user + active for quick filtering
CREATE INDEX IF NOT EXISTS idx_purchased_employees_user_active 
ON public.purchased_employees(user_id, is_active)
WHERE is_active = true;

-- Token usage: user + provider + date for analytics
CREATE INDEX IF NOT EXISTS idx_token_usage_analytics 
ON public.token_usage(user_id, provider, created_at DESC);

-- Automation executions: user + status + created for dashboard
CREATE INDEX IF NOT EXISTS idx_automation_executions_dashboard 
ON public.automation_executions(user_id, status, executed_at DESC);

-- Notifications: user + read status + created for inbox
CREATE INDEX IF NOT EXISTS idx_notifications_inbox 
ON public.notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify:

-- 1. Check all foreign keys have covering indexes:
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   tc.constraint_name,
--   EXISTS (
--     SELECT 1 FROM pg_indexes 
--     WHERE schemaname = 'public' 
--     AND tablename = tc.table_name 
--     AND indexdef LIKE '%' || kcu.column_name || '%'
--   ) as has_index
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu 
--   ON tc.constraint_name = kcu.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
-- ORDER BY tc.table_name, kcu.column_name;

-- 2. Check index usage statistics:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 3. Check for missing indexes on foreign keys:
-- SELECT 
--   c.conrelid::regclass AS table_name,
--   string_agg(a.attname, ', ') AS columns,
--   c.conname AS constraint_name
-- FROM pg_constraint c
-- JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
-- WHERE c.contype = 'f'
--   AND NOT EXISTS (
--     SELECT 1 FROM pg_index i
--     WHERE i.indrelid = c.conrelid
--     AND c.conkey[1:array_length(c.conkey, 1)] @> i.indkey[0:array_length(c.conkey, 1)-1]
--   )
-- GROUP BY c.conrelid, c.conname
-- ORDER BY table_name;


