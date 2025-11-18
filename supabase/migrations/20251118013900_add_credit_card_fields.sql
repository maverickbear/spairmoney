-- Migration: Add credit card fields to Account and Debt tables
-- Date: 2025-11-18
-- Description: Adds dueDayOfMonth and extraCredit to Account table, and status and nextDueDate to Debt table for automatic credit card debt management

-- ============================================================================
-- ADD FIELDS TO Account TABLE
-- ============================================================================

-- Add dueDayOfMonth column (nullable integer, 1-31)
ALTER TABLE "Account"
ADD COLUMN IF NOT EXISTS "dueDayOfMonth" integer;

COMMENT ON COLUMN "Account"."dueDayOfMonth" IS 'Day of month when credit card bill is due (1-31). Only used for type=''credit'' accounts.';

-- Add extraCredit column (numeric with default 0, not null)
ALTER TABLE "Account"
ADD COLUMN IF NOT EXISTS "extraCredit" numeric(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN "Account"."extraCredit" IS 'Extra prepaid credit on this credit card. Used when user pays more than the current debt balance.';

-- ============================================================================
-- ADD FIELDS TO Debt TABLE
-- ============================================================================

-- Add status column (text with default 'active')
ALTER TABLE "Debt"
ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';

-- Add constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'debt_status_check'
  ) THEN
    ALTER TABLE "Debt"
    ADD CONSTRAINT "debt_status_check" 
    CHECK ("status" IN ('active', 'closed'));
  END IF;
END $$;

COMMENT ON COLUMN "Debt"."status" IS 'Estado da dívida (ativa ou encerrada)';

-- Add nextDueDate column (nullable date)
ALTER TABLE "Debt"
ADD COLUMN IF NOT EXISTS "nextDueDate" date;

COMMENT ON COLUMN "Debt"."nextDueDate" IS 'Data de vencimento da fatura/dívida';

-- ============================================================================
-- UPDATE EXISTING RECORDS
-- ============================================================================

-- Set status to 'closed' for debts that are already paid off
UPDATE "Debt"
SET "status" = 'closed'
WHERE "isPaidOff" = true AND "status" = 'active';

-- Keep existing active debts as 'active'
UPDATE "Debt"
SET "status" = 'active'
WHERE "isPaidOff" = false AND "status" IS NULL;

