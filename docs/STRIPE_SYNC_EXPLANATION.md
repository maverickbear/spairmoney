# Como as Informações são Sincronizadas com o Stripe

## 📋 Visão Geral

Quando você altera um plano no Portal Management, as informações são automaticamente sincronizadas com o Stripe usando a **Stripe API**. Este documento explica o fluxo completo.

## 🔄 Fluxo de Sincronização

### 1. **Portal Management → API → Supabase**
```
Usuário edita plano no Portal
    ↓
PUT /api/admin/plans
    ↓
Atualiza tabela "Plan" no Supabase
```

### 2. **Supabase → Stripe API**
```
Após salvar no Supabase
    ↓
Chama syncPlanToStripe(planId)
    ↓
Faz múltiplas chamadas à Stripe API
```

## 📡 Como as Informações são Enviadas para o Stripe

### **Conexão com Stripe**

O sistema usa o **Stripe SDK oficial** para Node.js:

```typescript
// lib/api/stripe.ts (linha 11-14)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});
```

A chave secreta (`STRIPE_SECRET_KEY`) é armazenada nas variáveis de ambiente e autentica todas as requisições.

## 🎯 Onde Cada Informação é Alterada no Stripe

### **1. Nome do Produto**

**Onde:** Dashboard Stripe → Products → [Nome do Produto]

**Como é enviado:**
```typescript
// lib/api/stripe.ts (linha 1395-1397)
await stripe.products.update(plan.stripeProductId, {
  name: plan.name,
});
```

**API Stripe usada:** `stripe.products.update()`

**O que acontece:**
- Atualiza o nome do produto no Stripe Dashboard
- Visível em: Products → [Seu Produto] → Name

---

### **2. Preços (Monthly e Yearly)**

**Onde:** Dashboard Stripe → Products → [Nome do Produto] → Pricing

**Como é enviado:**
```typescript
// lib/api/stripe.ts (linha 1416-1423)
const newMonthlyPrice = await stripe.prices.create({
  product: plan.stripeProductId,
  unit_amount: Math.round(plan.priceMonthly * 100), // Converte para centavos
  currency: "cad",
  recurring: {
    interval: "month",
  },
});
```

**API Stripe usada:** 
- `stripe.prices.create()` - Cria novo preço
- `stripe.prices.update()` - Arquiva preço antigo (active: false)
- `stripe.prices.retrieve()` - Verifica preço atual

**O que acontece:**
- **Preços no Stripe são IMUTÁVEIS** (não podem ser editados)
- Quando o preço muda, o sistema:
  1. Cria um novo preço com o valor atualizado
  2. Arquiva o preço antigo (marca como `active: false`)
  3. Atualiza o ID do preço no Supabase

**Visível em:**
- Dashboard Stripe → Products → [Seu Produto] → Pricing
- Lista de preços mostra: preço ativo (novo) e preços arquivados (antigos)

---

### **3. Features (Funcionalidades)**

**Onde:** Dashboard Stripe → Entitlements → Features

**Como é enviado:**

#### **3.1. Criação/Atualização de Features**

```typescript
// lib/api/stripe.ts (linha 1225-1251)
// Busca feature existente
const existingFeatures = await stripe.entitlements.features.list({
  lookup_key: lookupKey, // Ex: "investments", "household"
  limit: 1,
});

if (existingFeatures.data.length > 0) {
  // Atualiza feature existente
  await stripe.entitlements.features.update(
    existingFeatures.data[0].id,
    {
      name: "Investments",
      metadata: {
        description: "Investment tracking and portfolio management"
      },
    }
  );
} else {
  // Cria nova feature
  await stripe.entitlements.features.create({
    lookup_key: "investments",
    name: "Investments",
    metadata: {
      description: "Investment tracking and portfolio management"
    },
  });
}
```

**API Stripe usada:**
- `stripe.entitlements.features.list()` - Lista features existentes
- `stripe.entitlements.features.create()` - Cria nova feature
- `stripe.entitlements.features.update()` - Atualiza feature existente

**Features criadas/atualizadas:**
- `investments` → Investment Tracking
- `household` → Household Members
- `advanced_reports` → Advanced Reports
- `csv_export` → CSV Export
- `debts` → Debt Tracking
- `goals` → Goals
- `bank_integration` → Bank Integration

**Visível em:**
- Dashboard Stripe → Entitlements → Features
- Cada feature aparece como um item separado com seu `lookup_key` e nome

---

#### **3.2. Metadados do Produto (Features como Metadados)**

**Onde:** Dashboard Stripe → Products → [Nome do Produto] → Metadata

**Como é enviado:**
```typescript
// lib/api/stripe.ts (linha 1334-1356)
const metadata: Record<string, string> = {
  planId: plan.id,
  planName: plan.name,
  // Feature flags individuais
  hasInvestments: "true",
  hasAdvancedReports: "true",
  hasCsvExport: "true",
  hasDebts: "true",
  hasGoals: "true",
  hasBankIntegration: "true",
  hasHousehold: "true",
  // Limites
  maxTransactions: "300",
  maxAccounts: "8",
  // IDs das features (separados por vírgula)
  featureIds: "feat_xxx,feat_yyy,feat_zzz",
  // JSON completo das features
  features: JSON.stringify(plan.features),
};

await stripe.products.update(plan.stripeProductId, {
  metadata,
});
```

**API Stripe usada:** `stripe.products.update()` com campo `metadata`

**O que acontece:**
- Todas as features são armazenadas nos **metadados do produto**
- Isso permite consulta rápida sem precisar verificar Entitlements
- O JSON completo das features também é armazenado

**Visível em:**
- Dashboard Stripe → Products → [Seu Produto] → Scroll até "Metadata"
- Mostra todos os pares chave-valor

---

## 📊 Mapeamento de Features

### **Features do Portal → Features do Stripe**

| Portal (Supabase) | Stripe Feature (lookup_key) | Stripe Feature (nome) |
|-------------------|---------------------------|----------------------|
| `hasInvestments` | `investments` | Investment Tracking |
| `hasHousehold` | `household` | Household Members |
| `hasAdvancedReports` | `advanced_reports` | Advanced Reports |
| `hasCsvExport` | `csv_export` | CSV Export |
| `hasDebts` | `debts` | Debt Tracking |
| `hasGoals` | `goals` | Goals |
| `hasBankIntegration` | `bank_integration` | Bank Integration |

---

## 🔍 Onde Verificar no Stripe Dashboard

### **1. Produto e Nome**
```
Dashboard Stripe
  → Products
    → [Nome do seu produto]
      → Name (aqui está o nome)
```

### **2. Preços**
```
Dashboard Stripe
  → Products
    → [Nome do seu produto]
      → Pricing
        → Lista de preços (ativos e arquivados)
```

### **3. Features (Entitlements)**
```
Dashboard Stripe
  → Entitlements
    → Features
      → Lista de todas as features criadas
```

### **4. Metadados do Produto**
```
Dashboard Stripe
  → Products
    → [Nome do seu produto]
      → Scroll até "Metadata"
        → Mostra todos os metadados (features, limites, etc.)
```

---

## 🔄 Processo Completo de Sincronização

### **Quando você salva um plano no Portal:**

1. **Salva no Supabase** (linha 113-118 de `app/api/admin/plans/route.ts`)
   ```typescript
   await supabase.from("Plan").update(updateData).eq("id", id)
   ```

2. **Invalida cache** (linha 129)
   ```typescript
   await invalidatePlansCache()
   ```

3. **Sincroniza com Stripe** (linha 135)
   ```typescript
   await syncPlanToStripe(id)
   ```

4. **Dentro de `syncPlanToStripe`:**
   - Atualiza nome do produto (linha 1395)
   - Verifica e atualiza preços (linhas 1407-1524)
   - Sincroniza features (linha 1527)
     - Cria/atualiza Features via Entitlements API
     - Atualiza metadados do produto

---

## ⚠️ Observações Importantes

### **Preços são Imutáveis**
- No Stripe, **preços não podem ser editados**
- Quando você muda um preço, o sistema:
  1. Cria um novo preço
  2. Arquiva o antigo
  3. Atualiza o ID no Supabase

### **Features são Criadas Globalmente**
- As Features no Stripe são **globais** (não específicas de um produto)
- O mesmo `lookup_key` pode ser usado em múltiplos produtos
- O sistema verifica se a feature já existe antes de criar

### **Metadados vs Entitlements**
- **Metadados**: Armazenados no produto, para referência rápida
- **Entitlements/Features**: Sistema oficial do Stripe para gerenciar acesso a features
- Ambos são atualizados para garantir consistência

---

## 🧪 Como Testar

1. **Edite um plano no Portal Management**
2. **Verifique no Stripe Dashboard:**
   - Products → Nome atualizado?
   - Products → Pricing → Preços atualizados?
   - Entitlements → Features → Features criadas/atualizadas?
   - Products → Metadata → Metadados atualizados?

3. **Verifique os logs do servidor:**
   - Procure por mensagens como:
     - `✅ Updated product name: ...`
     - `✅ Updated monthly price: ...`
     - `✅ Feature investments ensured: ...`

---

## 📝 Resumo

| Informação | Onde no Stripe | API Usada |
|-----------|----------------|-----------|
| Nome do Produto | Products → [Produto] → Name | `stripe.products.update()` |
| Preços | Products → [Produto] → Pricing | `stripe.prices.create()` + `stripe.prices.update()` |
| Features (Entitlements) | Entitlements → Features | `stripe.entitlements.features.*` |
| Metadados (Features) | Products → [Produto] → Metadata | `stripe.products.update()` (metadata) |

Todas as alterações são feitas via **Stripe API** usando o SDK oficial do Stripe para Node.js.

