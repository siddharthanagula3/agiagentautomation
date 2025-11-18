-- Backfill existing auth.users who don't have entries in public.users, user_profiles, or user_settings
-- This fixes any users who signed up before the handle_new_user trigger was added

-- Backfill public.users
INSERT INTO public.users (id, email, name, role, plan, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  'user',
  'free',
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Backfill public.user_profiles
INSERT INTO public.user_profiles (id, name, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Backfill public.user_settings
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
  ai_max_tokens,
  created_at,
  updated_at
)
SELECT
  au.id,
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
  4000,  -- ai_max_tokens
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings us WHERE us.id = au.id
)
ON CONFLICT (id) DO NOTHING;
