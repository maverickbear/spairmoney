-- Add plaidMetadata JSONB column to Transaction table
ALTER TABLE "Transaction" 
ADD COLUMN IF NOT EXISTS "plaidMetadata" JSONB;

-- Create GIN index for efficient JSONB queries
-- This allows efficient queries on the entire JSONB structure
CREATE INDEX IF NOT EXISTS "Transaction_plaidMetadata_idx" 
ON "Transaction" USING GIN ("plaidMetadata");

-- Add B-tree index for pending transactions (using text extraction)
-- B-tree works with text values extracted from JSONB
CREATE INDEX IF NOT EXISTS "Transaction_plaidMetadata_pending_idx" 
ON "Transaction" ((("plaidMetadata"->>'pending')::boolean))
WHERE "plaidMetadata"->>'pending' IS NOT NULL;

