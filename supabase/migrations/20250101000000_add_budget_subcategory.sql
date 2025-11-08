-- Adicionar suporte para subcategorias no budget
-- Permite criar um budget que inclui subcategorias específicas

-- Criar tabela de relacionamento BudgetSubcategory para many-to-many
CREATE TABLE IF NOT EXISTS "BudgetSubcategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetSubcategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BudgetSubcategory_budgetId_subcategoryId_key" 
ON "BudgetSubcategory"("budgetId", "subcategoryId");

CREATE INDEX IF NOT EXISTS "BudgetSubcategory_budgetId_idx" 
ON "BudgetSubcategory"("budgetId");

CREATE INDEX IF NOT EXISTS "BudgetSubcategory_subcategoryId_idx" 
ON "BudgetSubcategory"("subcategoryId");

-- Adicionar foreign keys
ALTER TABLE "BudgetSubcategory" 
ADD CONSTRAINT "BudgetSubcategory_budgetId_fkey" 
FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetSubcategory" 
ADD CONSTRAINT "BudgetSubcategory_subcategoryId_fkey" 
FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

