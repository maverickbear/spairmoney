# Tratamento de Transações Futuras e Debts

Este documento explica como o sistema Spare Finance lida com transações futuras e debts que possuem transações tanto passadas quanto futuras.

## Índice

1. [Visão Geral](#visão-geral)
2. [Transações Futuras](#transações-futuras)
3. [Debts e Transações](#debts-e-transações)
4. [Cálculo de Pagamentos Passados](#cálculo-de-pagamentos-passados)
5. [Criação de Transações Futuras](#criação-de-transações-futuras)
6. [Filtragem de Transações por Data](#filtragem-de-transações-por-data)
7. [Fluxo Completo](#fluxo-completo)

---

## Visão Geral

O sistema diferencia claramente entre:
- **Transações Passadas**: Já ocorreram e afetam saldos e relatórios
- **Transações Futuras**: Ainda não ocorreram e aparecem apenas em "Upcoming Transactions"
- **Debts**: Calculam pagamentos passados automaticamente e criam transações futuras

### Princípios Fundamentais

1. **Transações futuras NÃO afetam saldos de contas** - apenas transações com `date <= hoje` são consideradas
2. **Debts calculam pagamentos passados automaticamente** - baseado em `firstPaymentDate` até hoje
3. **Transações futuras de debts são criadas apenas a partir de hoje** - evita poluir histórico com pagamentos passados
4. **Transações futuras aparecem em "Upcoming Transactions"** - permitindo ao usuário marcar como pagas

---

## Transações Futuras

### O que são Transações Futuras?

Transações futuras são registros na tabela `Transaction` com `date > hoje`. Elas podem ser:

1. **Transações recorrentes** (`recurring = true`): Aparecem mensalmente
2. **Transações únicas futuras** (`recurring = false`): Criadas manualmente com data futura
3. **Transações de debts**: Criadas automaticamente para pagamentos futuros

### Onde são Usadas?

#### 1. Upcoming Transactions (`getUpcomingTransactions`)

**Arquivo**: `lib/api/transactions.ts` (linha 628)

Esta função busca transações que aparecerão nos próximos 15 dias:

```typescript
// Busca transações recorrentes (todas, independente da data)
const recurringTransactions = await supabase
  .from("Transaction")
  .select("*")
  .eq("recurring", true);

// Busca transações não-recorrentes com data futura (próximos 15 dias)
const futureTransactions = await supabase
  .from("Transaction")
  .select("*")
  .eq("recurring", false)
  .gt("date", today)
  .lte("date", endDate); // endDate = hoje + 15 dias
```

**Comportamento**:
- Transações recorrentes: Calcula próxima ocorrência baseada no dia do mês original
- Transações futuras: Usa a data diretamente
- Debts: Calcula próximos pagamentos dinamicamente (não cria transações no banco)

#### 2. Filtragem em Relatórios e Dashboard

**Arquivo**: `app/(protected)/dashboard/summary-cards.tsx` (linha 69)

Transações futuras são **excluídas** de cálculos de:
- Receitas do mês
- Despesas do mês
- Comparações com mês anterior

```typescript
// Filtra apenas transações passadas (date <= hoje)
const pastTransactions = selectedMonthTransactions.filter((t) => {
  const txDate = parseTransactionDate(t.date);
  txDate.setHours(0, 0, 0, 0);
  return txDate <= today; // Exclui transações futuras
});
```

#### 3. Cálculo de Saldos de Contas

**Arquivo**: `lib/api/transactions.ts` (linha 923) - `getAccountBalance`

**Arquivo**: `lib/api/accounts-client.ts` (linha 83)

Saldos de contas **NUNCA** incluem transações futuras:

```typescript
// Apenas transações com date <= hoje
const { data: transactions } = await supabase
  .from("Transaction")
  .select("type, amount, date")
  .eq("accountId", accountId)
  .lte("date", todayEnd.toISOString());

// Filtra novamente para garantir
for (const tx of transactions || []) {
  const txDate = new Date(txYear, txMonth, txDay);
  if (txDate > todayDate) {
    continue; // Pula transações futuras
  }
  // ... calcula saldo
}
```

---

## Debts e Transações

### Arquitetura de Debts

Debts possuem duas responsabilidades principais:

1. **Calcular pagamentos passados automaticamente** - baseado em `firstPaymentDate`
2. **Criar transações futuras** - apenas a partir de hoje

### Estrutura de Dados

**Arquivo**: `lib/api/debts.ts` (linha 17)

```typescript
interface Debt {
  id: string;
  name: string;
  firstPaymentDate: string; // Data do primeiro pagamento
  paymentFrequency?: string; // "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
  paymentAmount?: number; // Valor do pagamento baseado na frequência
  monthlyPayment: number; // Valor mensal equivalente
  principalPaid: number; // Calculado automaticamente
  interestPaid: number; // Calculado automaticamente
  currentBalance: number; // Calculado automaticamente
  isPaused: boolean; // Se pausado, não calcula nem cria transações
  isPaidOff: boolean; // Se quitado, não cria transações futuras
  accountId?: string; // Conta associada (opcional)
}
```

---

## Cálculo de Pagamentos Passados

### Função Principal: `calculatePaymentsFromDate`

**Arquivo**: `lib/utils/debts.ts` (linha 273)

Esta função calcula quanto já foi pago desde `firstPaymentDate` até hoje:

```typescript
export function calculatePaymentsFromDate(
  debt: DebtForCalculation,
  currentDate: Date = new Date()
): {
  principalPaid: number;
  interestPaid: number;
  currentBalance: number;
  monthsPaid: number;
}
```

### Como Funciona

1. **Calcula meses decorridos**:
   ```typescript
   const monthsDiff = Math.floor(
     (current.getFullYear() - firstPayment.getFullYear()) * 12 +
     (current.getMonth() - firstPayment.getMonth())
   );
   ```

2. **Se primeiro pagamento é futuro**: Retorna estado inicial (nada foi pago)

3. **Calcula mês a mês** (amortização):
   ```typescript
   for (let month = 0; month < monthsToCalculate && balance > 0; month++) {
     const interest = balance * monthlyInterestRate;
     const principal = Math.min(balance, totalMonthlyPayment - interest);
     
     totalInterestPaid += interest;
     totalPrincipalPaid += principal;
     balance -= principal;
   }
   ```

4. **Atualiza debt no banco** se valores calculados diferem dos armazenados

### Quando é Executado?

**Arquivo**: `lib/api/debts.ts` (linha 63) - `getDebts()`

Toda vez que debts são buscados:

```typescript
export async function getDebts(): Promise<DebtWithCalculations[]> {
  const debts = await supabase.from("Debt").select("*");
  
  const debtsWithCalculations = await Promise.all(
    debts.map(async (debt) => {
      // Calcula pagamentos passados
      const calculatedPayments = calculatePaymentsFromDate(debtForCalculation);
      
      // Atualiza no banco se necessário
      if (needsUpdate && !debt.isPaused && !debt.isPaidOff) {
        await supabase.from("Debt").update({
          principalPaid: calculatedPayments.principalPaid,
          interestPaid: calculatedPayments.interestPaid,
          currentBalance: calculatedPayments.currentBalance,
        });
      }
    })
  );
}
```

### Importante

- **Pagamentos passados NÃO criam transações no banco** - são apenas cálculos
- **Cálculo é baseado em meses**, não em dias exatos
- **Se debt está pausado ou quitado**, usa valores armazenados (não calcula)

---

## Criação de Transações Futuras

### Função Principal: `createDebtPaymentTransactions`

**Arquivo**: `lib/api/debts.ts` (linha 390)

Esta função cria transações futuras para pagamentos de debts:

```typescript
async function createDebtPaymentTransactions(debt: any): Promise<void> {
  // Só cria se:
  // - debt tem accountId
  // - debt não está quitado
  // - debt não está pausado
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calcula próximos pagamentos baseado na frequência
  // APENAS para datas >= hoje (futuras)
  
  for (let i = startingIndex; i < numberOfPayments; i++) {
    const currentDate = calculateNextPaymentDate(firstPaymentDate, i, frequency);
    
    // Só cria se data >= hoje
    if (currentDate >= today) {
      transactions.push({
        date: currentDate,
        type: "expense",
        amount: paymentAmount,
        accountId: debt.accountId,
        categoryId: categoryMapping.categoryId,
        recurring: true, // Marca como recorrente
      });
    }
  }
  
  // Cria transações em lotes (max 500)
  await createTransaction(...);
}
```

### Quando é Executado?

1. **Ao criar um novo debt** (`createDebt`):
   ```typescript
   const debt = await supabase.from("Debt").insert(debtData);
   if (debt.accountId && !isPaidOff) {
     await createDebtPaymentTransactions(debt);
   }
   ```

2. **Ao atualizar um debt** (`updateDebt`):
   - Não é chamado automaticamente
   - Transações existentes continuam válidas
   - Se necessário, usuário deve recriar manualmente

### Características Importantes

1. **Apenas transações futuras**: Nunca cria transações com `date < hoje`
2. **Marca como recorrente**: `recurring = true` para aparecer em "Upcoming Transactions"
3. **Limite de 500 transações**: Evita criar muitas transações de uma vez
4. **Suporta múltiplas frequências**: monthly, biweekly, weekly, semimonthly, daily

### Exemplo

Se um debt tem:
- `firstPaymentDate`: 2024-01-01
- `paymentFrequency`: "monthly"
- `totalMonths`: 12
- Hoje: 2024-06-15

**Resultado**:
- ❌ NÃO cria transações para Jan, Fev, Mar, Abr, Mai, Jun (já passaram)
- ✅ Cria transações para Jul, Ago, Set, Out, Nov, Dez (futuras)

---

## Filtragem de Transações por Data

### Locais onde Transações Futuras são Filtradas

#### 1. Summary Cards (Dashboard)

**Arquivo**: `app/(protected)/dashboard/summary-cards.tsx`

```typescript
// Filtra transações passadas apenas
const pastTransactions = selectedMonthTransactions.filter((t) => {
  const txDate = parseTransactionDate(t.date);
  txDate.setHours(0, 0, 0, 0);
  return txDate <= today; // Exclui futuras
});
```

#### 2. Account Balance

**Arquivo**: `lib/api/transactions.ts` - `getAccountBalance`

```typescript
// Query SQL já filtra
.lte("date", todayEnd.toISOString())

// Filtra novamente para garantir
if (txDate > todayDate) {
  continue; // Pula transações futuras
}
```

#### 3. Accounts Client

**Arquivo**: `lib/api/accounts-client.ts` - `getAccountsClient`

```typescript
// Calcula saldo apenas com transações passadas
for (const tx of transactions || []) {
  const txDate = new Date(txYear, txMonth, txDay);
  if (txDate > todayDate) {
    continue; // Pula transações futuras
  }
  // ... atualiza saldo
}
```

#### 4. Cash Flow Timeline

**Arquivo**: `app/(protected)/dashboard/widgets/cash-flow-timeline-widget.tsx`

Filtra transações por período selecionado, mas ainda exclui futuras se necessário.

### Locais onde Transações Futuras são Incluídas

#### 1. Upcoming Transactions

**Arquivo**: `lib/api/transactions.ts` - `getUpcomingTransactions`

Inclui:
- Transações recorrentes (calcula próxima ocorrência)
- Transações futuras únicas (próximos 15 dias)
- Pagamentos de debts (calculados dinamicamente)

#### 2. Lista de Transações (com filtro de data)

Se usuário filtra por período futuro, transações futuras aparecem na lista.

---

## Fluxo Completo

### Cenário: Debt Criado em Janeiro, Hoje é Junho

1. **Usuário cria debt**:
   - `firstPaymentDate`: 2024-01-01
   - `totalMonths`: 12
   - `paymentFrequency`: "monthly"

2. **Sistema cria transações futuras**:
   - ❌ Não cria para Jan-Jun (passado)
   - ✅ Cria para Jul-Dez (futuro)
   - Cada transação tem `recurring = true`

3. **Sistema calcula pagamentos passados**:
   - `calculatePaymentsFromDate` calcula Jan-Jun
   - Atualiza `principalPaid`, `interestPaid`, `currentBalance`
   - **NÃO cria transações no banco** para esses meses

4. **Dashboard mostra**:
   - Saldos: Apenas transações passadas (não inclui pagamentos de debt ainda não pagos)
   - Upcoming Transactions: Mostra próximos pagamentos (Jul, Ago, etc.)

5. **Usuário marca pagamento como pago**:
   - Cria transação real com data de hoje
   - Transação futura original continua (ou é removida, dependendo da implementação)

### Cenário: Debt Criado Hoje para Começar em 3 Meses

1. **Usuário cria debt**:
   - `firstPaymentDate`: 2024-09-01 (futuro)
   - `totalMonths`: 12

2. **Sistema calcula pagamentos passados**:
   - `monthsDiff < 0` → Retorna estado inicial
   - `principalPaid = 0`, `currentBalance = initialAmount - downPayment`

3. **Sistema cria transações futuras**:
   - ✅ Cria todas as 12 transações (todas são futuras)
   - Primeira transação: 2024-09-01

4. **Dashboard mostra**:
   - Saldos: Não afetados (nenhuma transação passada)
   - Upcoming Transactions: Mostra primeira transação em Setembro

---

## Resumo das Regras

### Transações Futuras

✅ **Incluídas em**:
- Upcoming Transactions (próximos 15 dias)
- Lista de transações (se filtro incluir período futuro)

❌ **Excluídas de**:
- Cálculo de saldos de contas
- Receitas/Despesas do mês atual
- Comparações com mês anterior
- Relatórios financeiros (a menos que filtro inclua futuro)

### Debts

✅ **Calculam automaticamente**:
- Pagamentos passados (desde `firstPaymentDate` até hoje)
- Saldo atual baseado em amortização
- Juros pagos e principal pago

✅ **Criam transações futuras**:
- Apenas para datas >= hoje
- Marcadas como `recurring = true`
- Limitadas a 500 transações

❌ **NÃO criam**:
- Transações passadas (evita poluir histórico)
- Transações se `isPaused = true`
- Transações se `isPaidOff = true`
- Transações se `accountId` não está definido

---

## Arquivos Principais

### Transações
- `lib/api/transactions.ts` - Lógica principal de transações
- `lib/api/transactions-client.ts` - Cliente para transações
- `app/api/transactions/route.ts` - API route

### Debts
- `lib/api/debts.ts` - Lógica principal de debts (server)
- `lib/api/debts-client.ts` - Cliente para debts
- `lib/utils/debts.ts` - Funções de cálculo (puras, client/server)

### Dashboard
- `app/(protected)/dashboard/summary-cards.tsx` - Cards de resumo
- `app/(protected)/dashboard/financial-overview-page.tsx` - Página principal
- `components/dashboard/upcoming-transactions.tsx` - Widget de transações futuras

### Cálculo de Saldos
- `lib/api/transactions.ts` - `getAccountBalance`
- `lib/api/accounts-client.ts` - `getAccountsClient`
- `lib/services/balance-calculator.ts` - Calculadora de saldos

---

## Notas de Implementação

### Timezone

O sistema normaliza datas para evitar problemas de timezone:
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0); // Normaliza para início do dia
```

### Performance

- Debts calculam pagamentos passados apenas quando necessário
- Transações futuras são criadas em lotes (50 por vez)
- Limite de 500 transações por debt evita sobrecarga

### Segurança

- Todas as operações verificam ownership (RLS)
- Transações futuras não afetam saldos (prevenção de fraude)

---

## Possíveis Melhorias Futuras

1. **Sincronização automática**: Recriar transações futuras quando debt é atualizado
2. **Limpeza de transações**: Remover transações futuras antigas quando debt é pausado/quitado
3. **Histórico de pagamentos**: Criar opção para criar transações passadas manualmente
4. **Notificações**: Alertar sobre pagamentos de debts próximos

---

**Última atualização**: 2024-12-XX
**Autor**: Documentação automática baseada em análise de código

