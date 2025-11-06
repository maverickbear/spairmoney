-- Add accountId column to Debt table
ALTER TABLE "Debt" 
  ADD COLUMN IF NOT EXISTS "accountId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Debt" 
  ADD CONSTRAINT "Debt_accountId_fkey" 
  FOREIGN KEY ("accountId") 
  REFERENCES "Account"("id") 
  ON DELETE SET NULL;

-- Create index for accountId
CREATE INDEX IF NOT EXISTS "Debt_accountId_idx" ON "Debt"("accountId");

