-- Script to verify Transaction RLS and userId status
-- Run this in Supabase SQL Editor to check the current state

-- ============================================
-- 1. Check RLS Status
-- ============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

-- ============================================
-- 2. Check userId column status
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Transaction'
AND column_name = 'userId';

-- ============================================
-- 3. Count transactions with/without userId
-- ============================================
SELECT 
  COUNT(*) as "Total Transactions",
  COUNT("userId") as "Transactions with userId",
  COUNT(*) - COUNT("userId") as "Transactions without userId"
FROM "Transaction";

-- ============================================
-- 4. Check RLS Policies
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
ORDER BY policyname;

-- ============================================
-- 5. Sample transactions (first 10)
-- ============================================
SELECT 
  id,
  "userId",
  "accountId",
  type,
  amount,
  date,
  "createdAt"
FROM "Transaction"
ORDER BY "createdAt" DESC
LIMIT 10;

-- ============================================
-- 6. Check if userId matches account ownership
-- ============================================
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  a."userId" as "Account userId",
  CASE 
    WHEN t."userId" = a."userId" THEN 'MATCH'
    WHEN t."userId" IS NULL THEN 'MISSING'
    ELSE 'MISMATCH'
  END as "Status"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
ORDER BY t."createdAt" DESC
LIMIT 20;

