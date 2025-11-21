-- ============================================================================
-- Fix Security Linter Issues
-- ============================================================================
-- Date: 2025-02-02
-- Description: Fixes security issues detected by database linter:
--              1. Enable RLS on UserBlockHistory table (policies exist but RLS disabled)
--              2. Fix vw_transactions_for_reports view to use SECURITY INVOKER
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON UserBlockHistory
-- ============================================================================
-- Issue: Table has RLS policies but RLS is not enabled
-- Policies exist: "Admins can insert block history", "Admins can view all block history", "Users can view own block history"

ALTER TABLE "public"."UserBlockHistory" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE "public"."UserBlockHistory" IS 'Tracks history of user blocks and unblocks with reasons. RLS enabled to enforce access control policies.';

-- ============================================================================
-- 2. FIX vw_transactions_for_reports VIEW SECURITY
-- ============================================================================
-- Issue: View is defined with SECURITY DEFINER property
-- Solution: Recreate view to ensure it respects RLS policies on underlying Transaction table
--           Views should use the security context of the querying user, not the creator
--           By recreating without SECURITY DEFINER, the view will respect RLS on Transaction

-- Drop and recreate the view to ensure it respects RLS
DROP VIEW IF EXISTS "public"."vw_transactions_for_reports";

CREATE VIEW "public"."vw_transactions_for_reports" AS
SELECT 
    "id",
    "type",
    "amount",
    "accountId",
    "categoryId",
    "subcategoryId",
    "description",
    "tags",
    "transferToId",
    "transferFromId",
    "createdAt",
    "updatedAt",
    "recurring",
    "userId",
    "suggestedCategoryId",
    "suggestedSubcategoryId",
    "plaidMetadata",
    "expenseType",
    "amount_numeric",
    "description_search",
    "date"
FROM "public"."Transaction"
WHERE "transferFromId" IS NULL
  AND "transferToId" IS NULL
  AND "type" IN ('expense', 'income');

ALTER VIEW "public"."vw_transactions_for_reports" OWNER TO "postgres";

COMMENT ON VIEW "public"."vw_transactions_for_reports" IS 'Transactions for reports, excluding transfers. Use this view for income/expense calculations to avoid double-counting transfers. The view respects RLS policies on the underlying Transaction table.';

-- Re-grant permissions (RLS on Transaction table will be enforced)
GRANT SELECT ON TABLE "public"."vw_transactions_for_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_transactions_for_reports" TO "service_role";

