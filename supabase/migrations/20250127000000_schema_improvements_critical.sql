-- ============================================================================
-- Schema Improvements - Critical Fixes
-- ============================================================================
-- Data: 2025-01-27
-- Descrição: Melhorias críticas de performance e validação
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para query mais comum: transações por usuário e data
-- Esta é a query mais executada no sistema (relatórios, dashboards)
CREATE INDEX IF NOT EXISTS "idx_transaction_user_date" 
ON "public"."Transaction" USING btree ("userId", "date" DESC)
WHERE "date" IS NOT NULL;

-- Índice composto para queries com filtros adicionais (tipo + data)
CREATE INDEX IF NOT EXISTS "idx_transaction_user_date_type" 
ON "public"."Transaction" USING btree ("userId", "date" DESC, "type")
WHERE "date" IS NOT NULL AND "type" IS NOT NULL;

-- Índice para PlannedPayment por data e status (query comum)
CREATE INDEX IF NOT EXISTS "idx_planned_payment_user_date_status" 
ON "public"."PlannedPayment" USING btree ("userId", "date", "status")
WHERE "date" IS NOT NULL;

COMMENT ON INDEX "public"."idx_transaction_user_date" IS 'Índice otimizado para queries de transações por usuário e período (query mais comum do sistema)';
COMMENT ON INDEX "public"."idx_transaction_user_date_type" IS 'Índice composto para queries com filtro de tipo adicional';
COMMENT ON INDEX "public"."idx_planned_payment_user_date_status" IS 'Índice para queries de pagamentos planejados por data e status';

-- ============================================================================
-- 2. VALIDAÇÃO DE DATAS
-- ============================================================================

-- Validação de data para Transaction
-- Permite datas de 1900 até 1 ano no futuro (para planejamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transaction_date_valid'
  ) THEN
    ALTER TABLE "public"."Transaction" 
    ADD CONSTRAINT "transaction_date_valid" 
    CHECK ("date" >= '1900-01-01'::date AND "date" <= (CURRENT_DATE + INTERVAL '1 year'));
  END IF;
END $$;

-- Validação de data para PlannedPayment
-- Permite planejamento até 5 anos no futuro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'planned_payment_date_valid'
  ) THEN
    ALTER TABLE "public"."PlannedPayment" 
    ADD CONSTRAINT "planned_payment_date_valid" 
    CHECK ("date" >= '1900-01-01'::date AND "date" <= (CURRENT_DATE + INTERVAL '5 years'));
  END IF;
END $$;

-- Validação de data para Debt (firstPaymentDate)
-- Permite dívidas com pagamento inicial até 50 anos no futuro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'debt_first_payment_date_valid'
  ) THEN
    ALTER TABLE "public"."Debt" 
    ADD CONSTRAINT "debt_first_payment_date_valid" 
    CHECK (
      "firstPaymentDate" IS NULL OR 
      ("firstPaymentDate" >= '1900-01-01'::date AND "firstPaymentDate" <= (CURRENT_DATE + INTERVAL '50 years'))
    );
  END IF;
END $$;

-- Validação de data para Debt (nextDueDate)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'debt_next_due_date_valid'
  ) THEN
    ALTER TABLE "public"."Debt" 
    ADD CONSTRAINT "debt_next_due_date_valid" 
    CHECK (
      "nextDueDate" IS NULL OR 
      ("nextDueDate" >= '1900-01-01'::date AND "nextDueDate" <= (CURRENT_DATE + INTERVAL '10 years'))
    );
  END IF;
END $$;

COMMENT ON CONSTRAINT "transaction_date_valid" ON "public"."Transaction" IS 'Valida que a data da transação está em um range válido (1900 até 1 ano no futuro)';
COMMENT ON CONSTRAINT "planned_payment_date_valid" ON "public"."PlannedPayment" IS 'Valida que a data do pagamento planejado está em um range válido (1900 até 5 anos no futuro)';
COMMENT ON CONSTRAINT "debt_first_payment_date_valid" ON "public"."Debt" IS 'Valida que a data do primeiro pagamento está em um range válido';
COMMENT ON CONSTRAINT "debt_next_due_date_valid" ON "public"."Debt" IS 'Valida que a próxima data de vencimento está em um range válido';

-- ============================================================================
-- 3. REMOVER TABELA NÃO UTILIZADA: BudgetSubcategory
-- ============================================================================

-- NOTA: Esta tabela já foi removida anteriormente.
-- O subcategoryId agora está diretamente na tabela Budget.
-- Esta seção foi comentada pois a tabela não existe mais.

-- Se a tabela ainda existir em outros ambientes, descomente as linhas abaixo:

-- -- Remover políticas RLS
-- DROP POLICY IF EXISTS "Users can delete own budget subcategories" ON "public"."BudgetSubcategory";
-- DROP POLICY IF EXISTS "Users can insert own budget subcategories" ON "public"."BudgetSubcategory";
-- DROP POLICY IF EXISTS "Users can update own budget subcategories" ON "public"."BudgetSubcategory";
-- DROP POLICY IF EXISTS "Users can view own budget subcategories" ON "public"."BudgetSubcategory";
--
-- -- Remover índices
-- DROP INDEX IF EXISTS "public"."BudgetSubcategory_budgetId_idx";
-- DROP INDEX IF EXISTS "public"."BudgetSubcategory_budgetId_subcategoryId_key";
-- DROP INDEX IF EXISTS "public"."BudgetSubcategory_subcategoryId_idx";
--
-- -- Remover constraints
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_constraint 
--     WHERE conname = 'BudgetSubcategory_budgetId_fkey'
--   ) THEN
--     ALTER TABLE "public"."BudgetSubcategory" 
--     DROP CONSTRAINT "BudgetSubcategory_budgetId_fkey";
--   END IF;
-- END $$;
--
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_constraint 
--     WHERE conname = 'BudgetSubcategory_subcategoryId_fkey'
--   ) THEN
--     ALTER TABLE "public"."BudgetSubcategory" 
--     DROP CONSTRAINT "BudgetSubcategory_subcategoryId_fkey";
--   END IF;
-- END $$;
--
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_constraint 
--     WHERE conname = 'BudgetSubcategory_pkey'
--   ) THEN
--     ALTER TABLE "public"."BudgetSubcategory" 
--     DROP CONSTRAINT "BudgetSubcategory_pkey";
--   END IF;
-- END $$;
--
-- -- Remover GRANTs
-- REVOKE ALL ON TABLE "public"."BudgetSubcategory" FROM "anon";
-- REVOKE ALL ON TABLE "public"."BudgetSubcategory" FROM "authenticated";
-- REVOKE ALL ON TABLE "public"."BudgetSubcategory" FROM "service_role";
--
-- -- Remover RLS
-- ALTER TABLE "public"."BudgetSubcategory" DISABLE ROW LEVEL SECURITY;
--
-- -- Remover tabela
-- DROP TABLE IF EXISTS "public"."BudgetSubcategory";

-- ============================================================================
-- NOTAS
-- ============================================================================

-- 1. Os índices melhorarão significativamente a performance de:
--    - Relatórios por período
--    - Dashboards com filtros de data
--    - Queries de pagamentos planejados
--
-- 2. As validações de data previnem:
--    - Bugs de data inválida na aplicação
--    - Dados corrompidos por erros de entrada
--    - Problemas com timezone
--
-- 3. BudgetSubcategory:
--    - Tabela já foi removida anteriormente
--    - A funcionalidade foi migrada para Budget.subcategoryId

