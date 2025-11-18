# Melhorias Recomendadas para o Schema

## 📋 Resumo Executivo

Este documento lista melhorias recomendadas para o schema PostgreSQL, priorizadas por criticidade e impacto.

---

## 🔴 Críticas (Alta Prioridade)

### 1. Índice Faltando para Query Mais Comum

**Problema:** A query mais comum (`SELECT * FROM Transaction WHERE userId = ? AND date BETWEEN ? AND ?`) não tem índice otimizado.

**Status Atual:**
- ✅ Existe: `idx_transaction_user_updated` em `(userId, updatedAt, createdAt)`
- ❌ Falta: Índice em `(userId, date)` para queries por período

**Solução:**
```sql
-- Migration: Adicionar índice para queries por data
CREATE INDEX IF NOT EXISTS "idx_transaction_user_date" 
ON "public"."Transaction" USING btree ("userId", "date" DESC);

-- Índice composto para queries com filtros adicionais
CREATE INDEX IF NOT EXISTS "idx_transaction_user_date_type" 
ON "public"."Transaction" USING btree ("userId", "date" DESC, "type") 
WHERE "date" IS NOT NULL;
```

**Impacto:** Melhora significativa na performance de relatórios e dashboards.

---

### 2. Validação de Datas

**Problema:** Não há constraints impedindo datas inválidas (futuras irrealistas, muito antigas).

**Solução:**
```sql
-- Adicionar constraint de validação de data
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "transaction_date_valid" 
CHECK ("date" >= '1900-01-01'::date AND "date" <= (CURRENT_DATE + INTERVAL '1 year'));

ALTER TABLE "public"."PlannedPayment" 
ADD CONSTRAINT "planned_payment_date_valid" 
CHECK ("date" >= '1900-01-01'::date AND "date" <= (CURRENT_DATE + INTERVAL '5 years'));

ALTER TABLE "public"."Debt" 
ADD CONSTRAINT "debt_first_payment_date_valid" 
CHECK ("firstPaymentDate" >= '1900-01-01'::date AND "firstPaymentDate" <= (CURRENT_DATE + INTERVAL '50 years'));
```

**Impacto:** Previne dados inválidos e bugs na aplicação.

---

### 3. Remover Tabela Não Utilizada: BudgetSubcategory

**Status:** Tabela não é mais utilizada (subcategoryId agora está diretamente em Budget).

**Solução:**
```sql
-- 1. Verificar dados legados
SELECT COUNT(*) FROM "BudgetSubcategory";

-- 2. Se houver dados, migrar se necessário (provavelmente não há necessidade)
-- 3. Remover foreign keys, índices e políticas
DROP POLICY IF EXISTS "Users can delete own budget subcategories" ON "public"."BudgetSubcategory";
DROP POLICY IF EXISTS "Users can insert own budget subcategories" ON "public"."BudgetSubcategory";
DROP POLICY IF EXISTS "Users can update own budget subcategories" ON "public"."BudgetSubcategory";
DROP POLICY IF EXISTS "Users can view own budget subcategories" ON "public"."BudgetSubcategory";

DROP INDEX IF EXISTS "BudgetSubcategory_budgetId_idx";
DROP INDEX IF EXISTS "BudgetSubcategory_budgetId_subcategoryId_key";
DROP INDEX IF EXISTS "BudgetSubcategory_subcategoryId_idx";

ALTER TABLE "public"."BudgetSubcategory" DROP CONSTRAINT IF EXISTS "BudgetSubcategory_budgetId_fkey";
ALTER TABLE "public"."BudgetSubcategory" DROP CONSTRAINT IF EXISTS "BudgetSubcategory_subcategoryId_fkey";
ALTER TABLE "public"."BudgetSubcategory" DROP CONSTRAINT IF EXISTS "BudgetSubcategory_pkey";

-- 4. Remover tabela
DROP TABLE IF EXISTS "public"."BudgetSubcategory";

-- 5. Remover GRANTs
REVOKE ALL ON TABLE "public"."BudgetSubcategory" FROM "anon", "authenticated", "service_role";
```

**Impacto:** Limpeza do schema, reduz complexidade.

---

## 🟡 Importantes (Média Prioridade)

### 4. Validação de Valores Positivos

**Problema:** Algumas tabelas não validam valores positivos onde necessário.

**Solução:**
```sql
-- Transaction: amount_numeric deve ser positivo
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "transaction_amount_positive" 
CHECK ("amount_numeric" > 0);

-- AccountInvestmentValue: totalValue deve ser não-negativo
ALTER TABLE "public"."AccountInvestmentValue" 
ADD CONSTRAINT "account_investment_value_non_negative" 
CHECK ("totalValue" >= 0);

-- SimpleInvestmentEntry: amount deve ser positivo
ALTER TABLE "public"."SimpleInvestmentEntry" 
ADD CONSTRAINT "simple_investment_entry_amount_positive" 
CHECK ("amount" > 0);
```

**Nota:** Verificar se há dados existentes que violariam essas constraints antes de aplicar.

---

### 5. Índice para Busca de Descrição

**Status Atual:** 
- ✅ Existe: `transaction_description_search_trgm_idx` (GIN com trigram)
- ⚠️ Pode ser otimizado para queries específicas

**Melhoria Opcional:**
```sql
-- Índice adicional para busca exata (se necessário)
CREATE INDEX IF NOT EXISTS "idx_transaction_description_exact" 
ON "public"."Transaction" USING btree ("description_search") 
WHERE "description_search" IS NOT NULL;
```

**Impacto:** Melhora performance de buscas, mas o índice atual já é bom.

---

### 6. Validação de Relacionamentos em Transfers

**Problema:** Transferências criam 2 transações, mas não há constraint garantindo que ambas existam.

**Solução:**
```sql
-- Adicionar constraint para garantir integridade de transfers
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "transfer_pairs_valid" 
CHECK (
  ("transferToId" IS NULL AND "transferFromId" IS NULL) OR
  ("transferToId" IS NOT NULL AND "transferFromId" IS NULL AND "type" = 'expense') OR
  ("transferFromId" IS NOT NULL AND "transferToId" IS NULL AND "type" = 'income')
);
```

**Nota:** Isso pode ser complexo de implementar devido à natureza das transações. Avaliar se é necessário.

---

## 🟢 Melhorias (Baixa Prioridade)

### 7. ENUMs vs TEXT com CHECK

**Status Atual:** Uso de TEXT com CHECK constraints (ex: `"type" TEXT CHECK (type IN (...))`)

**Análise:**
- ✅ **Vantagem atual:** Flexibilidade para adicionar novos valores sem ALTER TYPE
- ❌ **Vantagem ENUM:** Type safety no PostgreSQL, melhor performance

**Recomendação:** Manter TEXT com CHECK, pois:
1. Supabase/PostgREST funciona melhor com TEXT
2. Flexibilidade é importante para evolução do sistema
3. Performance difference é mínima

**Se quiser migrar (não recomendado):**
```sql
-- Exemplo (NÃO RECOMENDADO)
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE transaction_type USING "type"::transaction_type;
```

---

### 8. Soft Deletes

**Status:** Não implementado (usa DELETE direto)

**Análise:**
- ✅ **Vantagem:** Recuperação de dados, auditoria
- ❌ **Desvantagem:** Complexidade adicional, queries mais lentas

**Recomendação:** Implementar apenas para tabelas críticas (Transaction, Account) se necessário para compliance.

**Se implementar:**
```sql
-- Adicionar coluna deletedAt
ALTER TABLE "public"."Transaction" 
ADD COLUMN IF NOT EXISTS "deletedAt" timestamp(3) without time zone;

-- Atualizar políticas RLS
-- (adicionar AND "deletedAt" IS NULL em todas as políticas SELECT)

-- Criar função para soft delete
CREATE OR REPLACE FUNCTION "soft_delete_transaction"(p_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Transaction" 
  SET "deletedAt" = CURRENT_TIMESTAMP 
  WHERE "id" = p_id AND "userId" = auth.uid();
END;
$$;
```

---

### 9. Tabela de Auditoria

**Status:** Não implementado

**Recomendação:** Implementar apenas se necessário para compliance/regulamentação.

**Se implementar:**
```sql
CREATE TABLE IF NOT EXISTS "public"."audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_name" text NOT NULL,
  "record_id" text NOT NULL,
  "action" text NOT NULL CHECK ("action" IN ('INSERT', 'UPDATE', 'DELETE')),
  "old_data" jsonb,
  "new_data" jsonb,
  "user_id" uuid REFERENCES "auth"."users"("id"),
  "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "idx_audit_log_table_record" ON "public"."audit_log"("table_name", "record_id");
CREATE INDEX "idx_audit_log_user_timestamp" ON "public"."audit_log"("user_id", "timestamp" DESC);

-- Trigger function (exemplo para Transaction)
CREATE OR REPLACE FUNCTION "audit_transaction_changes"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO "audit_log" ("table_name", "record_id", "action", "old_data", "user_id")
    VALUES ('Transaction', OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO "audit_log" ("table_name", "record_id", "action", "old_data", "new_data", "user_id")
    VALUES ('Transaction', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO "audit_log" ("table_name", "record_id", "action", "new_data", "user_id")
    VALUES ('Transaction', NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER "trigger_audit_transaction"
AFTER INSERT OR UPDATE OR DELETE ON "public"."Transaction"
FOR EACH ROW EXECUTE FUNCTION "audit_transaction_changes"();
```

**Impacto:** Alto overhead de performance, usar apenas se necessário.

---

### 10. View Materializada para Relatórios Mensais

**Status:** Não implementado

**Recomendação:** Implementar se relatórios mensais forem lentos.

**Se implementar:**
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."monthly_summary" AS
SELECT 
  "userId",
  DATE_TRUNC('month', "date")::date as "month",
  COUNT(*) FILTER (WHERE "type" = 'income') as "income_count",
  COUNT(*) FILTER (WHERE "type" = 'expense') as "expense_count",
  SUM("amount_numeric") FILTER (WHERE "type" = 'income') as "total_income",
  SUM("amount_numeric") FILTER (WHERE "type" = 'expense') as "total_expenses",
  SUM("amount_numeric") FILTER (WHERE "type" = 'income') - 
  SUM("amount_numeric") FILTER (WHERE "type" = 'expense') as "net_flow"
FROM "public"."Transaction"
WHERE "transferFromId" IS NULL AND "transferToId" IS NULL
GROUP BY "userId", DATE_TRUNC('month', "date");

CREATE UNIQUE INDEX "idx_monthly_summary_user_month" 
ON "public"."monthly_summary"("userId", "month");

-- Refresh via trigger ou cron job
-- REFRESH MATERIALIZED VIEW CONCURRENTLY "monthly_summary";
```

---

## 📝 Notas Importantes

### Sobre GRANT ALL no Supabase

**⚠️ IMPORTANTE:** O uso de `GRANT ALL` no Supabase é **correto e necessário**:

1. **RLS é a camada de segurança real:** As políticas RLS (Row Level Security) controlam o acesso aos dados, não as permissões GRANT
2. **GRANT é necessário para RLS funcionar:** Sem GRANT, o PostgreSQL nem verifica as políticas RLS
3. **Padrão do Supabase:** É o padrão recomendado pelo Supabase para aplicações com RLS

**Não altere os GRANTs** - eles estão corretos para o modelo de segurança do Supabase.

---

### Sobre Criptografia Dual (amount + amount_numeric)

**Status:** Implementação atual está correta para o caso de uso:
- `amount` (TEXT criptografado) - segurança
- `amount_numeric` (NUMERIC) - performance em queries e cálculos

**Recomendação:** Manter como está, pois:
1. Segurança dos dados sensíveis
2. Performance em relatórios e cálculos
3. Sincronização é gerenciada pela aplicação (pode adicionar trigger se necessário)

---

## 🎯 Priorização de Implementação

### Fase 1 (Imediato)
1. ✅ Adicionar índice `idx_transaction_user_date`
2. ✅ Adicionar validação de datas
3. ✅ Remover tabela `BudgetSubcategory`

### Fase 2 (Próximo Sprint)
4. ✅ Adicionar validação de valores positivos
5. ✅ Melhorar índices de busca (se necessário)

### Fase 3 (Futuro)
6. ⚠️ Soft deletes (apenas se necessário)
7. ⚠️ Auditoria (apenas se necessário para compliance)
8. ⚠️ View materializada (apenas se performance for problema)

---

## 📅 Data da Análise

Análise realizada em: 2025-01-XX
Schema analisado: `supabase/schema_reference.sql`
Contexto: Supabase com Row Level Security (RLS)

