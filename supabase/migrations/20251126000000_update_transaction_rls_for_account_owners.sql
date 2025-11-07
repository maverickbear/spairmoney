-- Migration: Update Transaction RLS policies to include AccountOwner
-- This migration updates Transaction RLS policies to allow users to view transactions
-- from accounts they own via AccountOwner or are members of via HouseholdMember

-- ============================================
-- Step 1: Update Transaction SELECT policy
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Create new policy that includes AccountOwner and HouseholdMember
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 2: Update Transaction INSERT policy
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON "Transaction";

-- Create new policy that includes AccountOwner
CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK (
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 3: Update Transaction UPDATE policy
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";

-- Create new policy that includes AccountOwner
CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING (
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 4: Update Transaction DELETE policy
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

-- Create new policy that includes AccountOwner
CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING (
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

