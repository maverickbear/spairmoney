-- Add Trial plan to app_plans (copy of Pro with price 0 and no Stripe).
-- Run this in Supabase SQL Editor after the Pro plan exists.
--
-- Trial: same features as Pro, 30-day duration via app_subscriptions.trial_end_date.
-- New users get an app_subscription with plan_id = 'trial' on signup.

INSERT INTO app_plans (
  id,
  name,
  price_monthly,
  price_yearly,
  features,
  stripe_price_id_monthly,
  stripe_price_id_yearly,
  stripe_product_id,
  created_at,
  updated_at
)
SELECT
  'trial',
  'Trial',
  0,
  0,
  features,
  NULL,
  NULL,
  NULL,
  now(),
  now()
FROM app_plans
WHERE id = 'pro'
LIMIT 1
ON CONFLICT (id) DO NOTHING;
