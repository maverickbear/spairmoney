-- Migration: Create UserServiceSubscription Table
-- Date: 2025-01-23
-- Description: Creates UserServiceSubscription table to manage recurring service subscriptions
-- Similar to Debts, these subscriptions automatically create Planned Payments

-- ============================================================================
-- CREATE USERSERVICESUBSCRIPTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."UserServiceSubscription" (
    "id" "text" NOT NULL,
    "userId" "uuid" NOT NULL,
    "serviceName" "text" NOT NULL,
    "subcategoryId" "text",
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "billingFrequency" "text" NOT NULL DEFAULT 'monthly'::"text",
    "billingDay" integer,
    "accountId" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "firstBillingDate" date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "UserServiceSubscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserServiceSubscription_billingFrequency_check" CHECK (("billingFrequency" = ANY (ARRAY['monthly'::"text", 'weekly'::"text", 'biweekly'::"text", 'semimonthly'::"text", 'daily'::"text"]))),
    CONSTRAINT "UserServiceSubscription_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "UserServiceSubscription_billingDay_check" CHECK (
        (("billingFrequency" = 'monthly'::"text" AND "billingDay" >= 1 AND "billingDay" <= 31) OR
         ("billingFrequency" = 'semimonthly'::"text" AND "billingDay" >= 1 AND "billingDay" <= 31) OR
         ("billingFrequency" = 'weekly'::"text" AND "billingDay" >= 0 AND "billingDay" <= 6) OR
         ("billingFrequency" = 'biweekly'::"text" AND "billingDay" >= 0 AND "billingDay" <= 6) OR
         ("billingFrequency" = 'daily'::"text" AND "billingDay" IS NULL))
    ),
    CONSTRAINT "UserServiceSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserServiceSubscription_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL,
    CONSTRAINT "UserServiceSubscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."UserServiceSubscription" OWNER TO "postgres";

COMMENT ON TABLE "public"."UserServiceSubscription" IS 'Recurring service subscriptions that automatically create Planned Payments';
COMMENT ON COLUMN "public"."UserServiceSubscription"."serviceName" IS 'Name of the service (can be custom or from subcategory)';
COMMENT ON COLUMN "public"."UserServiceSubscription"."subcategoryId" IS 'Subcategory ID if service is based on existing subcategory';
COMMENT ON COLUMN "public"."UserServiceSubscription"."billingFrequency" IS 'How often the subscription is billed: monthly, weekly, biweekly, semimonthly, daily';
COMMENT ON COLUMN "public"."UserServiceSubscription"."billingDay" IS 'Day of month (1-31) for monthly/semimonthly, or day of week (0-6, Sunday=0) for weekly/biweekly';
COMMENT ON COLUMN "public"."UserServiceSubscription"."firstBillingDate" IS 'Date of the first billing/payment';
COMMENT ON COLUMN "public"."UserServiceSubscription"."isActive" IS 'Whether the subscription is currently active (paused subscriptions do not generate planned payments)';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for filtering by userId (most common query)
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_user_id" 
  ON "public"."UserServiceSubscription" ("userId");

-- Index for filtering by isActive
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_is_active" 
  ON "public"."UserServiceSubscription" ("isActive") 
  WHERE "isActive" = true;

-- Index for filtering by accountId
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_account_id" 
  ON "public"."UserServiceSubscription" ("accountId");

-- Index for filtering by subcategoryId
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_subcategory_id" 
  ON "public"."UserServiceSubscription" ("subcategoryId") 
  WHERE "subcategoryId" IS NOT NULL;

-- Composite index for common queries (userId + isActive)
CREATE INDEX IF NOT EXISTS "idx_user_service_subscription_user_active" 
  ON "public"."UserServiceSubscription" ("userId", "isActive");

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "public"."UserServiceSubscription" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
  ON "public"."UserServiceSubscription" 
  FOR SELECT 
  USING (("userId" = "auth"."uid"()));

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
  ON "public"."UserServiceSubscription" 
  FOR INSERT 
  WITH CHECK (("userId" = "auth"."uid"()));

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
  ON "public"."UserServiceSubscription" 
  FOR UPDATE 
  USING (("userId" = "auth"."uid"()));

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" 
  ON "public"."UserServiceSubscription" 
  FOR DELETE 
  USING (("userId" = "auth"."uid"()));

