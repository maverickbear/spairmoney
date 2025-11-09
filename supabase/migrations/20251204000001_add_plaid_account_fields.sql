-- Add Plaid account fields to Account table
ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS "plaidMask" TEXT,
ADD COLUMN IF NOT EXISTS "plaidOfficialName" TEXT,
ADD COLUMN IF NOT EXISTS "plaidVerificationStatus" TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Account_plaidMask_idx" ON "Account"("plaidMask");
CREATE INDEX IF NOT EXISTS "Account_plaidVerificationStatus_idx" ON "Account"("plaidVerificationStatus");

