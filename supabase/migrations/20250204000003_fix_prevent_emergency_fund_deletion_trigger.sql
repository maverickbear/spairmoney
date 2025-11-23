-- Fix prevent_emergency_fund_deletion trigger to allow deletion when user is being deleted
-- When a user is deleted, their system goals should also be deleted
-- We'll modify the function to check if we're in a deletion context

CREATE OR REPLACE FUNCTION "public"."prevent_emergency_fund_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_exists boolean;
BEGIN
  IF OLD."isSystemGoal" = true THEN
    -- Check if user still exists in User table
    -- If user doesn't exist, we're in a CASCADE deletion context, allow it
    SELECT EXISTS(SELECT 1 FROM "public"."User" WHERE "id" = OLD."userId") INTO v_user_exists;
    
    IF NOT v_user_exists THEN
      -- User is being deleted via CASCADE, allow goal deletion
      RETURN OLD;
    END IF;
    
    -- User still exists, prevent deletion (normal deletion attempt)
    RAISE EXCEPTION 'System goals cannot be deleted. You can edit them instead.';
  END IF;
  
  RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."prevent_emergency_fund_deletion"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."prevent_emergency_fund_deletion"() IS 'Prevents deletion of system goals, except when the user is being deleted (CASCADE). Uses SET search_path for security.';

