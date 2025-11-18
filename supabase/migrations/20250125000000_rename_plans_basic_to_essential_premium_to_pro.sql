-- Migration: Rename Plans from basic/premium to essential/pro
-- Date: 2025-01-25
-- Description: Renames plan IDs and names from "basic"/"premium" to "essential"/"pro" for clarity and consistency

-- ============================================================================
-- RENAME PLAN IDs AND NAMES
-- ============================================================================
-- Note: We cannot directly update primary keys that are referenced by foreign keys.
-- Strategy: Insert new plans, update references, then delete old plans.

-- Step 1: Insert new Plan records with new IDs, copying all data from old ones
INSERT INTO "Plan" (
  "id",
  "name",
  "priceMonthly",
  "priceYearly",
  "features",
  "stripePriceIdMonthly",
  "stripePriceIdYearly",
  "stripeProductId",
  "createdAt",
  "updatedAt"
)
SELECT 
  'essential' as "id",
  'Essential' as "name",
  "priceMonthly",
  "priceYearly",
  "features",
  "stripePriceIdMonthly",
  "stripePriceIdYearly",
  "stripeProductId",
  "createdAt",
  NOW() as "updatedAt"
FROM "Plan"
WHERE "id" = 'basic'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Plan" (
  "id",
  "name",
  "priceMonthly",
  "priceYearly",
  "features",
  "stripePriceIdMonthly",
  "stripePriceIdYearly",
  "stripeProductId",
  "createdAt",
  "updatedAt"
)
SELECT 
  'pro' as "id",
  'Pro' as "name",
  "priceMonthly",
  "priceYearly",
  "features",
  "stripePriceIdMonthly",
  "stripePriceIdYearly",
  "stripeProductId",
  "createdAt",
  NOW() as "updatedAt"
FROM "Plan"
WHERE "id" = 'premium'
ON CONFLICT ("id") DO NOTHING;

-- Step 2: Update all Subscription records to reference the new plan IDs
UPDATE "Subscription"
SET "planId" = 'essential', "updatedAt" = NOW()
WHERE "planId" = 'basic';

UPDATE "Subscription"
SET "planId" = 'pro', "updatedAt" = NOW()
WHERE "planId" = 'premium';

-- Step 3: Delete the old Plan records (only if no subscriptions reference them)
-- This is safe because we've already updated all subscriptions above
DELETE FROM "Plan"
WHERE "id" IN ('basic', 'premium');

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify after running)
-- ============================================================================
-- SELECT id, name, "priceMonthly", "priceYearly"
-- FROM "Plan"
-- ORDER BY "priceMonthly";
--
-- SELECT COUNT(*) as essential_count
-- FROM "Subscription"
-- WHERE "planId" = 'essential';
--
-- SELECT COUNT(*) as pro_count
-- FROM "Subscription"
-- WHERE "planId" = 'pro';

