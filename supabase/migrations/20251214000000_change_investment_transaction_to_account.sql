-- Migration: Change InvestmentTransaction.accountId to reference Account instead of InvestmentAccount
-- This allows investment transactions to reference accounts of type "investment" from the Account table

-- ============================================
-- Step 1: Drop the existing foreign key constraint
-- ============================================

ALTER TABLE "InvestmentTransaction"
DROP CONSTRAINT IF EXISTS "InvestmentTransaction_accountId_fkey";

-- ============================================
-- Step 2: Add new foreign key constraint to Account table
-- ============================================

ALTER TABLE "InvestmentTransaction"
ADD CONSTRAINT "InvestmentTransaction_accountId_fkey" 
FOREIGN KEY ("accountId") 
REFERENCES "Account"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ============================================
-- Step 3: Update RLS policies to use Account.userId
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can insert own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can update own investment transactions" ON "InvestmentTransaction";
DROP POLICY IF EXISTS "Users can delete own investment transactions" ON "InvestmentTransaction";

-- Create new policies that reference Account table
CREATE POLICY "Users can view own investment transactions" ON "InvestmentTransaction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "InvestmentTransaction"."accountId"
      AND "Account"."userId" = auth.uid()
      AND "Account"."type" = 'investment'
    )
  );

CREATE POLICY "Users can insert own investment transactions" ON "InvestmentTransaction"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "InvestmentTransaction"."accountId"
      AND "Account"."userId" = auth.uid()
      AND "Account"."type" = 'investment'
    )
  );

CREATE POLICY "Users can update own investment transactions" ON "InvestmentTransaction"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "InvestmentTransaction"."accountId"
      AND "Account"."userId" = auth.uid()
      AND "Account"."type" = 'investment'
    )
  );

CREATE POLICY "Users can delete own investment transactions" ON "InvestmentTransaction"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "InvestmentTransaction"."accountId"
      AND "Account"."userId" = auth.uid()
      AND "Account"."type" = 'investment'
    )
  );

