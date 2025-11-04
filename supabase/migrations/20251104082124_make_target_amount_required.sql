-- Make targetAmount required again in Goal table
-- Goals now require both targetAmount (the goal to achieve) and incomePercentage (monthly allocation)

-- First, set any NULL values to 0 (or you can delete them if preferred)
UPDATE "Goal" SET "targetAmount" = 0 WHERE "targetAmount" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Goal" 
ALTER COLUMN "targetAmount" SET NOT NULL;

