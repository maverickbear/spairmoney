-- Migration: Create SystemSettings table
-- Date: 2025-01-24
-- Description: Creates SystemSettings table to store system-wide configuration like maintenance mode

-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "public"."SystemSettings" (
    "id" "text" NOT NULL DEFAULT gen_random_uuid()::text,
    "maintenanceMode" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups (we'll only have one row)
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSettings_id_key" ON "public"."SystemSettings" ("id");

-- Insert default settings row
INSERT INTO "public"."SystemSettings" ("id", "maintenanceMode", "createdAt", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Enable RLS
ALTER TABLE "public"."SystemSettings" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admin can read system settings
CREATE POLICY "SystemSettings_select_super_admin" ON "public"."SystemSettings"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."User"
            WHERE "User"."id" = auth.uid()
            AND "User"."role" = 'super_admin'
        )
    );

-- RLS Policy: Only super_admin can update system settings
CREATE POLICY "SystemSettings_update_super_admin" ON "public"."SystemSettings"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."User"
            WHERE "User"."id" = auth.uid()
            AND "User"."role" = 'super_admin'
        )
    );

-- RLS Policy: Only super_admin can insert system settings
CREATE POLICY "SystemSettings_insert_super_admin" ON "public"."SystemSettings"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."User"
            WHERE "User"."id" = auth.uid()
            AND "User"."role" = 'super_admin'
        )
    );

-- Add comment
COMMENT ON TABLE "public"."SystemSettings" IS 'Stores system-wide configuration settings like maintenance mode. Only super_admin can read/write.';

COMMENT ON COLUMN "public"."SystemSettings"."maintenanceMode" IS 'When true, only super_admin users can access the platform. All other users see maintenance page.';

