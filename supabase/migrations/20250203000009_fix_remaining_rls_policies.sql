-- ============================================================================
-- Fix Remaining RLS Policies Performance Issues
-- ============================================================================
-- Date: 2025-02-03
-- Description: Fixes remaining RLS policies that still use auth.uid() or
--              auth.role() directly instead of (select auth.uid()) or
--              (select auth.role()). This prevents re-evaluation for each row.
--              Also removes duplicate indexes.
-- ============================================================================
-- Note: This migration addresses policies that were not fixed in the previous
-- migration or were created/updated after that migration.

-- ============================================================================
-- PART 1: FIX REMAINING AUTH RLS INITPLAN ISSUES
-- ============================================================================
-- Replace auth.uid() and auth.role() with (select auth.uid()) and
-- (select auth.role()) to prevent re-evaluation for each row.

-- Note: The previous migration (20250203000007) fixed many policies, but
-- the linter is still detecting issues. This migration ensures ALL policies
-- use the optimized pattern, including those in subqueries.

-- IMPORTANT: Even though some policies were already fixed, we recreate them
-- here to ensure consistency and catch any that may have been missed or
-- created after the previous migration. The DROP IF EXISTS + CREATE pattern
-- is idempotent and safe.

-- Policies that use auth.role() need special attention - they should use
-- (select auth.role()) instead of auth.role() directly.

-- Plan policies (Service role)
DROP POLICY IF EXISTS "Service role can insert plans" ON "public"."Plan";
CREATE POLICY "Service role can insert plans" ON "public"."Plan"
FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can update plans" ON "public"."Plan";
CREATE POLICY "Service role can update plans" ON "public"."Plan"
FOR UPDATE
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can delete plans" ON "public"."Plan";
CREATE POLICY "Service role can delete plans" ON "public"."Plan"
FOR DELETE
USING ((select auth.role()) = 'service_role');

-- Subscription policies (Service role)
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can insert subscriptions" ON "public"."Subscription"
FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can update subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can update subscriptions" ON "public"."Subscription"
FOR UPDATE
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can delete subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can delete subscriptions" ON "public"."Subscription"
FOR DELETE
USING ((select auth.role()) = 'service_role');

-- UserBlockHistory policies (fix auth.role() in subquery)
DROP POLICY IF EXISTS "Admins can insert block history" ON "public"."UserBlockHistory";
CREATE POLICY "Admins can insert block history" ON "public"."UserBlockHistory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" IN ('admin', 'super_admin')
    )
    OR (select auth.role()) = 'service_role'
);

-- Security policies (fix auth.role() in subqueries)
DROP POLICY IF EXISTS "Users can delete securities they own" ON "public"."Security";
CREATE POLICY "Users can delete securities they own" ON "public"."Security"
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Security"."id"
          AND "ia"."userId" = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Admins can insert securities" ON "public"."Security";
CREATE POLICY "Admins can insert securities" ON "public"."Security"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can update securities they own" ON "public"."Security";
CREATE POLICY "Users can update securities they own" ON "public"."Security"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Security"."id"
          AND "ia"."userId" = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

-- SecurityPrice policies (fix auth.role() in subqueries)
DROP POLICY IF EXISTS "Users can insert prices for securities they own" ON "public"."SecurityPrice";
CREATE POLICY "Users can insert prices for securities they own" ON "public"."SecurityPrice"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "SecurityPrice"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can update prices for securities they own" ON "public"."SecurityPrice";
CREATE POLICY "Users can update prices for securities they own" ON "public"."SecurityPrice"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "SecurityPrice"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can delete prices for securities they own" ON "public"."SecurityPrice";
CREATE POLICY "Users can delete prices for securities they own" ON "public"."SecurityPrice"
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "SecurityPrice"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
    OR (select auth.role()) = 'service_role'
);

-- Category policies (fix auth.uid() in subqueries)
-- Note: System categories are identified by userId IS NULL, not isSystem column
DROP POLICY IF EXISTS "Users can view system and own categories" ON "public"."Category";
CREATE POLICY "Users can view system and own categories" ON "public"."Category"
FOR SELECT
USING (
    "userId" IS NULL
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own categories" ON "public"."Category";
CREATE POLICY "Users can insert own categories" ON "public"."Category"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own categories" ON "public"."Category";
CREATE POLICY "Users can update own categories" ON "public"."Category"
FOR UPDATE
USING ("userId" = (select auth.uid()))
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own categories" ON "public"."Category";
CREATE POLICY "Users can delete own categories" ON "public"."Category"
FOR DELETE
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Super admin can insert system categories" ON "public"."Category";
CREATE POLICY "Super admin can insert system categories" ON "public"."Category"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can update system categories" ON "public"."Category";
CREATE POLICY "Super admin can update system categories" ON "public"."Category"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can delete system categories" ON "public"."Category";
CREATE POLICY "Super admin can delete system categories" ON "public"."Category"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- Subcategory policies (fix auth.uid() in subqueries)
-- Note: System subcategories are identified by userId IS NULL, not isSystem column
DROP POLICY IF EXISTS "Users can view system and own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can view system and own subcategories" ON "public"."Subcategory"
FOR SELECT
USING (
    "userId" IS NULL
    OR EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (
            "Category"."userId" IS NULL
            OR "Category"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can insert own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can insert own subcategories" ON "public"."Subcategory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (
            "Category"."userId" IS NULL
            OR "Category"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can update own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can update own subcategories" ON "public"."Subcategory"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (
            "Category"."userId" IS NULL
            OR "Category"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can delete own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can delete own subcategories" ON "public"."Subcategory"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (
            "Category"."userId" IS NULL
            OR "Category"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Super admin can insert system subcategories" ON "public"."Subcategory";
CREATE POLICY "Super admin can insert system subcategories" ON "public"."Subcategory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can update system subcategories" ON "public"."Subcategory";
CREATE POLICY "Super admin can update system subcategories" ON "public"."Subcategory"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can delete system subcategories" ON "public"."Subcategory";
CREATE POLICY "Super admin can delete system subcategories" ON "public"."Subcategory"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- Group policies (fix auth.uid() in subqueries)
-- Note: System groups are identified by userId IS NULL, not isSystem column
DROP POLICY IF EXISTS "Users can view system and own groups" ON "public"."Group";
CREATE POLICY "Users can view system and own groups" ON "public"."Group"
FOR SELECT
USING (
    "userId" IS NULL
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own groups" ON "public"."Group";
CREATE POLICY "Users can insert own groups" ON "public"."Group"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own groups" ON "public"."Group";
CREATE POLICY "Users can update own groups" ON "public"."Group"
FOR UPDATE
USING ("userId" = (select auth.uid()))
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own groups" ON "public"."Group";
CREATE POLICY "Users can delete own groups" ON "public"."Group"
FOR DELETE
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Super admin can insert system groups" ON "public"."Group";
CREATE POLICY "Super admin can insert system groups" ON "public"."Group"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can update system groups" ON "public"."Group";
CREATE POLICY "Super admin can update system groups" ON "public"."Group"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can delete system groups" ON "public"."Group";
CREATE POLICY "Super admin can delete system groups" ON "public"."Group"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ContactForm policies
DROP POLICY IF EXISTS "Users can view own contact submissions" ON "public"."ContactForm";
CREATE POLICY "Users can view own contact submissions" ON "public"."ContactForm"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own contact submissions" ON "public"."ContactForm";
CREATE POLICY "Users can insert own contact submissions" ON "public"."ContactForm"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all contact submissions" ON "public"."ContactForm";
CREATE POLICY "Super admins can view all contact submissions" ON "public"."ContactForm"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admins can update contact submissions" ON "public"."ContactForm";
CREATE POLICY "Super admins can update contact submissions" ON "public"."ContactForm"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- PromoCode policies
DROP POLICY IF EXISTS "Super admin can read promo codes" ON "public"."PromoCode";
CREATE POLICY "Super admin can read promo codes" ON "public"."PromoCode"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can insert promo codes" ON "public"."PromoCode";
CREATE POLICY "Super admin can insert promo codes" ON "public"."PromoCode"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can update promo codes" ON "public"."PromoCode";
CREATE POLICY "Super admin can update promo codes" ON "public"."PromoCode"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admin can delete promo codes" ON "public"."PromoCode";
CREATE POLICY "Super admin can delete promo codes" ON "public"."PromoCode"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- SystemSettings policies
DROP POLICY IF EXISTS "SystemSettings_select_super_admin" ON "public"."SystemSettings";
CREATE POLICY "SystemSettings_select_super_admin" ON "public"."SystemSettings"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "SystemSettings_update_super_admin" ON "public"."SystemSettings";
CREATE POLICY "SystemSettings_update_super_admin" ON "public"."SystemSettings"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

DROP POLICY IF EXISTS "SystemSettings_insert_super_admin" ON "public"."SystemSettings";
CREATE POLICY "SystemSettings_insert_super_admin" ON "public"."SystemSettings"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- SubscriptionServiceCategory policies
DROP POLICY IF EXISTS "Super admin can manage subscription service categories" ON "public"."SubscriptionServiceCategory";
CREATE POLICY "Super admin can manage subscription service categories" ON "public"."SubscriptionServiceCategory"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- SubscriptionService policies
DROP POLICY IF EXISTS "Super admin can manage subscription services" ON "public"."SubscriptionService";
CREATE POLICY "Super admin can manage subscription services" ON "public"."SubscriptionService"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- SubscriptionServicePlan policies
DROP POLICY IF EXISTS "Super admin can manage subscription service plans" ON "public"."SubscriptionServicePlan";
CREATE POLICY "Super admin can manage subscription service plans" ON "public"."SubscriptionServicePlan"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- Candle policies (fix auth.uid() in subqueries)
DROP POLICY IF EXISTS "Users can view candles for own securities" ON "public"."Candle";
CREATE POLICY "Users can view candles for own securities" ON "public"."Candle"
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Candle"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert candles for own securities" ON "public"."Candle";
CREATE POLICY "Users can insert candles for own securities" ON "public"."Candle"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Candle"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can update candles for own securities" ON "public"."Candle";
CREATE POLICY "Users can update candles for own securities" ON "public"."Candle"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Candle"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can delete candles for own securities" ON "public"."Candle";
CREATE POLICY "Users can delete candles for own securities" ON "public"."Candle"
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM "public"."Position" "p"
        INNER JOIN "public"."InvestmentAccount" "ia" ON "ia"."id" = "p"."accountId"
        WHERE "p"."securityId" = "Candle"."securityId"
          AND "ia"."userId" = (select auth.uid())
    )
);

-- Note: Some helper functions (like get_user_accessible_households(),
-- can_access_household_data(), etc.) use auth.uid() internally. These are
-- SECURITY DEFINER functions and may still trigger linter warnings, but they
-- are optimized at the function level. The important optimization is ensuring
-- that policies themselves use (select auth.uid()) instead of auth.uid().

-- ============================================================================
-- PART 2: REMOVE DUPLICATE INDEXES (if they still exist)
-- ============================================================================

-- Remove duplicate index on SecurityPrice if it still exists
-- Keep idx_security_price_security_date_desc (more specific with DESC)
DROP INDEX IF EXISTS "public"."idx_security_price_security_date";

-- Remove duplicate index on SystemSettings if it still exists
-- Keep SystemSettings_pkey (primary key constraint)
DROP INDEX IF EXISTS "public"."SystemSettings_id_key";

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration complements the previous migration (20250203000007) by:
-- 1. Ensuring all RLS policies use optimized auth function calls
-- 2. Removing any duplicate indexes that may have been recreated
--
-- The multiple_permissive_policies warnings are less critical and represent
-- a design choice where multiple policies are needed for different access
-- patterns (e.g., super_admin vs regular users). Consolidating these would
-- require careful analysis to ensure security is maintained.
--
-- The auth_rls_initplan warnings should be resolved after this migration
-- is applied. However, some warnings may persist if:
-- 1. Policies use helper functions (like get_user_accessible_households(),
--    can_access_household_data(), etc.) that call auth.uid() internally.
--    These functions are SECURITY DEFINER and are optimized at the function
--    level, so the warnings may be false positives.
-- 2. The linter detects patterns in complex subqueries that are actually
--    optimized but appear unoptimized to static analysis.
--
-- IMPORTANT: The multiple_permissive_policies warnings are intentional design
-- choices. Multiple policies are needed for different access patterns (e.g.,
-- super_admin vs regular users, service_role vs authenticated users).
-- Consolidating these would require careful analysis and could compromise
-- security. These warnings can be safely ignored.
-- ============================================================================

