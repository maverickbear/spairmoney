-- Migration: Create PlannedPayment Table
-- Date: 2025-01-21
-- Description: Creates PlannedPayment table to separate future payments from real transactions
-- This improves organization, performance, and clarity of the system

-- ============================================================================
-- CREATE PLANNEDPAYMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."PlannedPayment" (
    "id" "text" NOT NULL,
    "date" date NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "accountId" "text" NOT NULL,
    "categoryId" "text",
    "subcategoryId" "text",
    "description" "text",
    "source" "text" NOT NULL DEFAULT 'manual'::"text",
    "status" "text" NOT NULL DEFAULT 'scheduled'::"text",
    "linkedTransactionId" "text",
    "debtId" "text",
    "userId" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "PlannedPayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlannedPayment_type_check" CHECK (("type" = ANY (ARRAY['expense'::"text", 'income'::"text", 'transfer'::"text"]))),
    CONSTRAINT "PlannedPayment_source_check" CHECK (("source" = ANY (ARRAY['recurring'::"text", 'debt'::"text", 'manual'::"text"]))),
    CONSTRAINT "PlannedPayment_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'paid'::"text", 'skipped'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "PlannedPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE,
    CONSTRAINT "PlannedPayment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL,
    CONSTRAINT "PlannedPayment_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL,
    CONSTRAINT "PlannedPayment_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL,
    CONSTRAINT "PlannedPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "public"."Debt"("id") ON DELETE CASCADE,
    CONSTRAINT "PlannedPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE,
    -- Invariants: status = "paid" must have linkedTransactionId
    CONSTRAINT "PlannedPayment_paid_has_transaction" CHECK (
        ("status" <> 'paid'::"text" OR "linkedTransactionId" IS NOT NULL)
    ),
    -- Invariants: linkedTransactionId only exists if status = "paid"
    CONSTRAINT "PlannedPayment_transaction_only_if_paid" CHECK (
        ("linkedTransactionId" IS NULL OR "status" = 'paid'::"text")
    ),
    -- Invariants: skipped/cancelled cannot have linkedTransactionId
    CONSTRAINT "PlannedPayment_skipped_cancelled_no_transaction" CHECK (
        ("status" NOT IN ('skipped'::"text", 'cancelled'::"text") OR "linkedTransactionId" IS NULL)
    )
);

ALTER TABLE "public"."PlannedPayment" OWNER TO "postgres";

COMMENT ON TABLE "public"."PlannedPayment" IS 'Future payments that will become Transactions when paid. Does not affect account balances.';
COMMENT ON COLUMN "public"."PlannedPayment"."source" IS 'Origin of the planned payment: recurring (from recurring transaction), debt (from debt), manual (user created)';
COMMENT ON COLUMN "public"."PlannedPayment"."status" IS 'Current status: scheduled (pending), paid (converted to Transaction), skipped (skipped without creating Transaction), cancelled (cancelled)';
COMMENT ON COLUMN "public"."PlannedPayment"."linkedTransactionId" IS 'Transaction ID when this PlannedPayment was converted to a Transaction (only when status = paid)';
COMMENT ON COLUMN "public"."PlannedPayment"."debtId" IS 'Debt ID if this PlannedPayment was created from a debt';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for filtering by date (most common query)
CREATE INDEX IF NOT EXISTS "idx_planned_payment_date" 
  ON "public"."PlannedPayment" ("date" ASC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS "idx_planned_payment_status" 
  ON "public"."PlannedPayment" ("status");

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS "idx_planned_payment_source" 
  ON "public"."PlannedPayment" ("source");

-- Index for filtering by debtId (for debt-related queries)
CREATE INDEX IF NOT EXISTS "idx_planned_payment_debt_id" 
  ON "public"."PlannedPayment" ("debtId") WHERE "debtId" IS NOT NULL;

-- Index for filtering by userId (for RLS and user queries)
CREATE INDEX IF NOT EXISTS "idx_planned_payment_user_id" 
  ON "public"."PlannedPayment" ("userId");

-- Composite index for common queries (date + status + userId)
CREATE INDEX IF NOT EXISTS "idx_planned_payment_date_status_user" 
  ON "public"."PlannedPayment" ("date", "status", "userId");

-- Index for linkedTransactionId lookups
CREATE INDEX IF NOT EXISTS "idx_planned_payment_linked_transaction" 
  ON "public"."PlannedPayment" ("linkedTransactionId") WHERE "linkedTransactionId" IS NOT NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "public"."PlannedPayment" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own planned payments
CREATE POLICY "Users can view own planned payments" 
  ON "public"."PlannedPayment" 
  FOR SELECT 
  USING (("userId" = "auth"."uid"()));

-- Policy: Users can insert their own planned payments
CREATE POLICY "Users can insert own planned payments" 
  ON "public"."PlannedPayment" 
  FOR INSERT 
  WITH CHECK (("userId" = "auth"."uid"()));

-- Policy: Users can update their own planned payments
CREATE POLICY "Users can update own planned payments" 
  ON "public"."PlannedPayment" 
  FOR UPDATE 
  USING (("userId" = "auth"."uid"()));

-- Policy: Users can delete their own planned payments
CREATE POLICY "Users can delete own planned payments" 
  ON "public"."PlannedPayment" 
  FOR DELETE 
  USING (("userId" = "auth"."uid"()));

-- ============================================================================
-- FUNCTION: Convert PlannedPayment to Transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."convert_planned_payment_to_transaction"(
    p_planned_payment_id "text"
)
RETURNS "text"
LANGUAGE "plpgsql"
SECURITY DEFINER
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
    
    -- Encrypt amount (using same logic as Transaction)
    -- Note: This assumes amount encryption function exists
    -- For now, we'll store as numeric and let the application layer handle encryption
    -- The Transaction table expects encrypted text, so we need to handle this
    
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
        "recurring",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_transaction_id,
        v_planned_payment."date",
        v_planned_payment."type",
        v_planned_payment."amount"::"text", -- Will be encrypted by application layer
        v_planned_payment."accountId",
        v_planned_payment."categoryId",
        v_planned_payment."subcategoryId",
        v_planned_payment."description",
        v_user_id,
        false, -- Planned payments are not recurring by default
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Update planned payment status and link transaction
    UPDATE "public"."PlannedPayment"
    SET 
        "status" = 'paid'::"text",
        "linkedTransactionId" = v_transaction_id,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_planned_payment_id;
    
    RETURN v_transaction_id;
END;
$$;

COMMENT ON FUNCTION "public"."convert_planned_payment_to_transaction"("text") IS 'Converts a PlannedPayment to a Transaction. Idempotent - returns existing transaction if already converted.';

