-- Align subscription_plans with new pricing (Pro $29, Max $299, Enterprise custom)
-- Safely update legacy slugs to new ones and set prices/display order

BEGIN;

-- Update legacy Pay Per Employee -> Pro
UPDATE subscription_plans
SET
  name = 'Pro',
  slug = 'pro',
  price_monthly = 29,
  price_yearly = 290,
  popular = COALESCE(popular, false),
  color_gradient = COALESCE(color_gradient, 'from-blue-500 to-cyan-500'),
  active = true
WHERE slug = 'pay-per-employee';

-- Update legacy All Access -> Max
UPDATE subscription_plans
SET
  name = 'Max',
  slug = 'max',
  price_monthly = 299,
  price_yearly = 2990,
  popular = true,
  color_gradient = COALESCE(color_gradient, 'from-purple-500 to-pink-500'),
  active = true
WHERE slug = 'all-access';

-- Ensure display order is consistent
UPDATE subscription_plans SET display_order = 1 WHERE slug = 'pro';
UPDATE subscription_plans SET display_order = 2 WHERE slug = 'max';
UPDATE subscription_plans SET display_order = 3 WHERE slug = 'enterprise';

COMMIT;


