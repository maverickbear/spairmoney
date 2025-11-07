-- Script rápido para verificar e corrigir o problema do RLS
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar usuário atual e transações
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  COUNT(*) as "Total Transactions in DB",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Transactions with my userId",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Transactions with other userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Transactions with NULL userId"
FROM "Transaction";

-- ============================================
-- 2. Verificar transações e suas contas
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
-- 3. CORRIGIR: Atualizar userId das transações baseado na conta
-- ============================================
-- Este UPDATE corrige transações onde:
-- - A conta pertence ao usuário atual (Account.userId = auth.uid())
-- - Mas a transação tem userId diferente ou NULL

UPDATE "Transaction" t
SET "userId" = (
  SELECT a."userId" 
  FROM "Account" a 
  WHERE a.id = t."accountId"
  AND a."userId" = auth.uid()
)
WHERE EXISTS (
  SELECT 1 FROM "Account" a
  WHERE a.id = t."accountId"
  AND a."userId" = auth.uid()
)
AND (
  t."userId" IS NULL 
  OR t."userId" != auth.uid()
);

-- ============================================
-- 4. Verificar resultado após correção
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  COUNT(*) as "Total Transactions in DB",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Transactions (should match Total if all accounts are mine)",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Other User Transactions",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "NULL userId Transactions (should be 0)"
FROM "Transaction";

-- ============================================
-- 5. TESTAR: Verificar se o RLS agora permite acesso
-- ============================================
-- Esta query deve retornar o mesmo número que "My Transactions" acima
SELECT 
  COUNT(*) as "Visible Transactions via RLS (should match My Transactions above)"
FROM "Transaction"
WHERE "userId" = auth.uid()
   OR EXISTS (
     SELECT 1 FROM "Account" a
     WHERE a.id = "Transaction"."accountId"
     AND a."userId" = auth.uid()
   );

-- ============================================
-- 6. Verificar políticas RLS ativas
-- ============================================
SELECT 
  policyname,
  cmd as "Command",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Most important for viewing'
    ELSE 'Other operation'
  END as "Note"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

