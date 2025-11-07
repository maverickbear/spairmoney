-- Migration: Add userId to Transaction table
-- This migration adds a userId column to Transaction table to directly identify the owner
-- This makes RLS policies simpler and more efficient

-- ============================================
-- Step 1: Add userId column to Transaction
-- ============================================

-- Add userId column (nullable initially, will be populated from Account.userId)
ALTER TABLE "Transaction" 
ADD COLUMN IF NOT EXISTS "userId" UUID;

-- ============================================
-- Step 2: Populate userId from Account.userId for existing transactions
-- ============================================

-- Update existing transactions with userId from their account
UPDATE "Transaction" 
SET "userId" = (
  SELECT "Account"."userId" 
  FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
)
WHERE "userId" IS NULL;

-- ============================================
-- Step 3: Add foreign key constraint
-- ============================================

-- Add foreign key to User table
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"("id") 
ON DELETE CASCADE;

-- ============================================
-- Step 4: Create index on userId for performance
-- ============================================

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" 
ON "Transaction"("userId");

-- ============================================
-- Step 5: Make userId NOT NULL after populating
-- ============================================

-- Make userId required (NOT NULL) after populating existing data
ALTER TABLE "Transaction" 
ALTER COLUMN "userId" SET NOT NULL;

-- ============================================
-- Step 6: Update RLS policies to use userId directly
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Create new policy that uses userId directly (much simpler and more efficient)
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
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
-- Step 7: Update INSERT policy
-- ============================================

DROP POLICY IF EXISTS "Users can insert own transactions" ON "Transaction";

CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
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
-- Step 8: Update UPDATE policy
-- ============================================

DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";

CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
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
-- Step 9: Update DELETE policy
-- ============================================

DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
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

