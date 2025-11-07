-- Script de Teste: Verificar se o problema é com JOINs e RLS
-- Execute este script no Supabase SQL Editor ENQUANTO ESTIVER LOGADO

-- ============================================
-- 1. Testar SELECT simples (sem JOIN) - Deve funcionar
-- ============================================
SELECT 
  'SELECT simples (sem JOIN)' as "Teste",
  COUNT(*) as "Transações visíveis"
FROM "Transaction";

-- ============================================
-- 2. Testar SELECT com JOIN Account - Pode falhar se Account RLS bloquear
-- ============================================
SELECT 
  'SELECT com JOIN Account' as "Teste",
  COUNT(*) as "Transações visíveis"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId";

-- ============================================
-- 3. Verificar se Account RLS está bloqueando
-- ============================================
-- Verificar quantas contas o usuário pode ver
SELECT 
  'Contas visíveis' as "Teste",
  COUNT(*) as "Total"
FROM "Account";

-- ============================================
-- 4. Verificar transações e suas contas
-- ============================================
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  t."accountId" as "Account ID",
  a."userId" as "Account userId",
  a.name as "Account Name",
  CASE 
    WHEN a.id IS NULL THEN '❌ Conta não encontrada'
    WHEN a."userId" IS NULL THEN '⚠️ Conta sem userId'
    WHEN a."userId" = auth.uid() THEN '✅ Conta pertence ao usuário'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" 
      WHERE "AccountOwner"."accountId" = a.id 
      AND "AccountOwner"."ownerId" = auth.uid()
    ) THEN '✅ Conta via AccountOwner'
    ELSE '❌ Conta não acessível'
  END as "Status da Conta"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
WHERE t.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.date DESC
LIMIT 10;

-- ============================================
-- 5. Testar query similar ao código (com select aninhado)
-- ============================================
-- Esta é a query que o Supabase faz quando você usa select('*, account:Account(*)')
-- O problema pode estar aqui: se Account RLS bloquear, a transação não aparece
SELECT 
  t.*,
  CASE 
    WHEN a.id IS NOT NULL THEN jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'userId', a."userId",
      'type', a.type
    )
    ELSE NULL
  END as account
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
WHERE t.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.date DESC
LIMIT 5;

