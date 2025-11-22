-- Migration: Add Emergency Fund Goal System
-- Adds goalType column to Goal table and creates emergency fund goals for all users

-- Step 1: Add goalType column to Goal table
ALTER TABLE "Goal" 
ADD COLUMN IF NOT EXISTS "goalType" TEXT;

-- Step 2: Drop existing constraint if it exists
ALTER TABLE "Goal" 
DROP CONSTRAINT IF EXISTS "goal_targetamount_positive";

-- Step 3: Add new constraint that allows targetAmount = 0 for emergency_fund goals
ALTER TABLE "Goal" 
ADD CONSTRAINT "goal_targetamount_positive" 
CHECK (
  ("targetAmount" > 0) OR 
  ("goalType" = 'emergency_fund' AND "targetAmount" >= 0)
);

-- Step 4: Add index on goalType for performance
CREATE INDEX IF NOT EXISTS "idx_goal_goaltype" ON "Goal"("goalType") WHERE "goalType" IS NOT NULL;

-- Step 5: Create emergency fund goals for all existing users/households
-- This creates a goal for each household that doesn't already have one
INSERT INTO "Goal" (
  "id",
  "name",
  "targetAmount",
  "currentBalance",
  "incomePercentage",
  "priority",
  "description",
  "isPaused",
  "isCompleted",
  "completedAt",
  "expectedIncome",
  "targetMonths",
  "accountId",
  "holdingId",
  "userId",
  "householdId",
  "goalType",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text as "id",
  'Emergency Funds' as "name",
  0.00 as "targetAmount",
  0.00 as "currentBalance",
  0.00 as "incomePercentage",
  'High' as "priority",
  'Emergency fund for unexpected expenses' as "description",
  false as "isPaused",
  false as "isCompleted",
  NULL as "completedAt",
  NULL as "expectedIncome",
  NULL as "targetMonths",
  NULL as "accountId",
  NULL as "holdingId",
  h."createdBy" as "userId",
  h."id" as "householdId",
  'emergency_fund' as "goalType",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Household" h
WHERE NOT EXISTS (
  SELECT 1 
  FROM "Goal" g 
  WHERE g."householdId" = h."id" 
    AND g."goalType" = 'emergency_fund'
)
ON CONFLICT DO NOTHING;

-- Step 6: Add comment to goalType column
COMMENT ON COLUMN "Goal"."goalType" IS 'Type of goal: emergency_fund for system-created emergency fund goals, NULL for user-created goals';

-- Step 7: Create function to prevent deletion of emergency_fund goals
CREATE OR REPLACE FUNCTION "public"."prevent_emergency_fund_deletion"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."goalType" = 'emergency_fund' THEN
    RAISE EXCEPTION 'Emergency fund goal cannot be deleted. You can edit it instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to prevent deletion of emergency_fund goals
DROP TRIGGER IF EXISTS "prevent_emergency_fund_deletion_trigger" ON "Goal";
CREATE TRIGGER "prevent_emergency_fund_deletion_trigger"
  BEFORE DELETE ON "Goal"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."prevent_emergency_fund_deletion"();

