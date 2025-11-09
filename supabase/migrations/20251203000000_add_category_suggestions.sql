-- Add suggested category fields to Transaction table
-- These fields store category suggestions from the learning model
-- that users can approve or reject

ALTER TABLE "Transaction" 
ADD COLUMN IF NOT EXISTS "suggestedCategoryId" TEXT,
ADD COLUMN IF NOT EXISTS "suggestedSubcategoryId" TEXT;

-- Add foreign key constraints
ALTER TABLE "Transaction" 
ADD CONSTRAINT "Transaction_suggestedCategoryId_fkey" 
FOREIGN KEY ("suggestedCategoryId") 
REFERENCES "Category"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

ALTER TABLE "Transaction" 
ADD CONSTRAINT "Transaction_suggestedSubcategoryId_fkey" 
FOREIGN KEY ("suggestedSubcategoryId") 
REFERENCES "Subcategory"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add index for faster queries on suggested categories
CREATE INDEX IF NOT EXISTS "Transaction_suggestedCategoryId_idx" 
ON "Transaction"("suggestedCategoryId") 
WHERE "suggestedCategoryId" IS NOT NULL;

