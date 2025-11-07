-- Script de Diagnóstico: Por que Monthly Income/Expenses aparecem como 0?
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há transações no banco
SELECT 
  COUNT(*) as "Total de Transações",
  COUNT(DISTINCT "userId") as "Usuários com Transações",
  COUNT(DISTINCT "accountId") as "Contas com Transações"
FROM "Transaction";

-- 2. Verificar transações sem userId
SELECT 
  COUNT(*) as "Transações sem userId",
  COUNT(DISTINCT "accountId") as "Contas afetadas"
FROM "Transaction"
WHERE "userId" IS NULL;

-- 3. Verificar transações do mês atual
SELECT 
  COUNT(*) as "Transações do Mês Atual",
  COUNT(CASE WHEN type = 'income' THEN 1 END) as "Income",
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as "Expense",
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as "Total Income",
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as "Total Expense"
FROM "Transaction"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 4. Verificar contas e seus userIds
SELECT 
  a.id as "Account ID",
  a.name as "Account Name",
  a."userId" as "Account UserId",
  COUNT(t.id) as "Transaction Count",
  COUNT(CASE WHEN t."userId" IS NULL THEN 1 END) as "Transactions sem userId"
FROM "Account" a
LEFT JOIN "Transaction" t ON t."accountId" = a.id
GROUP BY a.id, a.name, a."userId"
ORDER BY "Transaction Count" DESC
LIMIT 10;

-- 5. Verificar AccountOwner
SELECT 
  ao."accountId",
  ao."ownerId",
  COUNT(t.id) as "Transaction Count"
FROM "AccountOwner" ao
LEFT JOIN "Transaction" t ON t."accountId" = ao."accountId"
GROUP BY ao."accountId", ao."ownerId"
LIMIT 10;

-- 6. Verificar transações recentes com detalhes
SELECT 
  t.id,
  t.date,
  t.type,
  t.amount,
  t."accountId",
  t."userId" as "Transaction UserId",
  a."userId" as "Account UserId",
  a.name as "Account Name"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
ORDER BY t.date DESC
LIMIT 10;

-- 7. Verificar RLS status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

-- 8. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

-- 9. Testar acesso com RLS (simular usuário autenticado)
-- Substitua 'USER_ID_AQUI' pelo ID do usuário atual
-- SELECT 
--   COUNT(*) as "Transações Visíveis (com RLS)",
--   COUNT(CASE WHEN type = 'income' THEN 1 END) as "Income",
--   COUNT(CASE WHEN type = 'expense' THEN 1 END) as "Expense",
--   SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as "Total Income",
--   SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as "Total Expense"
-- FROM "Transaction"
-- WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
--   AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

