-- Migration: Add subscriptionId to PlannedPayment
-- Date: 2025-01-23
-- Description: Adds subscriptionId field to PlannedPayment to support subscription-based planned payments
-- Also updates source check constraint to include 'subscription'

-- Add subscriptionId column
ALTER TABLE "public"."PlannedPayment" 
ADD COLUMN IF NOT EXISTS "subscriptionId" "text";

-- Add foreign key constraint
ALTER TABLE "public"."PlannedPayment"
ADD CONSTRAINT "PlannedPayment_subscriptionId_fkey" 
FOREIGN KEY ("subscriptionId") 
REFERENCES "public"."UserServiceSubscription"("id") 
ON DELETE CASCADE;

-- Add index for subscriptionId queries
CREATE INDEX IF NOT EXISTS "idx_planned_payment_subscription_id" 
ON "public"."PlannedPayment" ("subscriptionId") 
WHERE "subscriptionId" IS NOT NULL;

-- Update source check constraint to include 'subscription'
ALTER TABLE "public"."PlannedPayment"
DROP CONSTRAINT IF EXISTS "PlannedPayment_source_check";

ALTER TABLE "public"."PlannedPayment"
ADD CONSTRAINT "PlannedPayment_source_check" 
CHECK (("source" = ANY (ARRAY['recurring'::"text", 'debt'::"text", 'manual'::"text", 'subscription'::"text"])));

COMMENT ON COLUMN "public"."PlannedPayment"."subscriptionId" IS 'Subscription ID if this PlannedPayment was created from a UserServiceSubscription';

