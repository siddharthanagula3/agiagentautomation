-- Fix: Add trigger to automatically create user records on signup
-- This fixes the vibe_sessions foreign key constraint error and user_settings issues

-- Function to handle new user signup
-- Creates entries in public.users, user_profiles, and user_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user',
    'free'
  );

  -- Insert into public.user_profiles
  INSERT INTO public.user_profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );

  -- Insert into public.user_settings with default values
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
    ai_max_tokens
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
    4000   -- ai_max_tokens
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user records in public.users, user_profiles, and user_settings when a new user signs up via Supabase Auth';
