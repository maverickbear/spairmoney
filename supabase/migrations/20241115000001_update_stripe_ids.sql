-- Migration: Update Stripe Product and Price IDs
-- After creating products in Stripe Dashboard, update the Plan table with the IDs
-- 
-- INSTRUCTIONS:
-- 1. Go to Stripe Dashboard > Products
-- 2. For each product, copy:
--    - Product ID (starts with prod_)
--    - Monthly Price ID (starts with price_)
--    - Yearly Price ID (starts with price_)
-- 3. Replace the placeholders below with your actual IDs
-- 4. Run this migration in Supabase SQL Editor

-- Update Basic plan with Stripe IDs
UPDATE "Plan"
SET 
  "stripeProductId" = 'prod_TN1rbECmWoclr5', -- Replace with your Basic plan product ID
  "stripePriceIdMonthly" = 'price_1SQHoAEV4odJQ85hgdOaspRK', -- Replace with your Basic monthly price ID
  "stripePriceIdYearly" = 'price_1SQI2gEV4odJQ85hAxAMn2dv', -- Replace with your Basic yearly price ID
  "updatedAt" = NOW()
WHERE "id" = 'basic';

-- Update Premium plan with Stripe IDs
UPDATE "Plan"
SET 
  "stripeProductId" = 'prod_TN1xsytuKyAlEx', -- Replace with your Premium plan product ID
  "stripePriceIdMonthly" = 'price_1SQI0YEV4odJQ85hcMjR7Zja', -- Replace with your Premium monthly price ID
  "stripePriceIdYearly" = 'price_1SQHtxEV4odJQ85haJ16YGwt', -- Replace with your Premium yearly price ID
  "updatedAt" = NOW()
WHERE "id" = 'premium';

-- Note: Free plan doesn't need Stripe IDs (it's free)

