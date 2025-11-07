-- Script de Verificação: Verificar se todas as políticas RLS foram criadas corretamente
-- Execute este script no Supabase SQL Editor após executar a migration

-- ============================================
-- 1. Listar todas as políticas criadas
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 2. Estatísticas por tabela
-- ============================================
SELECT 
  tablename,
  COUNT(*) as "Total Policies",
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as "SELECT",
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as "INSERT",
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as "UPDATE",
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as "DELETE"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 3. Verificar políticas específicas importantes
-- ============================================

-- Transaction policies (deve ter 4 políticas)
SELECT 
  'Transaction' as "Table",
  COUNT(*) as "Policy Count",
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as "SELECT",
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as "INSERT",
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as "UPDATE",
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as "DELETE"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction';

-- Account policies (deve ter 4 políticas)
SELECT 
  'Account' as "Table",
  COUNT(*) as "Policy Count",
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as "SELECT",
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as "INSERT",
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as "UPDATE",
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as "DELETE"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Account';

-- ============================================
-- 4. Verificar condição das políticas Transaction
-- ============================================
SELECT 
  policyname,
  cmd,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================
-- 5. Verificar condição das políticas Account
-- ============================================
SELECT 
  policyname,
  cmd,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Account'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================
-- 6. Resumo final
-- ============================================
SELECT 
  'Total Tables with RLS' as "Metric",
  COUNT(*) as "Value"
FROM pg_tables
WHERE schemaname = 'public' 
AND rowsecurity = true
AND tablename IN (
  'Account', 'Transaction', 'Budget', 'BudgetCategory', 'Category', 'Subcategory',
  'Macro', 'Goal', 'Debt', 'InvestmentAccount', 'InvestmentTransaction',
  'AccountInvestmentValue', 'SimpleInvestmentEntry', 'AccountOwner', 'HouseholdMember',
  'User', 'Plan', 'Subscription', 'Security', 'SecurityPrice'
)
UNION ALL
SELECT 
  'Total Policies Created' as "Metric",
  COUNT(*) as "Value"
FROM pg_policies
WHERE schemaname = 'public';

