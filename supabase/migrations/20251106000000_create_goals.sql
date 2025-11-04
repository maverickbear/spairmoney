-- Create Goal table
CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "incomePercentage" DOUBLE PRECISION NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isTransferred" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Goal_accountId_idx" ON "Goal"("accountId");
CREATE INDEX IF NOT EXISTS "Goal_isCompleted_idx" ON "Goal"("isCompleted");
CREATE INDEX IF NOT EXISTS "Goal_isTransferred_idx" ON "Goal"("isTransferred");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_accountId_fkey" 
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant permissions
GRANT ALL ON TABLE "Goal" TO "anon";
GRANT ALL ON TABLE "Goal" TO "authenticated";
GRANT ALL ON TABLE "Goal" TO "service_role";

