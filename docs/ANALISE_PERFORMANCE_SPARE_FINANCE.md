# Análise de Performance - Spare Finance

**Data da Análise:** 15 de Novembro de 2025  
**Analisado por:** Claude (Sonnet 4.5)  
**Usuário:** Naor Tartarotti

---

## 📊 RESUMO EXECUTIVO

Foram identificados **problemas críticos de performance** na aplicação Spare Finance, com tempos de resposta de API chegando a **63 segundos**. Os problemas estão concentrados em:

1. **Polling excessivo** de updates
2. **Queries N+1** no banco de dados
3. **Falta de índices** em queries frequentes
4. **Ausência de cache** em chamadas repetitivas
5. **Problema de dados** com transações sem `securityId`

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **API `/api/dashboard/check-updates` (11-28 segundos)**

**Sintomas:**
```
GET /api/dashboard/check-updates 200 in 12.8s (proxy.ts: 12.0s)
GET /api/dashboard/check-updates 200 in 13.0s (proxy.ts: 11.8s)
GET /api/dashboard/check-updates 200 in 25.6s (proxy.ts: 12.4s)
```

**Problema:**
- Executa 6 queries simultâneas (Transaction, Account, Budget, Goal, Debt, SimpleInvestmentEntry)
- Cada query faz ORDER BY e LIMIT 1 sem índices otimizados
- Executado repetidamente (polling)

**Impacto:** Alto - Esta API é chamada constantemente para verificar updates

**Arquivo:** `/app/api/dashboard/check-updates/route.ts`

**Código Problemático:**
```typescript
const checks = await Promise.all([
  supabase
    .from("Transaction")
    .select("updatedAt, createdAt")
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle(),
  // ... mais 5 queries similares
]);
```

---

### 2. **API `/api/portfolio/summary` (6-49 segundos)**

**Sintomas:**
```
GET /api/portfolio/summary 200 in 28.1s (proxy.ts: 20.4s)
GET /api/portfolio/summary 200 in 49s (proxy.ts: 22.8s)
```

**Problemas:**
1. Chama `getHoldings()` que faz múltiplas queries complexas
2. Busca preços históricos sem cache
3. Calcula holdings de forma não otimizada (processa todos os transactions)
4. Queries N+1 para buscar dados de securities e accounts

**Impacto:** Crítico - Página de investimentos fica inacessível

**Arquivo:** `/lib/api/portfolio.ts` (linha 82)

---

### 3. **API `/api/portfolio/historical` (21-51 segundos)**

**Sintomas:**
```
GET /api/portfolio/historical?days=30 200 in 28.1s
GET /api/portfolio/historical?days=30 200 in 51s
```

**Problemas:**
1. Processa TODOS os transactions (até 5 anos atrás!)
2. Calcula portfolio value para cada dia individualmente
3. Busca preços históricos sem índices otimizados
4. Loop gigantesco processando transactions para reconstruir holdings

**Código Problemático:** (`/lib/api/portfolio.ts`, linha 275)
```typescript
const transactionsStartDate = subDays(startDate, 365 * 5); // 5 ANOS!
const transactions = await getInvestmentTransactions({
  startDate: transactionsStartDate,
  endDate,
});
```

**Impacto:** Crítico - Gráfico de performance demora minutos para carregar

---

### 4. **API `/api/ai/alerts` (28-63 segundos)**

**Sintomas:**
```
POST /api/ai/alerts 200 in 28.1s (proxy.ts: 20.5s)
POST /api/ai/alerts 200 in 63s (proxy.ts: 22.8s)
```

**Problema:**
- Provavelmente chama múltiplas APIs (incluindo portfolio) sequencialmente
- Aguarda respostas de LLM (latência de AI)
- Sem timeout ou fallback

**Impacto:** Crítico - Usuário aguarda 1 minuto por insights de AI

---

### 5. **API `/api/financial-health` (12 segundos)**

**Sintomas:**
```
GET /api/financial-health?date=2025-11-15 200 in 12.4s
GET /api/financial-health?date=2025-11-15 200 in 12.3s
```

**Problema:**
- Cálculos complexos de saúde financeira
- Provavelmente agrega dados de múltiplas fontes
- Sem cache para mesma data

---

### 6. **Transações sem `securityId` (Integridade de Dados)**

**Sintomas:**
```
[INVESTMENTS] Skipped 14 transactions without securityId: [
  'b95caadc-7761-49bc-84c0-f59bfbe5d0bb (buy)',
  '378195bc-cef1-4e72-be31-5e9c87f71077 (buy)',
  'e7aa0462-bfb3-4b30-8c1c-16426224a4b5 (dividend)',
  ...
]
```

**Problema:**
- 14 transações de investimento sem `securityId`
- Tipos afetados: buy, dividend
- Prejudica cálculos de holdings e portfolio

**Impacto:** Médio - Dados incorretos, mas aplicação continua funcionando

---

### 7. **Aviso de Segurança - Supabase Auth**

**Sintomas:**
```
Using the user object as returned from supabase.auth.getSession() 
or from some supabase.auth.onAuthStateChange() events could be insecure!
Use supabase.auth.getUser() instead
```

**Problema:**
- Uso inseguro de `getSession()` em vez de `getUser()`
- Dados vindos de cookies podem não ser autênticos

**Impacto:** Alto - Risco de segurança

**Locais afetados:** Múltiplos arquivos (precisa busca global)

---

## 💡 SOLUÇÕES PROPOSTAS

### 1. **Otimizar `/api/dashboard/check-updates`**

#### Solução A: Criar View Materializada (Recomendado)
```sql
-- Criar view materializada com os últimos updates
CREATE MATERIALIZED VIEW dashboard_last_updates AS
SELECT 
  'transactions' as table_name,
  MAX(GREATEST(updated_at, created_at)) as last_update
FROM "Transaction"
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'accounts' as table_name,
  MAX(GREATEST(updated_at, created_at)) as last_update
FROM "Account"
WHERE user_id = auth.uid()
-- ... para outras tabelas

-- Criar índice
CREATE UNIQUE INDEX idx_dashboard_last_updates_table 
  ON dashboard_last_updates(table_name);

-- Refresh automático via trigger
CREATE OR REPLACE FUNCTION refresh_dashboard_updates()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_last_updates;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Solução B: Usar Redis Cache
```typescript
// app/api/dashboard/check-updates/route.ts
import { redis } from '@/lib/services/redis';

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  const cacheKey = `updates:${userId}`;
  
  // Tentar cache primeiro (5 segundos de TTL)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }
  
  // ... buscar do banco ...
  
  // Salvar no cache
  await redis.setex(cacheKey, 5, JSON.stringify(result));
  return NextResponse.json(result);
}
```

#### Solução C: Adicionar Índices Compostos
```sql
-- Transaction
CREATE INDEX idx_transaction_user_updated 
  ON "Transaction"(user_id, updated_at DESC, created_at DESC);

-- Account  
CREATE INDEX idx_account_user_updated 
  ON "Account"(user_id, updated_at DESC, created_at DESC);

-- Budget
CREATE INDEX idx_budget_user_updated 
  ON "Budget"(user_id, updated_at DESC, created_at DESC);

-- Goal
CREATE INDEX idx_goal_user_updated 
  ON "Goal"(user_id, updated_at DESC, created_at DESC);

-- Debt
CREATE INDEX idx_debt_user_updated 
  ON "Debt"(user_id, updated_at DESC, created_at DESC);

-- SimpleInvestmentEntry
CREATE INDEX idx_simple_investment_user_updated 
  ON "SimpleInvestmentEntry"(user_id, updated_at DESC, created_at DESC);
```

---

### 2. **Otimizar `/api/portfolio/summary`**

#### Solução A: Cache de Holdings com Invalidação
```typescript
// lib/api/portfolio.ts
import { CacheManager } from '@/lib/services/cache-manager';

const cache = new CacheManager();

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const userId = await getCurrentUserId();
  const cacheKey = `portfolio:summary:${userId}`;
  
  // Tentar cache (5 minutos)
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // ... calcular summary ...
  
  // Cache com TTL de 5 minutos
  await cache.set(cacheKey, summary, 300);
  return summary;
}

// Invalidar cache quando houver updates
export async function invalidatePortfolioCache(userId: string) {
  await cache.del(`portfolio:summary:${userId}`);
  await cache.del(`portfolio:holdings:${userId}`);
  await cache.del(`portfolio:accounts:${userId}`);
}
```

#### Solução B: Otimizar Query de Holdings
```typescript
// Em vez de processar TODOS os transactions, usar view materializada
export async function getHoldings(accountId?: string): Promise<Holding[]> {
  const supabase = await createServerClient();
  
  // Usar view pré-calculada em vez de calcular on-the-fly
  const { data: holdings } = await supabase
    .from("holdings_view") // View materializada
    .select("*")
    .eq("user_id", userId);
    
  return holdings || [];
}
```

#### Solução C: Criar View Materializada para Holdings
```sql
CREATE MATERIALIZED VIEW holdings_view AS
WITH transaction_agg AS (
  SELECT 
    it.security_id,
    it.account_id,
    it.user_id,
    SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END) as total_buy,
    SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END) as total_sell,
    SUM(CASE 
      WHEN type = 'buy' THEN quantity * price + COALESCE(fees, 0)
      WHEN type = 'sell' THEN -(quantity * price - COALESCE(fees, 0))
      ELSE 0 
    END) as book_value
  FROM "InvestmentTransaction" it
  WHERE it.security_id IS NOT NULL
  GROUP BY it.security_id, it.account_id, it.user_id
)
SELECT 
  ta.security_id,
  ta.account_id,
  ta.user_id,
  s.symbol,
  s.name,
  s.class as asset_type,
  COALESCE(s.sector, 'Unknown') as sector,
  (ta.total_buy - ta.total_sell) as quantity,
  CASE 
    WHEN (ta.total_buy - ta.total_sell) > 0 
    THEN ta.book_value / (ta.total_buy - ta.total_sell)
    ELSE 0 
  END as avg_price,
  ta.book_value,
  sp.price as last_price,
  (ta.total_buy - ta.total_sell) * sp.price as market_value,
  ((ta.total_buy - ta.total_sell) * sp.price - ta.book_value) as unrealized_pnl,
  CASE 
    WHEN ta.book_value > 0 
    THEN (((ta.total_buy - ta.total_sell) * sp.price - ta.book_value) / ta.book_value) * 100
    ELSE 0 
  END as unrealized_pnl_percent,
  a.name as account_name
FROM transaction_agg ta
JOIN "Security" s ON s.id = ta.security_id
LEFT JOIN LATERAL (
  SELECT price 
  FROM "SecurityPrice" 
  WHERE security_id = ta.security_id 
  ORDER BY date DESC 
  LIMIT 1
) sp ON true
LEFT JOIN "Account" a ON a.id = ta.account_id
WHERE (ta.total_buy - ta.total_sell) > 0;

-- Criar índices
CREATE INDEX idx_holdings_view_user ON holdings_view(user_id);
CREATE INDEX idx_holdings_view_account ON holdings_view(account_id);

-- Refresh via trigger
CREATE OR REPLACE FUNCTION refresh_holdings_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY holdings_view;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_holdings_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON "InvestmentTransaction"
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_holdings_view();
```

---

### 3. **Otimizar `/api/portfolio/historical`**

#### Solução A: Pré-calcular Dados Históricos
```typescript
// Criar tabela para armazenar valores históricos pré-calculados
// Executar job diário para calcular e salvar
export async function calculateAndStoreHistoricalData(userId: string) {
  const supabase = await createServerClient();
  
  // Calcular para os últimos 365 dias
  const data = await calculateHistoricalDataOptimized(userId);
  
  // Salvar na tabela
  await supabase
    .from("PortfolioHistoricalValue")
    .upsert(data.map(d => ({
      user_id: userId,
      date: d.date,
      value: d.value,
      updated_at: new Date()
    })));
}

// API agora apenas lê dados pré-calculados
export async function getPortfolioHistoricalData(days: number = 365) {
  const supabase = await createServerClient();
  const userId = await getCurrentUserId();
  
  const startDate = subDays(new Date(), days);
  
  const { data } = await supabase
    .from("PortfolioHistoricalValue")
    .select("date, value")
    .eq("user_id", userId)
    .gte("date", formatDateStart(startDate))
    .order("date", { ascending: true });
    
  return data || [];
}
```

#### Solução B: Limitar Busca de Transactions
```typescript
// Em vez de buscar 5 anos, buscar apenas período necessário + buffer
const transactionsStartDate = subDays(startDate, 30); // Apenas 30 dias antes
```

#### Solução C: Usar Query mais Eficiente
```sql
-- Criar view para holdings históricos
CREATE MATERIALIZED VIEW portfolio_daily_values AS
WITH RECURSIVE dates AS (
  SELECT (CURRENT_DATE - INTERVAL '365 days')::date as date
  UNION ALL
  SELECT (date + INTERVAL '1 day')::date
  FROM dates
  WHERE date < CURRENT_DATE
),
holdings_by_date AS (
  -- Calcular holdings para cada data
  SELECT 
    d.date,
    it.user_id,
    it.security_id,
    SUM(
      CASE 
        WHEN it.date <= d.date AND it.type = 'buy' THEN it.quantity
        WHEN it.date <= d.date AND it.type = 'sell' THEN -it.quantity
        ELSE 0
      END
    ) as quantity
  FROM dates d
  CROSS JOIN "InvestmentTransaction" it
  WHERE it.security_id IS NOT NULL
  GROUP BY d.date, it.user_id, it.security_id
  HAVING SUM(
    CASE 
      WHEN it.date <= d.date AND it.type = 'buy' THEN it.quantity
      WHEN it.date <= d.date AND it.type = 'sell' THEN -it.quantity
      ELSE 0
    END
  ) > 0
)
SELECT 
  h.date,
  h.user_id,
  SUM(h.quantity * sp.price) as portfolio_value
FROM holdings_by_date h
JOIN "SecurityPrice" sp ON sp.security_id = h.security_id AND sp.date = h.date
GROUP BY h.date, h.user_id;
```

---

### 4. **Otimizar `/api/ai/alerts`**

#### Solução A: Implementar Timeout e Streaming
```typescript
// app/api/ai/alerts/route.ts
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  
  // Implementar timeout de 10 segundos
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    // Buscar dados em paralelo em vez de sequencial
    const [summary, transactions, health] = await Promise.all([
      getPortfolioSummary().catch(() => null),
      getRecentTransactions().catch(() => null),
      getFinancialHealth().catch(() => null),
    ]);
    
    // Chamar AI com dados agregados
    const alerts = await generateAlerts({
      summary,
      transactions,
      health,
    }, { signal: controller.signal });
    
    clearTimeout(timeout);
    return NextResponse.json(alerts);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      // Retornar resposta parcial se timeout
      return NextResponse.json({ 
        alerts: [],
        message: "Análise em andamento, tente novamente em instantes" 
      });
    }
    throw error;
  }
}
```

#### Solução B: Cache de Alerts
```typescript
// Cachear alerts por 15 minutos
const cacheKey = `ai:alerts:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return NextResponse.json(JSON.parse(cached));
}

// ... gerar alerts ...

await redis.setex(cacheKey, 900, JSON.stringify(alerts)); // 15 min
```

#### Solução C: Background Job
```typescript
// Gerar alerts em background job (cada 30 min)
// API apenas retorna últimos alerts gerados
export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  
  const { data: alerts } = await supabase
    .from("AiAlerts")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 60 * 1000)) // últimos 30 min
    .order("created_at", { ascending: false })
    .limit(10);
    
  return NextResponse.json(alerts || []);
}
```

---

### 5. **Corrigir Transações sem `securityId`**

#### Migration SQL
```sql
-- Criar script para identificar e corrigir transações
SELECT 
  id,
  type,
  date,
  description,
  account_id
FROM "InvestmentTransaction"
WHERE security_id IS NULL
  AND type IN ('buy', 'sell', 'dividend');

-- Opções:
-- 1. Deletar transações inválidas
DELETE FROM "InvestmentTransaction"
WHERE id IN (
  'b95caadc-7761-49bc-84c0-f59bfbe5d0bb',
  '378195bc-cef1-4e72-be31-5e9c87f71077',
  -- ... outros IDs
);

-- 2. Ou adicionar constraint para prevenir futuros casos
ALTER TABLE "InvestmentTransaction"
ADD CONSTRAINT check_security_required
CHECK (
  (type IN ('buy', 'sell', 'dividend') AND security_id IS NOT NULL)
  OR
  (type NOT IN ('buy', 'sell', 'dividend'))
);
```

#### Código de Validação
```typescript
// lib/validations/investment.ts
export const investmentTransactionSchema = z.object({
  type: z.enum(['buy', 'sell', 'dividend', 'interest', 'transfer_in', 'transfer_out']),
  securityId: z.string().uuid().optional(),
  // ... outros campos
}).refine((data) => {
  // Validar que buy, sell, dividend requerem securityId
  if (['buy', 'sell', 'dividend'].includes(data.type)) {
    return !!data.securityId;
  }
  return true;
}, {
  message: "Security ID is required for buy, sell, and dividend transactions",
  path: ["securityId"],
});
```

---

### 6. **Corrigir Uso Inseguro de `getSession()`**

#### Busca Global e Replace
```bash
# Encontrar todos os usos de getSession
grep -r "getSession()" --include="*.ts" --include="*.tsx"

# Encontrar todos os usos de onAuthStateChange
grep -r "onAuthStateChange" --include="*.ts" --include="*.tsx"
```

#### Exemplo de Correção
```typescript
// ❌ ANTES (Inseguro)
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;

// ✅ DEPOIS (Seguro)
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

#### Arquivos Típicos a Corrigir
- `lib/supabase-server.ts`
- `middleware.ts`
- Componentes de autenticação
- API routes que verificam usuário

---

## 📈 MELHORIAS ADICIONAIS

### 1. **Implementar Sistema de Cache Global**

```typescript
// lib/services/cache-manager.ts (expandir)
import Redis from 'ioredis';

export class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Uso:
const cache = new CacheManager();

// Invalidar todo o cache de um usuário
await cache.invalidatePattern(`user:${userId}:*`);
```

### 2. **Adicionar Monitoramento de Performance**

```typescript
// lib/services/monitoring.ts (expandir)
import { logger } from './logger';

export function withPerformanceMonitoring<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  return async () => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Slow operation: ${operationName} took ${duration}ms`);
      }
      
      // Enviar para Sentry/DataDog
      // trackPerformance(operationName, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Failed operation: ${operationName} failed after ${duration}ms`, error);
      throw error;
    }
  };
}

// Uso:
export const getPortfolioSummary = withPerformanceMonitoring(
  async () => {
    // ... código original ...
  },
  'getPortfolioSummary'
);
```

### 3. **Implementar Pagination nas Transações**

```typescript
// app/api/transactions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('Transaction')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);
    
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}
```

### 4. **Otimizar Queries com `explain analyze`**

```sql
-- Antes de criar índices, analisar queries
EXPLAIN ANALYZE
SELECT *
FROM "Transaction"
WHERE user_id = 'xxx'
ORDER BY updated_at DESC
LIMIT 1;

-- Ver custo e tempo de execução
-- Planejar índices baseado nos resultados
```

---

## 🎯 PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### **Fase 1 - Crítico (Implementar Imediatamente)**
1. ✅ Adicionar índices nas tabelas principais (1-2 horas)
2. ✅ Implementar cache Redis para check-updates (2-3 horas)
3. ✅ Limitar busca de transactions históricos para 30 dias (30 min)
4. ✅ Corrigir uso de getSession() → getUser() (1-2 horas)

**Tempo estimado:** 1 dia  
**Impacto:** Redução de 50-70% no tempo de resposta

### **Fase 2 - Alto (Próxima Semana)**
1. ✅ Criar view materializada para holdings (3-4 horas)
2. ✅ Implementar cache para portfolio summary (2 horas)
3. ✅ Corrigir transações sem securityId (1 hora)
4. ✅ Adicionar timeouts em APIs de AI (1 hora)

**Tempo estimado:** 2 dias  
**Impacto:** Redução de 80-90% no tempo de resposta

### **Fase 3 - Médio (Próximas 2 Semanas)**
1. ✅ Implementar background jobs para cálculos pesados (1 semana)
2. ✅ Criar view materializada para dados históricos (3-4 horas)
3. ✅ Implementar monitoramento de performance (2-3 horas)
4. ✅ Adicionar pagination em todas as listas (1 dia)

**Tempo estimado:** 2 semanas  
**Impacto:** Sistema totalmente otimizado

---

## 📊 MÉTRICAS ESPERADAS

### Antes vs Depois

| Endpoint | Antes | Depois (Fase 1) | Depois (Fase 2) | Melhoria |
|----------|-------|-----------------|-----------------|----------|
| `/api/dashboard/check-updates` | 12-28s | 3-5s | <1s | **96% mais rápido** |
| `/api/portfolio/summary` | 6-49s | 2-4s | <1s | **98% mais rápido** |
| `/api/portfolio/historical` | 21-51s | 5-8s | <2s | **96% mais rápido** |
| `/api/ai/alerts` | 28-63s | 10-15s | <5s | **92% mais rápido** |
| `/api/financial-health` | 12s | 3-4s | <1s | **92% mais rápido** |

---

## 🛠️ SCRIPTS DE IMPLEMENTAÇÃO

### Script 1: Criar Índices
```sql
-- Executar no Supabase SQL Editor
-- File: migrations/20251115_add_performance_indexes.sql

BEGIN;

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transaction_user_updated 
  ON "Transaction"(user_id, updated_at DESC, created_at DESC)
  WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transaction_user_date 
  ON "Transaction"(user_id, date DESC)
  WHERE date IS NOT NULL;

-- Account indexes
CREATE INDEX IF NOT EXISTS idx_account_user_updated 
  ON "Account"(user_id, updated_at DESC, created_at DESC)
  WHERE updated_at IS NOT NULL;

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budget_user_updated 
  ON "Budget"(user_id, updated_at DESC, created_at DESC)
  WHERE updated_at IS NOT NULL;

-- Goal indexes
CREATE INDEX IF NOT EXISTS idx_goal_user_updated 
  ON "Goal"(user_id, updated_at DESC, created_at DESC)
  WHERE updated_at IS NOT NULL;

-- Debt indexes
CREATE INDEX IF NOT EXISTS idx_debt_user_updated 
  ON "Debt"(user_id, updated_at DESC, created_at DESC)
  WHERE updated_at IS NOT NULL;

-- Investment indexes
CREATE INDEX IF NOT EXISTS idx_investment_transaction_user_date 
  ON "InvestmentTransaction"(user_id, date DESC)
  WHERE date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investment_transaction_security 
  ON "InvestmentTransaction"(security_id, account_id)
  WHERE security_id IS NOT NULL;

-- SecurityPrice indexes
CREATE INDEX IF NOT EXISTS idx_security_price_security_date 
  ON "SecurityPrice"(security_id, date DESC)
  WHERE date IS NOT NULL;

-- Position indexes (Questrade)
CREATE INDEX IF NOT EXISTS idx_position_account_open 
  ON "Position"(account_id, "openQuantity")
  WHERE "openQuantity" > 0;

COMMIT;

-- Verificar tamanho dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Script 2: Criar Views Materializadas
```sql
-- File: migrations/20251115_create_materialized_views.sql

-- View para holdings
CREATE MATERIALIZED VIEW IF NOT EXISTS holdings_view AS
WITH transaction_agg AS (
  SELECT 
    it.security_id,
    it.account_id,
    it.user_id,
    SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END) as total_buy,
    SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END) as total_sell,
    SUM(CASE 
      WHEN type = 'buy' THEN quantity * price + COALESCE(fees, 0)
      WHEN type = 'sell' THEN -(quantity * price - COALESCE(fees, 0))
      ELSE 0 
    END) as book_value
  FROM "InvestmentTransaction" it
  WHERE it.security_id IS NOT NULL
  GROUP BY it.security_id, it.account_id, it.user_id
)
SELECT 
  ta.security_id,
  ta.account_id,
  ta.user_id,
  s.symbol,
  s.name,
  s.class as asset_type,
  COALESCE(s.sector, 'Unknown') as sector,
  (ta.total_buy - ta.total_sell) as quantity,
  CASE 
    WHEN (ta.total_buy - ta.total_sell) > 0 
    THEN ta.book_value / (ta.total_buy - ta.total_sell)
    ELSE 0 
  END as avg_price,
  ta.book_value,
  sp.price as last_price,
  (ta.total_buy - ta.total_sell) * sp.price as market_value,
  ((ta.total_buy - ta.total_sell) * sp.price - ta.book_value) as unrealized_pnl,
  CASE 
    WHEN ta.book_value > 0 
    THEN (((ta.total_buy - ta.total_sell) * sp.price - ta.book_value) / ta.book_value) * 100
    ELSE 0 
  END as unrealized_pnl_percent,
  a.name as account_name,
  NOW() as last_updated
FROM transaction_agg ta
JOIN "Security" s ON s.id = ta.security_id
LEFT JOIN LATERAL (
  SELECT price 
  FROM "SecurityPrice" 
  WHERE security_id = ta.security_id 
  ORDER BY date DESC 
  LIMIT 1
) sp ON true
LEFT JOIN "Account" a ON a.id = ta.account_id
WHERE (ta.total_buy - ta.total_sell) > 0;

-- Criar índices na view
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_view_unique 
  ON holdings_view(user_id, security_id, account_id);
  
CREATE INDEX IF NOT EXISTS idx_holdings_view_user 
  ON holdings_view(user_id);

-- Função para refresh
CREATE OR REPLACE FUNCTION refresh_holdings_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY holdings_view;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-refresh (executar em background)
CREATE OR REPLACE FUNCTION schedule_holdings_refresh()
RETURNS void AS $$
BEGIN
  PERFORM pg_notify('refresh_holdings', '');
END;
$$ LANGUAGE plpgsql;

-- Trigger após mudanças em transactions
DROP TRIGGER IF EXISTS holdings_refresh_trigger ON "InvestmentTransaction";
CREATE TRIGGER holdings_refresh_trigger
AFTER INSERT OR UPDATE OR DELETE ON "InvestmentTransaction"
FOR EACH STATEMENT
EXECUTE FUNCTION schedule_holdings_refresh();

-- Refresh inicial
REFRESH MATERIALIZED VIEW holdings_view;
```

### Script 3: Limpar Dados Inválidos
```sql
-- File: migrations/20251115_clean_invalid_data.sql

BEGIN;

-- 1. Identificar transações problemáticas
CREATE TEMP TABLE invalid_transactions AS
SELECT 
  id,
  type,
  date,
  description,
  account_id,
  security_id
FROM "InvestmentTransaction"
WHERE security_id IS NULL
  AND type IN ('buy', 'sell', 'dividend');

-- 2. Log das transações que serão removidas
DO $$
DECLARE
  tx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tx_count FROM invalid_transactions;
  RAISE NOTICE 'Found % invalid transactions to remove', tx_count;
END $$;

-- 3. Backup antes de deletar (opcional)
CREATE TABLE IF NOT EXISTS "InvestmentTransaction_backup_20251115" AS
SELECT * FROM "InvestmentTransaction"
WHERE id IN (SELECT id FROM invalid_transactions);

-- 4. Deletar transações inválidas
DELETE FROM "InvestmentTransaction"
WHERE id IN (SELECT id FROM invalid_transactions);

-- 5. Adicionar constraint para prevenir futuros casos
ALTER TABLE "InvestmentTransaction"
DROP CONSTRAINT IF EXISTS check_security_required;

ALTER TABLE "InvestmentTransaction"
ADD CONSTRAINT check_security_required
CHECK (
  (type IN ('buy', 'sell', 'dividend') AND security_id IS NOT NULL)
  OR
  (type NOT IN ('buy', 'sell', 'dividend'))
);

-- 6. Verificar integridade
SELECT 
  type,
  COUNT(*) as count,
  COUNT(security_id) as with_security,
  COUNT(*) - COUNT(security_id) as without_security
FROM "InvestmentTransaction"
GROUP BY type
ORDER BY type;

COMMIT;
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Otimizações Críticas
- [ ] Executar script de índices (`20251115_add_performance_indexes.sql`)
- [ ] Configurar Redis para cache
- [ ] Atualizar endpoint `/api/dashboard/check-updates` com cache
- [ ] Limitar busca de transactions em `getPortfolioHistoricalData`
- [ ] Buscar e substituir `getSession()` por `getUser()`
- [ ] Testar todos os endpoints críticos
- [ ] Monitorar logs por 24h

### Fase 2 - Views e Cache
- [ ] Executar script de views materializadas
- [ ] Implementar `CacheManager` expandido
- [ ] Atualizar `getHoldings()` para usar view materializada
- [ ] Adicionar cache em `getPortfolioSummary()`
- [ ] Executar script de limpeza de dados inválidos
- [ ] Adicionar timeouts em APIs de AI
- [ ] Testar integridade dos dados
- [ ] Atualizar documentação

### Fase 3 - Background Jobs
- [ ] Criar job para refresh de views materializadas
- [ ] Implementar job para cálculo de dados históricos
- [ ] Configurar job para geração de AI alerts
- [ ] Adicionar monitoramento de performance
- [ ] Implementar pagination em listas grandes
- [ ] Setup de alertas para queries lentas
- [ ] Documentar jobs e manutenção

---

## 🚨 NOTAS IMPORTANTES

1. **Backup antes de mudanças:** Sempre fazer backup antes de executar migrations
2. **Testar em staging:** Testar todas as mudanças em ambiente de desenvolvimento primeiro
3. **Monitorar Redis:** Configurar limites de memória e política de eviction
4. **Views materializadas:** Configurar refresh automático em horários de baixo uso
5. **Índices:** Monitorar tamanho dos índices e impacto no write performance

---

## 📞 PRÓXIMOS PASSOS

1. **Reunir com time técnico** para aprovar plano
2. **Alocar tempo de desenvolvimento** (estimado 2 semanas)
3. **Configurar ambiente de staging** para testes
4. **Executar Fase 1** (1 dia de trabalho)
5. **Monitorar e ajustar** baseado em métricas reais
6. **Executar Fases 2 e 3** progressivamente

---

## 🎓 RECURSOS ADICIONAIS

### Documentação Relevante
- [Supabase Performance Guide](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [Next.js API Routes Optimization](https://nextjs.org/docs/api-routes/introduction)

### Ferramentas de Monitoramento
- Sentry (já configurado) - para erros e performance
- Vercel Analytics - para métricas de frontend
- PostgreSQL pg_stat_statements - para análise de queries
- Redis Monitor - para análise de cache hits/misses

---

**Fim do Relatório**

*Gerado em: 15 de Novembro de 2025*  
*Por: Claude (Sonnet 4.5)*
