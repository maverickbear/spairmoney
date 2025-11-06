-- Insert default plans
INSERT INTO "Plan" ("id", "name", "priceMonthly", "priceYearly", "features", "createdAt", "updatedAt")
VALUES
  (
    'free',
    'free',
    0.00,
    0.00,
    '{"maxTransactions": 50, "maxAccounts": 2, "hasInvestments": false, "hasAdvancedReports": false, "hasCsvExport": false, "hasDebts": true, "hasGoals": true}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'basic',
    'basic',
    7.99,
    79.90,
    '{"maxTransactions": 500, "maxAccounts": 10, "hasInvestments": true, "hasAdvancedReports": true, "hasCsvExport": true, "hasDebts": true, "hasGoals": true}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'premium',
    'premium',
    14.99,
    149.90,
    '{"maxTransactions": -1, "maxAccounts": -1, "hasInvestments": true, "hasAdvancedReports": true, "hasCsvExport": true, "hasDebts": true, "hasGoals": true}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;

