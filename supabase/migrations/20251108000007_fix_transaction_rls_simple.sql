-- Migration: Fix Transaction RLS - Simple and Direct
-- O problema: A política RLS não está funcionando mesmo com userId correto
-- Solução: Criar uma política mais simples e direta que verifica userId primeiro

-- ============================================
-- Step 1: Recriar Transaction RLS policy de forma mais simples
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Política simplificada: verifica userId primeiro (mais rápido e direto)
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Verificação 1: userId direto (mais rápido)
    "userId" = auth.uid()
    OR
    -- Verificação 2: Account.userId (fallback)
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Verificação 3: AccountOwner (para contas compartilhadas)
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Verificação 4: HouseholdMember (para membros do household)
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 2: Verificar se a política foi criada
-- ============================================

SELECT 
  policyname,
  cmd as "Command",
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
AND policyname = 'Users can view own transactions';

-- ============================================
-- Step 3: Teste direto (execute enquanto logado)
-- ============================================
-- Descomente e execute para testar:
-- 
-- SELECT 
--   auth.uid() as "Current User ID",
--   COUNT(*) as "Total Transactions",
--   COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "Direct Match",
--   COUNT(CASE WHEN EXISTS (
--     SELECT 1 FROM "Account" 
--     WHERE "Account"."id" = "Transaction"."accountId" 
--     AND "Account"."userId" = auth.uid()
--   ) THEN 1 END) as "Via Account"
-- FROM "Transaction";

