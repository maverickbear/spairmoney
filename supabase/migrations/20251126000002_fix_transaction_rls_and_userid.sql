-- Migration: Fix Transaction RLS and ensure userId is populated
-- This migration ensures RLS is enabled and all transactions have userId
-- Run this after disabling RLS temporarily to fix the issue

-- ============================================
-- Step 1: Ensure userId column exists
-- ============================================

-- Add userId column if it doesn't exist (nullable initially)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Transaction' 
    AND column_name = 'userId'
  ) THEN
    ALTER TABLE "Transaction" ADD COLUMN "userId" UUID;
  END IF;
END $$;

-- ============================================
-- Step 2: Populate userId for all transactions that don't have it
-- ============================================

-- Update transactions with userId from their account
UPDATE "Transaction" 
SET "userId" = (
  SELECT "Account"."userId" 
  FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
)
WHERE "userId" IS NULL;

-- ============================================
-- Step 3: Add foreign key constraint if it doesn't exist
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'Transaction' 
    AND constraint_name = 'Transaction_userId_fkey'
  ) THEN
    ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- Step 4: Create index on userId if it doesn't exist
-- ============================================

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" 
ON "Transaction"("userId");

-- ============================================
-- Step 5: Make userId NOT NULL (only if all transactions have userId)
-- ============================================

-- Check if there are any NULL userIds
DO $$ 
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM "Transaction" 
  WHERE "userId" IS NULL;
  
  IF null_count = 0 THEN
    -- All transactions have userId, make it NOT NULL
    ALTER TABLE "Transaction" 
    ALTER COLUMN "userId" SET NOT NULL;
  ELSE
    RAISE NOTICE 'Warning: % transactions still have NULL userId. Cannot make column NOT NULL.', null_count;
  END IF;
END $$;

-- ============================================
-- Step 6: Enable RLS on Transaction table
-- ============================================

ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 7: Drop existing policies (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can insert own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

-- ============================================
-- Step 8: Create SELECT policy (most important for viewing transactions)
-- ============================================

CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- User owns the transaction directly (primary check - most efficient)
    "userId" = auth.uid()
    OR
    -- User owns the account directly (Account.userId) - fallback for old data
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
-- Step 9: Create INSERT policy
-- ============================================

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
-- Step 10: Create UPDATE policy
-- ============================================

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
-- Step 11: Create DELETE policy
-- ============================================

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

-- ============================================
-- Step 12: Verify the migration
-- ============================================

-- Check RLS status
DO $$ 
DECLARE
  rls_enabled BOOLEAN;
  userid_count INTEGER;
  null_userid_count INTEGER;
BEGIN
  -- Check if RLS is enabled
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' 
  AND tablename = 'Transaction';
  
  -- Count transactions with userId
  SELECT COUNT(*) INTO userid_count
  FROM "Transaction"
  WHERE "userId" IS NOT NULL;
  
  -- Count transactions without userId
  SELECT COUNT(*) INTO null_userid_count
  FROM "Transaction"
  WHERE "userId" IS NULL;
  
  RAISE NOTICE 'RLS Status: %', CASE WHEN rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END;
  RAISE NOTICE 'Transactions with userId: %', userid_count;
  RAISE NOTICE 'Transactions without userId: %', null_userid_count;
END $$;

