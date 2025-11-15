-- Migration: Update Stripe Production IDs
-- Date: 2025-01-01
-- Description: Updates Stripe Product IDs and Price IDs for production environment
-- Note: These are Live Mode IDs from Stripe Dashboard

-- ============================================================================
-- UPDATE PREMIUM PLAN
-- ============================================================================
UPDATE "Plan"
SET 
  "stripeProductId" = 'prod_TPjK1vCBWIGTa2',
  "stripePriceIdMonthly" = 'price_1SStrqEj1ttZtjC0bOlejqd7',
  "stripePriceIdYearly" = 'price_1SStrqEj1ttZtjC0JY2Il3XQ',
  "updatedAt" = NOW()
WHERE "id" = 'premium';

-- ============================================================================
-- UPDATE BASIC PLAN
-- ============================================================================
UPDATE "Plan"
SET 
  "stripeProductId" = 'prod_TPjKHNbEzYW73x',
  "stripePriceIdMonthly" = 'price_1SStrmEj1ttZtjC0zDCZVsnJ',
  "stripePriceIdYearly" = 'price_1SStrmEj1ttZtjC0UwcdYRBZ',
  "updatedAt" = NOW()
WHERE "id" = 'basic';

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify after running)
-- ============================================================================
-- SELECT 
--   id,
--   name,
--   "stripeProductId",
--   "stripePriceIdMonthly",
--   "stripePriceIdYearly"
-- FROM "Plan"
-- WHERE "id" IN ('basic', 'premium');

