-- Migration: Seed system default categories
-- This migration creates default Macro, Category, and Subcategory records
-- with userId = NULL that are shared by all users

-- ============================================
-- Step 1: Create System Macros (userId = NULL)
-- ============================================

-- Insert system macros, only if they don't already exist with userId = NULL
INSERT INTO "Macro" (id, name, "userId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  macro_name,
  NULL,
  NOW(),
  NOW()
FROM UNNEST(ARRAY['Income', 'Housing', 'Transportation', 'Food', 'Health', 'Subscriptions', 'Business', 'Family', 'Savings', 'Investments', 'Misc']) AS macro_name
WHERE NOT EXISTS (
  SELECT 1 FROM "Macro" 
  WHERE name = macro_name AND "userId" IS NULL
);

-- ============================================
-- Step 2: Create System Categories and Subcategories
-- ============================================

-- Get macro IDs for reference
DO $$
DECLARE
  macro_income_id TEXT;
  macro_housing_id TEXT;
  macro_transportation_id TEXT;
  macro_food_id TEXT;
  macro_health_id TEXT;
  macro_subscriptions_id TEXT;
  macro_business_id TEXT;
  macro_family_id TEXT;
  macro_savings_id TEXT;
  macro_investments_id TEXT;
  macro_misc_id TEXT;
BEGIN
  -- Get macro IDs
  SELECT id INTO macro_income_id FROM "Macro" WHERE name = 'Income' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_housing_id FROM "Macro" WHERE name = 'Housing' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_transportation_id FROM "Macro" WHERE name = 'Transportation' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_food_id FROM "Macro" WHERE name = 'Food' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_health_id FROM "Macro" WHERE name = 'Health' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_subscriptions_id FROM "Macro" WHERE name = 'Subscriptions' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_business_id FROM "Macro" WHERE name = 'Business' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_family_id FROM "Macro" WHERE name = 'Family' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_savings_id FROM "Macro" WHERE name = 'Savings' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_investments_id FROM "Macro" WHERE name = 'Investments' AND "userId" IS NULL LIMIT 1;
  SELECT id INTO macro_misc_id FROM "Macro" WHERE name = 'Misc' AND "userId" IS NULL LIMIT 1;

  -- Housing categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Rent', macro_housing_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Utilities', macro_housing_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Transportation categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Vehicle', macro_transportation_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Public Transit', macro_transportation_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Food categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Groceries', macro_food_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Restaurants', macro_food_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Health categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Medical', macro_health_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Fitness', macro_health_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Subscriptions categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Streaming', macro_subscriptions_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Software', macro_subscriptions_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Business categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Office', macro_business_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Marketing', macro_business_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Family categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Gifts', macro_family_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Child/Baby', macro_family_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Education', macro_family_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Travel', macro_family_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Donations', macro_family_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Savings categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Emergency Fund', macro_savings_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'RRSP', macro_savings_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'FHSA', macro_savings_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'TFSA', macro_savings_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Investments categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Stocks', macro_investments_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Crypto', macro_investments_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Misc categories
  INSERT INTO "Category" (id, name, "macroId", "userId", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Bank Fees', macro_misc_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Overdraft', macro_misc_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Unexpected', macro_misc_id, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'Uncategorized', macro_misc_id, NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Utilities
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['BC Hydro', 'Fortis BC', 'Internet', 'Maintenance', 'Insurance']) AS subcat_name
  WHERE cat.name = 'Utilities' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Vehicle
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Car Loan', 'Car Insurance', 'Fuel', 'Maintenance', 'Parking']) AS subcat_name
  WHERE cat.name = 'Vehicle' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Public Transit
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Transit Pass']) AS subcat_name
  WHERE cat.name = 'Public Transit' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Groceries
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Superstore', 'Save-On-Foods', 'Costco']) AS subcat_name
  WHERE cat.name = 'Groceries' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Restaurants
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Fast Food', 'Dine In', 'Delivery']) AS subcat_name
  WHERE cat.name = 'Restaurants' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Medical
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Doctor', 'Dentist', 'Pharmacy']) AS subcat_name
  WHERE cat.name = 'Medical' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Fitness
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Gym', 'Equipment']) AS subcat_name
  WHERE cat.name = 'Fitness' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Streaming
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Netflix', 'Spotify', 'YouTube Premium']) AS subcat_name
  WHERE cat.name = 'Streaming' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Software
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Adobe', 'Microsoft 365']) AS subcat_name
  WHERE cat.name = 'Software' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Office
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Supplies', 'Rent']) AS subcat_name
  WHERE cat.name = 'Office' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

  -- Create subcategories for Marketing
  INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, subcat_name, cat.id, NOW(), NOW()
  FROM "Category" cat
  CROSS JOIN UNNEST(ARRAY['Ads', 'Tools']) AS subcat_name
  WHERE cat.name = 'Marketing' AND cat."userId" IS NULL
  ON CONFLICT DO NOTHING;

END $$;

