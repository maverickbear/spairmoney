-- Update Goal table schema to match GOALS.md requirements

-- Add new columns
ALTER TABLE "Goal" 
  ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "expectedIncome" DOUBLE PRECISION;

-- Remove accountId column and foreign key constraint (if exists)
-- First drop the constraint if it exists
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_accountId_fkey";
-- Drop the index if it exists
DROP INDEX IF EXISTS "Goal_accountId_idx";
-- Drop the column if it exists
ALTER TABLE "Goal" DROP COLUMN IF EXISTS "accountId";

-- Remove isTransferred column (if exists)
DROP INDEX IF EXISTS "Goal_isTransferred_idx";
ALTER TABLE "Goal" DROP COLUMN IF EXISTS "isTransferred";

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "Goal_priority_idx" ON "Goal"("priority");
CREATE INDEX IF NOT EXISTS "Goal_isPaused_idx" ON "Goal"("isPaused");
-- isCompleted index already exists

-- Add check constraint for priority values
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_priority_check" 
  CHECK ("priority" IN ('High', 'Medium', 'Low'));

-- Add check constraint for currentBalance >= 0
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_currentBalance_check" 
  CHECK ("currentBalance" >= 0);

