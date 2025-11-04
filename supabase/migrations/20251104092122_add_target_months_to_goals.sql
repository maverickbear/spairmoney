-- Add targetMonths column to Goal table
ALTER TABLE "Goal" 
  ADD COLUMN IF NOT EXISTS "targetMonths" DOUBLE PRECISION;

-- Add check constraint for targetMonths to be positive when provided
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_targetMonths_check" 
  CHECK ("targetMonths" IS NULL OR "targetMonths" > 0);

