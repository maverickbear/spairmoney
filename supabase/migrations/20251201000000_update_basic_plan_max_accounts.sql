-- Update Basic plan to have 8 accounts instead of 10
UPDATE "Plan"
SET 
  "features" = jsonb_set(
    "features",
    '{maxAccounts}',
    '8'::jsonb
  ),
  "updatedAt" = NOW()
WHERE "id" = 'basic';

