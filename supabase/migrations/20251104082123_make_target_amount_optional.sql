-- Make targetAmount optional in Goal table
-- Goals are now based on percentage only, targetAmount is optional for backward compatibility

ALTER TABLE "Goal" 
ALTER COLUMN "targetAmount" DROP NOT NULL;

