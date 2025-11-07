-- Migration: Fix All Tables RLS - Complete Solution
-- This migration fixes RLS for Transaction, Account, AccountOwner, and HouseholdMember
-- The issue is that transactions don't appear because of RLS issues in related tables

-- ============================================
-- Step 1: Fix Account table - Ensure all accounts have userId
-- ============================================

-- First, let's see which accounts don't have userId
-- For accounts without userId, we'll try to get it from AccountOwner
UPDATE "Account" 
SET "userId" = (
  SELECT "ownerId" 
  FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Account"."id"
  ORDER BY "AccountOwner"."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Account"."id"
);

-- ============================================
-- Step 2: Create AccountOwner for accounts that don't have one
-- ============================================

-- For accounts that have userId but no AccountOwner, create one
INSERT INTO "AccountOwner" ("accountId", "ownerId", "createdAt", "updatedAt")
SELECT 
  a.id as "accountId",
  a."userId" as "ownerId",
  COALESCE(a."createdAt", NOW()) as "createdAt",
  COALESCE(a."updatedAt", NOW()) as "updatedAt"
FROM "Account" a
WHERE a."userId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "AccountOwner" ao
  WHERE ao."accountId" = a.id
  AND ao."ownerId" = a."userId"
);

-- ============================================
-- Step 3: Fix Transaction table - Ensure all transactions have userId
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

-- If account doesn't have userId, try to get it from AccountOwner
UPDATE "Transaction" 
SET "userId" = (
  SELECT "AccountOwner"."ownerId" 
  FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
  ORDER BY "AccountOwner"."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
);

-- ============================================
-- Step 4: Drop and recreate Transaction RLS policy
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Create a simpler, more reliable policy
-- This policy checks in order:
-- 1. Direct userId match (fastest)
-- 2. Account.userId match (fallback)
-- 3. AccountOwner match (for shared accounts)
-- 4. HouseholdMember match (for household members)
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Check 1: Direct userId match (most efficient)
    "userId" = auth.uid()
    OR
    -- Check 2: Account belongs to user
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Check 3: User is owner via AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Check 4: User is household member
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
-- Step 5: Verify Account RLS policy
-- ============================================

-- Check if Account has proper RLS policy
SELECT 
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Account'
AND cmd = 'SELECT'
AND policyname LIKE '%view%';

-- If Account doesn't have a SELECT policy, create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'Account'
    AND cmd = 'SELECT'
    AND policyname LIKE '%view%'
  ) THEN
    CREATE POLICY "Users can view own accounts" ON "Account"
      FOR SELECT USING (
        "userId" = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM "AccountOwner"
          WHERE "AccountOwner"."accountId" = "Account"."id"
          AND "AccountOwner"."ownerId" = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM "AccountOwner"
          JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
          WHERE "AccountOwner"."accountId" = "Account"."id"
          AND "HouseholdMember"."memberId" = auth.uid()
          AND "HouseholdMember"."status" = 'active'
        )
      );
  END IF;
END $$;

-- ============================================
-- Step 6: Verify AccountOwner RLS policy
-- ============================================

-- Check if AccountOwner has proper RLS policy
SELECT 
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'AccountOwner'
AND cmd = 'SELECT'
AND policyname LIKE '%view%';

-- If AccountOwner doesn't have a SELECT policy, create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'AccountOwner'
    AND cmd = 'SELECT'
    AND policyname LIKE '%view%'
  ) THEN
    CREATE POLICY "Users can view account owners" ON "AccountOwner"
      FOR SELECT USING (
        "ownerId" = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM "HouseholdMember"
          WHERE "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
          AND "HouseholdMember"."memberId" = auth.uid()
          AND "HouseholdMember"."status" = 'active'
        )
      );
  END IF;
END $$;

-- ============================================
-- Step 7: Statistics and verification
-- ============================================

-- Show statistics
SELECT 
  'Account' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Sem userId"
FROM "Account"
UNION ALL
SELECT 
  'Transaction' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Sem userId"
FROM "Transaction"
UNION ALL
SELECT 
  'AccountOwner' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) as "Com ownerId",
  0 as "Sem userId"
FROM "AccountOwner";

-- Show RLS status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('Transaction', 'Account', 'AccountOwner', 'HouseholdMember')
ORDER BY tablename;

-- Show all RLS policies
SELECT 
  tablename,
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('Transaction', 'Account', 'AccountOwner', 'HouseholdMember')
ORDER BY tablename, policyname;

