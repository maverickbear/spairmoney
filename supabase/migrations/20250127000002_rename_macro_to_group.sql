-- ============================================================================
-- Rename Macro to Group - Standardize Nomenclature
-- ============================================================================
-- Data: 2025-01-27
-- Descrição: Renomear todas as referências de "macro" para "group" para manter
--            consistência com o nome da tabela "Group"
-- ============================================================================

-- ============================================================================
-- 1. RENOMEAR COLUNAS: macroId → groupId
-- ============================================================================

-- Renomear macroId em Budget
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Budget' 
    AND column_name = 'macroId'
  ) THEN
    ALTER TABLE "public"."Budget" RENAME COLUMN "macroId" TO "groupId";
    RAISE NOTICE 'Renamed Budget.macroId to Budget.groupId';
  END IF;
END $$;

-- Renomear macroId em Category
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Category' 
    AND column_name = 'macroId'
  ) THEN
    ALTER TABLE "public"."Category" RENAME COLUMN "macroId" TO "groupId";
    RAISE NOTICE 'Renamed Category.macroId to Category.groupId';
  END IF;
END $$;

-- ============================================================================
-- 2. RENOMEAR CONSTRAINTS E FOREIGN KEYS
-- ============================================================================

-- Renomear constraint Budget_macroId_fkey
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Budget_macroId_fkey'
  ) THEN
    ALTER TABLE "public"."Budget" 
    RENAME CONSTRAINT "Budget_macroId_fkey" TO "Budget_groupId_fkey";
    RAISE NOTICE 'Renamed constraint Budget_macroId_fkey to Budget_groupId_fkey';
  END IF;
END $$;

-- Renomear constraint Category_groupId_fkey (já existe com nome correto, mas vamos garantir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Category_groupId_fkey'
  ) THEN
    -- Já está com nome correto, não precisa renomear
    RAISE NOTICE 'Constraint Category_groupId_fkey already has correct name';
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Category_macroId_fkey'
  ) THEN
    ALTER TABLE "public"."Category" 
    RENAME CONSTRAINT "Category_macroId_fkey" TO "Category_groupId_fkey";
    RAISE NOTICE 'Renamed constraint Category_macroId_fkey to Category_groupId_fkey';
  END IF;
END $$;

-- ============================================================================
-- 3. RENOMEAR ÍNDICES
-- ============================================================================

-- Renomear Budget_macroId_idx
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'Budget_macroId_idx'
  ) THEN
    ALTER INDEX "public"."Budget_macroId_idx" RENAME TO "Budget_groupId_idx";
    RAISE NOTICE 'Renamed index Budget_macroId_idx to Budget_groupId_idx';
  END IF;
END $$;

-- Renomear Budget_period_macroId_key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'Budget_period_macroId_key'
  ) THEN
    ALTER INDEX "public"."Budget_period_macroId_key" RENAME TO "Budget_period_groupId_key";
    RAISE NOTICE 'Renamed index Budget_period_macroId_key to Budget_period_groupId_key';
  END IF;
END $$;

-- Renomear Category_macroId_idx
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'Category_macroId_idx'
  ) THEN
    ALTER INDEX "public"."Category_macroId_idx" RENAME TO "Category_groupId_idx";
    RAISE NOTICE 'Renamed index Category_macroId_idx to Category_groupId_idx';
  END IF;
END $$;

-- Renomear idx_category_macro
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_category_macro'
  ) THEN
    ALTER INDEX "public"."idx_category_macro" RENAME TO "idx_category_group";
    RAISE NOTICE 'Renamed index idx_category_macro to idx_category_group';
  END IF;
END $$;

-- Renomear idx_category_userid_macroid
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_category_userid_macroid'
  ) THEN
    ALTER INDEX "public"."idx_category_userid_macroid" RENAME TO "idx_category_userid_groupid";
    RAISE NOTICE 'Renamed index idx_category_userid_macroid to idx_category_userid_groupid';
  END IF;
END $$;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Esta migration renomeia:
-- 1. Colunas: macroId → groupId (Budget, Category)
-- 2. Constraints: Budget_macroId_fkey → Budget_groupId_fkey
-- 3. Índices: todos os índices relacionados a macroId → groupId
--
-- Após aplicar esta migration, atualize o código TypeScript para usar
-- "groupId" e "Group" em vez de "macroId" e "Macro"

