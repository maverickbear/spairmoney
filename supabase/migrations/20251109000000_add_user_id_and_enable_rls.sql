-- Migration: Add userId to tables and enable RLS with proper policies
-- This migration adds multi-tenancy support and enables Row Level Security
-- Following Supabase best practices for security

-- ============================================
-- Step 1: Add userId column to user-owned tables
-- ============================================

-- Add userId to Account (required for multi-tenancy)
ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

-- Add userId to Budget
ALTER TABLE "Budget" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Budget_userId_idx" ON "Budget"("userId");

-- Add userId to Category (for user-specific categories)
ALTER TABLE "Category" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Category_userId_idx" ON "Category"("userId");

-- Add userId to Macro (for user-specific macros)
ALTER TABLE "Macro" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Macro_userId_idx" ON "Macro"("userId");

-- Add userId to Goal
ALTER TABLE "Goal" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");

-- Add userId to Debt
ALTER TABLE "Debt" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Debt_userId_idx" ON "Debt"("userId");

-- Add userId to InvestmentAccount
ALTER TABLE "InvestmentAccount" 
ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "InvestmentAccount_userId_idx" ON "InvestmentAccount"("userId");

-- ============================================
-- Step 2: Enable Row Level Security on all tables
-- ============================================

-- Enable RLS on user-owned tables
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

-- Security and SecurityPrice are global (market data), but still enable RLS for safety
ALTER TABLE "Security" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityPrice" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 3: Create RLS Policies
-- ============================================

-- ============================================
-- Account Policies
-- ============================================
-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (auth.uid() = "userId");

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts" ON "Account"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts" ON "Account"
  FOR UPDATE USING (auth.uid() = "userId");

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts" ON "Account"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- Transaction Policies
-- ============================================
-- Users can only see transactions from their own accounts
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Account" 
      WHERE "Account"."id" = "Transaction"."accountId" 
      AND "Account"."userId" = auth.uid()
    )
  );

-- Users can insert transactions to their own accounts
CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Account" 
      WHERE "Account"."id" = "Transaction"."accountId" 
      AND "Account"."userId" = auth.uid()
    )
  );

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Account" 
      WHERE "Account"."id" = "Transaction"."accountId" 
      AND "Account"."userId" = auth.uid()
    )
  );

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Account" 
      WHERE "Account"."id" = "Transaction"."accountId" 
      AND "Account"."userId" = auth.uid()
    )
  );

-- ============================================
-- Budget Policies
-- ============================================
CREATE POLICY "Users can view own budgets" ON "Budget"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own budgets" ON "Budget"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own budgets" ON "Budget"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own budgets" ON "Budget"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- BudgetCategory Policies
-- ============================================
-- Users can only access BudgetCategory for their own budgets
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

CREATE POLICY "Users can delete own budget categories" ON "BudgetCategory"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Budget" 
      WHERE "Budget"."id" = "BudgetCategory"."budgetId" 
      AND "Budget"."userId" = auth.uid()
    )
  );

-- ============================================
-- Macro Policies
-- ============================================
CREATE POLICY "Users can view own macros" ON "Macro"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own macros" ON "Macro"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own macros" ON "Macro"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own macros" ON "Macro"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- Category Policies
-- ============================================
CREATE POLICY "Users can view own categories" ON "Category"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own categories" ON "Category"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own categories" ON "Category"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own categories" ON "Category"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- Subcategory Policies
-- ============================================
-- Users can only access subcategories from their own categories
CREATE POLICY "Users can view own subcategories" ON "Subcategory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND "Category"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert own subcategories" ON "Subcategory"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND "Category"."userId" = auth.uid()
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
-- Goal Policies
-- ============================================
CREATE POLICY "Users can view own goals" ON "Goal"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own goals" ON "Goal"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own goals" ON "Goal"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own goals" ON "Goal"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- Debt Policies
-- ============================================
CREATE POLICY "Users can view own debts" ON "Debt"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own debts" ON "Debt"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own debts" ON "Debt"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own debts" ON "Debt"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- InvestmentAccount Policies
-- ============================================
CREATE POLICY "Users can view own investment accounts" ON "InvestmentAccount"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own investment accounts" ON "InvestmentAccount"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own investment accounts" ON "InvestmentAccount"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own investment accounts" ON "InvestmentAccount"
  FOR DELETE USING (auth.uid() = "userId");

-- ============================================
-- InvestmentTransaction Policies
-- ============================================
-- Users can only access transactions from their own investment accounts
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
-- AccountInvestmentValue Policies
-- ============================================
-- Users can only access investment values for their own accounts
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
-- SimpleInvestmentEntry Policies
-- ============================================
-- Users can only access entries for their own accounts
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
-- Security Policies (Global - Market Data)
-- ============================================
-- Securities are global (market data), but we restrict writes to authenticated users
CREATE POLICY "Anyone can view securities" ON "Security"
  FOR SELECT USING (true);

-- Only authenticated users can insert securities (typically via service role)
CREATE POLICY "Authenticated users can insert securities" ON "Security"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update securities" ON "Security"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- SecurityPrice Policies (Global - Market Data)
-- ============================================
-- Security prices are global (market data)
CREATE POLICY "Anyone can view security prices" ON "SecurityPrice"
  FOR SELECT USING (true);

-- Only authenticated users can insert/update prices (typically via service role)
CREATE POLICY "Authenticated users can insert security prices" ON "SecurityPrice"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update security prices" ON "SecurityPrice"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- Update Subscription Policies (already exist, but improve them)
-- ============================================
-- Drop existing policies if they exist and recreate with better checks
DROP POLICY IF EXISTS "Users can read own subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Users can update own subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service can insert subscriptions" ON "Subscription";

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON "Subscription"
  FOR SELECT USING (auth.uid() = "userId");

-- Users cannot update subscriptions directly (only via webhook with service role)
-- Webhooks should use service_role key, which bypasses RLS
CREATE POLICY "Users cannot update subscriptions" ON "Subscription"
  FOR UPDATE USING (false);

-- Only service role can insert subscriptions (via webhook)
-- This is handled by service_role key which bypasses RLS
-- But we create a policy for safety
CREATE POLICY "Service role can manage subscriptions" ON "Subscription"
  FOR ALL USING (auth.role() = 'service_role');

