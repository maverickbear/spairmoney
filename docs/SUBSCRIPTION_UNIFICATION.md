# Unificação da Arquitetura de Subscription/Plans/Limits

## ✅ O que foi feito

### 1. API Unificada Criada
- **`lib/api/subscription.ts`** - Nova API unificada que é a **fonte única de verdade**
  - `getCurrentUserSubscriptionData()` - Retorna subscription + plan + limits de uma vez
  - `getUserSubscriptionData(userId)` - Para usuários específicos
  - `getPlans()` - Lista todos os plans
  - `getPlanById(planId)` - Busca plan específico
  - `checkTransactionLimit()` - Verifica limite de transações
  - `checkAccountLimit()` - Verifica limite de contas
  - `checkFeatureAccess()` - Verifica acesso a features
  - `invalidateSubscriptionCache()` - Invalida cache
  - Cache inteligente com TTL de 5 minutos
  - Suporte automático para household members (herança de subscription)

### 2. APIs Deprecated (mantidas para compatibilidade)
- **`lib/api/limits.ts`** - Agora apenas re-exporta da API unificada
- **`lib/api/plans.ts`** - Ainda existe mas deve ser migrado gradualmente

### 3. Contextos Unificados
- **`contexts/subscription-context.tsx`** - Único contexto necessário
  - Fornece: `subscription`, `plan`, `limits`, `checking`, `refetch`, `invalidateCache`
- **`contexts/plan-limits-context.tsx`** - Deprecated, agora apenas wrapper

### 4. Hooks Unificados
- **`hooks/use-subscription.ts`** - Hook principal (re-exporta `useSubscriptionContext`)
- **`hooks/use-plan-limits.ts`** - Deprecated, agora apenas wrapper

### 5. APIs Routes Atualizadas
- **`app/api/billing/subscription/route.ts`** - Usa API unificada
- **`app/(protected)/layout.tsx`** - Usa API unificada

### 6. Feature Guards Atualizados
- **`lib/api/feature-guard.ts`** - Usa API unificada
- **`lib/api/stripe.ts`** - Webhook invalida cache usando API unificada

## 🔄 Arquitetura Unificada

```
┌─────────────────────────────────────────────────────────┐
│              lib/api/subscription.ts                     │
│         (FONTE ÚNICA DE VERDADE - Server)               │
│                                                          │
│  • getCurrentUserSubscriptionData()                      │
│  • getUserSubscriptionData(userId)                      │
│  • getPlans()                                           │
│  • checkTransactionLimit()                              │
│  • checkAccountLimit()                                  │
│  • checkFeatureAccess()                                 │
│  • Cache inteligente (5min TTL)                         │
└─────────────────────────────────────────────────────────┘
                        │
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  API Routes      │          │  Server Actions │
│  /api/billing/*  │          │  lib/actions/*   │
└──────────────────┘          └──────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  contexts/subscription-context │
        │      (Client-side State)       │
        │                                │
        │  • subscription                │
        │  • plan                        │
        │  • limits                      │
        │  • checking                    │
        │  • refetch()                   │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      hooks/use-subscription    │
        │   (Hook principal - usar este) │
        └───────────────────────────────┘
```

## 📋 O que ainda precisa ser migrado

### Arquivos que ainda usam API antiga (`lib/api/plans.ts`):

1. **`app/api/billing/limits/route.ts`** - Deprecated, usar Server Action
2. **`app/api/billing/plans/route.ts`** - Migrar para `getPlans()`
3. **`app/api/billing/plans/public/route.ts`** - Migrar para `getPlans()`
4. **`app/api/billing/start-trial/route.ts`** - Atualizar invalidação de cache
5. **`app/api/stripe/sync-subscription/route.ts`** - Atualizar invalidação
6. **`app/api/stripe/create-account-and-link/route.ts`** - Atualizar invalidação
7. **`app/api/stripe/link-subscription/route.ts`** - Atualizar invalidação
8. **`lib/actions/billing.ts`** - Migrar para API unificada
9. **`lib/api/categories.ts`** - Verificar uso
10. **`lib/api/transactions.ts`** - Verificar uso
11. **`app/api/admin/plans/route.ts`** - Verificar uso

### Componentes que podem ser simplificados:

- Todos os componentes que usam `usePlanLimits()` podem usar `useSubscription()` diretamente
- Componentes que verificam features já estão usando `checkFeatureAccess()` (correto)

## 🎯 Próximos Passos

1. **Migrar APIs restantes** para usar `lib/api/subscription.ts`
2. **Atualizar invalidações de cache** em todos os webhooks/actions
3. **Remover código deprecated** após migração completa
4. **Atualizar documentação** de uso

## 💡 Como usar a nova API

### Server-side (Recomendado):
```typescript
import { getCurrentUserSubscriptionData, checkFeatureAccess } from "@/lib/api/subscription";

// Obter tudo de uma vez
const { subscription, plan, limits } = await getCurrentUserSubscriptionData();

// Verificar feature
const hasAccess = await checkFeatureAccess(userId, "hasInvestments");

// Verificar limites
const transactionLimit = await checkTransactionLimit(userId);
const accountLimit = await checkAccountLimit(userId);
```

### Client-side:
```typescript
import { useSubscription } from "@/hooks/use-subscription";

function MyComponent() {
  const { subscription, plan, limits, checking, refetch } = useSubscription();
  
  // Usar subscription, plan, limits diretamente
  if (!limits.hasInvestments) {
    return <UpgradePrompt />;
  }
  
  return <InvestmentsView />;
}
```

## 🔑 Princípios da Nova Arquitetura

1. **Fonte Única de Verdade**: `lib/api/subscription.ts` é a única API que acessa subscription/plan/limits
2. **Database é Source of Truth**: Features vêm diretamente do banco, sem merge com defaults
3. **Stripe Portal**: Usuário gerencia subscription no Stripe Portal (não precisamos de muitas rotas de gerenciamento)
4. **Cache Inteligente**: Cache de 5 minutos com invalidação automática via webhooks
5. **Household Members**: Herança automática de subscription do owner

## ⚠️ Breaking Changes

- `lib/api/plans.ts` ainda existe mas será deprecated
- `lib/api/limits.ts` agora é apenas wrapper
- `contexts/plan-limits-context.tsx` agora é apenas wrapper
- `hooks/use-plan-limits.ts` agora é apenas wrapper

Todos os wrappers mantêm compatibilidade durante a migração.

