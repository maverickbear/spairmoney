-- Update Basic plan to have 300 transactions instead of 500
UPDATE "Plan"
SET 
  "features" = jsonb_set(
    "features",
    '{maxTransactions}',
    '300'::jsonb
  ),
  "updatedAt" = NOW()
WHERE "id" = 'basic';

