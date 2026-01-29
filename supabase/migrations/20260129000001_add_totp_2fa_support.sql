-- Migration: Add TOTP 2FA support to user_settings
-- This adds the necessary columns for storing TOTP secrets and backup codes

-- Add TOTP 2FA columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS backup_codes_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS backup_codes_used INTEGER DEFAULT 0;

-- Add comment explaining the columns
COMMENT ON COLUMN public.user_settings.totp_secret IS 'Encrypted TOTP secret for 2FA (base32 encoded)';
COMMENT ON COLUMN public.user_settings.totp_enabled_at IS 'Timestamp when TOTP 2FA was enabled';
COMMENT ON COLUMN public.user_settings.backup_codes IS 'Array of hashed backup codes for 2FA recovery';
COMMENT ON COLUMN public.user_settings.backup_codes_generated_at IS 'Timestamp when backup codes were generated';
COMMENT ON COLUMN public.user_settings.backup_codes_used IS 'Count of backup codes that have been used';

-- Create index for faster lookups when verifying 2FA status
CREATE INDEX IF NOT EXISTS idx_user_settings_two_factor
ON public.user_settings(id)
WHERE two_factor_enabled = true;

-- Update the handle_new_user trigger function to include new columns with default values
-- (This ensures new users get proper defaults for 2FA columns)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user_profiles entry
  INSERT INTO public.user_profiles (
    id,
    name,
    timezone,
    language,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'America/New_York',
    'en',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create user_settings entry with defaults including 2FA columns
  INSERT INTO public.user_settings (
    id,
    email_notifications,
    push_notifications,
    workflow_alerts,
    employee_updates,
    system_maintenance,
    marketing_emails,
    weekly_reports,
    instant_alerts,
    two_factor_enabled,
    totp_secret,
    totp_enabled_at,
    backup_codes,
    backup_codes_generated_at,
    backup_codes_used,
    session_timeout,
    theme,
    auto_save,
    debug_mode,
    analytics_enabled,
    cache_size,
    backup_frequency,
    retention_period,
    max_concurrent_jobs,
    default_ai_provider,
    default_ai_model,
    prefer_streaming,
    ai_temperature,
    ai_max_tokens,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    true,  -- email_notifications
    true,  -- push_notifications
    true,  -- workflow_alerts
    true,  -- employee_updates
    true,  -- system_maintenance
    false, -- marketing_emails
    true,  -- weekly_reports
    true,  -- instant_alerts
    false, -- two_factor_enabled
    NULL,  -- totp_secret (not set until 2FA enabled)
    NULL,  -- totp_enabled_at
    NULL,  -- backup_codes (generated when 2FA enabled)
    NULL,  -- backup_codes_generated_at
    0,     -- backup_codes_used
    60,    -- session_timeout (minutes)
    'dark', -- theme
    true,  -- auto_save
    false, -- debug_mode
    true,  -- analytics_enabled
    '1GB', -- cache_size
    'daily', -- backup_frequency
    30,    -- retention_period
    10,    -- max_concurrent_jobs
    'openai', -- default_ai_provider
    'gpt-4o', -- default_ai_model
    true,  -- prefer_streaming
    0.7,   -- ai_temperature
    4000,  -- ai_max_tokens
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create user_token_balances entry if function exists
  BEGIN
    PERFORM get_or_create_token_balance(NEW.id);
  EXCEPTION WHEN undefined_function THEN
    -- Function doesn't exist yet, skip
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
