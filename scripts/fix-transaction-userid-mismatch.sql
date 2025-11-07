-- Script para corrigir userId das transações se não corresponder ao usuário atual
-- ⚠️ ATENÇÃO: Execute este script apenas se você tiver certeza de que as transações devem pertencer ao usuário atual
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar o usuário atual e suas transações
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  COUNT(*) as "Total Transactions",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Transactions",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Other User Transactions",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "NULL userId Transactions"
FROM "Transaction";

-- ============================================
-- 2. Verificar transações que não pertencem ao usuário atual
-- ============================================
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  t."accountId",
  a."userId" as "Account userId",
  a.name as "Account Name",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Correct'
    WHEN t."userId" IS NULL THEN '⚠️ NULL - Will fix'
    WHEN t."userId" != auth.uid() AND a."userId" = auth.uid() THEN '⚠️ Mismatch - Will fix'
    ELSE '❌ Different user - Will NOT fix'
  END as "Status"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
ORDER BY t."createdAt" DESC;

-- ============================================
-- 3. ATUALIZAR transações que pertencem ao usuário atual mas têm userId incorreto
-- ============================================
-- ⚠️ ATENÇÃO: Este UPDATE só corrige transações onde:
-- - A conta pertence ao usuário atual (Account.userId = auth.uid())
-- - A transação tem userId NULL ou diferente
-- - Isso garante que não alteramos transações de outros usuários

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
-- 4. Verificar o resultado após a correção
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  COUNT(*) as "Total Transactions",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Transactions (should match Total)",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Other User Transactions",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "NULL userId Transactions (should be 0)"
FROM "Transaction";

-- ============================================
-- 5. Testar se o RLS agora permite acesso
-- ============================================
SELECT 
  COUNT(*) as "Visible Transactions (should match My Transactions above)"
FROM "Transaction"
WHERE "userId" = auth.uid();

