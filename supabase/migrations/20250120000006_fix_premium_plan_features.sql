-- Migration: Fix Pro Plan Features
-- Date: 2025-01-20
-- Description: Ensures Pro plan has hasHousehold and hasInvestments set to true
-- This fixes the issue where Pro users were blocked from accessing household and investments features

-- ============================================================================
-- FIX PRO PLAN FEATURES
-- ============================================================================
-- Update Pro plan to ensure all features are set correctly
-- This uses a complete features object to ensure all fields are properly set
UPDATE "Plan"
SET 
  "features" = jsonb_build_object(
    'maxTransactions', -1,
    'maxAccounts', -1,
    'hasInvestments', true,
    'hasAdvancedReports', true,
    'hasCsvExport', true,
    'hasDebts', true,
    'hasGoals', true,
    'hasBankIntegration', true,
    'hasHousehold', true
  ),
  "updatedAt" = NOW()
WHERE "id" = 'pro';

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify after running)
-- ============================================================================
-- SELECT 
--   id,
--   name,
--   "features"->>'hasHousehold' as has_household,
--   "features"->>'hasInvestments' as has_investments,
--   "features"->>'hasAdvancedReports' as has_advanced_reports,
--   "features"->>'hasCsvExport' as has_csv_export,
--   "features"->>'hasBankIntegration' as has_bank_integration,
--   "features"->>'maxTransactions' as max_transactions,
--   "features"->>'maxAccounts' as max_accounts
-- FROM "Plan"
-- WHERE "id" = 'pro';

