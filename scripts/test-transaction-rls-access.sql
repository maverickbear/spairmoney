-- Script de teste direto para verificar acesso às transações via RLS
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar usuário atual
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  auth.email() as "Current User Email";

-- ============================================
-- 2. Verificar transações e seus userIds
-- ============================================
SELECT 
  id as "Transaction ID",
  "userId" as "Transaction userId",
  "accountId",
  type,
  amount,
  CASE 
    WHEN "userId" = auth.uid() THEN '✅ userId matches'
    WHEN "userId" IS NULL THEN '⚠️ userId is NULL'
    ELSE '❌ userId does not match'
  END as "userId Status"
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
    WHEN "userId" = auth.uid() THEN '✅ Account belongs to me'
    ELSE '❌ Account does not belong to me'
  END as "Account Status"
FROM "Account"
ORDER BY "createdAt" DESC;

-- ============================================
-- 4. Verificar correspondência entre transações e contas
-- ============================================
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  t."accountId",
  a."userId" as "Account userId",
  a.name as "Account Name",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Transaction userId matches'
    WHEN a."userId" = auth.uid() THEN '⚠️ Account belongs to me, but transaction userId is different'
    ELSE '❌ Account does not belong to me'
  END as "Status"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
ORDER BY t."createdAt" DESC;

-- ============================================
-- 5. TESTE DIRETO: Tentar acessar transações via RLS
-- ============================================
-- Esta query deve retornar apenas transações que o RLS permite ver
SELECT 
  COUNT(*) as "Visible Transactions Count",
  SUM(amount) as "Total Amount of Visible Transactions"
FROM "Transaction";

-- ============================================
-- 6. TESTE ALTERNATIVO: Verificar se a política RLS funciona
-- ============================================
-- Esta query testa cada condição da política RLS
SELECT 
  t.id as "Transaction ID",
  t."userId" = auth.uid() as "Direct userId match",
  EXISTS (
    SELECT 1 FROM "Account" a
    WHERE a.id = t."accountId"
    AND a."userId" = auth.uid()
  ) as "Account ownership match",
  EXISTS (
    SELECT 1 FROM "AccountOwner" ao
    WHERE ao."accountId" = t."accountId"
    AND ao."ownerId" = auth.uid()
  ) as "AccountOwner match",
  EXISTS (
    SELECT 1 FROM "AccountOwner" ao
    JOIN "HouseholdMember" hm ON hm."ownerId" = ao."ownerId"
    WHERE ao."accountId" = t."accountId"
    AND hm."memberId" = auth.uid()
    AND hm."status" = 'active'
  ) as "HouseholdMember match",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Should be visible (direct match)'
    WHEN EXISTS (
      SELECT 1 FROM "Account" a
      WHERE a.id = t."accountId"
      AND a."userId" = auth.uid()
    ) THEN '✅ Should be visible (account ownership)'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" ao
      WHERE ao."accountId" = t."accountId"
      AND ao."ownerId" = auth.uid()
    ) THEN '✅ Should be visible (AccountOwner)'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" ao
      JOIN "HouseholdMember" hm ON hm."ownerId" = ao."ownerId"
      WHERE ao."accountId" = t."accountId"
      AND hm."memberId" = auth.uid()
      AND hm."status" = 'active'
    ) THEN '✅ Should be visible (HouseholdMember)'
    ELSE '❌ Should NOT be visible'
  END as "RLS Access Status"
FROM "Transaction" t
ORDER BY t."createdAt" DESC;

