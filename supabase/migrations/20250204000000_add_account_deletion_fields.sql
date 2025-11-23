-- Add account deletion fields to User table
-- This enables soft deletion with a grace period

ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "deletedAt" timestamp(3) without time zone,
ADD COLUMN IF NOT EXISTS "scheduledDeletionAt" timestamp(3) without time zone;

-- Add index on scheduledDeletionAt for efficient cleanup queries
CREATE INDEX IF NOT EXISTS "User_scheduledDeletionAt_idx" ON "public"."User"("scheduledDeletionAt")
WHERE "scheduledDeletionAt" IS NOT NULL;

-- Add index on deletedAt for efficient queries
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "public"."User"("deletedAt")
WHERE "deletedAt" IS NOT NULL;

COMMENT ON COLUMN "public"."User"."deletedAt" IS 'Timestamp when account deletion was requested. Account is in grace period until scheduledDeletionAt.';
COMMENT ON COLUMN "public"."User"."scheduledDeletionAt" IS 'Timestamp when account will be permanently deleted (30 days after deletion request).';

