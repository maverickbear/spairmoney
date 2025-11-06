-- Add payment frequency fields to Debt table
ALTER TABLE "Debt" 
  ADD COLUMN IF NOT EXISTS "paymentFrequency" TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS "paymentAmount" DOUBLE PRECISION;

-- Add check constraint for payment frequency
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_paymentFrequency_check" 
    CHECK ("paymentFrequency" IN ('monthly', 'biweekly', 'weekly', 'semimonthly', 'daily'));

-- Add check constraint for payment amount
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_paymentAmount_check" 
    CHECK ("paymentAmount" > 0 OR "paymentAmount" IS NULL);

-- Create index for payment frequency
CREATE INDEX IF NOT EXISTS "Debt_paymentFrequency_idx" ON "Debt"("paymentFrequency");

