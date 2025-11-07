-- Migration: Fix Transaction RLS - Final Solution
-- Este é o fix final que garante que tudo está correto
-- Execute esta migration no Supabase SQL Editor

-- ============================================
-- Step 1: Garantir que todas as transações têm userId
-- ============================================

-- Preencher userId nas transações que não têm (via Account)
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

-- Preencher userId nas transações que não têm (via AccountOwner)
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
-- Step 2: Garantir que todas as contas têm userId
-- ============================================

-- Preencher userId nas contas que não têm (via AccountOwner)
UPDATE "Account" 
SET "userId" = (
  SELECT "AccountOwner"."ownerId" 
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
-- Step 4: Recriar Transaction RLS policy (versão simplificada)
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";

-- Política simplificada que verifica userId primeiro (mais rápido)
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    -- Verificação 1: userId direto (mais rápido e direto)
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
-- Step 5: Recriar Account RLS policy (garantir que está correta)
-- ============================================

DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";

CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (
    -- Verificação 1: userId direto
    "userId" = auth.uid()
    OR
    -- Verificação 2: AccountOwner
    EXISTS (
      SELECT 1 
      FROM "AccountOwner"
      WHERE "AccountOwner"."accountId" = "Account"."id"
      AND "AccountOwner"."ownerId" = auth.uid()
    )
    OR
    -- Verificação 3: HouseholdMember
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
-- Step 6: Estatísticas e verificação
-- ============================================

-- Verificar estatísticas
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
AND tablename IN ('Transaction', 'Account')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

