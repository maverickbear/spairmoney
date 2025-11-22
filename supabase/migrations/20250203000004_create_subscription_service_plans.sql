-- ============================================================================
-- Create SubscriptionServicePlan Table
-- ============================================================================
-- Date: 2025-02-03
-- Description: Creates table to store pricing plans for subscription services
--              Each service can have multiple plans (e.g., Basic, Pro, Enterprise)
--              with different prices in USD or CAD
-- ============================================================================

-- ============================================================================
-- CREATE SUBSCRIPTIONSERVICEPLAN TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."SubscriptionServicePlan" (
    "id" "text" NOT NULL,
    "serviceId" "text" NOT NULL,
    "planName" "text" NOT NULL,
    "price" numeric(15,2) NOT NULL,
    "currency" "text" NOT NULL DEFAULT 'USD'::"text",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "SubscriptionServicePlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubscriptionServicePlan_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."SubscriptionService"("id") ON DELETE CASCADE,
    CONSTRAINT "SubscriptionServicePlan_serviceId_planName_unique" UNIQUE ("serviceId", "planName"),
    CONSTRAINT "SubscriptionServicePlan_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "SubscriptionServicePlan_currency_check" CHECK (("currency" = ANY (ARRAY['USD'::"text", 'CAD'::"text"])))
);

ALTER TABLE "public"."SubscriptionServicePlan" OWNER TO "postgres";

COMMENT ON TABLE "public"."SubscriptionServicePlan" IS 'Pricing plans for subscription services (e.g., Basic, Pro, Enterprise)';
COMMENT ON COLUMN "public"."SubscriptionServicePlan"."serviceId" IS 'Service this plan belongs to';
COMMENT ON COLUMN "public"."SubscriptionServicePlan"."planName" IS 'Plan name (e.g., "Basic", "Pro", "Enterprise")';
COMMENT ON COLUMN "public"."SubscriptionServicePlan"."price" IS 'Price of the plan';
COMMENT ON COLUMN "public"."SubscriptionServicePlan"."currency" IS 'Currency code: USD or CAD';
COMMENT ON COLUMN "public"."SubscriptionServicePlan"."isActive" IS 'Whether the plan is active and visible';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_subscription_service_plan_service_id" 
  ON "public"."SubscriptionServicePlan" ("serviceId", "isActive");

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "public"."SubscriptionServicePlan" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Everyone can view active plans
CREATE POLICY "Anyone can view active subscription service plans" 
  ON "public"."SubscriptionServicePlan" 
  FOR SELECT 
  USING ("isActive" = true);

-- Policy: Only super_admin can manage plans
CREATE POLICY "Super admin can manage subscription service plans" 
  ON "public"."SubscriptionServicePlan" 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
      AND "User"."role" = 'super_admin'
    )
  );

