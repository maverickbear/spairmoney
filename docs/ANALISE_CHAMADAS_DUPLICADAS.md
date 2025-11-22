# Análise Profunda: Chamadas Duplicadas no Dashboard

## 📊 Resumo Executivo

Esta análise identifica todas as fontes de chamadas duplicadas de `getAccounts()`, `getHoldings()`, e endpoints de portfolio no carregamento do dashboard.

## 🔍 Fontes de Chamadas Duplicadas

### 1. **Dashboard Data Loader** (`app/(protected)/dashboard/data-loader.tsx`)

#### Chamadas Diretas:
- **Linha 70**: `getAccounts(accessToken, refreshToken, { includeHoldings: true })`
  - Chamada explícita para buscar contas com holdings
  - Usada para calcular `totalBalance` e `savings`
  - **Impacto**: ALTO - Sempre executada

#### Chamadas Indiretas:
- **Linha 309**: `getGoalsInternal(accessToken, refreshToken)`
  - Internamente chama `getAccounts()` na linha 201 de `lib/api/goals.ts`
  - **Condição**: Apenas se houver goals com `accountId`
  - **Impacto**: MÉDIO - Condicional

- **Linha 290**: `calculateFinancialHealth(selectedMonth, userId, accessToken, refreshToken)`
  - Internamente chama `getAccounts()` na linha 368 de `lib/api/financial-health.ts`
  - **Condição**: Apenas para calcular `emergencyFundMonths`
  - **Impacto**: MÉDIO - Condicional

**Total no Data Loader**: 1-3 chamadas de `getAccounts()` dependendo de condições

---

### 2. **OnboardingWidget** (`components/dashboard/onboarding-widget.tsx`)

#### Chamadas Client-Side:
- **Linha 64**: `getAccountsClient()` 
  - **Condição**: Apenas se `initialStatus` não for fornecido (linha 43-44)
  - **Problema**: Esta é uma chamada **client-side** que não usa a deduplicação server-side
  - **Impacto**: MÉDIO - Condicional, mas pode duplicar se `initialStatus` não vier do servidor

**Observação**: O `data-loader.tsx` já calcula `onboardingStatus` (linha 348) e passa para o widget, então esta chamada **não deveria** acontecer na maioria dos casos.

---

### 3. **Financial Health** (`lib/api/financial-health.ts`)

#### Chamada Interna:
- **Linha 368**: `getAccounts(accessToken, refreshToken, { includeHoldings: true })`
  - Usado para calcular `emergencyFundMonths`
  - **Condição**: Sempre executada quando `calculateFinancialHealth()` é chamada
  - **Impacto**: ALTO - Sempre executada

**Problema**: Esta chamada é **redundante** porque o `data-loader` já tem as contas (linha 268).

---

### 4. **Goals** (`lib/api/goals.ts`)

#### Chamada Interna:
- **Linha 201**: `getAccounts(accessToken, refreshToken)`
  - Usado para sincronizar balances de goals com `accountId`
  - **Condição**: Apenas se houver goals com `accountId` (linha 196)
  - **Impacto**: BAIXO - Condicional

**Problema**: Esta chamada é **redundante** porque o `data-loader` já tem as contas.

---

### 5. **Portfolio Widgets** (Client-Side)

#### InvestmentPortfolioWidget:
- **Linha 181**: `fetch("/api/portfolio/all?days=30")`
  - Widget do dashboard que busca dados de portfolio
  - **Impacto**: ALTO - Sempre executada se usuário tem acesso a investimentos

#### PortfolioPerformanceWidget:
- **Linha 50**: `fetch("/api/portfolio/all?days=365")`
  - Widget do dashboard que busca dados de portfolio
  - **Impacto**: ALTO - Sempre executada se usuário tem acesso a investimentos

**Problema**: Dois widgets fazem chamadas separadas para o mesmo endpoint (com parâmetros diferentes).

---

## 📈 Análise de Fluxo no Carregamento do Dashboard

### Fluxo Atual (ANTES das otimizações):

```
1. Dashboard Page Load
   ├─> loadDashboardData()
       ├─> getAccounts() [CHAMADA 1] ✅
       ├─> getGoalsInternal()
       │   └─> getAccounts() [CHAMADA 2] ❌ DUPLICADA (se houver goals)
       ├─> calculateFinancialHealth()
       │   └─> getAccounts() [CHAMADA 3] ❌ DUPLICADA
       └─> getAccountsWithTokens() [CHAMADA 4] ❌ DUPLICADA (mesma função)

2. OnboardingWidget (Client-Side)
   └─> getAccountsClient() [CHAMADA 5] ❌ DUPLICADA (se initialStatus não fornecido)

3. Portfolio Widgets (Client-Side)
   ├─> InvestmentPortfolioWidget
   │   └─> /api/portfolio/all?days=30 [CHAMADA 6]
   └─> PortfolioPerformanceWidget
       └─> /api/portfolio/all?days=365 [CHAMADA 7]
```

### Impacto de `getHoldings()`:

Cada chamada de `getAccounts()` com `includeHoldings: true` chama `getHoldings()`:
- **CHAMADA 1**: ✅ Necessária
- **CHAMADA 2**: ❌ Duplicada (via goals)
- **CHAMADA 3**: ❌ Duplicada (via financial-health)
- **CHAMADA 4**: ❌ Duplicada (mesma função)
- **CHAMADA 5**: ❌ Duplicada (client-side, não usa deduplicação)

**Total**: 3-5 chamadas de `getHoldings()` desnecessárias!

---

## ✅ Otimizações Aplicadas

### 1. Deduplicação de Requisições para `getAccounts()`
- **Arquivo**: `lib/api/accounts.ts`
- **Implementação**: Cache em memória com TTL de 2 segundos
- **Resultado**: Chamadas simultâneas reutilizam a mesma requisição em andamento
- **Status**: ✅ IMPLEMENTADO

### 2. Deduplicação de Requisições para Questrade Accounts
- **Arquivo**: `app/api/questrade/accounts/route.ts`
- **Implementação**: Cache em memória com TTL de 5 segundos
- **Status**: ✅ IMPLEMENTADO

### 3. Consolidação de Endpoints de Portfolio
- **Arquivo**: `app/(protected)/reports/page.tsx`
- **Mudança**: De 3 endpoints separados para 1 endpoint consolidado
- **Status**: ✅ IMPLEMENTADO

---

## 🔧 Otimizações Recomendadas (NÃO IMPLEMENTADAS)

### 1. **Passar Contas como Parâmetro para Goals e Financial Health**

**Problema**: `getGoalsInternal()` e `calculateFinancialHealth()` chamam `getAccounts()` mesmo quando as contas já estão disponíveis.

**Solução**:
```typescript
// Em data-loader.tsx
const accounts = await getAccountsWithTokens(accessToken, refreshToken);

// Passar accounts como parâmetro
const goals = await getGoalsInternal(accessToken, refreshToken, accounts);
const financialHealth = await calculateFinancialHealth(
  selectedMonth, 
  userId, 
  accessToken, 
  refreshToken,
  accounts // Passar accounts aqui
);
```

**Benefício**: Elimina 2 chamadas duplicadas de `getAccounts()`

---

### 2. **Garantir que OnboardingWidget Use initialStatus**

**Problema**: Se `initialStatus` não for fornecido, o widget faz uma chamada client-side.

**Solução**: Sempre fornecer `initialStatus` do servidor (já está sendo feito na linha 348 do data-loader).

**Status**: ✅ JÁ IMPLEMENTADO (mas verificar se sempre funciona)

---

### 3. **Compartilhar Dados de Portfolio Entre Widgets**

**Problema**: Dois widgets fazem chamadas separadas para `/api/portfolio/all`.

**Solução Opção A**: Usar React Context para compartilhar dados entre widgets
**Solução Opção B**: Adicionar deduplicação no endpoint `/api/portfolio/all`
**Solução Opção C**: Criar um hook compartilhado que faz a chamada uma vez

**Benefício**: Elimina 1 chamada duplicada de portfolio

---

### 4. **Adicionar Deduplicação para `getAccountsClient()`**

**Problema**: `getAccountsClient()` é client-side e não usa a deduplicação server-side.

**Solução**: Adicionar cache/deduplicação client-side usando React Query ou similar.

**Benefício**: Elimina chamadas duplicadas client-side

---

## 📊 Estatísticas de Impacto

### Antes das Otimizações:
- **getAccounts()**: 3-5 chamadas por carregamento do dashboard
- **getHoldings()**: 3-5 chamadas (uma por getAccounts com holdings)
- **/api/portfolio/all**: 2 chamadas (de widgets diferentes)

### Depois das Otimizações Atuais:
- **getAccounts()**: 1-3 chamadas (deduplicação reduz chamadas simultâneas)
- **getHoldings()**: 1-3 chamadas (reduzido pela deduplicação de getAccounts)
- **/api/portfolio/all**: 2 chamadas (ainda duplicadas, mas widgets diferentes)

### Após Todas as Otimizações Recomendadas:
- **getAccounts()**: 1 chamada (passar como parâmetro elimina duplicações)
- **getHoldings()**: 1 chamada (via getAccounts)
- **/api/portfolio/all**: 1 chamada (compartilhada entre widgets)

---

## 🎯 Priorização de Otimizações

### Alta Prioridade:
1. ✅ **Deduplicação de getAccounts()** - IMPLEMENTADO
2. ⚠️ **Passar accounts como parâmetro para goals e financial-health** - RECOMENDADO

### Média Prioridade:
3. ⚠️ **Compartilhar dados de portfolio entre widgets** - RECOMENDADO
4. ✅ **Garantir initialStatus sempre fornecido** - JÁ IMPLEMENTADO

### Baixa Prioridade:
5. ⚠️ **Deduplicação client-side para getAccountsClient()** - OPCIONAL

---

## 📝 Conclusão

As otimizações já implementadas (deduplicação de requisições) devem reduzir significativamente as chamadas duplicadas. As otimizações recomendadas eliminariam completamente as duplicações restantes, mas requerem refatoração de assinaturas de funções.

