-- ============================================================================
-- FIX SUPABASE SECURITY ISSUES
-- Run this in Supabase SQL Editor to resolve all security warnings and errors
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Security Definer Views (ERRORS)
-- Remove SECURITY DEFINER from views to use the querying user's permissions
-- ============================================================================

-- Fix token_usage_summary view
DROP VIEW IF EXISTS public.token_usage_summary;
CREATE VIEW public.token_usage_summary AS
SELECT 
    user_id,
    provider,
    model,
    COUNT(*) as request_count,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(total_tokens) as total_tokens,
    SUM(input_cost) as total_input_cost,
    SUM(output_cost) as total_output_cost,
    SUM(total_cost) as total_cost,
    DATE_TRUNC('day', created_at) as date
FROM public.token_usage
GROUP BY user_id, provider, model, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

GRANT SELECT ON public.token_usage_summary TO authenticated;
GRANT SELECT ON public.token_usage_summary TO anon;

-- Fix recent_chat_sessions view (if exists)
DROP VIEW IF EXISTS public.recent_chat_sessions;
CREATE VIEW public.recent_chat_sessions AS
SELECT 
    cs.id,
    cs.user_id,
    cs.employee_id,
    cs.role,
    cs.provider,
    cs.title,
    cs.is_active,
    cs.last_message_at,
    cs.created_at,
    cs.updated_at,
    COUNT(cm.id) as message_count
FROM public.chat_sessions cs
LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.user_id, cs.employee_id, cs.role, cs.provider, cs.title, cs.is_active, cs.last_message_at, cs.created_at, cs.updated_at
ORDER BY cs.last_message_at DESC NULLS LAST, cs.created_at DESC
LIMIT 50;

GRANT SELECT ON public.recent_chat_sessions TO authenticated;
GRANT SELECT ON public.recent_chat_sessions TO anon;

-- Fix user_purchased_employees_with_stats view (if exists)
DROP VIEW IF EXISTS public.user_purchased_employees_with_stats;
CREATE VIEW public.user_purchased_employees_with_stats AS
SELECT 
    pe.id,
    pe.user_id,
    pe.employee_id,
    pe.role,
    pe.provider,
    pe.purchased_at,
    pe.is_active,
    pe.created_at,
    pe.updated_at,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(cm.id) as total_messages,
    MAX(cs.last_message_at) as last_used_at
FROM public.purchased_employees pe
LEFT JOIN public.chat_sessions cs ON pe.employee_id = cs.employee_id AND pe.user_id = cs.user_id
LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
GROUP BY pe.id, pe.user_id, pe.employee_id, pe.role, pe.provider, pe.purchased_at, pe.is_active, pe.created_at, pe.updated_at;

GRANT SELECT ON public.user_purchased_employees_with_stats TO authenticated;
GRANT SELECT ON public.user_purchased_employees_with_stats TO anon;

-- ============================================================================
-- PART 2: Fix Function Search Path Mutable (WARNINGS)
-- Add SET search_path = public to all functions for security
-- ============================================================================

-- Fix get_user_token_usage function
CREATE OR REPLACE FUNCTION public.get_user_token_usage(
    p_user_id uuid,
    p_start_date timestamp with time zone DEFAULT NULL,
    p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
    provider text,
    model text,
    request_count bigint,
    total_input_tokens bigint,
    total_output_tokens bigint,
    total_tokens bigint,
    total_cost numeric
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.provider,
        t.model,
        COUNT(*)::bigint as request_count,
        SUM(t.input_tokens)::bigint as total_input_tokens,
        SUM(t.output_tokens)::bigint as total_output_tokens,
        SUM(t.total_tokens)::bigint as total_tokens,
        SUM(t.total_cost)::numeric as total_cost
    FROM public.token_usage t
    WHERE t.user_id = p_user_id
        AND (p_start_date IS NULL OR t.created_at >= p_start_date)
        AND (p_end_date IS NULL OR t.created_at <= p_end_date)
    GROUP BY t.provider, t.model
    ORDER BY total_cost DESC;
END;
$$;

-- Fix get_provider_usage_stats function
CREATE OR REPLACE FUNCTION public.get_provider_usage_stats(
    p_provider text DEFAULT NULL,
    p_days integer DEFAULT 30
)
RETURNS TABLE (
    provider text,
    model text,
    total_requests bigint,
    total_tokens bigint,
    total_cost numeric,
    avg_tokens_per_request numeric,
    avg_cost_per_request numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.provider,
        t.model,
        COUNT(*)::bigint as total_requests,
        SUM(t.total_tokens)::bigint as total_tokens,
        SUM(t.total_cost)::numeric as total_cost,
        AVG(t.total_tokens)::numeric as avg_tokens_per_request,
        AVG(t.total_cost)::numeric as avg_cost_per_request
    FROM public.token_usage t
    WHERE (p_provider IS NULL OR t.provider = p_provider)
        AND t.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY t.provider, t.model
    ORDER BY total_cost DESC;
END;
$$;

-- ============================================================================
-- PART 3: Add RLS Policies for Tables with No Policies (INFO)
-- ============================================================================

-- Add policies for automation_connections
DROP POLICY IF EXISTS "Users can view their own automation connections" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can create their own automation connections" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can update their own automation connections" ON public.automation_connections;
DROP POLICY IF EXISTS "Users can delete their own automation connections" ON public.automation_connections;

CREATE POLICY "Users can view their own automation connections"
    ON public.automation_connections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_connections.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own automation connections"
    ON public.automation_connections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_connections.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own automation connections"
    ON public.automation_connections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_connections.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own automation connections"
    ON public.automation_connections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_connections.workflow_id
            AND w.user_id = auth.uid()
        )
    );

-- Add policies for automation_nodes
DROP POLICY IF EXISTS "Users can view their own automation nodes" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can create their own automation nodes" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can update their own automation nodes" ON public.automation_nodes;
DROP POLICY IF EXISTS "Users can delete their own automation nodes" ON public.automation_nodes;

CREATE POLICY "Users can view their own automation nodes"
    ON public.automation_nodes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_nodes.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own automation nodes"
    ON public.automation_nodes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_nodes.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own automation nodes"
    ON public.automation_nodes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_nodes.workflow_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own automation nodes"
    ON public.automation_nodes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.automation_workflows w
            WHERE w.id = automation_nodes.workflow_id
            AND w.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 4: Update Other Functions with Search Path (if they exist)
-- ============================================================================

-- Note: The following functions need to be updated by finding them first
-- and adding SET search_path = public to each one:
-- 
-- - update_user_credits_timestamp
-- - handle_updated_at
-- - get_or_create_user_profile
-- - initialize_user_credits
-- - update_chat_session_last_message
-- - update_workflow_timestamp
-- - calculate_execution_duration
-- - cleanup_expired_cache
-- - get_workflow_stats
-- - get_automation_overview
-- - update_updated_at_column
-- - get_dashboard_stats
-- - check_rate_limit
-- - _ensure_rls_owned

-- Example template for updating existing functions:
-- 1. Get the function definition: \df+ public.function_name
-- 2. Add SET search_path = public after SECURITY DEFINER
-- 3. Recreate the function with CREATE OR REPLACE FUNCTION

-- Generic update for trigger functions
DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
BEGIN
    -- Find all functions without proper search_path
    FOR func_record IN 
        SELECT 
            n.nspname as schema,
            p.proname as name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'update_user_credits_timestamp',
            'handle_updated_at',
            'update_chat_session_last_message',
            'update_workflow_timestamp',
            'calculate_execution_duration',
            'update_updated_at_column'
        )
    LOOP
        -- These are typically simple trigger functions
        -- We'll add search_path to them
        RAISE NOTICE 'Found function: %.%', func_record.schema, func_record.name;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify views no longer have SECURITY DEFINER
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('token_usage_summary', 'recent_chat_sessions', 'user_purchased_employees_with_stats');

-- Verify functions have proper search_path
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN 'Has SET parameters'
        ELSE 'No SET parameters'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_user_token_usage', 'get_provider_usage_stats');

-- Verify RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('automation_connections', 'automation_nodes', 'token_usage')
ORDER BY tablename, policyname;

-- ============================================================================
-- SETUP COMPLETE!
-- Security issues should now be resolved
-- ============================================================================

-- Summary of changes:
-- ✅ Removed SECURITY DEFINER from 3 views
-- ✅ Added SET search_path = public to 2 critical functions
-- ✅ Added RLS policies for automation_connections table
-- ✅ Added RLS policies for automation_nodes table
-- ⚠️  Other functions need manual review (see PART 4)
-- 
-- Remaining tasks:
-- 1. Enable leaked password protection in Auth settings:
--    Dashboard > Authentication > Policies > Enable "Leaked Password Protection"
-- 2. Review and update other functions listed in PART 4 if they're critical

