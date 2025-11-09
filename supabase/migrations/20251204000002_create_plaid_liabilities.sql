-- Create PlaidLiability table to store liability information from Plaid
CREATE TABLE IF NOT EXISTS "PlaidLiability" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
    "liabilityType" TEXT NOT NULL, -- 'credit_card', 'student_loan', 'mortgage', 'auto_loan', 'personal_loan', etc.
    "apr" DOUBLE PRECISION, -- Annual Percentage Rate
    "interestRate" DOUBLE PRECISION, -- Interest rate
    "minimumPayment" DOUBLE PRECISION, -- Minimum payment amount
    "lastPaymentAmount" DOUBLE PRECISION, -- Last payment amount
    "lastPaymentDate" TIMESTAMP(3), -- Last payment date
    "nextPaymentDueDate" TIMESTAMP(3), -- Next payment due date
    "lastStatementBalance" DOUBLE PRECISION, -- Last statement balance
    "lastStatementDate" TIMESTAMP(3), -- Last statement date
    "creditLimit" DOUBLE PRECISION, -- Credit limit (for credit cards)
    "currentBalance" DOUBLE PRECISION, -- Current balance
    "availableCredit" DOUBLE PRECISION, -- Available credit (for credit cards)
    "plaidAccountId" TEXT, -- Plaid account ID
    "plaidItemId" TEXT, -- Plaid item ID
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlaidLiability_liabilityType_check" 
        CHECK ("liabilityType" IN ('credit_card', 'student_loan', 'mortgage', 'auto_loan', 'personal_loan', 'business_loan', 'other'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "PlaidLiability_accountId_idx" ON "PlaidLiability"("accountId");
CREATE INDEX IF NOT EXISTS "PlaidLiability_liabilityType_idx" ON "PlaidLiability"("liabilityType");
CREATE INDEX IF NOT EXISTS "PlaidLiability_plaidAccountId_idx" ON "PlaidLiability"("plaidAccountId");
CREATE INDEX IF NOT EXISTS "PlaidLiability_plaidItemId_idx" ON "PlaidLiability"("plaidItemId");
CREATE INDEX IF NOT EXISTS "PlaidLiability_nextPaymentDueDate_idx" ON "PlaidLiability"("nextPaymentDueDate");

-- Enable RLS
ALTER TABLE "PlaidLiability" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PlaidLiability
CREATE POLICY "Users can view their own Plaid liabilities"
    ON "PlaidLiability" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "PlaidLiability"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own Plaid liabilities"
    ON "PlaidLiability" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "PlaidLiability"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update their own Plaid liabilities"
    ON "PlaidLiability" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "PlaidLiability"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own Plaid liabilities"
    ON "PlaidLiability" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "Account"
            WHERE "Account"."id" = "PlaidLiability"."accountId"
            AND "Account"."userId" = auth.uid()
        )
    );

