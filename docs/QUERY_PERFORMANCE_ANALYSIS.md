# Query Performance Analysis
**Data:** Novembro 2025  
**Objetivo:** Analisar dados de performance de queries PostgreSQL e identificar otimizações

---

## 📊 RESUMO EXECUTIVO

Análise de performance de queries PostgreSQL revelou que **85.2% do tempo total de execução** está concentrado em uma única query: `realtime.list_changes`. Esta query é chamada **10,424 vezes** e representa o principal gargalo de performance.

### Principais Descobertas

1. **Query `realtime.list_changes` domina o tempo de execução** (85.2%)
   - 10,424 chamadas
   - Tempo médio: 3.63ms por chamada
   - Tempo total: 37.79 segundos
   - Cache hit rate: 100% (boa notícia)

2. **Queries de schema introspection** consomem tempo significativo
   - Query de tabelas: 8.91% do tempo total (3.95s)
   - Query de funções: 1.07% do tempo total (472ms)
   - Query de colunas: 0.10% do tempo total (40ms)

3. **Queries PostgREST** têm bom desempenho
   - Account queries: 0.16% do tempo total
   - Transaction queries: 0.13% do tempo total
   - Cache hit rate: 100% (excelente)

---

## 🔍 ANÁLISE DETALHADA

### 1. Query `realtime.list_changes` (CRÍTICO)

**Query:**
```sql
SELECT wal->>$5 as type,
       wal->>$6 as schema,
       wal->>$7 as table,
       wal->>$8 as columns,
       wal->>$9 as record,
       wal->>$10 as old_record,
       wal->>$11 as commit_timestamp,
       subscription_ids,
       errors
FROM realtime.list_changes($1, $2, $3, $4)
```

**Estatísticas:**
- **Calls:** 10,424
- **Mean time:** 3.63ms
- **Min time:** 3.36ms
- **Max time:** 173.25ms (outlier preocupante)
- **Total time:** 37.79s
- **Prop total time:** 85.2%
- **Cache hit rate:** 100%
- **Rows read:** 0

**Análise:**
- Esta query é parte do sistema Supabase Realtime
- É chamada toda vez que há uma mudança em tabelas com subscriptions ativas
- O cache hit rate de 100% indica que os dados estão em cache, mas a query ainda é executada
- O outlier de 173ms sugere que em alguns casos a query pode ser lenta

**Causa Raiz:**
- Múltiplas subscriptions Realtime ativas simultaneamente (Transaction, Budget, Goal, Account)
- Cada subscription gera chamadas frequentes a `realtime.list_changes`
- O componente `DashboardRealtime` mantém 4 subscriptions ativas quando o usuário está no dashboard

**Impacto:**
- **ALTO** - Esta query é responsável por 85% do tempo total de execução
- Mesmo com cache hit rate de 100%, a query ainda precisa ser executada
- O overhead de processar WAL (Write-Ahead Log) pode ser significativo

---

### 2. Query de Schema Introspection (Tabelas)

**Query:** Complexa query para listar tabelas com metadados

**Estatísticas:**
- **Calls:** 1
- **Mean time:** 3,952.59ms (3.95 segundos)
- **Total time:** 3.95s
- **Prop total time:** 8.91%
- **Cache hit rate:** 100%
- **Rows read:** 1

**Análise:**
- Esta query é executada apenas 1 vez (provavelmente durante inicialização)
- Apesar de ser lenta (3.95s), não é um problema crítico pois é executada raramente
- Cache hit rate de 100% indica que resultados estão sendo cacheados

**Recomendação:**
- **BAIXA PRIORIDADE** - Query executada raramente, não impacta performance geral

---

### 3. Query de Schema Introspection (Funções)

**Estatísticas:**
- **Calls:** 2
- **Mean time:** 236.40ms
- **Total time:** 472.79ms
- **Prop total time:** 1.07%
- **Cache hit rate:** 100%

**Análise:**
- Query executada apenas 2 vezes
- Tempo médio razoável (236ms)
- Não é um problema crítico

**Recomendação:**
- **BAIXA PRIORIDADE**

---

### 4. Queries PostgREST

#### Account Queries
- **Calls:** 20
- **Mean time:** 3.58ms
- **Total time:** 71.54ms
- **Prop total time:** 0.16%
- **Cache hit rate:** 100%

#### Transaction Queries
- **Calls:** 20
- **Mean time:** 2.79ms
- **Total time:** 55.86ms
- **Prop total time:** 0.13%
- **Cache hit rate:** 100%

**Análise:**
- Queries PostgREST têm excelente desempenho
- Cache hit rate de 100% indica que dados estão sendo cacheados corretamente
- Tempo médio muito baixo (< 4ms)

**Recomendação:**
- **NENHUMA AÇÃO NECESSÁRIA** - Performance excelente

---

## 🎯 RECOMENDAÇÕES DE OTIMIZAÇÃO

### Prioridade ALTA - Otimizar Realtime Subscriptions

#### 1. Reduzir Número de Subscriptions Ativas

**Problema:** O componente `DashboardRealtime` mantém 4 subscriptions ativas simultaneamente (Transaction, Budget, Goal, Account).

**Solução 1: Consolidar em uma única subscription**
```typescript
// ✅ Consolidar múltiplas subscriptions em uma única
supabase
  .channel("dashboard-all")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "Transaction",
    },
    () => scheduleRefresh()
  )
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "Budget",
    },
    () => scheduleRefresh()
  )
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "Goal",
    },
    () => scheduleRefresh()
  )
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "Account",
    },
    () => scheduleRefresh()
  )
  .subscribe();
```

**Benefícios:**
- Reduz número de canais Realtime ativos
- Pode reduzir chamadas a `realtime.list_changes`
- Mantém funcionalidade intacta

**Solução 2: Usar filtros mais específicos**
```typescript
// ✅ Adicionar filtros para reduzir eventos desnecessários
supabase
  .channel("dashboard-transactions")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "Transaction",
      filter: `userId=eq.${userId}`, // Apenas mudanças do usuário atual
    },
    () => scheduleRefresh()
  )
  .subscribe();
```

**Benefícios:**
- Reduz número de eventos processados
- Filtra apenas mudanças relevantes
- Pode reduzir significativamente chamadas a `realtime.list_changes`

**Solução 3: Implementar debouncing mais agressivo**
```typescript
// ✅ Debouncing mais agressivo (500ms → 2000ms)
const scheduleRefresh = async () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(async () => {
    router.refresh();
  }, 2000); // Aumentar para 2 segundos
};
```

**Benefícios:**
- Reduz número de refreshs do dashboard
- Menos chamadas a `realtime.list_changes`
- Melhor experiência do usuário (menos flickering)

#### 2. Implementar Lazy Loading de Subscriptions

**Problema:** Subscriptions são criadas imediatamente quando o componente monta.

**Solução:** Criar subscriptions apenas quando necessário
```typescript
// ✅ Lazy loading de subscriptions
useEffect(() => {
  if (pathname !== "/dashboard") {
    return;
  }

  // Aguardar 1 segundo antes de criar subscriptions
  const subscriptionTimeout = setTimeout(() => {
    // Criar subscriptions aqui
  }, 1000);

  return () => {
    clearTimeout(subscriptionTimeout);
    // Cleanup subscriptions
  };
}, [pathname]);
```

**Benefícios:**
- Reduz subscriptions ativas em páginas que não precisam
- Melhora performance inicial do dashboard

#### 3. Usar Polling como Alternativa

**Problema:** Realtime subscriptions podem ser overkill para alguns casos.

**Solução:** Usar polling para dados que não precisam de atualização instantânea
```typescript
// ✅ Polling como alternativa para alguns dados
useEffect(() => {
  if (pathname !== "/dashboard") {
    return;
  }

  // Usar polling para Budget e Goal (mudam menos frequentemente)
  const pollingInterval = setInterval(() => {
    router.refresh();
  }, 30000); // 30 segundos

  // Usar Realtime apenas para Transaction e Account (mudam frequentemente)
  const realtimeSubscriptions = [
    // Apenas Transaction e Account
  ];

  return () => {
    clearInterval(pollingInterval);
    // Cleanup subscriptions
  };
}, [pathname]);
```

**Benefícios:**
- Reduz carga no sistema Realtime
- Mantém atualização para dados críticos (Transaction, Account)
- Usa polling para dados menos críticos (Budget, Goal)

---

### Prioridade MÉDIA - Otimizações Adicionais

#### 1. Monitorar Outliers

**Problema:** Query `realtime.list_changes` tem outlier de 173ms (vs média de 3.63ms).

**Solução:** Adicionar logging para identificar quando outliers ocorrem
```typescript
// ✅ Logging de performance
const startTime = performance.now();
// ... operação ...
const endTime = performance.now();
if (endTime - startTime > 50) { // Threshold de 50ms
  console.warn('Slow realtime operation:', endTime - startTime);
}
```

**Benefícios:**
- Identifica padrões de lentidão
- Permite investigação de causas raiz

#### 2. Implementar Circuit Breaker

**Problema:** Se Realtime estiver com problemas, pode impactar toda a aplicação.

**Solução:** Implementar circuit breaker para Realtime
```typescript
// ✅ Circuit breaker para Realtime
let consecutiveFailures = 0;
const MAX_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minuto

const subscribeWithCircuitBreaker = () => {
  if (consecutiveFailures >= MAX_FAILURES) {
    console.warn('Realtime circuit breaker open, using polling');
    // Fallback para polling
    return;
  }

  try {
    // Tentar subscription
  } catch (error) {
    consecutiveFailures++;
    // Após timeout, resetar circuit breaker
  }
};
```

**Benefícios:**
- Previne cascata de falhas
- Fallback automático para polling
- Melhora resiliência da aplicação

---

## 📈 MÉTRICAS ESPERADAS

### Após Implementação das Otimizações

| Métrica | Antes | Depois | Melhoria Esperada |
|---------|-------|--------|-------------------|
| Chamadas a `realtime.list_changes` | 10,424 | 3,000-5,000 | **50-70% redução** ⬆️ |
| Tempo total de `realtime.list_changes` | 37.79s | 11-19s | **50-70% redução** ⬆️ |
| Prop total time de `realtime.list_changes` | 85.2% | 40-60% | **25-45% redução** ⬆️ |
| Número de subscriptions ativas (Realtime) | 4 | 1 | **75% redução** ⬆️ |
| Tabelas monitoradas via Realtime | 4 | 2 | **50% redução** |
| Refreshs do dashboard | Alto | Baixo-Médio | **40-60% redução** ⬆️ |
| Resiliência a falhas | Nenhuma | Circuit breaker + fallback | **Melhoria significativa** ✅ |

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1 - Otimizações Críticas (Alta Prioridade)

1. **Consolidar subscriptions Realtime** (1-2 horas)
   - Modificar `components/dashboard/dashboard-realtime.tsx`
   - Testar funcionalidade
   - Impacto: **ALTO** - Reduz 30-50% das chamadas

2. **Adicionar filtros específicos** (1 hora)
   - Filtrar por `userId` nas subscriptions
   - Testar que apenas mudanças relevantes são processadas
   - Impacto: **MÉDIO-ALTO** - Reduz eventos desnecessários

3. **Aumentar debouncing** (30 minutos)
   - Aumentar de 500ms para 2000ms
   - Testar UX
   - Impacto: **MÉDIO** - Reduz refreshs

### Fase 2 - Otimizações Adicionais (Média Prioridade)

1. **Implementar lazy loading de subscriptions** (1 hora)
   - Adicionar delay antes de criar subscriptions
   - Testar comportamento
   - Impacto: **MÉDIO** - Melhora performance inicial

2. **Usar polling para dados menos críticos** (2 horas)
   - Migrar Budget e Goal para polling
   - Manter Realtime apenas para Transaction e Account
   - Testar funcionalidade
   - Impacto: **MÉDIO** - Reduz carga no Realtime

3. **Adicionar logging de performance** (1 hora)
   - Logging de outliers
   - Monitoramento de performance
   - Impacto: **BAIXO** - Melhora observabilidade

### Fase 3 - Resiliência (Baixa Prioridade)

1. **Implementar circuit breaker** (2-3 horas)
   - Circuit breaker para Realtime
   - Fallback para polling
   - Testar cenários de falha
   - Impacto: **BAIXO** - Melhora resiliência

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Fase 1 - Otimizações Críticas

- [x] Consolidar subscriptions Realtime em uma única subscription ✅ IMPLEMENTADO
- [ ] Adicionar filtros por `userId` nas subscriptions (requer configuração RLS específica)
- [x] Aumentar debouncing de 500ms para 2000ms ✅ IMPLEMENTADO
- [x] Adicionar lazy loading de subscriptions (1s delay) ✅ IMPLEMENTADO
- [ ] Testar funcionalidade após mudanças
- [ ] Monitorar métricas de performance

### ✅ Fase 2 - Otimizações Adicionais

- [x] Implementar lazy loading de subscriptions ✅ IMPLEMENTADO (Fase 1)
- [x] Migrar Budget e Goal para polling ✅ IMPLEMENTADO
- [x] Adicionar logging de performance ✅ IMPLEMENTADO
- [ ] Testar comportamento após mudanças

### ✅ Fase 3 - Resiliência

- [x] Implementar circuit breaker ✅ IMPLEMENTADO
- [x] Adicionar fallback para polling ✅ IMPLEMENTADO
- [ ] Testar cenários de falha

---

## 🔧 ARQUIVOS MODIFICADOS

### Componentes React

1. **`components/dashboard/dashboard-realtime.tsx`** ✅ MODIFICADO
   - ✅ Consolidado subscriptions críticas (Transaction, Account) em 1 channel único
   - ✅ Aumentado debouncing de 500ms para 2000ms
   - ✅ Implementado lazy loading (1s delay antes de criar subscriptions)
   - ✅ Usado useRef para gerenciar subscription corretamente
   - ✅ **NOVO:** Implementado estratégia híbrida (Realtime + Polling)
     - Realtime apenas para Transaction e Account (mudam frequentemente)
     - Polling para Budget e Goal (mudam menos frequentemente, 30s intervalo)
   - ✅ **NOVO:** Implementado circuit breaker com fallback automático
     - Máximo de 5 falhas consecutivas
     - Timeout de 60 segundos para reset
     - Fallback automático para polling quando circuit breaker está aberto
   - ✅ **NOVO:** Adicionado logging de performance
     - Monitora operações lentas (> 50ms)
     - Logs de status de subscription
     - Ajuda a identificar outliers e problemas

### Hooks

2. **`hooks/use-dashboard-updates.ts`** (se necessário)
   - Ajustar polling se migrar para polling híbrido

### Utilitários

3. **`lib/utils/realtime.ts`** (novo arquivo)
   - Circuit breaker
   - Logging de performance
   - Helpers para subscriptions

---

## 📚 REFERÊNCIAS

- [Supabase Realtime Performance](https://supabase.com/docs/guides/realtime/performance)
- [PostgreSQL WAL Performance](https://www.postgresql.org/docs/current/wal.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## 🎯 CONCLUSÃO

A análise revela que **85.2% do tempo de execução** está concentrado na query `realtime.list_changes`, que é parte do sistema Supabase Realtime. Embora o cache hit rate seja de 100%, a query ainda precisa ser executada para cada evento Realtime.

### Otimizações Implementadas

As seguintes otimizações foram implementadas com sucesso:

1. ✅ **Consolidação de subscriptions** - Reduzido de 4 para 1 channel Realtime
2. ✅ **Estratégia híbrida** - Realtime apenas para dados críticos (Transaction, Account), polling para dados menos críticos (Budget, Goal)
3. ✅ **Aumento de debouncing** - De 500ms para 2000ms
4. ✅ **Lazy loading** - Delay de 1s antes de criar subscriptions
5. ✅ **Circuit breaker** - Proteção contra falhas com fallback automático para polling
6. ✅ **Logging de performance** - Monitoramento de operações lentas e outliers

### Resultados Esperados

Com essas otimizações implementadas, esperamos:
- **50-70% de redução** nas chamadas a `realtime.list_changes` (vs 30-50% original)
- **50-70% de redução** no tempo total de `realtime.list_changes`
- **75% de redução** no número de subscriptions Realtime ativas
- **Melhoria significativa** na resiliência com circuit breaker e fallback automático

### Próximos Passos

1. **Testar funcionalidade** - Verificar que todas as otimizações funcionam corretamente
2. **Monitorar métricas** - Acompanhar performance após implementação
3. **Ajustar configurações** - Fine-tune de intervalos de polling e thresholds do circuit breaker se necessário

---

**Fim do Relatório**

*Gerado em: Novembro 2025*  
*Baseado em dados de performance PostgreSQL*

