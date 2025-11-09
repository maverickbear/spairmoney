-- Add Plaid integration fields to Account table
ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS "plaidItemId" TEXT,
ADD COLUMN IF NOT EXISTS "plaidAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "isConnected" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "syncEnabled" BOOLEAN DEFAULT true;

-- Create PlaidConnection table to store access tokens
CREATE TABLE IF NOT EXISTS "PlaidConnection" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "itemId" TEXT NOT NULL UNIQUE,
    "accessToken" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT
);

-- Create TransactionSync table to track synced transactions
CREATE TABLE IF NOT EXISTS "TransactionSync" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
    "plaidTransactionId" TEXT NOT NULL UNIQUE,
    "transactionId" TEXT REFERENCES "Transaction"("id") ON DELETE SET NULL,
    "syncDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "status" TEXT DEFAULT 'synced' -- 'synced', 'pending', 'error'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "PlaidConnection_userId_idx" ON "PlaidConnection"("userId");
CREATE INDEX IF NOT EXISTS "PlaidConnection_itemId_idx" ON "PlaidConnection"("itemId");
CREATE INDEX IF NOT EXISTS "Account_plaidItemId_idx" ON "Account"("plaidItemId");
CREATE INDEX IF NOT EXISTS "Account_isConnected_idx" ON "Account"("isConnected");
CREATE INDEX IF NOT EXISTS "TransactionSync_accountId_idx" ON "TransactionSync"("accountId");
CREATE INDEX IF NOT EXISTS "TransactionSync_plaidTransactionId_idx" ON "TransactionSync"("plaidTransactionId");

-- Update plans to include hasBankIntegration feature
UPDATE "Plan" 
SET "features" = jsonb_set(
    "features"::jsonb,
    '{hasBankIntegration}',
    'false'::jsonb
)
WHERE "id" = 'free';

UPDATE "Plan" 
SET "features" = jsonb_set(
    "features"::jsonb,
    '{hasBankIntegration}',
    'true'::jsonb
)
WHERE "id" IN ('basic', 'premium');

-- Add RLS policies for PlaidConnection
ALTER TABLE "PlaidConnection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Plaid connections"
    ON "PlaidConnection" FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own Plaid connections"
    ON "PlaidConnection" FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own Plaid connections"
    ON "PlaidConnection" FOR UPDATE
    USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own Plaid connections"
    ON "PlaidConnection" FOR DELETE
    USING (auth.uid() = "userId");

-- Add RLS policies for TransactionSync
ALTER TABLE "TransactionSync" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view TransactionSync for their accounts"
    ON "TransactionSync" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "TransactionSync"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert TransactionSync for their accounts"
    ON "TransactionSync" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "TransactionSync"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update TransactionSync for their accounts"
    ON "TransactionSync" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "TransactionSync"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete TransactionSync for their accounts"
    ON "TransactionSync" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "TransactionSync"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

