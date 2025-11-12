-- Script para atualizar InvestmentAccount sem userId
-- Execute este script no Supabase SQL Editor
-- 
-- ATENÇÃO: Este script atribui contas sem userId ao primeiro usuário encontrado
-- Se você tiver múltiplos usuários, ajuste o WHERE clause para especificar o usuário correto

-- Opção 1: Atribuir ao primeiro usuário (use com cuidado se houver múltiplos usuários)
UPDATE "InvestmentAccount"
SET "userId" = (SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1)
WHERE "userId" IS NULL;

-- Opção 2: Atribuir a um usuário específico por email (descomente e ajuste o email)
-- UPDATE "InvestmentAccount"
-- SET "userId" = (SELECT id FROM "User" WHERE email = 'seu-email@exemplo.com')
-- WHERE "userId" IS NULL;

-- Verificar o resultado
SELECT 
  id,
  name,
  type,
  "userId",
  (SELECT email FROM "User" WHERE id = "InvestmentAccount"."userId") as user_email
FROM "InvestmentAccount";

