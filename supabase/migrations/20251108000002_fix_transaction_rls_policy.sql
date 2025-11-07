-- Migration: Fix Transaction RLS Policy
-- This migration fixes the RLS policy to ensure users can view their own transactions
-- The issue was that the policy wasn't working correctly, causing transactions to not appear

-- ============================================
-- Step 1: Drop existing policy
-- ============================================
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- ============================================
-- Step 2: Create new, simplified SELECT policy
-- ============================================
-- This policy checks in order of efficiency:
-- 1. Direct userId match (fastest)
-- 2. Account ownership via Account.userId
-- 3. Account ownership via AccountOwner
-- 4. Household member access
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Primary check: User owns the transaction directly (most efficient)
    "userId" = auth.uid()
    OR
    -- Fallback 1: User owns the account directly
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Fallback 2: User is an owner via AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Fallback 3: User is a member of household that has AccountOwner
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
-- Step 3: Verify the policy was created
-- ============================================
-- Check if policy exists
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
-- Step 4: Test query (this will show if RLS is working)
-- ============================================
-- Note: This query will only work if you're authenticated
-- To test, run this in the Supabase SQL Editor while logged in
-- SELECT 
--   COUNT(*) as "Total Transactions Visible",
--   COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Direct Transactions",
--   COUNT(CASE WHEN EXISTS (
--     SELECT 1 FROM "Account" 
--     WHERE "Account"."id" = "Transaction"."accountId" 
--     AND "Account"."userId" = auth.uid()
--   ) THEN 1 END) as "Transactions via Account Ownership"
-- FROM "Transaction";

