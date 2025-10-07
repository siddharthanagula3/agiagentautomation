-- Create token_usage table for tracking AI API token consumption
-- This table stores detailed usage data for each AI provider (OpenAI, Anthropic, Google, Perplexity)

CREATE TABLE IF NOT EXISTS public.token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'perplexity')),
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON public.token_usage(provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_provider ON public.token_usage(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_session_id ON public.token_usage(session_id);

-- Enable Row Level Security
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

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

-- Create a view for aggregated token usage by user and provider
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

-- Create a function to get user's total token usage
CREATE OR REPLACE FUNCTION public.get_user_token_usage(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    provider TEXT,
    model TEXT,
    request_count BIGINT,
    total_input_tokens BIGINT,
    total_output_tokens BIGINT,
    total_tokens BIGINT,
    total_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.provider,
        t.model,
        COUNT(*)::BIGINT as request_count,
        SUM(t.input_tokens)::BIGINT as total_input_tokens,
        SUM(t.output_tokens)::BIGINT as total_output_tokens,
        SUM(t.total_tokens)::BIGINT as total_tokens,
        SUM(t.total_cost)::NUMERIC as total_cost
    FROM public.token_usage t
    WHERE t.user_id = p_user_id
        AND (p_start_date IS NULL OR t.created_at >= p_start_date)
        AND (p_end_date IS NULL OR t.created_at <= p_end_date)
    GROUP BY t.provider, t.model
    ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get provider usage statistics
CREATE OR REPLACE FUNCTION public.get_provider_usage_stats(
    p_provider TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    provider TEXT,
    model TEXT,
    total_requests BIGINT,
    total_tokens BIGINT,
    total_cost NUMERIC,
    avg_tokens_per_request NUMERIC,
    avg_cost_per_request NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.provider,
        t.model,
        COUNT(*)::BIGINT as total_requests,
        SUM(t.total_tokens)::BIGINT as total_tokens,
        SUM(t.total_cost)::NUMERIC as total_cost,
        AVG(t.total_tokens)::NUMERIC as avg_tokens_per_request,
        AVG(t.total_cost)::NUMERIC as avg_cost_per_request
    FROM public.token_usage t
    WHERE (p_provider IS NULL OR t.provider = p_provider)
        AND t.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY t.provider, t.model
    ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_token_usage(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_usage_stats(TEXT, INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.token_usage IS 'Tracks AI API token usage and costs for all providers';
COMMENT ON COLUMN public.token_usage.user_id IS 'User who made the request (null for anonymous)';
COMMENT ON COLUMN public.token_usage.session_id IS 'Chat session identifier for grouping requests';
COMMENT ON COLUMN public.token_usage.provider IS 'AI provider: openai, anthropic, google, or perplexity';
COMMENT ON COLUMN public.token_usage.model IS 'Specific model used (e.g., gpt-4o-mini, claude-3-5-sonnet)';
COMMENT ON COLUMN public.token_usage.input_tokens IS 'Number of input/prompt tokens';
COMMENT ON COLUMN public.token_usage.output_tokens IS 'Number of output/completion tokens';
COMMENT ON COLUMN public.token_usage.total_tokens IS 'Total tokens (input + output)';
COMMENT ON COLUMN public.token_usage.input_cost IS 'Cost for input tokens in USD';
COMMENT ON COLUMN public.token_usage.output_cost IS 'Cost for output tokens in USD';
COMMENT ON COLUMN public.token_usage.total_cost IS 'Total cost in USD';

