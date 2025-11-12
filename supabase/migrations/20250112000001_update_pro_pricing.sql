-- Update Pro plan pricing to $29/month and $24.99/month if billed yearly ($299.88/year)
-- This aligns all pricing across the application

BEGIN;

-- Update Pro plan pricing
UPDATE subscription_plans
SET
  price_monthly = 29.00,
  price_yearly = 299.88,  -- $24.99/month if billed yearly
  updated_at = now()
WHERE slug = 'pro';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM subscription_plans
  WHERE slug = 'pro' 
    AND price_monthly = 29.00 
    AND price_yearly = 299.88;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Failed to update Pro plan pricing';
  END IF;
END $$;

COMMIT;

