# Row Level Security (RLS) - Documentação Completa

## 📋 Visão Geral

Este documento descreve a implementação de **Row Level Security (RLS)** no Supabase para garantir isolamento de dados entre usuários e seguir as melhores práticas de segurança.

## 🎯 Objetivo

O RLS garante que:
- ✅ Cada usuário só pode acessar seus próprios dados
- ✅ Dados de diferentes usuários são completamente isolados
- ✅ A segurança é aplicada no nível do banco de dados, não apenas na aplicação
- ✅ Proteção contra acesso não autorizado mesmo se houver falha na aplicação

## 📊 Arquitetura de Multi-Tenancy

### Estrutura de Relacionamentos

```
User (auth.users)
  ├── Account (userId)
  │   ├── Transaction (via accountId)
  │   ├── Debt (via accountId)
  │   ├── AccountInvestmentValue (via accountId)
  │   └── SimpleInvestmentEntry (via accountId)
  │
  ├── Budget (userId)
  │   └── BudgetCategory (via budgetId)
  │
  ├── Category (userId)
  │   └── Subcategory (via categoryId)
  │
  ├── Macro (userId)
  │
  ├── Goal (userId)
  │
  ├── InvestmentAccount (userId)
  │   └── InvestmentTransaction (via accountId)
  │
  └── Subscription (userId)
```

### Tabelas com userId Direto

As seguintes tabelas têm coluna `userId` diretamente:

- `Account`
- `Budget`
- `Category`
- `Macro`
- `Goal`
- `Debt`
- `InvestmentAccount`
- `Subscription`

### Tabelas com Relacionamento Indireto

As seguintes tabelas acessam o userId através de relacionamentos:

- `Transaction` → via `Account.userId`
- `BudgetCategory` → via `Budget.userId`
- `Subcategory` → via `Category.userId`
- `InvestmentTransaction` → via `InvestmentAccount.userId`
- `AccountInvestmentValue` → via `Account.userId`
- `SimpleInvestmentEntry` → via `Account.userId`

### Tabelas Globais (Públicas)

As seguintes tabelas são compartilhadas entre todos os usuários:

- `Security` - Dados de mercado (símbolos, nomes, classes)
- `SecurityPrice` - Preços históricos de mercado
- `Plan` - Planos de assinatura (preços públicos)

### Tabelas com Dados Padrão do Sistema

As seguintes tabelas têm dados padrão do sistema (userId = NULL) compartilhados por todos os usuários, além de dados personalizados (userId = user_id) para usuários com planos pagos:

- `Macro` - Grupos padrão do sistema (Income, Housing, Transportation, etc.)
- `Category` - Categorias padrão do sistema associadas aos grupos
- `Subcategory` - Subcategorias padrão do sistema associadas às categorias

**Nota**: Usuários com planos gratuitos podem apenas visualizar e usar os dados padrão. Apenas usuários com planos pagos podem criar, editar ou deletar seus próprios macros, categorias e subcategorias personalizadas.

## 🔒 Políticas RLS Implementadas

### 1. Account (Contas)

**Políticas:**
- ✅ **SELECT**: Usuários só veem suas próprias contas
- ✅ **INSERT**: Usuários só podem criar contas para si
- ✅ **UPDATE**: Usuários só podem atualizar suas próprias contas
- ✅ **DELETE**: Usuários só podem deletar suas próprias contas

**SQL:**
```sql
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (auth.uid() = "userId");
```

### 2. Transaction (Transações)

**Políticas:**
- ✅ **SELECT**: Usuários só veem transações de suas próprias contas
- ✅ **INSERT**: Usuários só podem criar transações em suas contas
- ✅ **UPDATE**: Usuários só podem atualizar transações de suas contas
- ✅ **DELETE**: Usuários só podem deletar transações de suas contas

**SQL:**
```sql
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Account" 
      WHERE "Account"."id" = "Transaction"."accountId" 
      AND "Account"."userId" = auth.uid()
    )
  );
```

### 3. Budget (Orçamentos)

**Políticas:**
- ✅ **SELECT**: Usuários só veem seus próprios orçamentos
- ✅ **INSERT**: Usuários só podem criar orçamentos para si
- ✅ **UPDATE**: Usuários só podem atualizar seus próprios orçamentos
- ✅ **DELETE**: Usuários só podem deletar seus próprios orçamentos

### 4. Category (Categorias)

**Nota**: Categorias agora têm dados padrão do sistema (userId = NULL) compartilhados por todos os usuários, além de categorias personalizadas (userId = user_id) apenas para usuários com planos pagos.

**Políticas:**
- ✅ **SELECT**: Usuários veem categorias padrão do sistema (userId IS NULL) OU suas próprias categorias (userId = auth.uid())
- ✅ **INSERT**: Usuários só podem criar categorias personalizadas (requer plano pago). Dados padrão são criados via migration.
- ✅ **UPDATE**: Usuários só podem atualizar suas próprias categorias (não podem editar categorias padrão do sistema)
- ✅ **DELETE**: Usuários só podem deletar suas próprias categorias (não podem deletar categorias padrão do sistema)

**SQL:**
```sql
CREATE POLICY "Users can view system and own categories" ON "Category"
  FOR SELECT USING (
    "userId" IS NULL OR "userId" = auth.uid()
  );
```

### 5. Subcategory (Subcategorias)

**Nota**: Subcategorias herdam o comportamento da categoria pai. Subcategorias de categorias padrão do sistema são compartilhadas, mas usuários com planos pagos podem criar subcategorias personalizadas para categorias padrão.

**Políticas:**
- ✅ **SELECT**: Usuários veem subcategorias de categorias padrão do sistema OU de suas próprias categorias
- ✅ **INSERT**: Usuários podem criar subcategorias em categorias padrão (requer plano pago) OU em suas próprias categorias
- ✅ **UPDATE**: Usuários só podem atualizar subcategorias de suas próprias categorias (não podem editar subcategorias de categorias padrão)
- ✅ **DELETE**: Usuários só podem deletar subcategorias de suas próprias categorias (não podem deletar subcategorias de categorias padrão)

**SQL:**
```sql
CREATE POLICY "Users can view system and own subcategories" ON "Subcategory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND ("Category"."userId" IS NULL OR "Category"."userId" = auth.uid())
    )
  );
```

### 6. Macro (Macros)

**Nota**: Macros agora têm dados padrão do sistema (userId = NULL) compartilhados por todos os usuários, além de macros personalizados (userId = user_id) apenas para usuários com planos pagos.

**Políticas:**
- ✅ **SELECT**: Usuários veem macros padrão do sistema (userId IS NULL) OU seus próprios macros (userId = auth.uid())
- ✅ **INSERT**: Usuários só podem criar macros personalizados (requer plano pago). Dados padrão são criados via migration.
- ✅ **UPDATE**: Usuários só podem atualizar seus próprios macros (não podem editar macros padrão do sistema)
- ✅ **DELETE**: Usuários só podem deletar seus próprios macros (não podem deletar macros padrão do sistema)

**SQL:**
```sql
CREATE POLICY "Users can view system and own macros" ON "Macro"
  FOR SELECT USING (
    "userId" IS NULL OR "userId" = auth.uid()
  );
```

### 7. Goal (Metas)

**Políticas:**
- ✅ **SELECT**: Usuários só veem suas próprias metas
- ✅ **INSERT**: Usuários só podem criar metas para si
- ✅ **UPDATE**: Usuários só podem atualizar suas próprias metas
- ✅ **DELETE**: Usuários só podem deletar suas próprias metas

### 8. Debt (Dívidas)

**Políticas:**
- ✅ **SELECT**: Usuários só veem suas próprias dívidas
- ✅ **INSERT**: Usuários só podem criar dívidas para si
- ✅ **UPDATE**: Usuários só podem atualizar suas próprias dívidas
- ✅ **DELETE**: Usuários só podem deletar suas próprias dívidas

### 9. InvestmentAccount (Contas de Investimento)

**Políticas:**
- ✅ **SELECT**: Usuários só veem suas próprias contas de investimento
- ✅ **INSERT**: Usuários só podem criar contas de investimento para si
- ✅ **UPDATE**: Usuários só podem atualizar suas próprias contas
- ✅ **DELETE**: Usuários só podem deletar suas próprias contas

### 10. InvestmentTransaction (Transações de Investimento)

**Políticas:**
- ✅ **SELECT**: Usuários só veem transações de suas próprias contas de investimento
- ✅ **INSERT**: Usuários só podem criar transações em suas contas
- ✅ **UPDATE**: Usuários só podem atualizar transações de suas contas
- ✅ **DELETE**: Usuários só podem deletar transações de suas contas

### 11. Security (Securities - Dados de Mercado)

**Políticas:**
- ✅ **SELECT**: Qualquer pessoa pode ler (dados públicos de mercado)
- ✅ **INSERT**: Apenas usuários autenticados (normalmente via service_role)
- ✅ **UPDATE**: Apenas usuários autenticados

**Nota**: Securities são dados globais compartilhados (símbolos de ações, ETFs, etc.)

### 12. SecurityPrice (Preços de Mercado)

**Políticas:**
- ✅ **SELECT**: Qualquer pessoa pode ler (dados públicos)
- ✅ **INSERT**: Apenas usuários autenticados (normalmente via service_role)
- ✅ **UPDATE**: Apenas usuários autenticados

**Nota**: Preços são dados globais compartilhados

### 13. Subscription (Assinaturas)

**Políticas:**
- ✅ **SELECT**: Usuários só veem suas próprias assinaturas
- ✅ **INSERT**: Apenas service_role (via webhook do Stripe)
- ✅ **UPDATE**: Apenas service_role (via webhook do Stripe)

**Nota**: Usuários não podem criar/atualizar assinaturas diretamente - isso é feito via webhook

## 📝 Migração de Dados

### Arquivo de Migração

A migração completa está em:
```
supabase/migrations/20251109000000_add_user_id_and_enable_rls.sql
```

### O que a Migração Faz

1. **Adiciona coluna `userId`** às tabelas que precisam de multi-tenancy
2. **Cria índices** em `userId` para performance
3. **Habilita RLS** em todas as tabelas relevantes
4. **Cria políticas RLS** para cada tabela

### Aplicando a Migração

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Supabase Dashboard
# Copie e cole o conteúdo do arquivo de migração
```

## 🔧 Atualizando o Código da Aplicação

### 1. Adicionar userId ao Criar Registros

**Antes:**
```typescript
const { data: account } = await supabase
  .from("Account")
  .insert({
    name: "Checking",
    type: "checking"
  });
```

**Depois:**
```typescript
const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();

const { data: account } = await supabase
  .from("Account")
  .insert({
    name: "Checking",
    type: "checking",
    userId: user.id  // ✅ Adicionar userId
  });
```

### 2. Exemplo: Atualizar createAccount

**Arquivo:** `lib/api/accounts.ts`

```typescript
export async function createAccount(data: AccountFormData) {
  const supabase = createServerClient();
  
  // Obter usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: account, error } = await supabase
    .from("Account")
    .insert({
      id,
      name: data.name,
      type: data.type,
      creditLimit: data.type === "credit" ? data.creditLimit : null,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create account: ${error.message}`);
  }

  return account;
}
```

### 3. Tabelas que Precisam de Atualização

Atualize as seguintes funções para incluir `userId`:

- ✅ `lib/api/accounts.ts` - `createAccount()`
- ✅ `lib/api/budgets.ts` - `createBudget()`
- ✅ `lib/api/categories.ts` - `createCategory()`
- ✅ `lib/api/goals.ts` - `createGoal()`
- ✅ `lib/api/debts.ts` - `createDebt()`
- ✅ `lib/api/investments.ts` - `createInvestmentAccount()`

### 4. Migrar Dados Existentes

Se você já tem dados no banco, precisa atribuí-los a usuários:

```sql
-- Exemplo: Atribuir todas as contas ao primeiro usuário
-- ⚠️ ATENÇÃO: Ajuste conforme necessário para seu caso
UPDATE "Account" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;
```

**⚠️ Cuidado**: Isso atribuirá todos os dados ao primeiro usuário. Em produção, você precisa de uma estratégia de migração mais cuidadosa.

## 🧪 Testando RLS

### 1. Teste Manual

1. **Crie dois usuários** no Supabase Dashboard
2. **Faça login como User 1** e crie uma conta
3. **Faça login como User 2** e tente acessar a conta do User 1
4. **Resultado esperado**: User 2 não deve ver a conta do User 1

### 2. Teste via SQL Editor

```sql
-- Como User 1 (substitua pelo UUID real)
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = 'user-1-uuid-here';

SELECT * FROM "Account";
-- Deve retornar apenas contas do User 1

-- Como User 2
SET LOCAL request.jwt.claim.sub = 'user-2-uuid-here';

SELECT * FROM "Account";
-- Deve retornar apenas contas do User 2
```

### 3. Verificar Políticas

```sql
-- Ver todas as políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🚨 Troubleshooting

### Problema: "new row violates row-level security policy"

**Causa**: Tentando inserir um registro sem `userId` ou com `userId` incorreto.

**Solução**:
1. Verifique se está obtendo o usuário autenticado corretamente
2. Verifique se está incluindo `userId` no INSERT
3. Verifique se o `userId` corresponde ao usuário autenticado

### Problema: "Não consigo ver meus próprios dados"

**Causa**: RLS está habilitado mas não há políticas ou políticas estão incorretas.

**Solução**:
1. Verifique se RLS está habilitado: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verifique se as políticas existem: `SELECT * FROM pg_policies WHERE tablename = 'Account';`
3. Verifique se o usuário está autenticado: `SELECT auth.uid();`

### Problema: "Service role não consegue inserir"

**Causa**: Service role deveria bypassar RLS, mas pode estar usando a chave errada.

**Solução**:
1. Use `SUPABASE_SERVICE_ROLE_KEY` (não `ANON_KEY`) para operações de service
2. Service role bypassa RLS automaticamente - não precisa de políticas especiais

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Multi-Tenancy Guide](https://supabase.com/docs/guides/auth/row-level-security#multi-tenant-applications)

## ✅ Checklist de Implementação

- [x] Adicionar coluna `userId` às tabelas principais
- [x] Criar índices em `userId` para performance
- [x] Habilitar RLS em todas as tabelas relevantes
- [x] Criar políticas RLS para cada tabela
- [x] Documentar políticas e relacionamentos
- [ ] Atualizar código da aplicação para incluir `userId`
- [ ] Migrar dados existentes (se houver)
- [ ] Testar RLS com múltiplos usuários
- [ ] Verificar políticas em produção

## 🔄 Próximos Passos

1. **Atualizar Código**: Modificar todas as funções de criação para incluir `userId`
2. **Migração de Dados**: Atribuir dados existentes a usuários (se aplicável)
3. **Testes**: Testar RLS com múltiplos usuários
4. **Monitoramento**: Verificar logs do Supabase para garantir que RLS está funcionando

---

**Última atualização**: 2025-01-09  
**Versão**: 1.0.0

