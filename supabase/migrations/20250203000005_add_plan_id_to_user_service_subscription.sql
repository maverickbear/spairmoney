-- ============================================================================
-- Add planId to UserServiceSubscription Table
-- ============================================================================
-- Date: 2025-02-03
-- Description: Adds planId field to UserServiceSubscription to link to SubscriptionServicePlan
-- ============================================================================

-- Add planId column
ALTER TABLE "public"."UserServiceSubscription"
  ADD COLUMN IF NOT EXISTS "planId" "text";

-- Add foreign key constraint
ALTER TABLE "public"."UserServiceSubscription"
  ADD CONSTRAINT "UserServiceSubscription_planId_fkey" 
  FOREIGN KEY ("planId") 
  REFERENCES "public"."SubscriptionServicePlan"("id") 
  ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_plan_id" 
  ON "public"."UserServiceSubscription" ("planId");

-- Add comment
COMMENT ON COLUMN "public"."UserServiceSubscription"."planId" IS 'ID of the selected plan from SubscriptionServicePlan (optional)';

