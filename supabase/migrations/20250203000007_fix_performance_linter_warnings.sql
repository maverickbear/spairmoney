-- ============================================================================
-- Fix Performance Linter Warnings
-- ============================================================================
-- Date: 2025-02-03
-- Description: Fixes performance warnings from Supabase database linter:
--              1. Replaces auth.uid() with (select auth.uid()) in RLS policies
--                 to prevent re-evaluation for each row (auth_rls_initplan)
--              2. Removes duplicate indexes
-- ============================================================================
-- Note: This migration updates the most critical policies manually.
-- Additional policies may need updates in future migrations.

-- ============================================================================
-- PART 1: FIX AUTH RLS INITPLAN - Critical Policies
-- ============================================================================
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation
-- for each row. This significantly improves query performance at scale.

-- PlaidConnection policies
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

-- Group policies
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

DROP POLICY IF EXISTS "Users can view system and own groups" ON "public"."Group";
CREATE POLICY "Users can view system and own groups" ON "public"."Group"
FOR SELECT
USING (
    "isSystem" = true
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

-- Household policies
DROP POLICY IF EXISTS "Users can create households" ON "public"."Household";
CREATE POLICY "Users can create households" ON "public"."Household"
FOR INSERT
WITH CHECK ("createdBy" = (select auth.uid()));

DROP POLICY IF EXISTS "Owners can update their households" ON "public"."Household";
CREATE POLICY "Owners can update their households" ON "public"."Household"
FOR UPDATE
USING ("createdBy" = (select auth.uid()))
WITH CHECK ("createdBy" = (select auth.uid()));

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

DROP POLICY IF EXISTS "Users can insert account owners" ON "public"."AccountOwner";
CREATE POLICY "Users can insert account owners" ON "public"."AccountOwner"
FOR INSERT
WITH CHECK (
    "ownerId" = (select auth.uid())
    OR get_account_user_id("accountId") = (select auth.uid())
);

-- Account policies
DROP POLICY IF EXISTS "Users can view household accounts" ON "public"."Account";
CREATE POLICY "Users can view household accounts" ON "public"."Account"
FOR SELECT
USING (
    (
        "householdId" IS NOT NULL 
        AND "householdId" IN (SELECT household_id FROM get_user_household_ids())
    )
    OR "userId" = (select auth.uid())
    OR can_access_account_via_accountowner("id")
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
)
WITH CHECK (
    can_access_household_data("householdId", 'write')
    OR "userId" = (select auth.uid())
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

-- User policies
DROP POLICY IF EXISTS "Users can view own and household member profiles" ON "public"."User";
CREATE POLICY "Users can view own and household member profiles" ON "public"."User"
FOR SELECT
USING (
    "id" = (select auth.uid())
    OR "id" IN (
        SELECT "userId" FROM "public"."HouseholdMemberNew"
        WHERE "householdId" IN (SELECT household_id FROM get_user_household_ids())
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

-- Transaction policies
DROP POLICY IF EXISTS "Users can view household transactions" ON "public"."Transaction";
CREATE POLICY "Users can view household transactions" ON "public"."Transaction"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- InvestmentAccount policies
DROP POLICY IF EXISTS "Users can view household investment accounts" ON "public"."InvestmentAccount";
CREATE POLICY "Users can view household investment accounts" ON "public"."InvestmentAccount"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- Budget policies
DROP POLICY IF EXISTS "Users can view household budgets" ON "public"."Budget";
CREATE POLICY "Users can view household budgets" ON "public"."Budget"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- BudgetCategory policies
DROP POLICY IF EXISTS "Users can view household budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can view household budget categories" ON "public"."BudgetCategory"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
          AND (
            "Budget"."householdId" IN (SELECT household_id FROM get_user_accessible_households())
            OR "Budget"."userId" = (select auth.uid())
          )
    )
);

DROP POLICY IF EXISTS "Users can insert own budget categories" ON "public"."BudgetCategory";
CREATE POLICY "Users can insert own budget categories" ON "public"."BudgetCategory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "Budget"
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
        SELECT 1 FROM "Budget"
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
        SELECT 1 FROM "Budget"
        WHERE "Budget"."id" = "BudgetCategory"."budgetId"
          AND (
            can_access_household_data("Budget"."householdId", 'delete')
            OR "Budget"."userId" = (select auth.uid())
          )
    )
);

-- Goal policies
DROP POLICY IF EXISTS "Users can view household goals" ON "public"."Goal";
CREATE POLICY "Users can view household goals" ON "public"."Goal"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- Debt policies
DROP POLICY IF EXISTS "Users can view household debts" ON "public"."Debt";
CREATE POLICY "Users can view household debts" ON "public"."Debt"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- PlannedPayment policies
DROP POLICY IF EXISTS "Users can view household planned payments" ON "public"."PlannedPayment";
CREATE POLICY "Users can view household planned payments" ON "public"."PlannedPayment"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- UserServiceSubscription policies
DROP POLICY IF EXISTS "Users can view household service subscriptions" ON "public"."UserServiceSubscription";
CREATE POLICY "Users can view household service subscriptions" ON "public"."UserServiceSubscription"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
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
)
WITH CHECK (
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

-- PlaidLiability policies
DROP POLICY IF EXISTS "Users can view household Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can view household Plaid liabilities" ON "public"."PlaidLiability"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "PlaidLiability"."accountId"
          AND (
            a."householdId" IN (SELECT household_id FROM get_user_accessible_households())
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can insert their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can insert their own Plaid liabilities" ON "public"."PlaidLiability"
FOR INSERT
WITH CHECK (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "PlaidLiability"."accountId"
          AND (
            can_access_household_data(a."householdId", 'write')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can update their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can update their own Plaid liabilities" ON "public"."PlaidLiability"
FOR UPDATE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "PlaidLiability"."accountId"
          AND (
            can_access_household_data(a."householdId", 'write')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can delete their own Plaid liabilities" ON "public"."PlaidLiability";
CREATE POLICY "Users can delete their own Plaid liabilities" ON "public"."PlaidLiability"
FOR DELETE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "PlaidLiability"."accountId"
          AND (
            can_access_household_data(a."householdId", 'delete')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

-- TransactionSync policies
DROP POLICY IF EXISTS "Users can view household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can view household TransactionSync" ON "public"."TransactionSync"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "TransactionSync"."accountId"
          AND (
            a."householdId" IN (SELECT household_id FROM get_user_accessible_households())
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can insert household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can insert household TransactionSync" ON "public"."TransactionSync"
FOR INSERT
WITH CHECK (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "TransactionSync"."accountId"
          AND (
            can_access_household_data(a."householdId", 'write')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can update household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can update household TransactionSync" ON "public"."TransactionSync"
FOR UPDATE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "TransactionSync"."accountId"
          AND (
            can_access_household_data(a."householdId", 'write')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "Users can delete household TransactionSync" ON "public"."TransactionSync";
CREATE POLICY "Users can delete household TransactionSync" ON "public"."TransactionSync"
FOR DELETE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR EXISTS (
        SELECT 1 FROM "Account" a
        WHERE a."id" = "TransactionSync"."accountId"
          AND (
            can_access_household_data(a."householdId", 'delete')
            OR EXISTS (
                SELECT 1 FROM "AccountOwner"
                WHERE "accountId" = a."id" AND "ownerId" = (select auth.uid())
            )
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
    OR auth.role() = 'service_role'
);

-- Plan policies (Service role)
DROP POLICY IF EXISTS "Service role can insert plans" ON "public"."Plan";
CREATE POLICY "Service role can insert plans" ON "public"."Plan"
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update plans" ON "public"."Plan";
CREATE POLICY "Service role can update plans" ON "public"."Plan"
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can delete plans" ON "public"."Plan";
CREATE POLICY "Service role can delete plans" ON "public"."Plan"
FOR DELETE
USING (auth.role() = 'service_role');

-- Subscription policies
DROP POLICY IF EXISTS "Users can view household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can view household subscriptions" ON "public"."Subscription"
FOR SELECT
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can insert household subscriptions" ON "public"."Subscription"
FOR INSERT
WITH CHECK (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can update household subscriptions" ON "public"."Subscription"
FOR UPDATE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR "userId" = (select auth.uid())
)
WITH CHECK (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete household subscriptions" ON "public"."Subscription";
CREATE POLICY "Users can delete household subscriptions" ON "public"."Subscription"
FOR DELETE
USING (
    "householdId" IN (SELECT household_id FROM get_user_accessible_households())
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can insert subscriptions" ON "public"."Subscription"
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can update subscriptions" ON "public"."Subscription"
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can delete subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role can delete subscriptions" ON "public"."Subscription"
FOR DELETE
USING (auth.role() = 'service_role');

-- Security policies
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
    OR auth.role() = 'service_role'
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
    OR auth.role() = 'service_role'
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
    OR auth.role() = 'service_role'
);

-- SecurityPrice policies
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
    OR auth.role() = 'service_role'
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
    OR auth.role() = 'service_role'
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
    OR auth.role() = 'service_role'
);

-- Candle policies
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

-- Category policies
DROP POLICY IF EXISTS "Users can view system and own categories" ON "public"."Category";
CREATE POLICY "Users can view system and own categories" ON "public"."Category"
FOR SELECT
USING (
    "isSystem" = true
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

-- Subcategory policies
DROP POLICY IF EXISTS "Users can view system and own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can view system and own subcategories" ON "public"."Subcategory"
FOR SELECT
USING (
    "isSystem" = true
    OR "userId" = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can insert own subcategories" ON "public"."Subcategory"
FOR INSERT
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can update own subcategories" ON "public"."Subcategory"
FOR UPDATE
USING ("userId" = (select auth.uid()))
WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own subcategories" ON "public"."Subcategory";
CREATE POLICY "Users can delete own subcategories" ON "public"."Subcategory"
FOR DELETE
USING ("userId" = (select auth.uid()));

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

-- ============================================================================
-- PART 2: REMOVE DUPLICATE INDEXES
-- ============================================================================

-- Remove duplicate index on SecurityPrice
-- Keep idx_security_price_security_date_desc (more specific with DESC)
DROP INDEX IF EXISTS "public"."idx_security_price_security_date";

-- Remove duplicate index on SystemSettings
-- Keep SystemSettings_pkey (primary key constraint)
DROP INDEX IF EXISTS "public"."SystemSettings_id_key";

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration fixes the most critical performance issues by:
-- 1. Replacing auth.uid() with (select auth.uid()) in RLS policies
--    This prevents re-evaluation for each row, significantly improving
--    query performance at scale.
--
-- 2. Removing duplicate indexes that waste storage and slow down writes.
--
-- Note: Some policies may still need updates. The linter will identify
-- any remaining issues in future scans. The multiple_permissive_policies
-- warnings are less critical and can be addressed later by consolidating
-- policies, but this requires careful analysis to ensure security.
