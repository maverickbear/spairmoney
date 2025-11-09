-- Add institutionLogo field to PlaidConnection table
ALTER TABLE "PlaidConnection" 
ADD COLUMN IF NOT EXISTS "institutionLogo" TEXT;

