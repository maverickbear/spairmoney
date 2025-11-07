-- Script para corrigir userId das transações e contas
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar usuário atual
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  auth.email() as "Current User Email";

-- ============================================
-- 2. Verificar contas e seus userIds
-- ============================================
SELECT 
  id as "Account ID",
  name as "Account Name",
  "userId" as "Account userId",
  CASE 
    WHEN "userId" = auth.uid() THEN '✅ Account belongs to me'
    WHEN "userId" IS NULL THEN '⚠️ Account userId is NULL'
    ELSE '❌ Account belongs to another user'
  END as "Account Status"
FROM "Account"
ORDER BY "createdAt" DESC;

-- ============================================
-- 3. Verificar transações e seus userIds
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
    WHEN a."userId" IS NULL THEN '⚠️ Account userId is NULL'
    ELSE '❌ Account belongs to another user'
  END as "Status"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
ORDER BY t."createdAt" DESC;

-- ============================================
-- 4. CORRIGIR: Atualizar userId das contas para o usuário atual
-- ============================================
-- ⚠️ ATENÇÃO: Este UPDATE atualiza TODAS as contas para pertencer ao usuário atual
-- Execute apenas se você tiver certeza de que todas as contas devem pertencer a você

-- Primeiro, vamos ver quantas contas serão afetadas
SELECT 
  COUNT(*) as "Accounts that will be updated",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Accounts already mine",
  COUNT(CASE WHEN "userId" != auth.uid() OR "userId" IS NULL THEN 1 END) as "Accounts that will be changed"
FROM "Account";

-- Se você quiser atualizar todas as contas para pertencer ao usuário atual, descomente a linha abaixo:
-- UPDATE "Account" SET "userId" = auth.uid() WHERE "userId" IS NULL OR "userId" != auth.uid();

-- ============================================
-- 5. CORRIGIR: Atualizar userId das transações baseado nas contas
-- ============================================
-- Este UPDATE atualiza transações onde:
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
-- 6. Verificar resultado após correção
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  COUNT(*) as "Total Transactions",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Transactions",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Other User Transactions",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "NULL userId Transactions"
FROM "Transaction";

-- ============================================
-- 7. TESTAR: Verificar se o RLS agora permite acesso
-- ============================================
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
-- 8. Verificar contas após correção (se você executou o UPDATE)
-- ============================================
SELECT 
  COUNT(*) as "Total Accounts",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Accounts",
  COUNT(CASE WHEN "userId" != auth.uid() THEN 1 END) as "Other User Accounts",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "NULL userId Accounts"
FROM "Account";

