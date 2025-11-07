-- Migration: Fix Transaction RLS with JOINs
-- O problema: Quando fazemos select('*, account:Account(*)'), o Supabase aplica RLS em Account também
-- Se Account RLS bloquear, a transação não aparece mesmo que Transaction RLS permita
-- 
-- Solução: Garantir que Account RLS permita acesso quando Transaction RLS permite

-- ============================================
-- Step 1: Verificar e corrigir Account RLS
-- ============================================

-- A política de Account deve permitir acesso quando:
-- 1. Account.userId = auth.uid()
-- 2. AccountOwner.ownerId = auth.uid()
-- 3. HouseholdMember.memberId = auth.uid()

-- Verificar se a política atual está correta
SELECT 
  policyname,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Account'
AND cmd = 'SELECT'
AND policyname = 'Users can view own accounts';

-- Se a política não existir ou estiver incorreta, recriar
DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";

CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (
    -- Check 1: Direct userId match
    "userId" = auth.uid()
    OR
    -- Check 2: User is owner via AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Account"."id"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Check 3: User is household member
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      JOIN "HouseholdMember" ON "HouseholdMember"."ownerId" = "AccountOwner"."ownerId"
      WHERE "AccountOwner"."accountId" = "Account"."id"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 2: Garantir que todas as contas têm userId
-- ============================================

-- Preencher userId nas contas que não têm
UPDATE "Account" 
SET "userId" = (
  SELECT "ownerId" 
  FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Account"."id"
  ORDER BY "AccountOwner"."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Account"."id"
);

-- ============================================
-- Step 3: Criar AccountOwner para contas que não têm
-- ============================================

-- Para contas que têm userId mas não têm AccountOwner, criar
INSERT INTO "AccountOwner" ("accountId", "ownerId", "createdAt", "updatedAt")
SELECT 
  a.id as "accountId",
  a."userId" as "ownerId",
  COALESCE(a."createdAt", NOW()) as "createdAt",
  COALESCE(a."updatedAt", NOW()) as "updatedAt"
FROM "Account" a
WHERE a."userId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "AccountOwner" ao
  WHERE ao."accountId" = a.id
  AND ao."ownerId" = a."userId"
);

-- ============================================
-- Step 4: Garantir que todas as transações têm userId
-- ============================================

-- Preencher userId nas transações que não têm
UPDATE "Transaction" 
SET "userId" = (
  SELECT "Account"."userId" 
  FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
  AND "Account"."userId" IS NOT NULL
);

-- Se account não tem userId, tentar via AccountOwner
UPDATE "Transaction" 
SET "userId" = (
  SELECT "AccountOwner"."ownerId" 
  FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
  ORDER BY "AccountOwner"."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL
AND EXISTS (
  SELECT 1 FROM "AccountOwner" 
  WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
);

-- ============================================
-- Step 5: Recriar Transaction RLS policy
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Check 1: Direct userId match (fastest)
    "userId" = auth.uid()
    OR
    -- Check 2: Account belongs to user
    EXISTS (
      SELECT 1 
      FROM "Account"
      WHERE "Account"."id" = "Transaction"."accountId"
      AND "Account"."userId" = auth.uid()
    )
    OR
    -- Check 3: User is owner via AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Transaction"."accountId"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Check 4: User is household member
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
-- Step 6: Verificar Category e Subcategory RLS
-- ============================================

-- Category RLS deve permitir acesso a categorias do sistema (userId IS NULL) e do usuário
-- Verificar se a política está correta
SELECT 
  policyname,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Category'
AND cmd = 'SELECT'
AND policyname LIKE '%view%';

-- Subcategory RLS deve permitir acesso baseado na Category
SELECT 
  policyname,
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Subcategory'
AND cmd = 'SELECT'
AND policyname LIKE '%view%';

-- ============================================
-- Step 7: Estatísticas finais
-- ============================================

-- Verificar se tudo está correto
SELECT 
  'Account' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId"
FROM "Account"
UNION ALL
SELECT 
  'Transaction' as "Tabela",
  COUNT(*) as "Total",
  COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as "Com userId"
FROM "Transaction"
UNION ALL
SELECT 
  'AccountOwner' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) as "Com ownerId"
FROM "AccountOwner";

-- Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('Transaction', 'Account', 'AccountOwner')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

