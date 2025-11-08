-- Corrigir budgets existentes que têm macroId mas não são budgets agrupados
-- Budgets individuais (com categoryId) não devem ter macroId para evitar conflitos com Budget_period_macroId_key

-- Remover macroId de budgets que têm categoryId (budgets individuais)
-- Esses budgets não devem ter macroId, apenas budgets agrupados (sem categoryId) devem ter
UPDATE "Budget"
SET "macroId" = NULL
WHERE "categoryId" IS NOT NULL 
  AND "macroId" IS NOT NULL;

