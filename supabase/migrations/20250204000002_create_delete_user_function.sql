-- Create function to delete user and all related data
-- This function deletes all user data first, then attempts to delete from auth.users
-- Note: Actual deletion from auth.users must be done via Admin API

CREATE OR REPLACE FUNCTION "public"."delete_user_data"("p_user_id" "uuid")
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Temporarily disable the trigger to allow deletion of system goals
  -- This is safe because we're deleting the user, so their goals should be deleted too
  -- Check if trigger exists before disabling (to avoid errors if trigger doesn't exist)
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_emergency_fund_deletion_trigger' 
    AND tgrelid = 'public.Goal'::regclass
  ) THEN
    ALTER TABLE "public"."Goal" DISABLE TRIGGER "prevent_emergency_fund_deletion_trigger";
  END IF;
  
  -- Delete all goals (system and non-system)
  DELETE FROM "public"."Goal"
  WHERE "userId" = p_user_id;
  
  -- Re-enable the trigger if it was disabled
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_emergency_fund_deletion_trigger' 
    AND tgrelid = 'public.Goal'::regclass
  ) THEN
    ALTER TABLE "public"."Goal" ENABLE TRIGGER "prevent_emergency_fund_deletion_trigger";
  END IF;
  
  -- Delete subscriptions (to avoid RESTRICT constraint on planId)
  DELETE FROM "public"."Subscription"
  WHERE "userId" = p_user_id;
  
  -- Delete subscriptions by household if user owns households
  DELETE FROM "public"."Subscription"
  WHERE "householdId" IN (
    SELECT "id" FROM "public"."Household" WHERE "createdBy" = p_user_id
  );
  
  -- Note: We cannot delete from User table here because FK constraint to auth.users
  -- The User table will be deleted via CASCADE when auth.users is deleted
  -- All other data (accounts, transactions, etc.) will cascade delete when User is deleted
  
  -- This function cleans up data that might have RESTRICT constraints or triggers
END;
$$;

ALTER FUNCTION "public"."delete_user_data"("p_user_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."delete_user_data"("p_user_id" "uuid") IS 'Deletes user-related data (goals, subscriptions) before user deletion. Handles system goals and RESTRICT constraints. Actual user deletion from auth.users must be done via Admin API.';

