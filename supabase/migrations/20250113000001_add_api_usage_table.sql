-- Add api_usage table for tracking API calls with detailed metadata
-- Migration: 20250113000001_add_api_usage_table.sql

CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API call details
  provider TEXT NOT NULL CHECK (provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'google'::text, 'perplexity'::text])),
  model TEXT,
  operation_type TEXT NOT NULL,
  
  -- Token usage
  tokens_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  
  -- Cost tracking
  cost NUMERIC NOT NULL DEFAULT 0,
  
  -- Context tracking
  agent_type TEXT,
  execution_id UUID,
  session_id TEXT,
  task_id TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX idx_api_usage_timestamp ON public.api_usage(timestamp DESC);
CREATE INDEX idx_api_usage_provider ON public.api_usage(provider);
CREATE INDEX idx_api_usage_agent_type ON public.api_usage(agent_type);
CREATE INDEX idx_api_usage_execution_id ON public.api_usage(execution_id);
CREATE INDEX idx_api_usage_session_id ON public.api_usage(session_id);
CREATE INDEX idx_api_usage_task_id ON public.api_usage(task_id);

-- Composite index for user usage queries
CREATE INDEX idx_api_usage_user_timestamp ON public.api_usage(user_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own API usage
CREATE POLICY "Users can view their own API usage"
  ON public.api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own API usage
CREATE POLICY "Users can insert their own API usage"
  ON public.api_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

