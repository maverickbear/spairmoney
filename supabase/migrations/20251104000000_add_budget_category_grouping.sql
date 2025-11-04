-- Adicionar suporte para budgets agrupados por Macro com múltiplas categorias
-- Permite criar um único budget que agrupa múltiplas categorias

-- Adicionar campo macroId opcional ao Budget
ALTER TABLE "Budget" 
ADD COLUMN IF NOT EXISTS "macroId" TEXT;

-- Criar tabela de relacionamento BudgetCategory para many-to-many
CREATE TABLE IF NOT EXISTS "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BudgetCategory_budgetId_categoryId_key" 
ON "BudgetCategory"("budgetId", "categoryId");

CREATE INDEX IF NOT EXISTS "BudgetCategory_budgetId_idx" 
ON "BudgetCategory"("budgetId");

CREATE INDEX IF NOT EXISTS "BudgetCategory_categoryId_idx" 
ON "BudgetCategory"("categoryId");

-- Adicionar foreign keys
ALTER TABLE "BudgetCategory" 
ADD CONSTRAINT "BudgetCategory_budgetId_fkey" 
FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetCategory" 
ADD CONSTRAINT "BudgetCategory_categoryId_fkey" 
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Adicionar foreign key para macroId no Budget
ALTER TABLE "Budget" 
ADD CONSTRAINT "Budget_macroId_fkey" 
FOREIGN KEY ("macroId") REFERENCES "Macro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Criar index para macroId
CREATE INDEX IF NOT EXISTS "Budget_macroId_idx" ON "Budget"("macroId");

-- Atualizar constraint unique para permitir budgets agrupados por macro
-- Remover constraint antiga e criar nova que permite macroId
DROP INDEX IF EXISTS "Budget_period_categoryId_key";

-- Nova constraint: permite unique por (period, categoryId) OU (period, macroId)
-- Mas como não podemos ter constraint unique condicional direto, vamos permitir
-- que categoryId seja null quando macroId está presente
ALTER TABLE "Budget" 
ALTER COLUMN "categoryId" DROP NOT NULL;

-- Criar constraint unique para (period, categoryId) quando categoryId não é null
-- E constraint unique para (period, macroId) quando macroId não é null
-- Isso será gerenciado pela aplicação

CREATE UNIQUE INDEX IF NOT EXISTS "Budget_period_categoryId_key" 
ON "Budget"("period", "categoryId") 
WHERE "categoryId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Budget_period_macroId_key" 
ON "Budget"("period", "macroId") 
WHERE "macroId" IS NOT NULL;

