-- Migration SQL Completa para Supabase PostgreSQL
-- Este arquivo contém TUDO: criação de tabelas + dados iniciais
-- Execute este script no SQL Editor do Supabase (Settings > Database > SQL Editor)

-- =====================================================
-- PARTE 1: CRIAR TABELAS
-- =====================================================

-- Tabela: Account
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Account_type_idx" ON "Account"("type");

-- Tabela: Macro
CREATE TABLE IF NOT EXISTS "Macro" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Macro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Macro_name_key" ON "Macro"("name");
CREATE INDEX IF NOT EXISTS "Macro_name_idx" ON "Macro"("name");

-- Tabela: Category
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "macroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Category_macroId_idx" ON "Category"("macroId");
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");
ALTER TABLE "Category" ADD CONSTRAINT "Category_macroId_fkey" FOREIGN KEY ("macroId") REFERENCES "Macro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela: Subcategory
CREATE TABLE IF NOT EXISTS "Subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");
CREATE INDEX IF NOT EXISTS "Subcategory_name_idx" ON "Subcategory"("name");
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela: Transaction
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "description" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "transferToId" TEXT,
    "transferFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX IF NOT EXISTS "Transaction_categoryId_date_idx" ON "Transaction"("categoryId", "date");
CREATE INDEX IF NOT EXISTS "Transaction_accountId_idx" ON "Transaction"("accountId");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_date_type_idx" ON "Transaction"("date", "type");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabela: Budget
CREATE TABLE IF NOT EXISTS "Budget" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Budget_period_categoryId_key" ON "Budget"("period", "categoryId");
CREATE INDEX IF NOT EXISTS "Budget_period_idx" ON "Budget"("period");
CREATE INDEX IF NOT EXISTS "Budget_categoryId_period_idx" ON "Budget"("categoryId", "period");
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela: InvestmentAccount
CREATE TABLE IF NOT EXISTS "InvestmentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvestmentAccount_type_idx" ON "InvestmentAccount"("type");
ALTER TABLE "InvestmentAccount" ADD CONSTRAINT "InvestmentAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabela: Security
CREATE TABLE IF NOT EXISTS "Security" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Security_symbol_key" ON "Security"("symbol");
CREATE INDEX IF NOT EXISTS "Security_symbol_idx" ON "Security"("symbol");
CREATE INDEX IF NOT EXISTS "Security_class_idx" ON "Security"("class");

-- Tabela: InvestmentTransaction
CREATE TABLE IF NOT EXISTS "InvestmentTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,
    "securityId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "transferToId" TEXT,
    "transferFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvestmentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvestmentTransaction_date_idx" ON "InvestmentTransaction"("date");
CREATE INDEX IF NOT EXISTS "InvestmentTransaction_accountId_idx" ON "InvestmentTransaction"("accountId");
CREATE INDEX IF NOT EXISTS "InvestmentTransaction_securityId_idx" ON "InvestmentTransaction"("securityId");
CREATE INDEX IF NOT EXISTS "InvestmentTransaction_type_idx" ON "InvestmentTransaction"("type");
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabela: SecurityPrice
CREATE TABLE IF NOT EXISTS "SecurityPrice" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SecurityPrice_securityId_date_key" ON "SecurityPrice"("securityId", "date");
CREATE INDEX IF NOT EXISTS "SecurityPrice_securityId_date_idx" ON "SecurityPrice"("securityId", "date");
ALTER TABLE "SecurityPrice" ADD CONSTRAINT "SecurityPrice_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- PARTE 2: INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir Macros
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
  ('mac_misc', 'Misc', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Inserir Categories e Subcategories

-- Housing
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_rent', 'Rent', 'mac_housing', NOW(), NOW()),
  ('cat_utilities', 'Utilities', 'mac_housing', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_bc_hydro', 'BC Hydro', 'cat_utilities', NOW(), NOW()),
  ('sub_fortis_bc', 'Fortis BC', 'cat_utilities', NOW(), NOW()),
  ('sub_internet', 'Internet', 'cat_utilities', NOW(), NOW()),
  ('sub_maintenance', 'Maintenance', 'cat_utilities', NOW(), NOW()),
  ('sub_insurance', 'Insurance', 'cat_utilities', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Transportation
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_vehicle', 'Vehicle', 'mac_transportation', NOW(), NOW()),
  ('cat_transit', 'Public Transit', 'mac_transportation', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_car_loan', 'Car Loan', 'cat_vehicle', NOW(), NOW()),
  ('sub_car_insurance', 'Car Insurance', 'cat_vehicle', NOW(), NOW()),
  ('sub_fuel', 'Fuel', 'cat_vehicle', NOW(), NOW()),
  ('sub_vehicle_maintenance', 'Maintenance', 'cat_vehicle', NOW(), NOW()),
  ('sub_parking', 'Parking', 'cat_vehicle', NOW(), NOW()),
  ('sub_transit_pass', 'Transit Pass', 'cat_transit', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Food
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_groceries', 'Groceries', 'mac_food', NOW(), NOW()),
  ('cat_restaurants', 'Restaurants', 'mac_food', NOW(), NOW()),
  ('cat_coffee', 'Coffee', 'mac_food', NOW(), NOW()),
  ('cat_pet_food', 'Pet Food', 'mac_food', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_apollo', 'Apollo', 'cat_pet_food', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Health
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_therapy', 'Therapy', 'mac_health', NOW(), NOW()),
  ('cat_medication', 'Medication', 'mac_health', NOW(), NOW()),
  ('cat_gym', 'Gym', 'mac_health', NOW(), NOW()),
  ('cat_health_insurance', 'Insurance', 'mac_health', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_naor', 'Naor', 'cat_therapy', NOW(), NOW()),
  ('sub_natalia', 'Natalia', 'cat_therapy', NOW(), NOW()),
  ('sub_ozempic', 'Ozempic', 'cat_medication', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subscriptions
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_streaming', 'Streaming', 'mac_subscriptions', NOW(), NOW()),
  ('cat_software', 'Software', 'mac_subscriptions', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_netflix', 'Netflix', 'cat_streaming', NOW(), NOW()),
  ('sub_disney', 'Disney+', 'cat_streaming', NOW(), NOW()),
  ('sub_youtube', 'YouTube', 'cat_streaming', NOW(), NOW()),
  ('sub_spotify', 'Spotify', 'cat_software', NOW(), NOW()),
  ('sub_adobe', 'Adobe', 'cat_software', NOW(), NOW()),
  ('sub_chatgpt', 'ChatGPT', 'cat_software', NOW(), NOW()),
  ('sub_cloud', 'Cloud', 'cat_software', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Business
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_office', 'Office', 'mac_business', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Subcategory" (id, name, "categoryId", "createdAt", "updatedAt")
VALUES 
  ('sub_office_rent', 'Office Rent (70%)', 'cat_office', NOW(), NOW()),
  ('sub_phone_internet', 'Phone & Internet', 'cat_office', NOW(), NOW()),
  ('sub_equipment', 'Equipment', 'cat_office', NOW(), NOW()),
  ('sub_hosting', 'Hosting', 'cat_office', NOW(), NOW()),
  ('sub_accounting', 'Accounting', 'cat_office', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Family
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_gifts', 'Gifts', 'mac_family', NOW(), NOW()),
  ('cat_child_baby', 'Child/Baby', 'mac_family', NOW(), NOW()),
  ('cat_education', 'Education', 'mac_family', NOW(), NOW()),
  ('cat_travel', 'Travel', 'mac_family', NOW(), NOW()),
  ('cat_donations', 'Donations', 'mac_family', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Savings
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_emergency_fund', 'Emergency Fund', 'mac_savings', NOW(), NOW()),
  ('cat_rrsp', 'RRSP', 'mac_savings', NOW(), NOW()),
  ('cat_fhsa', 'FHSA', 'mac_savings', NOW(), NOW()),
  ('cat_tfsa', 'TFSA', 'mac_savings', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Misc
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_bank_fees', 'Bank Fees', 'mac_misc', NOW(), NOW()),
  ('cat_overdraft', 'Overdraft', 'mac_misc', NOW(), NOW()),
  ('cat_unexpected', 'Unexpected', 'mac_misc', NOW(), NOW()),
  ('cat_uncategorized', 'Uncategorized', 'mac_misc', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Income
INSERT INTO "Category" (id, name, "macroId", "createdAt", "updatedAt")
VALUES 
  ('cat_salary', 'Salary', 'mac_income', NOW(), NOW())
ON CONFLICT DO NOTHING;

