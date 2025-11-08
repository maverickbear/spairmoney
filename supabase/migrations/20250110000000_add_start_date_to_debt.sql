-- Add startDate column to Debt table
ALTER TABLE "Debt" 
ADD COLUMN IF NOT EXISTS "startDate" timestamp(3) without time zone;

-- Set default value for existing records (use firstPaymentDate if startDate is null)
UPDATE "Debt" 
SET "startDate" = "firstPaymentDate" 
WHERE "startDate" IS NULL;

-- Make startDate NOT NULL after setting defaults
ALTER TABLE "Debt" 
ALTER COLUMN "startDate" SET NOT NULL;

-- Set default to current timestamp for new records
ALTER TABLE "Debt" 
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

