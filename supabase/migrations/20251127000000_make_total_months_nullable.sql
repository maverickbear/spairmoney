-- Make totalMonths nullable for credit cards (revolving credit)
-- Credit cards don't have a fixed term, so totalMonths should be nullable

-- First, drop the NOT NULL constraint and the check constraint
ALTER TABLE "Debt" 
  ALTER COLUMN "totalMonths" DROP NOT NULL;

-- Update the check constraint to allow NULL for credit cards
ALTER TABLE "Debt" 
  DROP CONSTRAINT IF EXISTS "Debt_totalMonths_check";

-- Add new check constraint that allows NULL or positive values
ALTER TABLE "Debt" 
  ADD CONSTRAINT "Debt_totalMonths_check" 
  CHECK ("totalMonths" IS NULL OR "totalMonths" > 0);

-- Also make downPayment nullable (some loan types don't require it)
ALTER TABLE "Debt" 
  ALTER COLUMN "downPayment" DROP NOT NULL;

-- Update the check constraint for downPayment to allow NULL
ALTER TABLE "Debt" 
  DROP CONSTRAINT IF EXISTS "Debt_downPayment_check";

-- Add new check constraint that allows NULL or non-negative values
ALTER TABLE "Debt" 
  ADD CONSTRAINT "Debt_downPayment_check" 
  CHECK ("downPayment" IS NULL OR "downPayment" >= 0);

-- Make startDate nullable (optional for credit cards)
ALTER TABLE "Debt" 
  ALTER COLUMN "startDate" DROP NOT NULL;

