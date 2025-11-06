-- Create Debt table
CREATE TABLE IF NOT EXISTS "Debt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "totalMonths" INTEGER NOT NULL,
    "firstPaymentDate" TIMESTAMP(3) NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "principalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalContributions" BOOLEAN NOT NULL DEFAULT false,
    "additionalContributionAmount" DOUBLE PRECISION DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "description" TEXT,
    "isPaidOff" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "paidOffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Debt_loanType_idx" ON "Debt"("loanType");
CREATE INDEX IF NOT EXISTS "Debt_isPaidOff_idx" ON "Debt"("isPaidOff");
CREATE INDEX IF NOT EXISTS "Debt_isPaused_idx" ON "Debt"("isPaused");
CREATE INDEX IF NOT EXISTS "Debt_priority_idx" ON "Debt"("priority");
CREATE INDEX IF NOT EXISTS "Debt_firstPaymentDate_idx" ON "Debt"("firstPaymentDate");

-- Add check constraints
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_loanType_check" 
    CHECK ("loanType" IN ('mortgage', 'car_loan', 'personal_loan', 'credit_card', 'student_loan', 'business_loan', 'other'));

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_priority_check" 
    CHECK ("priority" IN ('High', 'Medium', 'Low'));

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_initialAmount_check" 
    CHECK ("initialAmount" > 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_downPayment_check" 
    CHECK ("downPayment" >= 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_currentBalance_check" 
    CHECK ("currentBalance" >= 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_interestRate_check" 
    CHECK ("interestRate" >= 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_totalMonths_check" 
    CHECK ("totalMonths" > 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_monthlyPayment_check" 
    CHECK ("monthlyPayment" > 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_principalPaid_check" 
    CHECK ("principalPaid" >= 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_interestPaid_check" 
    CHECK ("interestPaid" >= 0);

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_additionalContributionAmount_check" 
    CHECK ("additionalContributionAmount" >= 0);

-- Grant permissions
GRANT ALL ON TABLE "Debt" TO "anon";
GRANT ALL ON TABLE "Debt" TO "authenticated";
GRANT ALL ON TABLE "Debt" TO "service_role";

