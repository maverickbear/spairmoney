-- Script de Teste: Verificar se auth.uid() está funcionando
-- Execute este script no Supabase SQL Editor ENQUANTO ESTIVER LOGADO

-- ============================================
-- 1. Verificar se auth.uid() retorna um valor
-- ============================================
SELECT 
  auth.uid() as "Current User ID",
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() retorna NULL - Usuário não autenticado'
    ELSE '✅ auth.uid() funcionando: ' || auth.uid()::text
  END as "Status";

-- ============================================
-- 2. Verificar transações com userId direto
-- ============================================
SELECT 
  'Transações com userId = auth.uid()' as "Teste",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Match Direto"
FROM "Transaction"
WHERE "userId" = auth.uid();

-- ============================================
-- 3. Verificar transações via Account.userId
-- ============================================
SELECT 
  'Transações via Account.userId' as "Teste",
  COUNT(*) as "Total"
FROM "Transaction" t
WHERE EXISTS (
  SELECT 1 
  FROM "Account" a
  WHERE a.id = t."accountId"
  AND a."userId" = auth.uid()
);

-- ============================================
-- 4. Verificar transações do mês atual
-- ============================================
SELECT 
  'Transações do mês (com RLS)' as "Teste",
  COUNT(*) as "Total",
  COUNT(CASE WHEN type = 'income' THEN 1 END) as "Income",
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as "Expense",
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as "Total Income",
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as "Total Expense"
FROM "Transaction"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ============================================
-- 5. Verificar transações específicas
-- ============================================
SELECT 
  t.id,
  t.date,
  t.type,
  t.amount,
  t."userId" as "Transaction userId",
  auth.uid() as "Current auth.uid()",
  CASE 
    WHEN t."userId" = auth.uid() THEN '✅ Match direto'
    ELSE '❌ Não match'
  END as "Status",
  a."userId" as "Account userId",
  a.name as "Account Name"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.date DESC
LIMIT 10;

