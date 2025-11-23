-- Create function to permanently delete accounts after grace period
-- This function should be called by a scheduled job (cron) daily

CREATE OR REPLACE FUNCTION "public"."cleanup_deleted_accounts"()
RETURNS TABLE(
  deleted_count integer,
  deleted_user_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_ids uuid[];
  v_deleted_count integer := 0;
BEGIN
  -- Find all users scheduled for deletion where grace period has passed
  SELECT ARRAY_AGG("id")
  INTO v_user_ids
  FROM "public"."User"
  WHERE "scheduledDeletionAt" IS NOT NULL
    AND "scheduledDeletionAt" < NOW()
    AND "deletedAt" IS NOT NULL;

  -- If no users to delete, return early
  IF v_user_ids IS NULL OR array_length(v_user_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[];
    RETURN;
  END IF;

  v_deleted_count := array_length(v_user_ids, 1);

  -- Delete users from auth.users (this will cascade delete from User table due to FK constraint)
  -- Note: This requires the function to be run with service role permissions
  -- The actual deletion from auth.users should be done via Supabase Admin API or service role client
  -- For now, we'll just mark them and log the IDs
  
  -- In a production environment, you would:
  -- 1. Call Supabase Admin API to delete from auth.users
  -- 2. Or use a service role client in a scheduled job (not in SQL function)
  
  -- For now, we'll return the user IDs that need to be deleted
  -- A separate scheduled job (Node.js/TypeScript) should call this function
  -- and then delete the users from auth.users using the Admin API

  RETURN QUERY SELECT v_deleted_count, v_user_ids;
END;
$$;

ALTER FUNCTION "public"."cleanup_deleted_accounts"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."cleanup_deleted_accounts"() IS 'Finds all users scheduled for deletion where grace period has passed. Returns count and user IDs. Actual deletion from auth.users should be done via Admin API or service role client.';

-- Create a helper function to get accounts scheduled for deletion (for monitoring)
CREATE OR REPLACE FUNCTION "public"."get_accounts_scheduled_for_deletion"()
RETURNS TABLE(
  user_id uuid,
  email text,
  deleted_at timestamp(3) without time zone,
  scheduled_deletion_at timestamp(3) without time zone,
  days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u."id" as user_id,
    u."email",
    u."deletedAt" as deleted_at,
    u."scheduledDeletionAt" as scheduled_deletion_at,
    CASE
      WHEN u."scheduledDeletionAt" IS NOT NULL THEN
        GREATEST(0, EXTRACT(EPOCH FROM (u."scheduledDeletionAt" - NOW()))::integer / 86400)
      ELSE NULL
    END as days_remaining
  FROM "public"."User" u
  WHERE u."deletedAt" IS NOT NULL
    AND (u."scheduledDeletionAt" IS NULL OR u."scheduledDeletionAt" > NOW())
  ORDER BY u."scheduledDeletionAt" ASC;
END;
$$;

ALTER FUNCTION "public"."get_accounts_scheduled_for_deletion"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_accounts_scheduled_for_deletion"() IS 'Returns all accounts currently in grace period (scheduled for deletion but not yet deleted).';

