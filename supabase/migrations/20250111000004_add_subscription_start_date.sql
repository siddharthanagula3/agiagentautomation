-- Add missing subscription_start_date column to users table
-- Migration: 20250111000004_add_subscription_start_date.sql

-- Add subscription_start_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_start_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.users.subscription_start_date IS 'When the current subscription started';
