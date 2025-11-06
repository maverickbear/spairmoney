# Guia de Implementação RLS - Passo a Passo

Este documento fornece um guia prático para implementar RLS no código da aplicação.

## 📋 Pré-requisitos

- ✅ Migração RLS aplicada: `20251109000000_add_user_id_and_enable_rls.sql`
- ✅ Usuário autenticado disponível no contexto da aplicação

## 🔧 Atualizando Funções de Criação

### 1. Account (Contas)

**Arquivo**: `lib/api/accounts.ts`

```typescript
export async function createAccount(data: AccountFormData) {
  const supabase = createServerClient();
  
  // ✅ Obter usuário autenticado
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

### 2. Transaction (Transações)

**Arquivo**: `lib/api/transactions.ts`

```typescript
export async function createTransaction(data: TransactionFormData) {
  const supabase = createServerClient();
  
  // ✅ Verificar se a conta pertence ao usuário
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Verificar se a conta pertence ao usuário
  const { data: account, error: accountError } = await supabase
    .from("Account")
    .select("id, userId")
    .eq("id", data.accountId)
    .eq("userId", user.id)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found or access denied");
  }

  // Criar transação (userId será verificado via RLS através do Account)
  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: transaction, error } = await supabase
    .from("Transaction")
    .insert({
      id,
      date: formatTimestamp(data.date),
      type: data.type,
      amount: data.amount,
      accountId: data.accountId,
      categoryId: data.categoryId || null,
      subcategoryId: data.subcategoryId || null,
      description: data.description || null,
      tags: data.tags || "",
      transferToId: data.transferToId || null,
      transferFromId: data.transferFromId || null,
      recurring: data.recurring || false,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return transaction;
}
```

### 3. Budget (Orçamentos)

**Arquivo**: `lib/api/budgets.ts`

```typescript
export async function createBudget(data: BudgetFormData) {
  const supabase = createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: budget, error } = await supabase
    .from("Budget")
    .insert({
      id,
      period: formatTimestamp(data.period),
      categoryId: data.categoryId || null,
      macroId: data.macroId || null,
      amount: data.amount,
      note: data.note || null,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create budget: ${error.message}`);
  }

  return budget;
}
```

### 4. Category (Categorias)

**Arquivo**: `lib/api/categories.ts`

```typescript
export async function createCategory(data: CategoryFormData) {
  const supabase = createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Verificar se o Macro pertence ao usuário
  const { data: macro, error: macroError } = await supabase
    .from("Macro")
    .select("id, userId")
    .eq("id", data.macroId)
    .eq("userId", user.id)
    .single();

  if (macroError || !macro) {
    throw new Error("Macro not found or access denied");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: category, error } = await supabase
    .from("Category")
    .insert({
      id,
      name: data.name,
      macroId: data.macroId,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return category;
}
```

### 5. Goal (Metas)

**Arquivo**: `lib/api/goals.ts`

```typescript
export async function createGoal(data: GoalFormData) {
  const supabase = createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: goal, error } = await supabase
    .from("Goal")
    .insert({
      id,
      name: data.name,
      targetAmount: data.targetAmount,
      incomePercentage: data.incomePercentage,
      currentBalance: data.currentBalance || 0,
      priority: data.priority || "Medium",
      isPaused: data.isPaused || false,
      expectedIncome: data.expectedIncome || null,
      targetMonths: data.targetMonths || null,
      description: data.description || null,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return goal;
}
```

### 6. Debt (Dívidas)

**Arquivo**: `lib/api/debts.ts`

```typescript
export async function createDebt(data: DebtFormData) {
  const supabase = createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: debt, error } = await supabase
    .from("Debt")
    .insert({
      id,
      name: data.name,
      loanType: data.loanType,
      initialAmount: data.initialAmount,
      downPayment: data.downPayment || 0,
      currentBalance: data.currentBalance,
      interestRate: data.interestRate,
      totalMonths: data.totalMonths,
      firstPaymentDate: formatTimestamp(data.firstPaymentDate),
      monthlyPayment: data.monthlyPayment,
      paymentFrequency: data.paymentFrequency || "monthly",
      paymentAmount: data.paymentAmount || null,
      accountId: data.accountId || null,
      priority: data.priority || "Medium",
      description: data.description || null,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create debt: ${error.message}`);
  }

  return debt;
}
```

### 7. InvestmentAccount (Contas de Investimento)

**Arquivo**: `lib/api/investments.ts`

```typescript
export async function createInvestmentAccount(data: InvestmentAccountFormData) {
  const supabase = createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = formatTimestamp(new Date());

  const { data: account, error } = await supabase
    .from("InvestmentAccount")
    .insert({
      id,
      name: data.name,
      type: data.type,
      accountId: data.accountId || null,
      userId: user.id,  // ✅ Adicionar userId
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create investment account: ${error.message}`);
  }

  return account;
}
```

## 🔍 Funções de Leitura

As funções de leitura (SELECT) não precisam de alterações - o RLS automaticamente filtra os dados por usuário. Mas você pode adicionar verificações extras se necessário:

```typescript
export async function getAccounts() {
  const supabase = createServerClient();
  
  // Não precisa passar userId - RLS filtra automaticamente
  const { data: accounts, error } = await supabase
    .from("Account")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return accounts || [];
}
```

## ⚠️ Migração de Dados Existentes

Se você já tem dados no banco **antes** de aplicar RLS, precisa atribuí-los a usuários:

```sql
-- ⚠️ ATENÇÃO: Ajuste conforme necessário
-- Este exemplo atribui todos os dados ao primeiro usuário

-- Atribuir contas ao primeiro usuário
UPDATE "Account" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir orçamentos
UPDATE "Budget" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir metas
UPDATE "Goal" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir dívidas
UPDATE "Debt" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir categorias
UPDATE "Category" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir macros
UPDATE "Macro" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Atribuir contas de investimento
UPDATE "InvestmentAccount" 
SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;
```

## ✅ Checklist de Implementação

- [ ] Aplicar migração RLS no banco de dados
- [ ] Atualizar `createAccount()` para incluir `userId`
- [ ] Atualizar `createBudget()` para incluir `userId`
- [ ] Atualizar `createCategory()` para incluir `userId`
- [ ] Atualizar `createGoal()` para incluir `userId`
- [ ] Atualizar `createDebt()` para incluir `userId`
- [ ] Atualizar `createInvestmentAccount()` para incluir `userId`
- [ ] Verificar que `createTransaction()` valida acesso à conta
- [ ] Verificar que `createSubcategory()` valida acesso à categoria
- [ ] Migrar dados existentes (se houver)
- [ ] Testar com múltiplos usuários
- [ ] Verificar logs do Supabase para erros RLS

## 🧪 Testando

1. **Crie dois usuários** de teste
2. **Faça login como User 1** e crie uma conta
3. **Faça login como User 2** e verifique que não vê a conta do User 1
4. **Tente criar uma transação** para a conta do User 1 como User 2 - deve falhar
5. **Verifique logs** do Supabase para garantir que RLS está funcionando

---

**Referência**: Veja [RLS_SECURITY.md](../RLS_SECURITY.md) para documentação completa sobre RLS.

