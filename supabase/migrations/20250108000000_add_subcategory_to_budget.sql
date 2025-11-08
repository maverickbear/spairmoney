-- Adicionar subcategoryId ao Budget e ajustar constraint única
-- Permite ter budgets diferentes para a mesma categoria no mesmo período se tiverem subcategorias diferentes

-- Adicionar campo subcategoryId ao Budget
ALTER TABLE "Budget" 
ADD COLUMN IF NOT EXISTS "subcategoryId" TEXT;

-- Adicionar foreign key para subcategoryId
ALTER TABLE "Budget" 
ADD CONSTRAINT "Budget_subcategoryId_fkey" 
FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Criar index para subcategoryId
CREATE INDEX IF NOT EXISTS "Budget_subcategoryId_idx" ON "Budget"("subcategoryId");

-- Remover constraint única antiga
DROP INDEX IF EXISTS "Budget_period_categoryId_key";

-- Criar nova constraint única que inclui subcategoryId
-- Permite ter budgets únicos por (period, categoryId, subcategoryId)
-- Quando subcategoryId é NULL, ainda é único por (period, categoryId)
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_period_categoryId_subcategoryId_key" 
ON "Budget"("period", "categoryId", COALESCE("subcategoryId", ''))
WHERE "categoryId" IS NOT NULL;

