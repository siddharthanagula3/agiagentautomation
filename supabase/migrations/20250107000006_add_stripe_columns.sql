-- Migration: Add Stripe Integration Columns
-- Date: 2025-01-07
-- Description: Adds Stripe-related columns to support payment integration for AI employee subscriptions

-- Add Stripe subscription columns to purchased_employees
DO $$
BEGIN
  -- Add columns if the table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'purchased_employees'
  ) THEN
    -- Add stripe_subscription_id if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'stripe_subscription_id'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- Add stripe_customer_id if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN stripe_customer_id TEXT;
    END IF;

    -- Add subscription_status if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'subscription_status'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;

    -- Add current_period_start if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'current_period_start'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add current_period_end if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'current_period_end'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add cancel_at_period_end if not exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_employees' 
      AND column_name = 'cancel_at_period_end'
    ) THEN
      ALTER TABLE public.purchased_employees ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
    END IF;

    -- Add constraint for subscription_status
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'purchased_employees_subscription_status_check'
    ) THEN
      ALTER TABLE public.purchased_employees
      ADD CONSTRAINT purchased_employees_subscription_status_check 
      CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'));
    END IF;

    -- Create indexes for faster Stripe lookups
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
  END IF;
END $$;

-- Add Stripe invoice/payment history table
CREATE TABLE IF NOT EXISTS public.stripe_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  amount_paid NUMERIC(10, 2) NOT NULL,
  amount_due NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'open', 'paid', 'uncollectible', 'void')
  ),
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  billing_reason TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stripe_invoices
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stripe_invoices' 
    AND policyname = 'stripe_invoices_select'
  ) THEN
    CREATE POLICY "stripe_invoices_select" ON public.stripe_invoices
      FOR SELECT
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Create indexes for invoice lookups
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user 
ON public.stripe_invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_id 
ON public.stripe_invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_subscription 
ON public.stripe_invoices(stripe_subscription_id);

-- Function to sync subscription status from Stripe webhook
CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically update subscription_status based on is_active flag
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.subscription_status := 'canceled';
  ELSIF NEW.is_active = true AND OLD.is_active = false THEN
    NEW.subscription_status := 'active';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update subscription status
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'purchased_employees'
  ) THEN
    DROP TRIGGER IF EXISTS sync_subscription_status_trigger ON public.purchased_employees;
    CREATE TRIGGER sync_subscription_status_trigger
      BEFORE UPDATE ON public.purchased_employees
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_stripe_subscription_status();
  END IF;
END $$;

-- Comment documentation
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'purchased_employees'
  ) THEN
    COMMENT ON COLUMN public.purchased_employees.stripe_subscription_id IS 'Stripe subscription ID for this AI employee';
    COMMENT ON COLUMN public.purchased_employees.subscription_status IS 'Current Stripe subscription status';
  END IF;
END $$;

COMMENT ON TABLE public.stripe_invoices IS 'Stores Stripe invoice records for billing history';
