-- Corrigir constraint única do Budget para permitir budgets diferentes com subcategorias diferentes
-- O problema era que COALESCE estava causando conflitos quando subcategorias eram diferentes

-- Remover constraint única problemática
DROP INDEX IF EXISTS "Budget_period_categoryId_subcategoryId_key";

-- Criar nova constraint única que trata subcategoryId corretamente
-- Quando subcategoryId é NULL, é único por (period, categoryId)
-- Quando subcategoryId não é NULL, é único por (period, categoryId, subcategoryId)
-- PostgreSQL trata NULLs como diferentes em índices únicos, então não precisamos de COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_period_categoryId_subcategoryId_key" 
ON "Budget"("period", "categoryId", "subcategoryId")
WHERE "categoryId" IS NOT NULL;

