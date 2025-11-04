-- Adicionar campo creditLimit à tabela Account
-- Este campo armazena o limite de crédito para cartões de crédito

ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION;

