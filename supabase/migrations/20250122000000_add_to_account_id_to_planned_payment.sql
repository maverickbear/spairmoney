-- Migration: Add toAccountId to PlannedPayment
-- Date: 2025-01-22
-- Description: Adds toAccountId field to PlannedPayment to support transfer type planned payments

ALTER TABLE "public"."PlannedPayment" 
ADD COLUMN IF NOT EXISTS "toAccountId" "text";

-- Add foreign key constraint
ALTER TABLE "public"."PlannedPayment"
ADD CONSTRAINT "PlannedPayment_toAccountId_fkey" 
FOREIGN KEY ("toAccountId") 
REFERENCES "public"."Account"("id") 
ON DELETE SET NULL;

-- Add index for toAccountId queries
CREATE INDEX IF NOT EXISTS "idx_planned_payment_to_account_id" 
ON "public"."PlannedPayment" ("toAccountId") 
WHERE "toAccountId" IS NOT NULL;

COMMENT ON COLUMN "public"."PlannedPayment"."toAccountId" IS 'Destination account ID for transfer type planned payments';

