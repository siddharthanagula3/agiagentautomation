-- ============================================================================
-- TOKEN USAGE TRACKING TABLE FOR AI API BILLING
-- Run this in Supabase SQL Editor to create the token_usage table
-- This tracks usage for OpenAI, Anthropic, Google AI Studio, and Perplexity
-- ============================================================================

-- Create token_usage table
CREATE TABLE IF NOT EXISTS public.token_usage (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text,
    provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'perplexity')),
    model text NOT NULL,
    input_tokens integer NOT NULL DEFAULT 0,
    output_tokens integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL DEFAULT 0,
    input_cost numeric(10, 6) NOT NULL DEFAULT 0,
    output_cost numeric(10, 6) NOT NULL DEFAULT 0,
    total_cost numeric(10, 6) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT token_usage_pkey PRIMARY KEY (id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON public.token_usage(provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_provider ON public.token_usage(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_session_id ON public.token_usage(session_id);

-- Enable Row Level Security
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Service role can insert token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Users can view session token usage" ON public.token_usage;

-- Policy: Users can view their own token usage
CREATE POLICY "Users can view their own token usage"
    ON public.token_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role can insert token usage (for Netlify functions)
CREATE POLICY "Service role can insert token usage"
    ON public.token_usage
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view anonymous session token usage (for guest users)
CREATE POLICY "Users can view session token usage"
    ON public.token_usage
    FOR SELECT
    USING (session_id IS NOT NULL);

-- ============================================================================
-- CREATE AGGREGATED VIEW FOR TOKEN USAGE SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW public.token_usage_summary AS
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

-- Grant access to the view
GRANT SELECT ON public.token_usage_summary TO authenticated;
GRANT SELECT ON public.token_usage_summary TO anon;

-- ============================================================================
-- FUNCTION: Get User's Total Token Usage
-- Usage: SELECT * FROM get_user_token_usage(auth.uid(), NULL, NULL);
-- ============================================================================

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

-- ============================================================================
-- FUNCTION: Get Provider Usage Statistics
-- Usage: SELECT * FROM get_provider_usage_stats('openai', 30);
-- ============================================================================

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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_token_usage(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_token_usage(uuid, timestamp with time zone, timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.get_provider_usage_stats(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_usage_stats(text, integer) TO anon;

-- ============================================================================
-- ADD HELPFUL COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.token_usage IS 'Tracks AI API token usage and costs for all providers (OpenAI, Anthropic, Google, Perplexity)';
COMMENT ON COLUMN public.token_usage.user_id IS 'User who made the request (null for anonymous sessions)';
COMMENT ON COLUMN public.token_usage.session_id IS 'Chat session identifier for grouping related requests';
COMMENT ON COLUMN public.token_usage.provider IS 'AI provider: openai, anthropic, google, or perplexity';
COMMENT ON COLUMN public.token_usage.model IS 'Specific model used (e.g., gpt-4o-mini, claude-3-5-sonnet-20241022, gemini-2.0-flash)';
COMMENT ON COLUMN public.token_usage.input_tokens IS 'Number of input/prompt tokens consumed';
COMMENT ON COLUMN public.token_usage.output_tokens IS 'Number of output/completion tokens generated';
COMMENT ON COLUMN public.token_usage.total_tokens IS 'Total tokens (input + output)';
COMMENT ON COLUMN public.token_usage.input_cost IS 'Cost for input tokens in USD';
COMMENT ON COLUMN public.token_usage.output_cost IS 'Cost for output tokens in USD';
COMMENT ON COLUMN public.token_usage.total_cost IS 'Total cost in USD (input_cost + output_cost)';

-- ============================================================================
-- VERIFICATION QUERIES (Optional - Run these to test)
-- ============================================================================

-- Check if table was created successfully
-- SELECT COUNT(*) FROM public.token_usage;

-- Test the user token usage function
-- SELECT * FROM public.get_user_token_usage(auth.uid(), NOW() - interval '30 days', NOW());

-- Test the provider stats function
-- SELECT * FROM public.get_provider_usage_stats('openai', 7);

-- View token usage summary
-- SELECT * FROM public.token_usage_summary LIMIT 10;

-- ============================================================================
-- SETUP COMPLETE!
-- The token_usage table is now ready to track AI API usage
-- ============================================================================

