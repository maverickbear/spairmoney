# Relatório de Validação do Schema

**Data:** 2025-01-XX  
**Arquivo:** `supabase/schema_reference.sql`

## ✅ Pontos Positivos

1. **Constraints de Validação**: O schema possui constraints adequadas para garantir integridade dos dados:
   - Validação de valores positivos (Budget, Goal, Debt)
   - Validação de tipos de transação (InvestmentTransaction)
   - Validação de enums (status, tipos, etc.)

2. **RLS Policies**: Todas as tabelas têm RLS habilitado e políticas bem definidas

3. **Índices**: Boa cobertura de índices para otimização de queries

4. **Foreign Keys**: Relacionamentos bem definidos com cascatas apropriadas

## ⚠️ Problemas Identificados

### 1. **View Materializada `holdings_view` - Falta Filtro de Tipo de Conta**

**Localização:** Linha 1042-1102

**Problema:** A view `holdings_view` faz JOIN com a tabela `Account` mas não verifica se `Account.type = 'investment'`. Isso pode incluir transações de contas que não são de investimento.

**Impacto:** 
- Potencial inconsistência de dados se houver contas não-investimento com transações de investimento
- As RLS policies para `InvestmentTransaction` verificam `Account.type = 'investment'`, mas a view não

**Recomendação:**
```sql
-- Adicionar filtro na CTE transaction_agg
FROM ("public"."InvestmentTransaction" "it"
  JOIN "public"."Account" "a_1" ON (("a_1"."id" = "it"."accountId") AND ("a_1"."type" = 'investment'::"text")))
WHERE (("it"."securityId" IS NOT NULL) AND ("a_1"."userId" IS NOT NULL))
```

### 2. **Inconsistência no Índice de HouseholdMember**

**Localização:** Linha 1872

**Problema:** Existe um índice que filtra por `status = 'accepted'`, mas o status correto para membros ativos é `'active'` (conforme definido no código TypeScript).

**Impacto:** 
- O índice pode não ser usado eficientemente se o status usado for 'active' ao invés de 'accepted'

**Recomendação:**
```sql
-- Verificar se o status 'accepted' é realmente usado ou se deveria ser 'active'
-- Se for 'active', atualizar o índice:
CREATE INDEX "idx_householdmember_memberid_status" 
  ON "public"."HouseholdMember" USING "btree" ("memberId", "status") 
  WHERE ("status" = 'active'::"text");
```

### 3. **Falta de Constraint CHECK para Status de HouseholdMember**

**Localização:** Tabela HouseholdMember (linha 536)

**Problema:** Não há constraint CHECK para validar os valores de `status`. O código TypeScript define: `"pending" | "active" | "declined"`, mas o schema não valida isso.

**Impacto:**
- Valores inválidos podem ser inseridos no banco

**Recomendação:**
```sql
ALTER TABLE "public"."HouseholdMember"
  ADD CONSTRAINT "HouseholdMember_status_check" 
  CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'declined'::"text"])));
```

### 4. **Views Materializadas com WITH NO DATA**

**Localização:** Linhas 1102, 1144, 1167, 1197

**Problema:** Todas as views materializadas são criadas com `WITH NO DATA`, o que significa que precisam ser populadas manualmente após a criação.

**Impacto:**
- Views estarão vazias até serem populadas
- Requer execução manual de `REFRESH MATERIALIZED VIEW` após criação

**Recomendação:**
- Se isso é intencional (para performance em migrações), está OK
- Caso contrário, remover `WITH NO DATA` ou adicionar instruções claras de refresh

### 5. **Possível Problema com Account.type**

**Localização:** RLS Policies para InvestmentTransaction

**Problema:** As RLS policies verificam `Account.type = 'investment'`, mas não há constraint CHECK na tabela `Account` para validar os valores de `type`.

**Impacto:**
- Valores inválidos de `type` podem ser inseridos, causando problemas nas RLS policies

**Recomendação:**
```sql
-- Adicionar constraint se não existir
ALTER TABLE "public"."Account"
  ADD CONSTRAINT "Account_type_check" 
  CHECK (("type" = ANY (ARRAY['checking'::"text", 'savings'::"text", 'credit'::"text", 'investment'::"text", 'other'::"text"])));
```

## 📋 Verificações Adicionais Recomendadas

1. **Verificar se todas as foreign keys têm índices correspondentes**
   - ✅ A maioria parece ter índices

2. **Verificar se há constraints duplicadas**
   - ✅ Não encontradas duplicatas óbvias

3. **Verificar se os triggers estão corretos**
   - ✅ Triggers parecem estar corretos

4. **Verificar se as funções SECURITY DEFINER estão seguras**
   - ⚠️ Funções usam `SET search_path TO ''` ou `'public'` - verificar se está correto

## 🔍 Observações

1. **Backup Table**: Existe uma tabela de backup `InvestmentTransaction_backup_20251115` - considerar remover em produção após validação

2. **Comentários**: O schema tem bons comentários explicando o propósito de colunas e constraints

3. **Performance**: Boa cobertura de índices, incluindo índices parciais (WHERE clauses)

## ✅ Conclusão

O schema está **bem estruturado** na maioria dos aspectos, mas há algumas **melhorias recomendadas** principalmente relacionadas a:
- Validação de valores enum (status, type)
- Consistência entre views e RLS policies
- Índices otimizados para os valores reais usados

**Prioridade de Correção:**
1. **Alta**: Adicionar constraint CHECK para HouseholdMember.status
2. **Média**: Adicionar filtro de Account.type na holdings_view
3. **Média**: Verificar/corrigir índice de HouseholdMember.status
4. **Baixa**: Adicionar constraint CHECK para Account.type (se não existir)

## 📦 Arquivos de Migração Criados

Foram criados os seguintes arquivos SQL para aplicar as correções:

1. **`supabase/migrations/20250101_fix_schema_validation_issues.sql`**
   - Migração principal com todas as correções
   - Pode ser executada manualmente no banco de dados
   - Inclui verificações de segurança (verifica se constraints já existem)
   - Popula automaticamente as views materializadas após recriação

2. **`supabase/migrations/20250101_fix_schema_validation_issues_ROLLBACK.sql`**
   - Script de rollback para reverter as mudanças se necessário
   - ⚠️ Use com cautela

### Como Aplicar a Migração

```bash
# Opção 1: Via Supabase CLI
supabase db reset  # Se em desenvolvimento
# ou
supabase migration up

# Opção 2: Executar manualmente no banco
psql -h <host> -U <user> -d <database> -f supabase/migrations/20250101_fix_schema_validation_issues.sql
```

### Verificação Pós-Migração

Após executar a migração, verifique:

```sql
-- Verificar constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conname IN ('HouseholdMember_status_check', 'Account_type_check');

-- Verificar índice
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_householdmember_memberid_status';

-- Verificar views materializadas
SELECT matviewname 
FROM pg_matviews 
WHERE matviewname IN ('holdings_view', 'asset_allocation_view', 'portfolio_summary_view', 'sector_allocation_view');
```

