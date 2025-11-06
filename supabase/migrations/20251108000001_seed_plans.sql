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
    9.99,
    99.99,
    '{"maxTransactions": 500, "maxAccounts": 10, "hasInvestments": true, "hasAdvancedReports": true, "hasCsvExport": true, "hasDebts": true, "hasGoals": true}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'premium',
    'premium',
    19.99,
    199.99,
    '{"maxTransactions": -1, "maxAccounts": -1, "hasInvestments": true, "hasAdvancedReports": true, "hasCsvExport": true, "hasDebts": true, "hasGoals": true}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;

