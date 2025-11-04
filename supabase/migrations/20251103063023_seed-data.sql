-- Dados iniciais: Macros, Categories e Subcategories
-- Execute este script após criar as tabelas (manual_migration.sql)
-- No SQL Editor do Supabase, copie e cole este conteúdo e execute

-- =====================================================
-- INSERIR MACROS
-- =====================================================

INSERT INTO "Macro" (id, name, "createdAt", "updatedAt")
VALUES 
  ('mac_' || gen_random_uuid()::text, 'Income', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Housing', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Transportation', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Food', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Health', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Subscriptions', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Business', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Family', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Savings', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Investments', NOW(), NOW()),
  ('mac_' || gen_random_uuid()::text, 'Misc', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Agora vamos usar IDs fixos para facilitar as referências
-- Primeiro, limpar e inserir com IDs fixos (se já existirem, deletar)
DELETE FROM "Macro";
INSERT INTO "Macro" (id, name, "createdAt", "updatedAt")
VALUES 
  ('mac_income', 'Income', NOW(), NOW()),
  ('mac_housing', 'Housing', NOW(), NOW()),
  ('mac_transportation', 'Transportation', NOW(), NOW()),
  ('mac_food', 'Food', NOW(), NOW()),
  ('mac_health', 'Health', NOW(), NOW()),
  ('mac_subscriptions', 'Subscriptions', NOW(), NOW()),
  ('mac_business', 'Business', NOW(), NOW()),
  ('mac_family', 'Family', NOW(), NOW()),
  ('mac_savings', 'Savings', NOW(), NOW()),
  ('mac_investments', 'Investments', NOW(), NOW()),
  ('mac_misc', 'Misc', NOW(), NOW());

-- =====================================================
-- INSERIR CATEGORIES E SUBCATEGORIES
-- =====================================================

-- Housing Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_rent', 'Rent', 'mac_housing', NOW(), NOW()),
  ('cat_utilities', 'Utilities', 'mac_housing', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Housing Subcategories (Utilities)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_bc_hydro', 'BC Hydro', 'cat_utilities', NOW(), NOW()),
  ('sub_fortis_bc', 'Fortis BC', 'cat_utilities', NOW(), NOW()),
  ('sub_internet', 'Internet', 'cat_utilities', NOW(), NOW()),
  ('sub_maintenance', 'Maintenance', 'cat_utilities', NOW(), NOW()),
  ('sub_insurance', 'Insurance', 'cat_utilities', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Transportation Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_vehicle', 'Vehicle', 'mac_transportation', NOW(), NOW()),
  ('cat_transit', 'Public Transit', 'mac_transportation', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Transportation Subcategories (Vehicle)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_car_loan', 'Car Loan', 'cat_vehicle', NOW(), NOW()),
  ('sub_car_insurance', 'Car Insurance', 'cat_vehicle', NOW(), NOW()),
  ('sub_fuel', 'Fuel', 'cat_vehicle', NOW(), NOW()),
  ('sub_vehicle_maintenance', 'Maintenance', 'cat_vehicle', NOW(), NOW()),
  ('sub_parking', 'Parking', 'cat_vehicle', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Transportation Subcategories (Public Transit)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_transit_pass', 'Transit Pass', 'cat_transit', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Food Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_groceries', 'Groceries', 'mac_food', NOW(), NOW()),
  ('cat_restaurants', 'Restaurants', 'mac_food', NOW(), NOW()),
  ('cat_coffee', 'Coffee', 'mac_food', NOW(), NOW()),
  ('cat_pet_food', 'Pet Food', 'mac_food', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Food Subcategories (Pet Food)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_apollo', 'Apollo', 'cat_pet_food', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Health Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_therapy', 'Therapy', 'mac_health', NOW(), NOW()),
  ('cat_medication', 'Medication', 'mac_health', NOW(), NOW()),
  ('cat_gym', 'Gym', 'mac_health', NOW(), NOW()),
  ('cat_health_insurance', 'Insurance', 'mac_health', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Health Subcategories (Therapy)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_naor', 'Naor', 'cat_therapy', NOW(), NOW()),
  ('sub_natalia', 'Natalia', 'cat_therapy', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Health Subcategories (Medication)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_ozempic', 'Ozempic', 'cat_medication', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subscriptions Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_streaming', 'Streaming', 'mac_subscriptions', NOW(), NOW()),
  ('cat_software', 'Software', 'mac_subscriptions', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subscriptions Subcategories (Streaming)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_netflix', 'Netflix', 'cat_streaming', NOW(), NOW()),
  ('sub_disney', 'Disney+', 'cat_streaming', NOW(), NOW()),
  ('sub_youtube', 'YouTube', 'cat_streaming', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subscriptions Subcategories (Software)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_spotify', 'Spotify', 'cat_software', NOW(), NOW()),
  ('sub_adobe', 'Adobe', 'cat_software', NOW(), NOW()),
  ('sub_chatgpt', 'ChatGPT', 'cat_software', NOW(), NOW()),
  ('sub_cloud', 'Cloud', 'cat_software', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Business Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_office', 'Office', 'mac_business', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Business Subcategories (Office)
INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_office_rent', 'Office Rent (70%)', 'cat_office', NOW(), NOW()),
  ('sub_phone_internet', 'Phone & Internet', 'cat_office', NOW(), NOW()),
  ('sub_equipment', 'Equipment', 'cat_office', NOW(), NOW()),
  ('sub_hosting', 'Hosting', 'cat_office', NOW(), NOW()),
  ('sub_accounting', 'Accounting', 'cat_office', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Family Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_gifts', 'Gifts', 'mac_family', NOW(), NOW()),
  ('cat_child_baby', 'Child/Baby', 'mac_family', NOW(), NOW()),
  ('cat_education', 'Education', 'mac_family', NOW(), NOW()),
  ('cat_travel', 'Travel', 'mac_family', NOW(), NOW()),
  ('cat_donations', 'Donations', 'mac_family', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Savings Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_emergency_fund', 'Emergency Fund', 'mac_savings', NOW(), NOW()),
  ('cat_rrsp', 'RRSP', 'mac_savings', NOW(), NOW()),
  ('cat_fhsa', 'FHSA', 'mac_savings', NOW(), NOW()),
  ('cat_tfsa', 'TFSA', 'mac_savings', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Misc Categories
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_bank_fees', 'Bank Fees', 'mac_misc', NOW(), NOW()),
  ('cat_overdraft', 'Overdraft', 'mac_misc', NOW(), NOW()),
  ('cat_unexpected', 'Unexpected', 'mac_misc', NOW(), NOW()),
  ('cat_uncategorized', 'Uncategorized', 'mac_misc', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Income Category (Salary)
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_salary', 'Salary', 'mac_income', NOW(), NOW())
ON CONFLICT DO NOTHING;

