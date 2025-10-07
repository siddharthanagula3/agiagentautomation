-- Migration: Add Stripe Integration Columns
-- Date: 2025-01-07
-- Description: Adds Stripe-related columns to support payment integration for AI employee subscriptions

-- Add Stripe subscription columns to purchased_employees if they don't exist
DO $$
BEGIN
  -- stripe_subscription_id
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'purchased_employees'
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.purchased_employees ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- stripe_customer_id
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'purchased_employees'
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.purchased_employees ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Create indexes for faster Stripe lookups if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'purchased_employees'
    AND indexname = 'idx_purchased_employees_stripe_subscription'
  ) THEN
    CREATE INDEX idx_purchased_employees_stripe_subscription
    ON public.purchased_employees(stripe_subscription_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'purchased_employees'
    AND indexname = 'idx_purchased_employees_stripe_customer'
  ) THEN
    CREATE INDEX idx_purchased_employees_stripe_customer
    ON public.purchased_employees(stripe_customer_id);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.purchased_employees.stripe_subscription_id IS 'Stripe subscription ID for this AI employee hire';
COMMENT ON COLUMN public.purchased_employees.stripe_customer_id IS 'Stripe customer ID associated with this purchase';

