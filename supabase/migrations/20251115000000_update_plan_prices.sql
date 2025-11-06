-- Migration: Update Plan Prices to Recommended Values
-- This migration updates the plan prices to the recommended pricing structure
-- Based on PRICING_ANALYSIS.md recommendations

-- Update Basic plan prices
UPDATE "Plan"
SET 
  "priceMonthly" = 7.99,
  "priceYearly" = 79.90,
  "updatedAt" = NOW()
WHERE "id" = 'basic';

-- Update Premium plan prices
UPDATE "Plan"
SET 
  "priceMonthly" = 14.99,
  "priceYearly" = 149.90,
  "updatedAt" = NOW()
WHERE "id" = 'premium';

-- Note: Free plan remains at $0.00 (no changes needed)

