-- Migration: Create SubscriptionServiceCategory and SubscriptionService Tables
-- Date: 2025-02-03
-- Description: Creates tables to manage subscription service categories and services
--              This allows super_admin to manage available subscription services

-- ============================================================================
-- CREATE SUBSCRIPTIONSERVICECATEGORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."SubscriptionServiceCategory" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "SubscriptionServiceCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubscriptionServiceCategory_name_unique" UNIQUE ("name")
);

ALTER TABLE "public"."SubscriptionServiceCategory" OWNER TO "postgres";

COMMENT ON TABLE "public"."SubscriptionServiceCategory" IS 'Categories for subscription services (e.g., AI tools, Streaming Video, etc.)';
COMMENT ON COLUMN "public"."SubscriptionServiceCategory"."name" IS 'Category name (e.g., "AI tools", "Streaming Video")';
COMMENT ON COLUMN "public"."SubscriptionServiceCategory"."displayOrder" IS 'Order for displaying categories in UI';
COMMENT ON COLUMN "public"."SubscriptionServiceCategory"."isActive" IS 'Whether the category is active and visible to users';

-- ============================================================================
-- CREATE SUBSCRIPTIONSERVICE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."SubscriptionService" (
    "id" "text" NOT NULL,
    "categoryId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "SubscriptionService_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubscriptionService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."SubscriptionServiceCategory"("id") ON DELETE CASCADE,
    CONSTRAINT "SubscriptionService_categoryId_name_unique" UNIQUE ("categoryId", "name")
);

ALTER TABLE "public"."SubscriptionService" OWNER TO "postgres";

COMMENT ON TABLE "public"."SubscriptionService" IS 'Individual subscription services (e.g., ChatGPT Team, Netflix, Spotify)';
COMMENT ON COLUMN "public"."SubscriptionService"."categoryId" IS 'Category this service belongs to';
COMMENT ON COLUMN "public"."SubscriptionService"."name" IS 'Service name (e.g., "ChatGPT Team", "Netflix")';
COMMENT ON COLUMN "public"."SubscriptionService"."logo" IS 'URL or path to the logo/image for this service';
COMMENT ON COLUMN "public"."SubscriptionService"."displayOrder" IS 'Order for displaying services within category';
COMMENT ON COLUMN "public"."SubscriptionService"."isActive" IS 'Whether the service is active and visible to users';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_subscription_service_category_display_order" 
  ON "public"."SubscriptionServiceCategory" ("displayOrder", "isActive");

CREATE INDEX IF NOT EXISTS "idx_subscription_service_category_id" 
  ON "public"."SubscriptionService" ("categoryId");

CREATE INDEX IF NOT EXISTS "idx_subscription_service_display_order" 
  ON "public"."SubscriptionService" ("categoryId", "displayOrder", "isActive");

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "public"."SubscriptionServiceCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SubscriptionService" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Everyone can view active categories
CREATE POLICY "Anyone can view active subscription service categories" 
  ON "public"."SubscriptionServiceCategory" 
  FOR SELECT 
  USING ("isActive" = true);

-- Policy: Only super_admin can manage categories
CREATE POLICY "Super admin can manage subscription service categories" 
  ON "public"."SubscriptionServiceCategory" 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
      AND "User"."role" = 'super_admin'
    )
  );

-- Policy: Everyone can view active services
CREATE POLICY "Anyone can view active subscription services" 
  ON "public"."SubscriptionService" 
  FOR SELECT 
  USING ("isActive" = true);

-- Policy: Only super_admin can manage services
CREATE POLICY "Super admin can manage subscription services" 
  ON "public"."SubscriptionService" 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
      AND "User"."role" = 'super_admin'
    )
  );

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default categories
INSERT INTO "public"."SubscriptionServiceCategory" ("id", "name", "displayOrder", "isActive", "createdAt", "updatedAt")
VALUES 
  ('cat_ai_tools', 'AI tools', 1, true, NOW(), NOW()),
  ('cat_cloud_storage', 'Cloud Storage', 2, true, NOW(), NOW()),
  ('cat_design_tools', 'Design Tools', 3, true, NOW(), NOW()),
  ('cat_dev_tools', 'Dev Tools', 4, true, NOW(), NOW()),
  ('cat_gaming', 'Gaming', 5, true, NOW(), NOW()),
  ('cat_news_media', 'News Media', 6, true, NOW(), NOW()),
  ('cat_office_suite', 'Office Suite', 7, true, NOW(), NOW()),
  ('cat_streaming_music', 'Streaming Music', 8, true, NOW(), NOW()),
  ('cat_streaming_sports', 'Streaming Sports', 9, true, NOW(), NOW()),
  ('cat_streaming_video', 'Streaming Video', 10, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Insert default services for AI tools category
INSERT INTO "public"."SubscriptionService" ("id", "categoryId", "name", "displayOrder", "isActive", "createdAt", "updatedAt")
VALUES 
  ('svc_chatgpt_team', 'cat_ai_tools', 'ChatGPT Team', 1, true, NOW(), NOW()),
  ('svc_chatgpt_plus', 'cat_ai_tools', 'ChatGPT Plus', 2, true, NOW(), NOW()),
  ('svc_claude_pro', 'cat_ai_tools', 'Claude Pro', 3, true, NOW(), NOW()),
  ('svc_perplexity_pro', 'cat_ai_tools', 'Perplexity Pro', 4, true, NOW(), NOW()),
  ('svc_midjourney', 'cat_ai_tools', 'Midjourney', 5, true, NOW(), NOW()),
  ('svc_runway_ai', 'cat_ai_tools', 'Runway AI', 6, true, NOW(), NOW()),
  ('svc_jasper_ai', 'cat_ai_tools', 'Jasper AI', 7, true, NOW(), NOW()),
  ('svc_elevenlabs', 'cat_ai_tools', 'ElevenLabs', 8, true, NOW(), NOW()),
  ('svc_grammarly_premium', 'cat_ai_tools', 'Grammarly Premium', 9, true, NOW(), NOW()),
  ('svc_synthesia', 'cat_ai_tools', 'Synthesia', 10, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

