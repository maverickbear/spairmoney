-- Script de diagnóstico para verificar por que o RLS não está permitindo acesso às transações
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar usuário autenticado atual
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  auth.email() as "Current User Email",
  auth.role() as "Current User Role";

-- ============================================
-- 2. Verificar todas as transações e seus userIds
-- ============================================
SELECT 
  id as "Transaction ID",
  "userId" as "Transaction userId",
  "accountId",
  type,
  amount,
  date,
  CASE 
    WHEN "userId" = auth.uid() THEN 'MATCH - Should be visible'
    WHEN "userId" IS NULL THEN 'NULL - Will not be visible'
    ELSE 'MISMATCH - Will not be visible'
  END as "RLS Status"
FROM "Transaction"
ORDER BY "createdAt" DESC;

-- ============================================
-- 3. Verificar contas e seus userIds
-- ============================================
SELECT 
  id as "Account ID",
  name as "Account Name",
  "userId" as "Account userId",
  CASE 
    WHEN "userId" = auth.uid() THEN 'MATCH - User owns this account'
    ELSE 'MISMATCH - User does not own this account'
  END as "Ownership Status"
FROM "Account"
ORDER BY "createdAt" DESC;

-- ============================================
-- 4. Verificar se há transações sem userId
-- ============================================
SELECT 
  COUNT(*) as "Transactions without userId"
FROM "Transaction"
WHERE "userId" IS NULL;

-- ============================================
-- 5. Verificar se há transações com userId diferente do usuário atual
-- ============================================
SELECT 
  COUNT(*) as "Transactions with different userId",
  COUNT(DISTINCT "userId") as "Number of different userIds"
FROM "Transaction"
WHERE "userId" IS NOT NULL
AND "userId" != auth.uid();

-- ============================================
-- 6. Verificar políticas RLS ativas
-- ============================================
SELECT 
  policyname,
  cmd as "Command",
  permissive,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
ORDER BY policyname;

-- ============================================
-- 7. Testar a política SELECT diretamente
-- ============================================
-- Esta query simula o que a política RLS faz
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  t."accountId",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Direct ownership'
    WHEN EXISTS (
      SELECT 1 FROM "Account" a
      WHERE a."id" = t."accountId"
      AND a."userId" = auth.uid()
    ) THEN '✅ Account ownership'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" ao
      WHERE ao."accountId" = t."accountId"
      AND ao."ownerId" = auth.uid()
    ) THEN '✅ AccountOwner'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" ao
      JOIN "HouseholdMember" hm ON hm."ownerId" = ao."ownerId"
      WHERE ao."accountId" = t."accountId"
      AND hm."memberId" = auth.uid()
      AND hm."status" = 'active'
    ) THEN '✅ HouseholdMember'
    ELSE '❌ No access'
  END as "Access Method"
FROM "Transaction" t
ORDER BY t."createdAt" DESC;

-- ============================================
-- 8. Verificar se o RLS está realmente habilitado
-- ============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN '✅ RLS is ENABLED'
    ELSE '❌ RLS is DISABLED'
  END as "Status"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

