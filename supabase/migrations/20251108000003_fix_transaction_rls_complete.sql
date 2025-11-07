-- Migration: Fix Transaction RLS Complete
-- This migration fixes the RLS policy and ensures all transactions have userId
-- Run this to fix the issue where transactions don't appear

-- ============================================
-- Step 1: Ensure userId column exists and is NOT NULL
-- ============================================

-- Add userId column if it doesn't exist
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
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
  AND "Account"."userId" IS NOT NULL
);

-- ============================================
-- Step 3: Drop and recreate RLS policy with correct logic
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Create new policy that checks in order of efficiency
-- This policy ensures users can see their own transactions
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Check 1: User owns the transaction directly (fastest check)
    "userId" = auth.uid()
    OR
    -- Check 2: User owns the account directly
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Check 3: User is an owner via AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Check 4: User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 4: Verify the policy was created
-- ============================================

SELECT 
  policyname,
  cmd as "Command",
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
AND policyname = 'Users can view own transactions';

-- ============================================
-- Step 5: Statistics (for debugging)
-- ============================================

-- Show statistics about transactions and userId
SELECT 
  COUNT(*) as "Total Transactions",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Transactions with userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Transactions without userId",
  COUNT(DISTINCT "userId") as "Unique UserIds"
FROM "Transaction";

-- Show statistics about accounts and userId
SELECT 
  COUNT(*) as "Total Accounts",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Accounts with userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Accounts without userId"
FROM "Account";

