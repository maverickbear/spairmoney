-- ============================================================================
-- Create Logos Bucket and RLS Policies
-- ============================================================================
-- Date: 2025-02-03
-- Description: Creates the logos storage bucket and RLS policies to allow
--              super_admin users to upload and read logo images
-- ============================================================================

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Create the logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Public bucket so logos can be accessed via public URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON STORAGE OBJECTS
-- ============================================================================

-- RLS is already enabled on storage.objects by default in Supabase
-- We just need to create policies

-- ============================================================================
-- RLS POLICIES FOR LOGOS BUCKET
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Super admin can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can delete logos" ON storage.objects;

-- Policy: Super admin can upload (INSERT) logos
CREATE POLICY "Super admin can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (
    EXISTS (
      SELECT 1
      FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
        AND "User"."role" = 'super_admin'
    )
  )
);

-- Policy: Everyone can read (SELECT) logos (since bucket is public)
CREATE POLICY "Anyone can read logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Policy: Super admin can update logos
CREATE POLICY "Super admin can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    EXISTS (
      SELECT 1
      FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
        AND "User"."role" = 'super_admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'logos'
  AND (
    EXISTS (
      SELECT 1
      FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
        AND "User"."role" = 'super_admin'
    )
  )
);

-- Policy: Super admin can delete logos
CREATE POLICY "Super admin can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    EXISTS (
      SELECT 1
      FROM "public"."User"
      WHERE "User"."id" = "auth"."uid"()
        AND "User"."role" = 'super_admin'
    )
  )
);

