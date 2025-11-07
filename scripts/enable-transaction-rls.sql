-- Script para habilitar RLS na tabela Transaction com as políticas corretas
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Verificar status atual do RLS
-- ============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

-- ============================================
-- 2. Habilitar RLS na tabela Transaction
-- ============================================
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Remover políticas antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can insert own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

-- ============================================
-- 4. Criar política SELECT (visualizar transações)
-- ============================================
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- User owns the transaction directly (primary check - most efficient)
    "userId" = auth.uid()
    OR
    -- User owns the account directly (Account.userId) - fallback for old data
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- 5. Criar política INSERT (criar transações)
-- ============================================
CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- 6. Criar política UPDATE (atualizar transações)
-- ============================================
CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- 7. Criar política DELETE (deletar transações)
-- ============================================
CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING (
    -- User owns the transaction directly
    "userId" = auth.uid()
    OR
    -- User owns the account directly (Account.userId)
    EXISTS (
      SELECT 1 FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- User is an owner via AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- User is a member of household that has AccountOwner
    EXISTS (
      SELECT 1 FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- 8. Verificar se funcionou
-- ============================================
-- Verificar RLS status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Transaction';

-- Verificar políticas criadas
SELECT 
  policyname,
  cmd as "Command",
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Transaction'
ORDER BY policyname;

-- Verificar se o usuário atual consegue ver suas transações
SELECT 
  COUNT(*) as "Total Transactions",
  COUNT(CASE WHEN "userId" = auth.uid() THEN 1 END) as "My Transactions"
FROM "Transaction";

