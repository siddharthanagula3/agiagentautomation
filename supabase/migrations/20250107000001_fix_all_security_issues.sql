-- ============================================================================
-- COMPREHENSIVE SUPABASE SECURITY FIX
-- Addresses all Performance Advisor and Security Advisor warnings/errors
-- ============================================================================
-- Migration: 20250107000001_fix_all_security_issues
-- Description: Fix all security definer views, function search paths, and RLS policies
-- ============================================================================

-- ============================================================================
-- PART 1: FIX SECURITY DEFINER VIEWS (3 ERRORS)
-- Issue: Views with SECURITY DEFINER bypass RLS and use creator's permissions
-- Solution: Recreate views without SECURITY DEFINER
-- ============================================================================

-- Drop and recreate token_usage_summary view
DROP VIEW IF EXISTS public.token_usage_summary CASCADE;

CREATE VIEW public.token_usage_summary
WITH (security_invoker = true)
AS
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
WHERE user_id = auth.uid()  -- Only show current user's data
GROUP BY user_id, provider, model, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

GRANT SELECT ON public.token_usage_summary TO authenticated;

-- Drop and recreate recent_chat_sessions view
DROP VIEW IF EXISTS public.recent_chat_sessions CASCADE;

CREATE VIEW public.recent_chat_sessions
WITH (security_invoker = true)
AS
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
WHERE cs.user_id = auth.uid()  -- Only show current user's sessions
GROUP BY cs.id, cs.user_id, cs.employee_id, cs.role, cs.provider, cs.title, cs.is_active, cs.last_message_at, cs.created_at, cs.updated_at
ORDER BY cs.last_message_at DESC NULLS LAST, cs.created_at DESC
LIMIT 50;

GRANT SELECT ON public.recent_chat_sessions TO authenticated;

-- Drop and recreate user_purchased_employees_with_stats view
DROP VIEW IF EXISTS public.user_purchased_employees_with_stats CASCADE;

CREATE VIEW public.user_purchased_employees_with_stats
WITH (security_invoker = true)
AS
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
WHERE pe.user_id = auth.uid()  -- Only show current user's employees
GROUP BY pe.id, pe.user_id, pe.employee_id, pe.role, pe.provider, pe.purchased_at, pe.is_active, pe.created_at, pe.updated_at;

GRANT SELECT ON public.user_purchased_employees_with_stats TO authenticated;

-- ============================================================================
-- PART 2: FIX FUNCTION SEARCH PATHS (16 WARNINGS)
-- Issue: Functions without explicit search_path are vulnerable to search_path hijacking
-- Solution: Add "SET search_path = public" to all functions
-- ============================================================================

-- Fix: update_user_credits_timestamp
CREATE OR REPLACE FUNCTION public.update_user_credits_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: get_or_create_user_profile
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(uuid);

CREATE FUNCTION public.get_or_create_user_profile(user_id_input uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_id uuid;
BEGIN
    SELECT id INTO profile_id
    FROM public.user_profiles
    WHERE id = user_id_input;
    
    IF profile_id IS NULL THEN
        INSERT INTO public.user_profiles (id)
        VALUES (user_id_input)
        RETURNING id INTO profile_id;
    END IF;
    
    RETURN profile_id;
END;
$$;

-- Fix: initialize_user_credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, bonus_credits, purchased_credits)
    VALUES (NEW.id, 100.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Fix: get_user_token_usage
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_user_token_usage(uuid, timestamp with time zone, timestamp with time zone);

CREATE FUNCTION public.get_user_token_usage(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix: get_provider_usage_stats
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_provider_usage_stats(text, integer);

CREATE FUNCTION public.get_provider_usage_stats(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        AND t.user_id = auth.uid()  -- Only current user's data
    GROUP BY t.provider, t.model
    ORDER BY total_cost DESC;
END;
$$;

-- Fix: update_chat_session_last_message
CREATE OR REPLACE FUNCTION public.update_chat_session_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.chat_sessions
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;

-- Fix: update_workflow_timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: calculate_execution_duration
CREATE OR REPLACE FUNCTION public.calculate_execution_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$;

-- Fix: cleanup_expired_cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.cache_entries
    WHERE expires_at < NOW();
END;
$$;

-- Fix: get_workflow_stats
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_workflow_stats(uuid);

CREATE FUNCTION public.get_workflow_stats(p_user_id uuid)
RETURNS TABLE (
    total_workflows bigint,
    active_workflows bigint,
    total_executions bigint,
    successful_executions bigint,
    failed_executions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT w.id)::bigint as total_workflows,
        COUNT(DISTINCT CASE WHEN w.is_active THEN w.id END)::bigint as active_workflows,
        COUNT(e.id)::bigint as total_executions,
        COUNT(CASE WHEN e.status = 'completed' THEN e.id END)::bigint as successful_executions,
        COUNT(CASE WHEN e.status = 'failed' THEN e.id END)::bigint as failed_executions
    FROM public.automation_workflows w
    LEFT JOIN public.automation_executions e ON w.id = e.workflow_id
    WHERE w.user_id = p_user_id;
END;
$$;

-- Fix: get_automation_overview
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_automation_overview(uuid);

CREATE FUNCTION public.get_automation_overview(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_workflows', COUNT(DISTINCT w.id),
        'active_workflows', COUNT(DISTINCT CASE WHEN w.is_active THEN w.id END),
        'total_executions', COUNT(e.id),
        'executions_today', COUNT(CASE WHEN e.created_at >= CURRENT_DATE THEN e.id END)
    )
    INTO result
    FROM public.automation_workflows w
    LEFT JOIN public.automation_executions e ON w.id = e.workflow_id
    WHERE w.user_id = p_user_id;
    
    RETURN result;
END;
$$;

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: get_dashboard_stats
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);

CREATE FUNCTION public.get_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'purchased_employees', COUNT(DISTINCT pe.id),
        'active_sessions', COUNT(DISTINCT cs.id),
        'total_messages', COUNT(cm.id),
        'automations', COUNT(DISTINCT w.id)
    )
    INTO result
    FROM public.purchased_employees pe
    LEFT JOIN public.chat_sessions cs ON pe.user_id = cs.user_id AND cs.is_active
    LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
    LEFT JOIN public.automation_workflows w ON w.user_id = p_user_id
    WHERE pe.user_id = p_user_id;
    
    RETURN result;
END;
$$;

-- Fix: check_rate_limit
-- Drop and recreate to handle return type changes
DROP FUNCTION IF EXISTS public.check_rate_limit(uuid, text, integer);

CREATE FUNCTION public.check_rate_limit(
    p_user_id uuid,
    p_api_endpoint text,
    p_limit_per_hour integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count integer;
    window_start timestamp with time zone;
    window_end timestamp with time zone;
BEGIN
    window_start := DATE_TRUNC('hour', NOW());
    window_end := window_start + interval '1 hour';
    
    SELECT COALESCE(request_count, 0)
    INTO current_count
    FROM public.api_rate_limits
    WHERE user_id = p_user_id
        AND api_endpoint = p_api_endpoint
        AND window_start = window_start;
    
    IF current_count IS NULL THEN
        INSERT INTO public.api_rate_limits (user_id, api_endpoint, request_count, limit_per_hour, window_start, window_end)
        VALUES (p_user_id, p_api_endpoint, 1, p_limit_per_hour, window_start, window_end);
        RETURN true;
    ELSIF current_count < p_limit_per_hour THEN
        UPDATE public.api_rate_limits
        SET request_count = request_count + 1
        WHERE user_id = p_user_id AND api_endpoint = p_api_endpoint AND window_start = window_start;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- Fix: _ensure_rls_owned
CREATE OR REPLACE FUNCTION public._ensure_rls_owned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 3: ADD RLS POLICIES FOR TABLES WITH RLS ENABLED BUT NO POLICIES (2 INFO)
-- Issue: Tables have RLS enabled but no policies defined
-- Solution: Add comprehensive RLS policies
-- ============================================================================

-- Policies for automation_connections
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

-- Policies for automation_nodes
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
-- PART 4: VERIFICATION
-- Run these queries to verify all issues are resolved
-- ============================================================================

-- Verify views no longer have SECURITY DEFINER
DO $$
DECLARE
    view_count integer;
BEGIN
    SELECT COUNT(*)
    INTO view_count
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('token_usage_summary', 'recent_chat_sessions', 'user_purchased_employees_with_stats')
    AND definition LIKE '%security_invoker%';
    
    RAISE NOTICE '✅ Security Invoker Views: % views updated', view_count;
END $$;

-- Verify functions have proper search_path
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*)
    INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig::text LIKE '%search_path=public%';
    
    RAISE NOTICE '✅ Functions with search_path: % functions secured', func_count;
END $$;

-- Verify RLS policies exist
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('automation_connections', 'automation_nodes');
    
    RAISE NOTICE '✅ RLS Policies: % policies created', policy_count;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Fixed 3 ERRORS: Security Definer Views
-- ✅ Fixed 16 WARNINGS: Function search_path mutable
-- ✅ Fixed 2 INFO: RLS enabled but no policies
-- 
-- Total issues resolved: 21
-- 
-- Next step: Enable leaked password protection in Auth settings
-- Dashboard > Authentication > Policies > Enable "Leaked Password Protection"

