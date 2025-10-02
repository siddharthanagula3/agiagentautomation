-- Update pricing model to new structure
-- New model: $1/employee per month OR $19 for all employees with $10 bonus credits

-- First, clear existing pricing plans
DELETE FROM public.subscription_plans;

-- Add new pricing plans
INSERT INTO public.subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  features,
  not_included,
  popular,
  color_gradient,
  display_order
) VALUES
-- Pay Per Employee Plan
(
  'Pay Per Employee',
  'pay-per-employee',
  'Perfect for teams that want flexibility',
  1.00,
  1.00,
  '["$1 per AI employee per month", "Pay-as-you-go after purchase", "No upfront commitment", "Cancel anytime", "Weekly billing", "All AI features included", "24/7 Support"]'::jsonb,
  '[]'::jsonb,
  false,
  'from-blue-500 to-cyan-500',
  1
),

-- All Access Plan with Bonus Credits
(
  'All Access',
  'all-access',
  'Best value - Hire unlimited AI employees',
  19.00,
  19.00,
  '["Hire ALL AI employees", "$10 bonus credits for first-time users", "Pay-as-you-go after credits", "Weekly billing", "All AI features included", "Priority support", "Advanced analytics", "Custom integrations"]'::jsonb,
  '[]'::jsonb,
  true,
  'from-purple-500 to-pink-500',
  2
),

-- Enterprise Plan
(
  'Enterprise',
  'enterprise',
  'Custom pricing for large organizations',
  0.00,
  0.00,
  '["Unlimited AI employees", "Custom credit packages", "Volume discounts", "Dedicated account manager", "SLA guarantees", "Custom integrations", "Advanced security", "Training & onboarding", "24/7 Priority support"]'::jsonb,
  '[]'::jsonb,
  false,
  'from-orange-500 to-red-500',
  3
);

-- Add table for user credits (for tracking $10 bonus credits and pay-as-you-go)
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,

  -- Credit balance
  bonus_credits DECIMAL(10, 2) DEFAULT 0.00,
  purchased_credits DECIMAL(10, 2) DEFAULT 0.00,
  total_credits DECIMAL(10, 2) GENERATED ALWAYS AS (bonus_credits + purchased_credits) STORED,

  -- Tracking
  credits_used DECIMAL(10, 2) DEFAULT 0.00,
  last_credit_purchase TIMESTAMPTZ,
  first_time_user BOOLEAN DEFAULT true,

  -- Billing
  weekly_billing_enabled BOOLEAN DEFAULT false,
  last_billing_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Add RLS policies for user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits" ON public.user_credits
  FOR INSERT WITH CHECK (true);

-- Add table for credit transactions (audit trail)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_credit_id UUID REFERENCES public.user_credits(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bonus', 'purchase', 'usage', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,

  -- For usage transactions
  ai_employee_id UUID,
  workflow_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_next_billing ON public.user_credits(next_billing_date) WHERE weekly_billing_enabled = true;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_timestamp
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_timestamp();

-- Function to initialize credits for new subscription
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  plan_slug TEXT;
  is_first_time BOOLEAN;
BEGIN
  -- Get the plan slug
  SELECT sp.slug INTO plan_slug
  FROM public.subscription_plans sp
  WHERE sp.id = NEW.plan_id;

  -- Check if user already has credits record
  SELECT NOT EXISTS(SELECT 1 FROM public.user_credits WHERE user_id = NEW.user_id) INTO is_first_time;

  -- Insert or update user_credits
  INSERT INTO public.user_credits (user_id, subscription_id, first_time_user, bonus_credits, weekly_billing_enabled)
  VALUES (
    NEW.user_id,
    NEW.id,
    is_first_time,
    CASE
      WHEN plan_slug = 'all-access' AND is_first_time THEN 10.00
      ELSE 0.00
    END,
    true
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription_id = NEW.id,
    bonus_credits = CASE
      WHEN plan_slug = 'all-access' AND user_credits.first_time_user THEN user_credits.bonus_credits + 10.00
      ELSE user_credits.bonus_credits
    END,
    updated_at = NOW();

  -- Record bonus credit transaction if applicable
  IF plan_slug = 'all-access' AND is_first_time THEN
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
    VALUES (NEW.user_id, 'bonus', 10.00, 'First-time user bonus credits for All Access plan');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to initialize credits on subscription creation
CREATE TRIGGER initialize_credits_on_subscription
  AFTER INSERT ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();
