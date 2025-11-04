-- Adicionar campo recurring à tabela Transaction
-- Este campo indica se a transação é recorrente (ocorre todos os meses)

ALTER TABLE "Transaction" 
ADD COLUMN IF NOT EXISTS "recurring" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Transaction_recurring_idx" ON "Transaction"("recurring");

