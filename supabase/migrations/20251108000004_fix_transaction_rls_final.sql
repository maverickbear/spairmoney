-- Migration: Fix Transaction RLS - Final Solution
-- This migration fixes the RLS policy to ensure users can view their own transactions
-- The issue was that the RLS policy wasn't working correctly

-- ============================================
-- Step 1: Populate userId for all transactions that don't have it
-- ============================================

-- Update transactions with userId from their account
-- This ensures all transactions have a userId for the RLS policy to work
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
-- Step 2: Drop existing policy
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- ============================================
-- Step 3: Create new, simplified RLS policy
-- ============================================
-- This policy checks in order of efficiency:
-- 1. Direct userId match (fastest - should work for most cases)
-- 2. Account ownership via Account.userId (fallback)
-- 3. Account ownership via AccountOwner (for shared accounts)
-- 4. Household member access (for household members)

CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Primary check: User owns the transaction directly
    -- This is the fastest check and should work for most transactions
    "userId" = auth.uid()
    OR
    -- Fallback 1: User owns the account directly
    -- This handles cases where userId might be NULL but account belongs to user
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Fallback 2: User is an owner via AccountOwner
    -- This handles shared accounts
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Fallback 3: User is a member of household that has AccountOwner
    -- This handles household members
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
-- Step 5: Test query (run this while logged in to verify it works)
-- ============================================
-- Note: This query will only work if you're authenticated
-- To test, run this in the Supabase SQL Editor while logged in
-- 
-- SELECT 
--   COUNT(*) as "Total Transactions Visible",
--   COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Direct Transactions",
--   COUNT(CASE WHEN EXISTS (
--     SELECT 1 FROM "Account" 
--     WHERE "Account"."id" = "Transaction"."accountId" 
--     AND "Account"."userId" = auth.uid()
--   ) THEN 1 END) as "Transactions via Account"
-- FROM "Transaction"
-- WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
--   AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

