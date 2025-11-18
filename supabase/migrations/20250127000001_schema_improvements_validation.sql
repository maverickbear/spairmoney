-- ============================================================================
-- Schema Improvements - Data Validation
-- ============================================================================
-- Data: 2025-01-27
-- Descrição: Validações adicionais de dados (valores positivos, etc)
-- ============================================================================
-- NOTA: Executar apenas após verificar que não há dados existentes que 
--       violariam essas constraints
-- ============================================================================

-- ============================================================================
-- VALIDAÇÃO DE VALORES POSITIVOS
-- ============================================================================

-- Transaction: amount_numeric deve ser positivo
-- NOTA: Verificar se há transações com amount_numeric <= 0 antes de aplicar
-- SELECT COUNT(*) FROM "Transaction" WHERE "amount_numeric" <= 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transaction_amount_positive'
  ) THEN
    ALTER TABLE "public"."Transaction" 
    ADD CONSTRAINT "transaction_amount_positive" 
    CHECK ("amount_numeric" > 0);
  END IF;
END $$;

-- AccountInvestmentValue: totalValue deve ser não-negativo (permite 0)
-- NOTA: Verificar se há valores negativos antes de aplicar
-- SELECT COUNT(*) FROM "AccountInvestmentValue" WHERE "totalValue" < 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'account_investment_value_non_negative'
  ) THEN
    ALTER TABLE "public"."AccountInvestmentValue" 
    ADD CONSTRAINT "account_investment_value_non_negative" 
    CHECK ("totalValue" >= 0);
  END IF;
END $$;

-- SimpleInvestmentEntry: amount deve ser positivo
-- NOTA: Verificar se há entradas com amount <= 0 antes de aplicar
-- SELECT COUNT(*) FROM "SimpleInvestmentEntry" WHERE "amount" <= 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'simple_investment_entry_amount_positive'
  ) THEN
    ALTER TABLE "public"."SimpleInvestmentEntry" 
    ADD CONSTRAINT "simple_investment_entry_amount_positive" 
    CHECK ("amount" > 0);
  END IF;
END $$;

-- InvestmentTransaction: quantity e price devem ser positivos quando presentes
-- NOTA: Já existe constraint check_buy_sell_fields, mas vamos garantir valores positivos
-- Verificar se há dados que violariam:
-- SELECT COUNT(*) FROM "InvestmentTransaction" 
-- WHERE ("type" IN ('buy', 'sell') AND ("quantity" <= 0 OR "price" < 0));

-- Esta constraint já existe parcialmente, mas vamos garantir
-- (A constraint check_buy_sell_fields já valida isso, mas vamos adicionar uma mais explícita)

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON CONSTRAINT "transaction_amount_positive" ON "public"."Transaction" 
IS 'Garante que valores de transação são sempre positivos';

COMMENT ON CONSTRAINT "account_investment_value_non_negative" ON "public"."AccountInvestmentValue" 
IS 'Garante que valores de investimento não são negativos (permite 0)';

COMMENT ON CONSTRAINT "simple_investment_entry_amount_positive" ON "public"."SimpleInvestmentEntry" 
IS 'Garante que valores de entrada de investimento são sempre positivos';

-- ============================================================================
-- QUERIES PARA VERIFICAR ANTES DE APLICAR
-- ============================================================================

-- Execute estas queries ANTES de aplicar a migration para verificar dados existentes:

-- 1. Verificar transações com valores inválidos
-- SELECT COUNT(*) as invalid_transactions
-- FROM "Transaction" 
-- WHERE "amount_numeric" <= 0;

-- 2. Verificar valores de investimento negativos
-- SELECT COUNT(*) as invalid_investment_values
-- FROM "AccountInvestmentValue" 
-- WHERE "totalValue" < 0;

-- 3. Verificar entradas de investimento inválidas
-- SELECT COUNT(*) as invalid_entries
-- FROM "SimpleInvestmentEntry" 
-- WHERE "amount" <= 0;

-- Se alguma query retornar > 0, investigar e corrigir os dados antes de aplicar as constraints.

