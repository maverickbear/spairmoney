-- Migration: Change goalType to isSystemGoal
-- Replaces goalType TEXT column with isSystemGoal BOOLEAN column

-- Step 1: Add isSystemGoal column
ALTER TABLE "Goal" 
ADD COLUMN IF NOT EXISTS "isSystemGoal" BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Migrate existing data: set isSystemGoal = true where goalType = 'emergency_fund'
UPDATE "Goal"
SET "isSystemGoal" = true
WHERE "goalType" = 'emergency_fund';

-- Step 3: Drop the old constraint that references goalType
ALTER TABLE "Goal" 
DROP CONSTRAINT IF EXISTS "goal_targetamount_positive";

-- Step 4: Add new constraint that allows targetAmount = 0 for system goals
ALTER TABLE "Goal" 
ADD CONSTRAINT "goal_targetamount_positive" 
CHECK (
  ("targetAmount" > 0) OR 
  ("isSystemGoal" = true AND "targetAmount" >= 0)
);

-- Step 5: Drop old index on goalType
DROP INDEX IF EXISTS "idx_goal_goaltype";

-- Step 6: Add index on isSystemGoal for performance
CREATE INDEX IF NOT EXISTS "idx_goal_issystemgoal" ON "Goal"("isSystemGoal") WHERE "isSystemGoal" = true;

-- Step 7: Update the deletion prevention function
CREATE OR REPLACE FUNCTION "public"."prevent_emergency_fund_deletion"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."isSystemGoal" = true THEN
    RAISE EXCEPTION 'System goals cannot be deleted. You can edit them instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Drop old goalType column
ALTER TABLE "Goal" 
DROP COLUMN IF EXISTS "goalType";

-- Step 9: Add comment to isSystemGoal column
COMMENT ON COLUMN "Goal"."isSystemGoal" IS 'Indicates if this is a system-created goal (e.g., Emergency Funds). System goals cannot be deleted.';

