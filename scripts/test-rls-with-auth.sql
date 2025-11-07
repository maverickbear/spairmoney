-- Script de Teste: Verificar RLS com auth.uid()
-- Execute este script no Supabase SQL Editor ENQUANTO ESTIVER LOGADO
-- Este script testa se o RLS está funcionando corretamente

-- ============================================
-- 1. Verificar se auth.uid() está funcionando
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() retorna NULL - Usuário não autenticado'
    ELSE '✅ auth.uid() funcionando: ' || auth.uid()::text
  END as "Status";

-- ============================================
-- 2. Verificar transações SEM RLS (usando service role)
-- ============================================
-- Nota: Esta query só funciona com service role key
-- Execute no SQL Editor com service role para ver todas as transações
SELECT 
  'Todas as transações (sem RLS)' as "Tipo",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Sem userId"
FROM "Transaction";

-- ============================================
-- 3. Verificar transações COM RLS (com auth.uid())
-- ============================================
-- Esta query deve retornar apenas as transações que o usuário pode ver
SELECT 
  'Transações visíveis (com RLS)' as "Tipo",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Direto (userId = auth.uid())",
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM "Account" 
    WHERE "Account"."id" = "Transaction"."accountId" 
    AND "Account"."userId" = auth.uid()
  ) THEN 1 END) as "Via Account.userId",
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM "AccountOwner" 
    WHERE "AccountOwner"."accountId" = "Transaction"."accountId" 
    AND "AccountOwner"."ownerId" = auth.uid()
  ) THEN 1 END) as "Via AccountOwner"
FROM "Transaction";

-- ============================================
-- 4. Verificar transações do mês atual COM RLS
-- ============================================
SELECT 
  'Transações do mês (com RLS)' as "Tipo",
  COUNT(*) as "Total",
  COUNT(CASE WHEN type = 'income' THEN 1 END) as "Income",
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as "Expense",
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as "Total Income",
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as "Total Expense"
FROM "Transaction"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ============================================
-- 5. Verificar contas COM RLS
-- ============================================
SELECT 
  'Contas visíveis (com RLS)' as "Tipo",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Direto (userId = auth.uid())",
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM "AccountOwner" 
    WHERE "AccountOwner"."accountId" = "Account"."id" 
    AND "AccountOwner"."ownerId" = auth.uid()
  ) THEN 1 END) as "Via AccountOwner"
FROM "Account";

-- ============================================
-- 6. Verificar AccountOwner COM RLS
-- ============================================
SELECT 
  'AccountOwner visíveis (com RLS)' as "Tipo",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "ownerId" = auth.uid() THEN 1 END) as "Direto (ownerId = auth.uid())"
FROM "AccountOwner";

-- ============================================
-- 7. Testar cada condição da política RLS separadamente
-- ============================================
SELECT 
  'Teste Condição 1: userId = auth.uid()' as "Condição",
  COUNT(*) as "Transações que passam"
FROM "Transaction"
WHERE "userId" = auth.uid();

SELECT 
  'Teste Condição 2: Account.userId = auth.uid()' as "Condição",
  COUNT(*) as "Transações que passam"
FROM "Transaction"
WHERE EXISTS (
  SELECT 1 FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId" 
  AND "Account"."userId" = auth.uid()
);

SELECT 
  'Teste Condição 3: AccountOwner.ownerId = auth.uid()' as "Condição",
  COUNT(*) as "Transações que passam"
FROM "Transaction"
WHERE EXISTS (
  SELECT 1 FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId" 
  AND "AccountOwner"."ownerId" = auth.uid()
);

SELECT 
  'Teste Condição 4: HouseholdMember' as "Condição",
  COUNT(*) as "Transações que passam"
FROM "Transaction"
WHERE EXISTS (
  SELECT 1 FROM "AccountOwner"
  JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
  AND "HouseholdMember"."memberId" = auth.uid()
  AND "HouseholdMember"."status" = 'active'
);

-- ============================================
-- 8. Verificar transações específicas do usuário atual
-- ============================================
SELECT 
  t.id,
  t.date,
  t.type,
  t.amount,
  t."userId" as "Transaction userId",
  t."accountId",
  a."userId" as "Account userId",
  a.name as "Account Name",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Passa: userId direto'
    WHEN a."userId" = auth.uid() THEN '✅ Passa: Account.userId'
    WHEN EXISTS (
      SELECT 1 FROM "AccountOwner" 
      WHERE "AccountOwner"."accountId" = t."accountId" 
      AND "AccountOwner"."ownerId" = auth.uid()
    ) THEN '✅ Passa: AccountOwner'
    ELSE '❌ NÃO PASSA: Nenhuma condição atendida'
  END as "Status RLS"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.date DESC
LIMIT 10;

