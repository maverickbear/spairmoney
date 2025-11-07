-- Script de Diagnóstico Completo: Verificar todas as tabelas relacionadas
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar Transaction e userId
-- ============================================
SELECT 
  'Transaction' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Sem userId",
  COUNT(DISTINCT "userId") as "UserIds únicos"
FROM "Transaction";

-- ============================================
-- 2. Verificar Account e userId
-- ============================================
SELECT 
  'Account' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId",
  COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as "Sem userId",
  COUNT(DISTINCT "userId") as "UserIds únicos"
FROM "Account";

-- ============================================
-- 3. Verificar AccountOwner
-- ============================================
SELECT 
  'AccountOwner' as "Tabela",
  COUNT(*) as "Total",
  COUNT(DISTINCT "accountId") as "Contas únicas",
  COUNT(DISTINCT "ownerId") as "Owners únicos"
FROM "AccountOwner";

-- ============================================
-- 4. Verificar HouseholdMember
-- ============================================
SELECT 
  'HouseholdMember' as "Tabela",
  COUNT(*) as "Total",
  COUNT(DISTINCT "ownerId") as "Owners únicos",
  COUNT(DISTINCT "memberId") as "Members únicos",
  COUNT(CASE WHEN "status" = 'active' THEN 1 END) as "Ativos"
FROM "HouseholdMember";

-- ============================================
-- 5. Verificar User (usuários autenticados)
-- ============================================
SELECT 
  'User' as "Tabela",
  COUNT(*) as "Total",
  COUNT(DISTINCT id) as "UserIds únicos"
FROM "User";

-- ============================================
-- 6. Verificar relação Transaction -> Account
-- ============================================
SELECT 
  'Transaction -> Account' as "Relação",
  COUNT(*) as "Total Transactions",
  COUNT(DISTINCT t."accountId") as "Contas únicas",
  COUNT(CASE WHEN a."userId" IS NOT NULL THEN 1 END) as "Contas com userId",
  COUNT(CASE WHEN a."userId" IS NULL THEN 1 END) as "Contas sem userId"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId";

-- ============================================
-- 7. Verificar transações sem userId e suas contas
-- ============================================
SELECT 
  t.id as "Transaction ID",
  t."userId" as "Transaction userId",
  t."accountId" as "Account ID",
  a."userId" as "Account userId",
  a.name as "Account Name",
  t.type as "Type",
  t.amount as "Amount",
  t.date as "Date"
FROM "Transaction" t
LEFT JOIN "Account" a ON a.id = t."accountId"
WHERE t."userId" IS NULL
LIMIT 10;

-- ============================================
-- 8. Verificar contas sem userId
-- ============================================
SELECT 
  a.id as "Account ID",
  a.name as "Account Name",
  a."userId" as "Account userId",
  COUNT(t.id) as "Transaction Count"
FROM "Account" a
LEFT JOIN "Transaction" t ON t."accountId" = a.id
WHERE a."userId" IS NULL
GROUP BY a.id, a.name, a."userId"
LIMIT 10;

-- ============================================
-- 9. Verificar AccountOwner para contas com transações
-- ============================================
SELECT 
  a.id as "Account ID",
  a.name as "Account Name",
  a."userId" as "Account userId",
  COUNT(DISTINCT ao."ownerId") as "AccountOwner Count",
  COUNT(t.id) as "Transaction Count"
FROM "Account" a
LEFT JOIN "AccountOwner" ao ON ao."accountId" = a.id
LEFT JOIN "Transaction" t ON t."accountId" = a.id
GROUP BY a.id, a.name, a."userId"
HAVING COUNT(t.id) > 0
LIMIT 10;

-- ============================================
-- 10. Testar RLS - Verificar se auth.uid() funciona
-- ============================================
-- Execute este enquanto estiver logado
-- SELECT 
--   auth.uid() as "Current User ID",
--   COUNT(*) as "Transactions Visible",
--   COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Direct userId Match",
--   COUNT(CASE WHEN EXISTS (
--     SELECT 1 FROM "Account" 
--     WHERE "Account"."id" = "Transaction"."accountId" 
--     AND "Account"."userId" = auth.uid()
--   ) THEN 1 END) as "Via Account userId"
-- FROM "Transaction";

-- ============================================
-- 11. Verificar políticas RLS ativas
-- ============================================
SELECT 
  policyname,
  cmd as "Command",
  permissive,
  roles,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
ORDER BY policyname;

-- ============================================
-- 12. Verificar se RLS está habilitado
-- ============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('Transaction', 'Account', 'AccountOwner', 'HouseholdMember')
ORDER BY tablename;

