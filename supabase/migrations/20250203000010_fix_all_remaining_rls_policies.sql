-- ============================================================================
-- Fix All Remaining RLS Policies Performance Issues
-- ============================================================================
-- Date: 2025-02-03
-- Description: Fixes ALL remaining RLS policies that still use auth.uid() or
--              auth.role() directly instead of (select auth.uid()) or
--              (select auth.role()). This prevents re-evaluation for each row.
-- ============================================================================
-- Note: This migration addresses ALL policies that the linter is still flagging
-- after the previous migrations. It ensures every policy uses the optimized
-- pattern, including those in subqueries and those that may have been missed.

-- ============================================================================
-- PART 1: FIX REMAINING AUTH RLS INITPLAN ISSUES
-- ============================================================================
-- Replace ALL instances of auth.uid() and auth.role() with (select auth.uid())
-- and (select auth.role()) to prevent re-evaluation for each row.

-- PlaidConnection policies (ensure all use optimized pattern)
DROP POLICY IF EXISTS "Users can view their own Plaid connections" ON "public"."PlaidConnection";
CREATE POLICY "Users can view their own Plaid connections" ON "public"."PlaidConnection"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own Plaid connections" ON "public"."PlaidConnection";
CREATE POLICY "Users can insert their own Plaid connections" ON "public"."PlaidConnection"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own Plaid connections" ON "public"."PlaidConnection";
CREATE POLICY "Users can update their own Plaid connections" ON "public"."PlaidConnection"
FOR UPDATE
USING ("userId" = (select auth.uid()))
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own Plaid connections" ON "public"."PlaidConnection";
CREATE POLICY "Users can delete their own Plaid connections" ON "public"."PlaidConnection"
FOR DELETE
USING ("userId" = (select auth.uid()));

-- Household policies
DROP POLICY IF EXISTS "Users can create households" ON "public"."Household";
CREATE POLICY "Users can create households" ON "public"."Household"
FOR INSERT
WITH CHECK ("createdBy" = (select auth.uid()));

DROP POLICY IF EXISTS "Owners can update their households" ON "public"."Household";
CREATE POLICY "Owners can update their households" ON "public"."Household"
FOR UPDATE
USING ("createdBy" = (select auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their households" ON "public"."Household";
CREATE POLICY "Owners can delete their households" ON "public"."Household"
FOR DELETE
USING ("createdBy" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their households" ON "public"."Household";
CREATE POLICY "Users can view their households" ON "public"."Household"
FOR SELECT
USING (
    "id" IN (SELECT household_id FROM get_user_household_ids())
    OR "createdBy" = (select auth.uid())
);

-- AccountOwner policies
DROP POLICY IF EXISTS "Users can view account owners" ON "public"."AccountOwner";
CREATE POLICY "Users can view account owners" ON "public"."AccountOwner"
FOR SELECT
USING (
    "ownerId" = (select auth.uid())
    OR get_account_user_id("accountId") = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert account owners" ON "public"."AccountOwner";
CREATE POLICY "Users can insert account owners" ON "public"."AccountOwner"
FOR INSERT
WITH CHECK (
    "ownerId" = (select auth.uid())
    OR get_account_user_id("accountId") = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update account owners" ON "public"."AccountOwner";
CREATE POLICY "Users can update account owners" ON "public"."AccountOwner"
FOR UPDATE
USING (
    "ownerId" = (select auth.uid())
    OR get_account_user_id("accountId") = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete account owners" ON "public"."AccountOwner";
CREATE POLICY "Users can delete account owners" ON "public"."AccountOwner"
FOR DELETE
USING (
    "ownerId" = (select auth.uid())
    OR get_account_user_id("accountId") = (select auth.uid())
);

-- Feedback policies
DROP POLICY IF EXISTS "Users can view own feedback submissions" ON "public"."Feedback";
CREATE POLICY "Users can view own feedback submissions" ON "public"."Feedback"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own feedback submissions" ON "public"."Feedback";
CREATE POLICY "Users can insert own feedback submissions" ON "public"."Feedback"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all feedback submissions" ON "public"."Feedback";
CREATE POLICY "Super admins can view all feedback submissions" ON "public"."Feedback"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- user_monthly_usage policies
DROP POLICY IF EXISTS "Users can view own monthly usage" ON "public"."user_monthly_usage";
CREATE POLICY "Users can view own monthly usage" ON "public"."user_monthly_usage"
FOR SELECT
USING ("user_id" = (select auth.uid()));

-- UserActiveHousehold policies
DROP POLICY IF EXISTS "Users can view their active household" ON "public"."UserActiveHousehold";
CREATE POLICY "Users can view their active household" ON "public"."UserActiveHousehold"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can set their active household" ON "public"."UserActiveHousehold";
CREATE POLICY "Users can set their active household" ON "public"."UserActiveHousehold"
FOR ALL
USING ("userId" = (select auth.uid()))
WITH CHECK (
    "userId" = (select auth.uid())
    AND "householdId" IN (SELECT household_id FROM get_user_household_ids())
);

-- Account policies (household-based)
DROP POLICY IF EXISTS "Users can view household accounts" ON "public"."Account";
CREATE POLICY "Users can view household accounts" ON "public"."Account"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
    OR can_access_account_via_accountowner("id")
    OR is_current_user_admin()
);

DROP POLICY IF EXISTS "Users can insert household accounts" ON "public"."Account";
CREATE POLICY "Users can insert household accounts" ON "public"."Account"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household accounts" ON "public"."Account";
CREATE POLICY "Users can update household accounts" ON "public"."Account"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
    OR can_access_account_via_accountowner("id")
    OR is_current_user_admin()
);

DROP POLICY IF EXISTS "Users can delete household accounts" ON "public"."Account";
CREATE POLICY "Users can delete household accounts" ON "public"."Account"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
    OR can_access_account_via_accountowner("id")
    OR is_current_user_admin()
);

-- PlaidLiability policies
DROP POLICY IF EXISTS "Users can view household Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can view household Plaid liabilities" ON "public"."PlaidLiability"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."Account"
        WHERE "Account"."id" = "PlaidLiability"."accountId"
        AND (
            "Account"."userId" = (select auth.uid())
            OR can_access_account_via_accountowner("Account"."id")
            OR can_access_household_data("Account"."householdId", 'read')
        )
    )
);

DROP POLICY IF EXISTS "Users can insert their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can insert their own Plaid liabilities" ON "public"."PlaidLiability"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."Account"
        WHERE "Account"."id" = "PlaidLiability"."accountId"
        AND (
            "Account"."userId" = (select auth.uid())
            OR can_access_account_via_accountowner("Account"."id")
            OR can_access_household_data("Account"."householdId", 'write')
        )
    )
);

DROP POLICY IF EXISTS "Users can update their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can update their own Plaid liabilities" ON "public"."PlaidLiability"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Account"
        WHERE "Account"."id" = "PlaidLiability"."accountId"
        AND (
            "Account"."userId" = (select auth.uid())
            OR can_access_account_via_accountowner("Account"."id")
            OR can_access_household_data("Account"."householdId", 'write')
        )
    )
);

DROP POLICY IF EXISTS "Users can delete their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can delete their own Plaid liabilities" ON "public"."PlaidLiability"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Account"
        WHERE "Account"."id" = "PlaidLiability"."accountId"
        AND (
            "Account"."userId" = (select auth.uid())
            OR can_access_account_via_accountowner("Account"."id")
            OR can_access_household_data("Account"."householdId", 'delete')
        )
    )
);

-- QuestradeConnection policies
DROP POLICY IF EXISTS "Users can view their own Questrade connections" ON "public"."QuestradeConnection";
CREATE POLICY "Users can view their own Questrade connections" ON "public"."QuestradeConnection"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own Questrade connections" ON "public"."QuestradeConnection";
CREATE POLICY "Users can insert their own Questrade connections" ON "public"."QuestradeConnection"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own Questrade connections" ON "public"."QuestradeConnection";
CREATE POLICY "Users can update their own Questrade connections" ON "public"."QuestradeConnection"
FOR UPDATE
USING ("userId" = (select auth.uid()))
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own Questrade connections" ON "public"."QuestradeConnection";
CREATE POLICY "Users can delete their own Questrade connections" ON "public"."QuestradeConnection"
FOR DELETE
USING ("userId" = (select auth.uid()));

-- User policies
DROP POLICY IF EXISTS "Users can view own and household member profiles" ON "public"."User";
CREATE POLICY "Users can view own and household member profiles" ON "public"."User"
FOR SELECT
USING (
    "id" = (select auth.uid())
    OR "id" IN (
        SELECT "userId" FROM "public"."HouseholdMemberNew"
        WHERE "householdId" IN (SELECT household_id FROM get_user_household_ids())
        AND "status" = 'active'
    )
);

DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."User";
CREATE POLICY "Users can insert own profile" ON "public"."User"
FOR INSERT
WITH CHECK ("id" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."User";
CREATE POLICY "Users can update own profile" ON "public"."User"
FOR UPDATE
USING ("id" = (select auth.uid()))
WITH CHECK ("id" = (select auth.uid()));

-- category_learning policies
DROP POLICY IF EXISTS "Users can view own category learning" ON "public"."category_learning";
CREATE POLICY "Users can view own category learning" ON "public"."category_learning"
FOR SELECT
USING ("user_id" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own category learning" ON "public"."category_learning";
CREATE POLICY "Users can insert own category learning" ON "public"."category_learning"
FOR INSERT
WITH CHECK ("user_id" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own category learning" ON "public"."category_learning";
CREATE POLICY "Users can update own category learning" ON "public"."category_learning"
FOR UPDATE
USING ("user_id" = (select auth.uid()))
WITH CHECK ("user_id" = (select auth.uid()));

-- UserBlockHistory policies
DROP POLICY IF EXISTS "Users can view own block history" ON "public"."UserBlockHistory";
CREATE POLICY "Users can view own block history" ON "public"."UserBlockHistory"
FOR SELECT
USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all block history" ON "public"."UserBlockHistory";
CREATE POLICY "Admins can view all block history" ON "public"."UserBlockHistory"
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM "public"."User"
        WHERE "User"."id" = (select auth.uid())
        AND "User"."role" IN ('admin', 'super_admin')
    )
);

-- TransactionSync policies
DROP POLICY IF EXISTS "Users can view household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can view household TransactionSync" ON "public"."TransactionSync"
FOR SELECT
USING (
    ("householdId" IN (SELECT household_id FROM get_user_accessible_households()))
    OR EXISTS (
        SELECT 1 FROM "public"."Account" "a"
        WHERE "a"."id" = "TransactionSync"."accountId"
        AND "a"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can insert household TransactionSync" ON "public"."TransactionSync"
FOR INSERT
WITH CHECK (
    ("householdId" IN (SELECT household_id FROM get_user_accessible_households()))
    OR EXISTS (
        SELECT 1 FROM "public"."Account" "a"
        WHERE "a"."id" = "TransactionSync"."accountId"
        AND "a"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can update household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can update household TransactionSync" ON "public"."TransactionSync"
FOR UPDATE
USING (
    ("householdId" IN (SELECT household_id FROM get_user_accessible_households()))
    OR EXISTS (
        SELECT 1 FROM "public"."Account" "a"
        WHERE "a"."id" = "TransactionSync"."accountId"
        AND "a"."userId" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can delete household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can delete household TransactionSync" ON "public"."TransactionSync"
FOR DELETE
USING (
    ("householdId" IN (SELECT household_id FROM get_user_accessible_households()))
    OR EXISTS (
        SELECT 1 FROM "public"."Account" "a"
        WHERE "a"."id" = "TransactionSync"."accountId"
        AND "a"."userId" = (select auth.uid())
    )
);

-- BudgetCategory policies
DROP POLICY IF EXISTS "Users can view household budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can view household budget categories" ON "public"."BudgetCategory"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "public"."Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
        AND (
            can_access_household_data("Budget"."householdId", 'read')
            OR "Budget"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can insert own budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can insert own budget categories" ON "public"."BudgetCategory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
        AND (
            can_access_household_data("Budget"."householdId", 'write')
            OR "Budget"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can update own budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can update own budget categories" ON "public"."BudgetCategory"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
        AND (
            can_access_household_data("Budget"."householdId", 'write')
            OR "Budget"."userId" = (select auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Users can delete own budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can delete own budget categories" ON "public"."BudgetCategory"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
        AND (
            can_access_household_data("Budget"."householdId", 'delete')
            OR "Budget"."userId" = (select auth.uid())
        )
    )
);

-- Subscription policies (household-based)
DROP POLICY IF EXISTS "Users can view household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can view household subscriptions" ON "public"."Subscription"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can insert household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can insert household subscriptions" ON "public"."Subscription"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can update household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can update household subscriptions" ON "public"."Subscription"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
    OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Users can delete household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can delete household subscriptions" ON "public"."Subscription"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
    OR (select auth.role()) = 'service_role'
);

-- HouseholdMemberNew policies
DROP POLICY IF EXISTS "Users can view household members" ON "public"."HouseholdMemberNew";
CREATE POLICY "Users can view household members" ON "public"."HouseholdMemberNew"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_household_ids())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can be added to households" ON "public"."HouseholdMemberNew";
CREATE POLICY "Users can be added to households" ON "public"."HouseholdMemberNew"
FOR INSERT
WITH CHECK (
    "userId" = (select auth.uid())
    OR "householdId" IN (SELECT household_id FROM get_user_admin_household_ids())
);

DROP POLICY IF EXISTS "Owners and admins can update household members" ON "public"."HouseholdMemberNew";
CREATE POLICY "Owners and admins can update household members" ON "public"."HouseholdMemberNew"
FOR UPDATE
USING (
    "householdId" IN (SELECT household_id FROM get_user_admin_household_ids())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Owners and admins can remove household members" ON "public"."HouseholdMemberNew";
CREATE POLICY "Owners and admins can remove household members" ON "public"."HouseholdMemberNew"
FOR DELETE
USING (
    "householdId" IN (SELECT household_id FROM get_user_admin_household_ids())
    OR "userId" = (select auth.uid())
);

-- Transaction policies (household-based)
DROP POLICY IF EXISTS "Users can view household transactions" ON "public"."Transaction";
CREATE POLICY "Users can view household transactions" ON "public"."Transaction"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household transactions" ON "public"."Transaction";
CREATE POLICY "Users can insert household transactions" ON "public"."Transaction"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household transactions" ON "public"."Transaction";
CREATE POLICY "Users can update household transactions" ON "public"."Transaction"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household transactions" ON "public"."Transaction";
CREATE POLICY "Users can delete household transactions" ON "public"."Transaction"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- InvestmentAccount policies (household-based)
DROP POLICY IF EXISTS "Users can view household investment accounts" ON "public"."InvestmentAccount";
CREATE POLICY "Users can view household investment accounts" ON "public"."InvestmentAccount"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household investment accounts" ON "public"."InvestmentAccount";
CREATE POLICY "Users can insert household investment accounts" ON "public"."InvestmentAccount"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household investment accounts" ON "public"."InvestmentAccount";
CREATE POLICY "Users can update household investment accounts" ON "public"."InvestmentAccount"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household investment accounts" ON "public"."InvestmentAccount";
CREATE POLICY "Users can delete household investment accounts" ON "public"."InvestmentAccount"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- Budget policies (household-based)
DROP POLICY IF EXISTS "Users can view household budgets" ON "public"."Budget";
CREATE POLICY "Users can view household budgets" ON "public"."Budget"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household budgets" ON "public"."Budget";
CREATE POLICY "Users can insert household budgets" ON "public"."Budget"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household budgets" ON "public"."Budget";
CREATE POLICY "Users can update household budgets" ON "public"."Budget"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household budgets" ON "public"."Budget";
CREATE POLICY "Users can delete household budgets" ON "public"."Budget"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- Goal policies (household-based)
DROP POLICY IF EXISTS "Users can view household goals" ON "public"."Goal";
CREATE POLICY "Users can view household goals" ON "public"."Goal"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household goals" ON "public"."Goal";
CREATE POLICY "Users can insert household goals" ON "public"."Goal"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household goals" ON "public"."Goal";
CREATE POLICY "Users can update household goals" ON "public"."Goal"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household goals" ON "public"."Goal";
CREATE POLICY "Users can delete household goals" ON "public"."Goal"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- Debt policies (household-based)
DROP POLICY IF EXISTS "Users can view household debts" ON "public"."Debt";
CREATE POLICY "Users can view household debts" ON "public"."Debt"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household debts" ON "public"."Debt";
CREATE POLICY "Users can insert household debts" ON "public"."Debt"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household debts" ON "public"."Debt";
CREATE POLICY "Users can update household debts" ON "public"."Debt"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household debts" ON "public"."Debt";
CREATE POLICY "Users can delete household debts" ON "public"."Debt"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- PlannedPayment policies (household-based)
DROP POLICY IF EXISTS "Users can view household planned payments" ON "public"."PlannedPayment";
CREATE POLICY "Users can view household planned payments" ON "public"."PlannedPayment"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household planned payments" ON "public"."PlannedPayment";
CREATE POLICY "Users can insert household planned payments" ON "public"."PlannedPayment"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household planned payments" ON "public"."PlannedPayment";
CREATE POLICY "Users can update household planned payments" ON "public"."PlannedPayment"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household planned payments" ON "public"."PlannedPayment";
CREATE POLICY "Users can delete household planned payments" ON "public"."PlannedPayment"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- UserServiceSubscription policies (household-based)
DROP POLICY IF EXISTS "Users can view household service subscriptions" ON "public"."UserServiceSubscription";
CREATE POLICY "Users can view household service subscriptions" ON "public"."UserServiceSubscription"
FOR SELECT
USING (
    can_access_household_data("householdId", 'read')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household service subscriptions" ON "public"."UserServiceSubscription";
CREATE POLICY "Users can insert household service subscriptions" ON "public"."UserServiceSubscription"
FOR INSERT
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household service subscriptions" ON "public"."UserServiceSubscription";
CREATE POLICY "Users can update household service subscriptions" ON "public"."UserServiceSubscription"
FOR UPDATE
USING (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household service subscriptions" ON "public"."UserServiceSubscription";
CREATE POLICY "Users can delete household service subscriptions" ON "public"."UserServiceSubscription"
FOR DELETE
USING (
    can_access_household_data("householdId", 'delete')
    OR "userId" = (select auth.uid())
);

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration fixes ALL remaining RLS policies that were flagged by the
-- linter. However, some warnings may still persist if:
--
-- 1. Policies use helper functions (like get_user_accessible_households(),
--    can_access_household_data(), etc.) that call auth.uid() internally.
--    These functions are SECURITY DEFINER and are optimized at the function
--    level, so the warnings may be false positives.
--
-- 2. The linter detects patterns in complex subqueries that are actually
--    optimized but appear unoptimized to static analysis.
--
-- IMPORTANT: The multiple_permissive_policies warnings are intentional design
-- choices. Multiple policies are needed for different access patterns (e.g.,
-- super_admin vs regular users, service_role vs authenticated users).
-- Consolidating these would require careful analysis and could compromise
-- security. These warnings can be safely ignored.
-- ============================================================================

