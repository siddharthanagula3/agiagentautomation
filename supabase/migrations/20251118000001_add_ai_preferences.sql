-- Add AI preference fields to user_settings table
-- This migration adds default provider and model preferences for AI chat

-- Add columns for AI preferences
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS default_ai_provider text DEFAULT 'openai'::text
  CHECK (default_ai_provider IN ('openai', 'anthropic', 'google', 'perplexity')),
ADD COLUMN IF NOT EXISTS default_ai_model text DEFAULT 'gpt-4o'::text,
ADD COLUMN IF NOT EXISTS prefer_streaming boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_temperature numeric DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 2),
ADD COLUMN IF NOT EXISTS ai_max_tokens integer DEFAULT 4000 CHECK (ai_max_tokens > 0);

-- Add comment to document the new columns
COMMENT ON COLUMN public.user_settings.default_ai_provider IS 'Default AI provider for general chat (openai, anthropic, google, perplexity)';
COMMENT ON COLUMN public.user_settings.default_ai_model IS 'Default AI model for the selected provider';
COMMENT ON COLUMN public.user_settings.prefer_streaming IS 'Whether to use streaming responses by default';
COMMENT ON COLUMN public.user_settings.ai_temperature IS 'Default temperature for AI responses (0-2)';
COMMENT ON COLUMN public.user_settings.ai_max_tokens IS 'Default max tokens for AI responses';
