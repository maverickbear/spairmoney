-- ============================================================================
-- Fix Security Linter Warnings
-- ============================================================================
-- Date: 2025-02-03
-- Description: Fixes all security warnings from Supabase database linter:
--              1. Adds SET search_path to all functions to prevent search_path injection
--              2. Moves pg_trgm extension from public schema to extensions schema
--              3. Revokes access to materialized views from anon/authenticated roles
-- ============================================================================

-- ============================================================================
-- PART 1: FIX FUNCTION SEARCH_PATH (21 functions)
-- ============================================================================
-- Add SET search_path = '' to all functions to prevent search_path injection attacks
-- Functions must fully qualify schema names (e.g., "public"."TableName")

-- 1. update_user_subscription_cache
CREATE OR REPLACE FUNCTION "public"."update_user_subscription_cache"("p_user_id" "uuid") 
RETURNS "void"
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household_id uuid;
  v_subscription_record record;
BEGIN
  -- Get user's active household (or default personal household)
  SELECT "householdId" INTO v_household_id
  FROM "public"."UserActiveHousehold"
  WHERE "userId" = p_user_id
  LIMIT 1;

  -- Fallback to default (personal) household if no active household set
  IF v_household_id IS NULL THEN
    SELECT "householdId" INTO v_household_id
    FROM "public"."HouseholdMemberNew"
    WHERE "userId" = p_user_id
      AND "isDefault" = true
      AND "status" = 'active'
    LIMIT 1;
  END IF;

  -- Get subscription for household (new architecture)
  IF v_household_id IS NOT NULL THEN
    SELECT 
      "id",
      "planId",
      "status"
    INTO v_subscription_record
    FROM "public"."Subscription"
    WHERE "householdId" = v_household_id
      AND "status" IN ('active', 'trialing')
    ORDER BY "createdAt" DESC
    LIMIT 1;
  END IF;

  -- Fallback: Try to get subscription by userId (backward compatibility)
  IF v_subscription_record IS NULL THEN
    SELECT 
      "id",
      "planId",
      "status"
    INTO v_subscription_record
    FROM "public"."Subscription"
    WHERE "userId" = p_user_id
      AND "status" IN ('active', 'trialing')
    ORDER BY "createdAt" DESC
    LIMIT 1;
  END IF;

  -- Update User table with subscription cache
  IF v_subscription_record IS NOT NULL THEN
    UPDATE "public"."User"
    SET
      "effectivePlanId" = v_subscription_record."planId",
      "effectiveSubscriptionStatus" = v_subscription_record."status",
      "effectiveSubscriptionId" = v_subscription_record."id",
      "subscriptionUpdatedAt" = NOW()
    WHERE "id" = p_user_id;
  ELSE
    -- If no subscription found, clear cache
    UPDATE "public"."User"
    SET
      "effectivePlanId" = NULL,
      "effectiveSubscriptionStatus" = NULL,
      "effectiveSubscriptionId" = NULL,
      "subscriptionUpdatedAt" = NOW()
    WHERE "id" = p_user_id;
  END IF;
END;
$$;

-- 2. prevent_emergency_fund_deletion
CREATE OR REPLACE FUNCTION "public"."prevent_emergency_fund_deletion"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."isSystemGoal" = true THEN
    RAISE EXCEPTION 'System goals cannot be deleted. You can edit them instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. get_user_household_ids
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS TABLE(household_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT hm."householdId" as household_id
    FROM "public"."HouseholdMemberNew" hm
    WHERE hm."userId" = auth.uid()
      AND hm."status" = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 4. can_access_account_via_accountowner
CREATE OR REPLACE FUNCTION can_access_account_via_accountowner(p_account_id text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM "public"."AccountOwner" ao
        WHERE ao."accountId" = p_account_id
          AND ao."ownerId" = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 5. get_account_user_id
CREATE OR REPLACE FUNCTION get_account_user_id(p_account_id text)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT "userId" INTO v_user_id
    FROM "public"."Account"
    WHERE "id" = p_account_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 6. get_user_accessible_households
CREATE OR REPLACE FUNCTION get_user_accessible_households()
RETURNS TABLE(household_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT hm."householdId"
    FROM "public"."HouseholdMemberNew" hm
    WHERE hm."userId" = auth.uid()
      AND hm."status" = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. get_user_active_household
CREATE OR REPLACE FUNCTION get_user_active_household()
RETURNS uuid AS $$
DECLARE
    active_household_id uuid;
BEGIN
    SELECT "householdId" INTO active_household_id
    FROM "public"."UserActiveHousehold"
    WHERE "userId" = auth.uid()
    LIMIT 1;
    
    -- If no active household set, return default (personal) household
    IF active_household_id IS NULL THEN
        SELECT hm."householdId" INTO active_household_id
        FROM "public"."HouseholdMemberNew" hm
        JOIN "public"."Household" h ON h."id" = hm."householdId"
        WHERE hm."userId" = auth.uid()
          AND hm."isDefault" = true
          AND h."type" = 'personal'
          AND hm."status" = 'active'
        LIMIT 1;
    END IF;
    
    RETURN active_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. can_access_household_data
CREATE OR REPLACE FUNCTION can_access_household_data(
    p_household_id uuid,
    p_operation text
)
RETURNS boolean AS $$
DECLARE
    user_role text;
    user_status text;
BEGIN
    -- If householdId is NULL, allow access (backward compatibility with userId)
    IF p_household_id IS NULL THEN
        RETURN true;
    END IF;
    
    -- Get user's role and status in this household
    SELECT hm."role", hm."status"
    INTO user_role, user_status
    FROM "public"."HouseholdMemberNew" hm
    WHERE hm."householdId" = p_household_id
      AND hm."userId" = auth.uid();
    
    -- User is not a member of this household
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- User must be active
    IF user_status != 'active' THEN
        RETURN false;
    END IF;
    
    -- Check operation permissions
    CASE p_operation
        WHEN 'read' THEN
            -- All active members can read
            RETURN true;
        
        WHEN 'write' THEN
            -- Only owner/admin can write
            RETURN user_role IN ('owner', 'admin');
        
        WHEN 'delete' THEN
            -- Only owner/admin can delete
            RETURN user_role IN ('owner', 'admin');
        
        ELSE
            -- Unknown operation, deny access
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. is_household_member
CREATE OR REPLACE FUNCTION is_household_member(p_household_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM "public"."HouseholdMemberNew" hm
        WHERE hm."householdId" = p_household_id
          AND hm."userId" = auth.uid()
          AND hm."status" = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. get_user_household_role
CREATE OR REPLACE FUNCTION get_user_household_role(p_household_id uuid)
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    SELECT hm."role"
    INTO user_role
    FROM "public"."HouseholdMemberNew" hm
    WHERE hm."householdId" = p_household_id
      AND hm."userId" = auth.uid()
      AND hm."status" = 'active';
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. update_household_members_subscription_cache
CREATE OR REPLACE FUNCTION "public"."update_household_members_subscription_cache"("p_household_id" "uuid") 
RETURNS "void"
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_record record;
BEGIN
  -- Update all active household members of this household
  FOR v_member_record IN
    SELECT "userId"
    FROM "public"."HouseholdMemberNew"
    WHERE "householdId" = p_household_id
      AND "status" = 'active'
      AND "userId" IS NOT NULL
  LOOP
    PERFORM "public"."update_user_subscription_cache"(v_member_record."userId");
  END LOOP;
END;
$$;

-- 12. convert_planned_payment_to_transaction
CREATE OR REPLACE FUNCTION "public"."convert_planned_payment_to_transaction"(
    p_planned_payment_id "text"
)
RETURNS "text"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_planned_payment "public"."PlannedPayment"%ROWTYPE;
    v_transaction_id "text";
    v_encrypted_amount "text";
    v_user_id "uuid";
BEGIN
    -- Get the planned payment
    SELECT * INTO v_planned_payment
    FROM "public"."PlannedPayment"
    WHERE "id" = p_planned_payment_id
    AND "userId" = "auth"."uid"()
    AND "status" = 'scheduled'::"text";
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PlannedPayment not found or already processed';
    END IF;
    
    -- Check if already has a linked transaction (idempotency)
    IF v_planned_payment."linkedTransactionId" IS NOT NULL THEN
        RETURN v_planned_payment."linkedTransactionId";
    END IF;
    
    v_user_id := v_planned_payment."userId";
    
    -- Generate transaction ID
    v_transaction_id := "gen_random_uuid"()::"text";
    
    -- Create the transaction
    INSERT INTO "public"."Transaction" (
        "id",
        "date",
        "type",
        "amount",
        "accountId",
        "categoryId",
        "subcategoryId",
        "description",
        "userId",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_transaction_id,
        v_planned_payment."dueDate",
        v_planned_payment."type",
        v_planned_payment."amount",
        v_planned_payment."accountId",
        v_planned_payment."categoryId",
        v_planned_payment."subcategoryId",
        v_planned_payment."description",
        v_user_id,
        NOW(),
        NOW()
    );
    
    -- Update planned payment to mark as processed
    UPDATE "public"."PlannedPayment"
    SET 
        "status" = 'completed'::"text",
        "linkedTransactionId" = v_transaction_id,
        "updatedAt" = NOW()
    WHERE "id" = p_planned_payment_id;
    
    RETURN v_transaction_id;
END;
$$;

-- 13. create_transaction_with_limit
CREATE OR REPLACE FUNCTION "create_transaction_with_limit"(
  p_id text,
  p_date date,
  p_type text,
  p_amount text,
  p_amount_numeric numeric(15,2),
  p_account_id text,
  p_user_id uuid,
  p_category_id text DEFAULT NULL,
  p_subcategory_id text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_description_search text DEFAULT NULL,
  p_recurring boolean DEFAULT false,
  p_expense_type text DEFAULT NULL,
  p_created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
  p_updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
  p_max_transactions integer DEFAULT -1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_month_date date;
  v_current_count integer;
  v_new_count integer;
  v_transaction_id text;
BEGIN
  -- Calculate month_date (first day of month)
  v_month_date := DATE_TRUNC('month', p_date)::date;
  
  -- Check limit if not unlimited
  IF p_max_transactions != -1 THEN
    SELECT COALESCE("transactions_count", 0) INTO v_current_count
    FROM "public"."user_monthly_usage"
    WHERE "user_id" = p_user_id AND "month_date" = v_month_date;
    
    IF v_current_count >= p_max_transactions THEN
      RAISE EXCEPTION 'Transaction limit reached for this month';
    END IF;
  END IF;
  
  -- Increment counter
  v_new_count := "public"."increment_transaction_count"(p_user_id, v_month_date);
  
  -- Insert transaction
  INSERT INTO "public"."Transaction" (
    "id", "date", "type", "amount", "amount_numeric", "accountId", "userId",
    "categoryId", "subcategoryId", "description", "description_search",
    "recurring", "expenseType", "createdAt", "updatedAt"
  ) VALUES (
    p_id, p_date, p_type, p_amount, p_amount_numeric, p_account_id, p_user_id,
    p_category_id, p_subcategory_id, p_description, p_description_search,
    p_recurring, p_expense_type, p_created_at, p_updated_at
  );
  
  -- Return JSON with transaction ID and new count
  RETURN jsonb_build_object(
    'transaction_id', p_id,
    'new_count', v_new_count
  );
END;
$$;

-- 14. are_users_in_same_household
CREATE OR REPLACE FUNCTION "public"."are_users_in_same_household"("p_user1_id" "uuid", "p_user2_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM "public"."HouseholdMemberNew" hm1
        JOIN "public"."HouseholdMemberNew" hm2 ON hm1."householdId" = hm2."householdId"
        WHERE hm1."userId" = p_user1_id
          AND hm2."userId" = p_user2_id
          AND hm1."status" = 'active'
          AND hm2."status" = 'active'
    );
END;
$$;

-- 15. get_latest_updates
CREATE OR REPLACE FUNCTION "public"."get_latest_updates"("p_user_id" "uuid") RETURNS TABLE("table_name" "text", "last_update" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    -- Transaction
    SELECT 
      'Transaction' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST("updatedAt", "createdAt"))) * 1000 as last_update
    FROM "public"."Transaction"
    WHERE "userId" = p_user_id
      AND ("updatedAt" IS NOT NULL OR "createdAt" IS NOT NULL)
    
    UNION ALL
    
    -- Account
    SELECT 
      'Account' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST("updatedAt", "createdAt"))) * 1000
    FROM "public"."Account"
    WHERE "userId" = p_user_id
      AND ("updatedAt" IS NOT NULL OR "createdAt" IS NOT NULL)
    
    UNION ALL
    
    -- Budget
    SELECT 
      'Budget' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST("updatedAt", "createdAt"))) * 1000
    FROM "public"."Budget"
    WHERE "userId" = p_user_id
      AND ("updatedAt" IS NOT NULL OR "createdAt" IS NOT NULL)
    
    UNION ALL
    
    -- Goal
    SELECT 
      'Goal' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST("updatedAt", "createdAt"))) * 1000
    FROM "public"."Goal"
    WHERE "userId" = p_user_id
      AND ("updatedAt" IS NOT NULL OR "createdAt" IS NOT NULL)
    
    UNION ALL
    
    -- Debt
    SELECT 
      'Debt' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST("updatedAt", "createdAt"))) * 1000
    FROM "public"."Debt"
    WHERE "userId" = p_user_id
      AND ("updatedAt" IS NOT NULL OR "createdAt" IS NOT NULL)
    
    UNION ALL
    
    -- SimpleInvestmentEntry (via Account)
    SELECT 
      'SimpleInvestmentEntry' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(sie."updatedAt", sie."createdAt"))) * 1000
    FROM "public"."SimpleInvestmentEntry" sie
    JOIN "public"."Account" a ON a.id = sie."accountId"
    WHERE a."userId" = p_user_id
      AND (sie."updatedAt" IS NOT NULL OR sie."createdAt" IS NOT NULL)
  )
  SELECT * FROM updates WHERE last_update IS NOT NULL;
END;
$$;

-- 16. increment_transaction_count
CREATE OR REPLACE FUNCTION "increment_transaction_count"(
  p_user_id uuid,
  p_month_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO "public"."user_monthly_usage" ("user_id", "month_date", "transactions_count")
  VALUES (p_user_id, p_month_date, 1)
  ON CONFLICT ("user_id", "month_date")
  DO UPDATE SET
    "transactions_count" = "public"."user_monthly_usage"."transactions_count" + 1;
  
  SELECT "transactions_count" INTO v_count
  FROM "public"."user_monthly_usage"
  WHERE "user_id" = p_user_id AND "month_date" = p_month_date;
  
  RETURN v_count;
END;
$$;

-- 17. notify_refresh_holdings
CREATE OR REPLACE FUNCTION "public"."notify_refresh_holdings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = ''
    AS $$
BEGIN
  -- Notificar que houve mudança (para background worker)
  PERFORM pg_notify('refresh_holdings', 'refresh_needed');
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 18. refresh_portfolio_views
CREATE OR REPLACE FUNCTION "public"."refresh_portfolio_views"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = ''
    AS $$
BEGIN
  -- Refresh holdings_view (tem índice único, pode usar CONCURRENTLY)
  REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."holdings_view";
  
  -- Refresh portfolio_summary_view (tem índice único, pode usar CONCURRENTLY)
  REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."portfolio_summary_view";
  
  -- Refresh outras views (sem índice único, não pode usar CONCURRENTLY)
  REFRESH MATERIALIZED VIEW "public"."asset_allocation_view";
  REFRESH MATERIALIZED VIEW "public"."sector_allocation_view";
END;
$$;

-- 19. trigger_update_subscription_cache
CREATE OR REPLACE FUNCTION "public"."trigger_update_subscription_cache"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
  v_household_id uuid;
BEGIN
  -- Only process if status is active or trialing
  IF NEW."status" IN ('active', 'trialing') THEN
    -- Update cache for the subscription owner (if userId-based subscription)
    IF NEW."userId" IS NOT NULL THEN
      PERFORM "public"."update_user_subscription_cache"(NEW."userId");
      
      -- Also update all household members if this is a userId-based subscription
      -- Get householdId from user's active household
      SELECT "householdId" INTO v_household_id
      FROM "public"."UserActiveHousehold"
      WHERE "userId" = NEW."userId"
      LIMIT 1;
      
      -- Fallback to default household
      IF v_household_id IS NULL THEN
        SELECT "householdId" INTO v_household_id
        FROM "public"."HouseholdMemberNew"
        WHERE "userId" = NEW."userId"
          AND "isDefault" = true
          AND "status" = 'active'
        LIMIT 1;
      END IF;
      
      IF v_household_id IS NOT NULL THEN
        PERFORM "public"."update_household_members_subscription_cache"(v_household_id);
      END IF;
    END IF;
    
    -- Update cache for all household members if this is a householdId-based subscription
    IF NEW."householdId" IS NOT NULL THEN
      -- Update all members of this household
      PERFORM "public"."update_household_members_subscription_cache"(NEW."householdId");
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 20. get_user_admin_household_ids
CREATE OR REPLACE FUNCTION get_user_admin_household_ids()
RETURNS TABLE(household_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT hm."householdId" as household_id
    FROM "public"."HouseholdMemberNew" hm
    WHERE hm."userId" = auth.uid()
      AND hm."role" IN ('owner', 'admin')
      AND hm."status" = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 21. create_transfer_with_limit
CREATE OR REPLACE FUNCTION "create_transfer_with_limit"(
  p_user_id uuid,
  p_from_account_id text,
  p_to_account_id text,
  p_amount text,
  p_amount_numeric numeric(15,2),
  p_date date,
  p_description text DEFAULT NULL,
  p_description_search text DEFAULT NULL,
  p_recurring boolean DEFAULT false,
  p_max_transactions integer DEFAULT -1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_outgoing_id text;
  v_incoming_id text;
  v_month_date date;
  v_current_count integer;
  v_new_count integer;
  v_now timestamp(3) without time zone;
  v_outgoing_description text;
  v_incoming_description text;
BEGIN
  -- Generate IDs
  v_outgoing_id := gen_random_uuid()::text;
  v_incoming_id := gen_random_uuid()::text;
  v_now := CURRENT_TIMESTAMP;
  
  -- Calculate month_date (first day of month)
  v_month_date := DATE_TRUNC('month', p_date)::date;
  
  -- Check limit if not unlimited
  IF p_max_transactions != -1 THEN
    SELECT COALESCE("transactions_count", 0) INTO v_current_count
    FROM "public"."user_monthly_usage"
    WHERE "user_id" = p_user_id AND "month_date" = v_month_date;
    
    IF v_current_count >= p_max_transactions THEN
      RAISE EXCEPTION 'Transaction limit reached for this month';
    END IF;
  END IF;
  
  -- Increment counter ONCE (transfer = 1 action, not 2)
  v_new_count := "public"."increment_transaction_count"(p_user_id, v_month_date);
  
  -- Prepare descriptions
  v_outgoing_description := COALESCE(p_description, 'Transfer to account');
  v_incoming_description := COALESCE(p_description, 'Transfer from account');
  
  -- Create outgoing transaction (expense from source account)
  INSERT INTO "public"."Transaction" (
    "id", "date", "type", "amount", "amount_numeric", "accountId", "userId",
    "categoryId", "subcategoryId", "description", "description_search",
    "recurring", "transferToId", "createdAt", "updatedAt"
  ) VALUES (
    v_outgoing_id, p_date, 'expense', p_amount, p_amount_numeric, p_from_account_id, p_user_id,
    NULL, NULL, v_outgoing_description, p_description_search,
    p_recurring, v_incoming_id, v_now, v_now
  );
  
  -- Create incoming transaction (income to destination account)
  INSERT INTO "public"."Transaction" (
    "id", "date", "type", "amount", "amount_numeric", "accountId", "userId",
    "categoryId", "subcategoryId", "description", "description_search",
    "recurring", "transferFromId", "createdAt", "updatedAt"
  ) VALUES (
    v_incoming_id, p_date, 'income', p_amount, p_amount_numeric, p_to_account_id, p_user_id,
    NULL, NULL, v_incoming_description, p_description_search,
    p_recurring, v_outgoing_id, v_now, v_now
  );
  
  -- Return JSON with transaction IDs and new count
  RETURN jsonb_build_object(
    'outgoing_id', v_outgoing_id,
    'incoming_id', v_incoming_id,
    'new_count', v_new_count
  );
END;
$$;

-- ============================================================================
-- PART 2: MOVE pg_trgm EXTENSION FROM public TO extensions SCHEMA
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
-- Note: This requires dropping and recreating the extension, which will drop
-- any dependent objects. We need to recreate the index that uses it.
DO $$
BEGIN
  -- Check if extension exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    -- Drop the index that uses the extension first
    DROP INDEX IF EXISTS "public"."transaction_description_search_trgm_idx";
    
    -- Drop extension from public schema
    DROP EXTENSION IF EXISTS pg_trgm CASCADE;
    
    -- Create extension in extensions schema (if it doesn't already exist there)
    IF NOT EXISTS (
      SELECT 1 FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'pg_trgm' AND n.nspname = 'extensions'
    ) THEN
      CREATE EXTENSION pg_trgm SCHEMA extensions;
    END IF;
    
    -- Recreate the index with the extension in the new schema
    CREATE INDEX IF NOT EXISTS "transaction_description_search_trgm_idx"
    ON "public"."Transaction"
    USING GIN ("description_search" extensions.gin_trgm_ops)
    WHERE ("description_search" IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- PART 3: REVOKE ACCESS TO MATERIALIZED VIEWS FROM anon/authenticated
-- ============================================================================
-- Materialized views should not be directly accessible via the API
-- Access should be controlled through RLS policies or functions

-- Revoke SELECT on materialized views from anon and authenticated roles
REVOKE SELECT ON "public"."holdings_view" FROM anon, authenticated;
REVOKE SELECT ON "public"."asset_allocation_view" FROM anon, authenticated;
REVOKE SELECT ON "public"."portfolio_summary_view" FROM anon, authenticated;
REVOKE SELECT ON "public"."sector_allocation_view" FROM anon, authenticated;

-- ============================================================================
-- PART 4: CREATE SECURE FUNCTIONS TO ACCESS MATERIALIZED VIEWS
-- ============================================================================
-- These functions provide secure access to materialized views with proper
-- RLS checks. Users can only access their own data.

-- 1. Function to get user's holdings from holdings_view
CREATE OR REPLACE FUNCTION "public"."get_user_holdings_view"(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  security_id text,
  account_id text,
  user_id uuid,
  symbol text,
  name text,
  asset_type text,
  sector text,
  quantity double precision,
  avg_price double precision,
  book_value double precision,
  last_price double precision,
  market_value double precision,
  unrealized_pnl double precision,
  unrealized_pnl_percent double precision,
  account_name text,
  last_price_date date,
  last_updated timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Verify user can only access their own data
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own holdings';
  END IF;

  RETURN QUERY
  SELECT 
    hv.security_id,
    hv.account_id,
    hv.user_id,
    hv.symbol,
    hv.name,
    hv.asset_type,
    hv.sector,
    hv.quantity,
    hv.avg_price,
    hv.book_value,
    hv.last_price,
    hv.market_value,
    hv.unrealized_pnl,
    hv.unrealized_pnl_percent,
    hv.account_name,
    hv.last_price_date,
    hv.last_updated
  FROM "public"."holdings_view" hv
  WHERE hv.user_id = p_user_id
  ORDER BY hv.market_value DESC;
END;
$$;

-- 2. Function to get user's portfolio summary
CREATE OR REPLACE FUNCTION "public"."get_user_portfolio_summary"(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  user_id uuid,
  holdings_count bigint,
  total_value double precision,
  total_cost double precision,
  total_return double precision,
  total_return_percent double precision,
  last_updated timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Verify user can only access their own data
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own portfolio summary';
  END IF;

  RETURN QUERY
  SELECT 
    psv.user_id,
    psv.holdings_count,
    psv.total_value,
    psv.total_cost,
    psv.total_return,
    psv.total_return_percent,
    psv.last_updated
  FROM "public"."portfolio_summary_view" psv
  WHERE psv.user_id = p_user_id;
END;
$$;

-- 3. Function to get user's asset allocation
CREATE OR REPLACE FUNCTION "public"."get_user_asset_allocation"(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  user_id uuid,
  asset_type text,
  holdings_count bigint,
  total_value double precision,
  total_pnl double precision,
  allocation_percent double precision,
  last_updated timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Verify user can only access their own data
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own asset allocation';
  END IF;

  RETURN QUERY
  SELECT 
    aav.user_id,
    aav.asset_type,
    aav.holdings_count,
    aav.total_value,
    aav.total_pnl,
    aav.allocation_percent,
    aav.last_updated
  FROM "public"."asset_allocation_view" aav
  WHERE aav.user_id = p_user_id
  ORDER BY aav.total_value DESC;
END;
$$;

-- 4. Function to get user's sector allocation
CREATE OR REPLACE FUNCTION "public"."get_user_sector_allocation"(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  user_id uuid,
  sector text,
  holdings_count bigint,
  total_value double precision,
  total_pnl double precision,
  allocation_percent double precision,
  last_updated timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Verify user can only access their own data
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own sector allocation';
  END IF;

  RETURN QUERY
  SELECT 
    sav.user_id,
    sav.sector,
    sav.holdings_count,
    sav.total_value,
    sav.total_pnl,
    sav.allocation_percent,
    sav.last_updated
  FROM "public"."sector_allocation_view" sav
  WHERE sav.user_id = p_user_id
  ORDER BY sav.total_value DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_user_holdings_view"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_portfolio_summary"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_asset_allocation"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_sector_allocation"(uuid) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION "public"."update_user_subscription_cache"("p_user_id" "uuid") IS 
'Updates the subscription cache in the User table. Uses HouseholdMemberNew and householdId-based subscriptions. Falls back to userId-based subscriptions for backward compatibility.';

COMMENT ON FUNCTION "public"."prevent_emergency_fund_deletion"() IS 
'Prevents deletion of system goals. Uses SET search_path for security.';

COMMENT ON FUNCTION get_user_household_ids() IS 
'Returns all household IDs where the current user is an active member. Uses SECURITY DEFINER to bypass RLS and prevent recursion. Uses SET search_path for security.';

COMMENT ON FUNCTION can_access_account_via_accountowner(text) IS 
'Checks if the current user can access an account via AccountOwner relationship. Uses SECURITY DEFINER to bypass RLS and prevent recursion. Uses SET search_path for security.';

COMMENT ON FUNCTION get_account_user_id(text) IS 
'Returns the userId of an account. Uses SECURITY DEFINER to bypass RLS and prevent recursion. Uses SET search_path for security.';

COMMENT ON FUNCTION get_user_accessible_households() IS 
'Returns all household IDs that the current user can access as an active member. Uses SET search_path for security.';

COMMENT ON FUNCTION get_user_active_household() IS 
'Returns the currently active household ID for the current user, or their default personal household. Uses SET search_path for security.';

COMMENT ON FUNCTION can_access_household_data(uuid, text) IS 
'Checks if the current user can perform an operation (read/write/delete) on a household''s data based on their role. Uses SET search_path for security.';

COMMENT ON FUNCTION is_household_member(uuid) IS 
'Returns true if the current user is an active member of the specified household. Uses SET search_path for security.';

COMMENT ON FUNCTION get_user_household_role(uuid) IS 
'Returns the current user''s role in the specified household, or NULL if not a member. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."update_household_members_subscription_cache"("p_household_id" "uuid") IS 
'Updates subscription cache for all active members of a household when the household subscription changes. Uses HouseholdMemberNew. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."convert_planned_payment_to_transaction"("p_planned_payment_id" "text") IS 
'Converts a planned payment to a transaction. Uses SET search_path for security.';

COMMENT ON FUNCTION "create_transaction_with_limit" IS 
'Creates a regular transaction atomically with limit checking. All operations in one transaction. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."are_users_in_same_household"("p_user1_id" "uuid", "p_user2_id" "uuid") IS 
'Checks if two users are active members of the same household. Uses SECURITY DEFINER to bypass RLS and prevent recursion. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."get_latest_updates"("p_user_id" "uuid") IS 
'Retorna timestamp da última atualização de cada tabela para um usuário. Usado pelo endpoint check-updates. Uses SET search_path for security.';

COMMENT ON FUNCTION "increment_transaction_count" IS 
'Atomically increments transaction count for a user/month. Used within transaction functions. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."notify_refresh_holdings"() IS 
'Notifies that holdings need to be refreshed. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."refresh_portfolio_views"() IS 
'Refresh manual de todas as views de portfolio. Executar via cron job ou API. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."trigger_update_subscription_cache"() IS 
'Updates subscription cache when subscription changes. Supports both userId-based (backward compatibility) and householdId-based subscriptions. Uses SET search_path for security.';

COMMENT ON FUNCTION get_user_admin_household_ids() IS 
'Returns all household IDs where the current user is an owner or admin. Uses SECURITY DEFINER to bypass RLS and prevent recursion. Uses SET search_path for security.';

COMMENT ON FUNCTION "create_transfer_with_limit" IS 
'Creates a transfer (2 transactions) atomically with limit checking. Counts as 1 transaction. All operations in one transaction. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."get_user_holdings_view"(uuid) IS 
'Secure function to get user holdings from holdings_view. Users can only access their own data. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."get_user_portfolio_summary"(uuid) IS 
'Secure function to get user portfolio summary from portfolio_summary_view. Users can only access their own data. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."get_user_asset_allocation"(uuid) IS 
'Secure function to get user asset allocation from asset_allocation_view. Users can only access their own data. Uses SET search_path for security.';

COMMENT ON FUNCTION "public"."get_user_sector_allocation"(uuid) IS 
'Secure function to get user sector allocation from sector_allocation_view. Users can only access their own data. Uses SET search_path for security.';

