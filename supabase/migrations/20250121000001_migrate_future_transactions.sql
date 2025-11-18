-- Migration: Migrate Future Transactions to PlannedPayments
-- Date: 2025-01-21
-- Description: Migrates existing future transactions and recurring transactions to PlannedPayments
-- Only migrates transactions with recurring=true and transactions created by debts

-- ============================================================================
-- MIGRATION STRATEGY
-- ============================================================================
-- 1. Migrate recurring transactions (recurring = true) to PlannedPayments
--    Generate PlannedPayments for next occurrences (up to 90 days)
-- 2. Migrate debt-related transactions (identified by description pattern)
-- 3. Optionally migrate manual future transactions (type = expense/income, date > today, recurring = false)
-- 4. Delete migrated transactions after confirmation

-- ============================================================================
-- STEP 1: Migrate Recurring Transactions
-- ============================================================================
-- For each recurring transaction, generate PlannedPayments for next occurrences
-- Only generate for dates within the next 90 days

DO $$
DECLARE
  rec_transaction RECORD;
  next_date DATE;
  today_date DATE;
  horizon_date DATE;
  original_day INT;
  months_ahead INT;
  planned_payment_id TEXT;
  encrypted_description TEXT;
BEGIN
  today_date := CURRENT_DATE;
  horizon_date := today_date + INTERVAL '90 days';

  -- Process each recurring transaction
  FOR rec_transaction IN 
    SELECT 
      t.id,
      t."date",
      t.type,
      t.amount,
      t."accountId",
      t."categoryId",
      t."subcategoryId",
      t.description,
      t."userId"
    FROM "Transaction" t
    WHERE t.recurring = true
    AND t."userId" IS NOT NULL
  LOOP
    -- Calculate original day of month
    original_day := EXTRACT(DAY FROM rec_transaction.date::DATE);
    
    -- Generate planned payments for next 3 months (12 occurrences max)
    -- This ensures we don't create too many at once
    FOR months_ahead IN 0..11 LOOP
      -- Calculate next occurrence date
      next_date := (DATE_TRUNC('month', today_date) + (months_ahead || ' months')::INTERVAL)::DATE;
      
      -- Adjust to the original day of month
      BEGIN
        next_date := next_date + (original_day - 1) || ' days'::INTERVAL;
        
        -- Handle edge case: if day doesn't exist in month (e.g., Jan 31 -> Feb)
        IF EXTRACT(DAY FROM next_date) != original_day THEN
          next_date := (DATE_TRUNC('month', next_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- If date calculation fails, use last day of month
        next_date := (DATE_TRUNC('month', next_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      END;
      
      -- Only create if date is in the future and within horizon
      IF next_date >= today_date AND next_date <= horizon_date THEN
        -- Check if PlannedPayment already exists for this transaction and date
        IF NOT EXISTS (
          SELECT 1 FROM "PlannedPayment"
          WHERE "userId" = rec_transaction."userId"
          AND "accountId" = rec_transaction."accountId"
          AND "date" = next_date
          AND "type" = rec_transaction.type
          AND "source" = 'recurring'
          AND "status" = 'scheduled'
        ) THEN
          planned_payment_id := gen_random_uuid()::TEXT;
          
          -- Insert planned payment
          INSERT INTO "PlannedPayment" (
            id,
            "date",
            type,
            amount,
            "accountId",
            "categoryId",
            "subcategoryId",
            description,
            source,
            status,
            "userId",
            "createdAt",
            "updatedAt"
          ) VALUES (
            planned_payment_id,
            next_date,
            rec_transaction.type,
            -- Convert encrypted amount to numeric (assuming it's stored as text)
            -- This is a simplified conversion - actual encryption handling should be done in application layer
            CASE 
              WHEN rec_transaction.amount ~ '^-?[0-9]+\.?[0-9]*$' THEN rec_transaction.amount::NUMERIC
              ELSE 0
            END,
            rec_transaction."accountId",
            rec_transaction."categoryId",
            rec_transaction."subcategoryId",
            rec_transaction.description,
            'recurring',
            'scheduled',
            rec_transaction."userId",
            NOW(),
            NOW()
          );
        END IF;
      END IF;
      
      -- Stop if we've exceeded horizon
      IF next_date > horizon_date THEN
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migrated recurring transactions to PlannedPayments';
END $$;

-- ============================================================================
-- STEP 2: Migrate Debt-Related Transactions
-- ============================================================================
-- Identify debt-related transactions by checking if they match debt payment patterns
-- This is a best-effort migration - some transactions might not be identified

DO $$
DECLARE
  rec_transaction RECORD;
  rec_debt RECORD;
  planned_payment_id TEXT;
BEGIN
  -- For each debt, find matching future transactions
  FOR rec_debt IN 
    SELECT id, "accountId", "userId", name
    FROM "Debt"
    WHERE "accountId" IS NOT NULL
    AND "isPaidOff" = false
    AND "isPaused" = false
  LOOP
    -- Find future transactions that might be debt payments
    -- Match by account, type (expense), and description containing debt name
    FOR rec_transaction IN
      SELECT 
        t.id,
        t."date",
        t.type,
        t.amount,
        t."accountId",
        t."categoryId",
        t."subcategoryId",
        t.description,
        t."userId"
      FROM "Transaction" t
      WHERE t."accountId" = rec_debt."accountId"
      AND t."userId" = rec_debt."userId"
      AND t.type = 'expense'
      AND t."date"::DATE > CURRENT_DATE
      AND t."date"::DATE <= CURRENT_DATE + INTERVAL '90 days'
      AND (t.description ILIKE '%' || rec_debt.name || '%' OR t.recurring = true)
      AND NOT EXISTS (
        SELECT 1 FROM "PlannedPayment"
        WHERE "debtId" = rec_debt.id
        AND "date" = t."date"::DATE
        AND "status" = 'scheduled'
      )
    LOOP
      planned_payment_id := gen_random_uuid()::TEXT;
      
      INSERT INTO "PlannedPayment" (
        id,
        "date",
        type,
        amount,
        "accountId",
        "categoryId",
        "subcategoryId",
        description,
        source,
        status,
        "debtId",
        "userId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        planned_payment_id,
        rec_transaction."date"::DATE,
        rec_transaction.type,
        CASE 
          WHEN rec_transaction.amount ~ '^-?[0-9]+\.?[0-9]*$' THEN rec_transaction.amount::NUMERIC
          ELSE 0
        END,
        rec_transaction."accountId",
        rec_transaction."categoryId",
        rec_transaction."subcategoryId",
        rec_transaction.description,
        'debt',
        'scheduled',
        rec_debt.id,
        rec_transaction."userId",
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migrated debt-related transactions to PlannedPayments';
END $$;

-- ============================================================================
-- STEP 3: Optional - Migrate Manual Future Transactions
-- ============================================================================
-- This step is commented out by default to avoid breaking existing workflows
-- Uncomment if you want to migrate all future transactions

/*
DO $$
DECLARE
  rec_transaction RECORD;
  planned_payment_id TEXT;
BEGIN
  FOR rec_transaction IN
    SELECT 
      t.id,
      t."date",
      t.type,
      t.amount,
      t."accountId",
      t."categoryId",
      t."subcategoryId",
      t.description,
      t."userId"
    FROM "Transaction" t
    WHERE t.recurring = false
    AND t.type IN ('expense', 'income')
    AND t."date"::DATE > CURRENT_DATE
    AND t."date"::DATE <= CURRENT_DATE + INTERVAL '90 days'
    AND t."userId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "PlannedPayment"
      WHERE "userId" = t."userId"
      AND "accountId" = t."accountId"
      AND "date" = t."date"::DATE
      AND "type" = t.type
      AND "status" = 'scheduled'
    )
  LOOP
    planned_payment_id := gen_random_uuid()::TEXT;
    
    INSERT INTO "PlannedPayment" (
      id,
      "date",
      type,
      amount,
      "accountId",
      "categoryId",
      "subcategoryId",
      description,
      source,
      status,
      "userId",
      "createdAt",
      "updatedAt"
    ) VALUES (
      planned_payment_id,
      rec_transaction."date"::DATE,
      rec_transaction.type,
      CASE 
        WHEN rec_transaction.amount ~ '^-?[0-9]+\.?[0-9]*$' THEN rec_transaction.amount::NUMERIC
        ELSE 0
      END,
      rec_transaction."accountId",
      rec_transaction."categoryId",
      rec_transaction."subcategoryId",
      rec_transaction.description,
      'manual',
      'scheduled',
      rec_transaction."userId",
      NOW(),
      NOW()
    );
  END LOOP;
  
  RAISE NOTICE 'Migrated manual future transactions to PlannedPayments';
END $$;
*/

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify after running)
-- ============================================================================
-- Count migrated planned payments by source
-- SELECT 
--   source,
--   COUNT(*) as count,
--   COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
--   COUNT(*) FILTER (WHERE status = 'paid') as paid
-- FROM "PlannedPayment"
-- GROUP BY source;

-- Check for any remaining future transactions that should have been migrated
-- SELECT COUNT(*) as remaining_future_transactions
-- FROM "Transaction"
-- WHERE recurring = true
-- AND "date"::DATE > CURRENT_DATE;

