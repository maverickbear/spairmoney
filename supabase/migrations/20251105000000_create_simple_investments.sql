-- Create SimpleInvestmentEntry table
CREATE TABLE IF NOT EXISTS "SimpleInvestmentEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL, -- "contribution" | "dividend" | "interest"
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SimpleInvestmentEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SimpleInvestmentEntry_accountId_idx" ON "SimpleInvestmentEntry"("accountId");
CREATE INDEX IF NOT EXISTS "SimpleInvestmentEntry_date_idx" ON "SimpleInvestmentEntry"("date");
CREATE INDEX IF NOT EXISTS "SimpleInvestmentEntry_type_idx" ON "SimpleInvestmentEntry"("type");
ALTER TABLE "SimpleInvestmentEntry" ADD CONSTRAINT "SimpleInvestmentEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AccountInvestmentValue table
CREATE TABLE IF NOT EXISTS "AccountInvestmentValue" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL UNIQUE,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountInvestmentValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountInvestmentValue_accountId_key" ON "AccountInvestmentValue"("accountId");
CREATE INDEX IF NOT EXISTS "AccountInvestmentValue_accountId_idx" ON "AccountInvestmentValue"("accountId");
ALTER TABLE "AccountInvestmentValue" ADD CONSTRAINT "AccountInvestmentValue_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant permissions
GRANT ALL ON TABLE "SimpleInvestmentEntry" TO "anon";
GRANT ALL ON TABLE "SimpleInvestmentEntry" TO "authenticated";
GRANT ALL ON TABLE "SimpleInvestmentEntry" TO "service_role";

GRANT ALL ON TABLE "AccountInvestmentValue" TO "anon";
GRANT ALL ON TABLE "AccountInvestmentValue" TO "authenticated";
GRANT ALL ON TABLE "AccountInvestmentValue" TO "service_role";

