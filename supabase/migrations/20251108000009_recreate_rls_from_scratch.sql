-- Migration: Recreate RLS from Scratch
-- This migration removes all existing RLS policies (~87 policies) and recreates them
-- with simple policies based on userId = auth.uid() for easier debugging

-- ============================================
-- Step 1: Remove all existing RLS policies
-- ============================================

-- Account policies
DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can insert own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can update own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can delete own accounts" ON "Account";

-- Transaction policies
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can insert own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

-- Budget policies
DROP POLICY IF EXISTS "Users can view own budgets" ON "Budget";
DROP POLICY IF EXISTS "Users can insert own budgets" ON "Budget";
DROP POLICY IF EXISTS "Users can update own budgets" ON "Budget";
DROP POLICY IF EXISTS "Users can delete own budgets" ON "Budget";

-- BudgetCategory policies
DROP POLICY IF EXISTS "Users can view own budget categories" ON "BudgetCategory";
DROP POLICY IF EXISTS "Users can insert own budget categories" ON "BudgetCategory";
DROP POLICY IF EXISTS "Users can update own budget categories" ON "BudgetCategory";
DROP POLICY IF EXISTS "Users can delete own budget categories" ON "BudgetCategory";

-- Category policies
DROP POLICY IF EXISTS "Users can view system and own categories" ON "Category";
DROP POLICY IF EXISTS "Users can insert own categories" ON "Category";
DROP POLICY IF EXISTS "Users can update own categories" ON "Category";
DROP POLICY IF EXISTS "Users can delete own categories" ON "Category";

-- Subcategory policies
DROP POLICY IF EXISTS "Users can view system and own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can insert own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can update own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can delete own subcategories" ON "Subcategory";

-- Macro policies
DROP POLICY IF EXISTS "Users can view system and own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can insert own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can update own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can delete own macros" ON "Macro";

-- Goal policies
DROP POLICY IF EXISTS "Users can view own goals" ON "Goal";
DROP POLICY IF EXISTS "Users can insert own goals" ON "Goal";
DROP POLICY IF EXISTS "Users can update own goals" ON "Goal";
DROP POLICY IF EXISTS "Users can delete own goals" ON "Goal";

-- Debt policies
DROP POLICY IF EXISTS "Users can view own debts" ON "Debt";
DROP POLICY IF EXISTS "Users can insert own debts" ON "Debt";
DROP POLICY IF EXISTS "Users can update own debts" ON "Debt";
DROP POLICY IF EXISTS "Users can delete own debts" ON "Debt";

-- InvestmentAccount policies
DROP POLICY IF EXISTS "Users can view own investment accounts" ON "InvestmentAccount";
DROP POLICY IF EXISTS "Users can insert own investment accounts" ON "InvestmentAccount";
DROP POLICY IF EXISTS "Users can update own investment accounts" ON "InvestmentAccount";
DROP POLICY IF EXISTS "Users can delete own investment accounts" ON "InvestmentAccount";

-- InvestmentTransaction policies
DROP POLICY IF EXISTS "Users can view own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can insert own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can update own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can delete own investment transactions" ON "InvestmentTransaction";

-- AccountInvestmentValue policies
DROP POLICY IF EXISTS "Users can view own account investment values" ON "AccountInvestmentValue";
DROP POLICY IF EXISTS "Users can insert own account investment values" ON "AccountInvestmentValue";
DROP POLICY IF EXISTS "Users can update own account investment values" ON "AccountInvestmentValue";
DROP POLICY IF EXISTS "Users can delete own account investment values" ON "AccountInvestmentValue";

-- SimpleInvestmentEntry policies
DROP POLICY IF EXISTS "Users can view own simple investment entries" ON "SimpleInvestmentEntry";
DROP POLICY IF EXISTS "Users can insert own simple investment entries" ON "SimpleInvestmentEntry";
DROP POLICY IF EXISTS "Users can update own simple investment entries" ON "SimpleInvestmentEntry";
DROP POLICY IF EXISTS "Users can delete own simple investment entries" ON "SimpleInvestmentEntry";

-- AccountOwner policies
DROP POLICY IF EXISTS "Users can view account owners" ON "AccountOwner";
DROP POLICY IF EXISTS "Users can insert account owners" ON "AccountOwner";
DROP POLICY IF EXISTS "Users can update account owners" ON "AccountOwner";
DROP POLICY IF EXISTS "Users can delete account owners" ON "AccountOwner";

-- HouseholdMember policies
DROP POLICY IF EXISTS "Anyone can view by invitation token" ON "HouseholdMember";
DROP POLICY IF EXISTS "Members can view own household relationships" ON "HouseholdMember";
DROP POLICY IF EXISTS "Owners can view own household members" ON "HouseholdMember";
DROP POLICY IF EXISTS "Owners can invite household members" ON "HouseholdMember";
DROP POLICY IF EXISTS "Owners can update own household members" ON "HouseholdMember";
DROP POLICY IF EXISTS "Members can accept invitations" ON "HouseholdMember";
DROP POLICY IF EXISTS "Owners can delete own household members" ON "HouseholdMember";

-- User policies
DROP POLICY IF EXISTS "Users can read own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can insert own profile" ON "User";
DROP POLICY IF EXISTS "Users cannot delete own profile" ON "User";
DROP POLICY IF EXISTS "Admins can read all users" ON "User";
DROP POLICY IF EXISTS "Members can read owner basic info" ON "User";

-- Plan policies
DROP POLICY IF EXISTS "Plans are publicly readable" ON "Plan";
DROP POLICY IF EXISTS "Service role can insert plans" ON "Plan";
DROP POLICY IF EXISTS "Service role can update plans" ON "Plan";
DROP POLICY IF EXISTS "Service role can delete plans" ON "Plan";

-- Subscription policies
DROP POLICY IF EXISTS "Users can read own subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Users cannot update subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can update subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can delete subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Members can read owner subscriptions" ON "Subscription";

-- Security policies
DROP POLICY IF EXISTS "Anyone can view securities" ON "Security";
DROP POLICY IF EXISTS "Authenticated users can insert securities" ON "Security";
DROP POLICY IF EXISTS "Authenticated users can update securities" ON "Security";
DROP POLICY IF EXISTS "Authenticated users can delete securities" ON "Security";

-- SecurityPrice policies
DROP POLICY IF EXISTS "Anyone can view security prices" ON "SecurityPrice";
DROP POLICY IF EXISTS "Authenticated users can insert security prices" ON "SecurityPrice";
DROP POLICY IF EXISTS "Authenticated users can update security prices" ON "SecurityPrice";
DROP POLICY IF EXISTS "Authenticated users can delete security prices" ON "SecurityPrice";

-- ============================================
-- Step 2: Recreate simple RLS policies
-- ============================================

-- ============================================
-- Account (userId direto)
-- ============================================
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own accounts" ON "Account"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own accounts" ON "Account"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own accounts" ON "Account"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- Transaction (userId direto - já tem coluna userId)
-- ============================================
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- Budget (userId direto)
-- ============================================
CREATE POLICY "Users can view own budgets" ON "Budget"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own budgets" ON "Budget"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own budgets" ON "Budget"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own budgets" ON "Budget"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- BudgetCategory (via Budget.userId)
-- ============================================
CREATE POLICY "Users can view own budget categories" ON "BudgetCategory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Budget"
      WHERE "Budget"."id" = "BudgetCategory"."budgetId"
      AND "Budget"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert own budget categories" ON "BudgetCategory"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Budget"
      WHERE "Budget"."id" = "BudgetCategory"."budgetId"
      AND "Budget"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update own budget categories" ON "BudgetCategory"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Budget"
      WHERE "Budget"."id" = "BudgetCategory"."budgetId"
      AND "Budget"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete own budget categories" ON "BudgetCategory"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Budget"
      WHERE "Budget"."id" = "BudgetCategory"."budgetId"
      AND "Budget"."userId" = auth.uid()
    )
  );

-- ============================================
-- Category (userId direto, permitir userId IS NULL para categorias do sistema)
-- ============================================
CREATE POLICY "Users can view system and own categories" ON "Category"
  FOR SELECT USING (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can insert own categories" ON "Category"
  FOR INSERT WITH CHECK (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can update own categories" ON "Category"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own categories" ON "Category"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- Subcategory (via Category.userId)
-- ============================================
CREATE POLICY "Users can view system and own subcategories" ON "Subcategory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Category"
      WHERE "Category"."id" = "Subcategory"."categoryId"
      AND (("Category"."userId" IS NULL) OR ("Category"."userId" = auth.uid()))
    )
  );

CREATE POLICY "Users can insert own subcategories" ON "Subcategory"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Category"
      WHERE "Category"."id" = "Subcategory"."categoryId"
      AND (("Category"."userId" IS NULL) OR ("Category"."userId" = auth.uid()))
    )
  );

CREATE POLICY "Users can update own subcategories" ON "Subcategory"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Category"
      WHERE "Category"."id" = "Subcategory"."categoryId"
      AND "Category"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete own subcategories" ON "Subcategory"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Category"
      WHERE "Category"."id" = "Subcategory"."categoryId"
      AND "Category"."userId" = auth.uid()
    )
  );

-- ============================================
-- Macro (userId direto, permitir userId IS NULL para macros do sistema)
-- ============================================
CREATE POLICY "Users can view system and own macros" ON "Macro"
  FOR SELECT USING (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can insert own macros" ON "Macro"
  FOR INSERT WITH CHECK (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can update own macros" ON "Macro"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own macros" ON "Macro"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- Goal (userId direto)
-- ============================================
CREATE POLICY "Users can view own goals" ON "Goal"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own goals" ON "Goal"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own goals" ON "Goal"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own goals" ON "Goal"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- Debt (userId direto)
-- ============================================
CREATE POLICY "Users can view own debts" ON "Debt"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own debts" ON "Debt"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own debts" ON "Debt"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own debts" ON "Debt"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- InvestmentAccount (userId direto)
-- ============================================
CREATE POLICY "Users can view own investment accounts" ON "InvestmentAccount"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can insert own investment accounts" ON "InvestmentAccount"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own investment accounts" ON "InvestmentAccount"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete own investment accounts" ON "InvestmentAccount"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================
-- InvestmentTransaction (via InvestmentAccount.userId)
-- ============================================
CREATE POLICY "Users can view own investment transactions" ON "InvestmentTransaction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "InvestmentAccount"
      WHERE "InvestmentAccount"."id" = "InvestmentTransaction"."accountId"
      AND "InvestmentAccount"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert own investment transactions" ON "InvestmentTransaction"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "InvestmentAccount"
      WHERE "InvestmentAccount"."id" = "InvestmentTransaction"."accountId"
      AND "InvestmentAccount"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update own investment transactions" ON "InvestmentTransaction"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "InvestmentAccount"
      WHERE "InvestmentAccount"."id" = "InvestmentTransaction"."accountId"
      AND "InvestmentAccount"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete own investment transactions" ON "InvestmentTransaction"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "InvestmentAccount"
      WHERE "InvestmentAccount"."id" = "InvestmentTransaction"."accountId"
      AND "InvestmentAccount"."userId" = auth.uid()
    )
  );

-- ============================================
-- AccountInvestmentValue (via Account.userId)
-- ============================================
CREATE POLICY "Users can view own account investment values" ON "AccountInvestmentValue"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountInvestmentValue"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account investment values" ON "AccountInvestmentValue"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountInvestmentValue"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update own account investment values" ON "AccountInvestmentValue"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountInvestmentValue"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account investment values" ON "AccountInvestmentValue"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountInvestmentValue"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

-- ============================================
-- SimpleInvestmentEntry (via Account.userId)
-- ============================================
CREATE POLICY "Users can view own simple investment entries" ON "SimpleInvestmentEntry"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "SimpleInvestmentEntry"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert own simple investment entries" ON "SimpleInvestmentEntry"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "SimpleInvestmentEntry"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update own simple investment entries" ON "SimpleInvestmentEntry"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "SimpleInvestmentEntry"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete own simple investment entries" ON "SimpleInvestmentEntry"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "SimpleInvestmentEntry"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

-- ============================================
-- AccountOwner (via Account.userId ou ownerId = auth.uid())
-- ============================================
CREATE POLICY "Users can view account owners" ON "AccountOwner"
  FOR SELECT USING (
    ("ownerId" = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountOwner"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert account owners" ON "AccountOwner"
  FOR INSERT WITH CHECK (
    ("ownerId" = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountOwner"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update account owners" ON "AccountOwner"
  FOR UPDATE USING (
    ("ownerId" = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountOwner"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete account owners" ON "AccountOwner"
  FOR DELETE USING (
    ("ownerId" = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "AccountOwner"."accountId"
      AND "Account"."userId" = auth.uid()
    )
  );

-- ============================================
-- HouseholdMember (ownerId = auth.uid() ou memberId = auth.uid())
-- ============================================
CREATE POLICY "Users can view household members" ON "HouseholdMember"
  FOR SELECT USING (
    ("ownerId" = auth.uid())
    OR
    ("memberId" = auth.uid())
  );

CREATE POLICY "Users can insert household members" ON "HouseholdMember"
  FOR INSERT WITH CHECK ("ownerId" = auth.uid());

CREATE POLICY "Users can update household members" ON "HouseholdMember"
  FOR UPDATE USING (
    ("ownerId" = auth.uid())
    OR
    ("memberId" = auth.uid())
  );

CREATE POLICY "Users can delete household members" ON "HouseholdMember"
  FOR DELETE USING ("ownerId" = auth.uid());

-- ============================================
-- User (id = auth.uid())
-- ============================================
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING ("id" = auth.uid());

CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK ("id" = auth.uid());

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING ("id" = auth.uid());

CREATE POLICY "Users cannot delete own profile" ON "User"
  FOR DELETE USING (false);

-- ============================================
-- Plan (SELECT público, INSERT/UPDATE/DELETE apenas service_role)
-- ============================================
CREATE POLICY "Plans are publicly readable" ON "Plan"
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert plans" ON "Plan"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update plans" ON "Plan"
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete plans" ON "Plan"
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- Subscription (SELECT userId = auth.uid(), INSERT/UPDATE/DELETE apenas service_role)
-- ============================================
CREATE POLICY "Users can view own subscriptions" ON "Subscription"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Service role can insert subscriptions" ON "Subscription"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update subscriptions" ON "Subscription"
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete subscriptions" ON "Subscription"
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- Security (SELECT público, INSERT/UPDATE/DELETE authenticated)
-- ============================================
CREATE POLICY "Anyone can view securities" ON "Security"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert securities" ON "Security"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update securities" ON "Security"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete securities" ON "Security"
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- SecurityPrice (SELECT público, INSERT/UPDATE/DELETE authenticated)
-- ============================================
CREATE POLICY "Anyone can view security prices" ON "SecurityPrice"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert security prices" ON "SecurityPrice"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update security prices" ON "SecurityPrice"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete security prices" ON "SecurityPrice"
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Step 3: Ensure RLS is enabled on all tables
-- ============================================
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BudgetCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subcategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Macro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvestmentAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvestmentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountInvestmentValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimpleInvestmentEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountOwner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HouseholdMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Security" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityPrice" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: Verification and statistics
-- ============================================

-- List all policies created
SELECT 
  tablename,
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Statistics by table
SELECT 
  tablename,
  COUNT(*) as "Policy Count",
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as "SELECT",
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as "INSERT",
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as "UPDATE",
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as "DELETE"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN (
  'Account', 'Transaction', 'Budget', 'BudgetCategory', 'Category', 'Subcategory',
  'Macro', 'Goal', 'Debt', 'InvestmentAccount', 'InvestmentTransaction',
  'AccountInvestmentValue', 'SimpleInvestmentEntry', 'AccountOwner', 'HouseholdMember',
  'User', 'Plan', 'Subscription', 'Security', 'SecurityPrice'
)
ORDER BY tablename;

