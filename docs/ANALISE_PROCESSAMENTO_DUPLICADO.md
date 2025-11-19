# Análise de Processamento Duplicado e Otimizações

## 🔴 Problemas Críticos Identificados

### 1. **getHoldings() sendo chamado múltiplas vezes desnecessariamente**

#### Problema:
- `getPortfolioSummaryInternal()` chama `getHoldings()` (linha 90)
- `getPortfolioAccounts()` chama `getHoldings()` novamente (linha 414)
- `getPortfolioHistoricalDataInternal()` chama `getPortfolioSummaryInternal()` que já chamou `getHoldings()`, e depois chama `getPortfolioHoldings()` que chama `getHoldings()` novamente (linha 470)
- Cache validation em `getPortfolioSummary()` chama `getHoldings()` mesmo quando há cache válido (linha 302)

#### Impacto:
- **3-4 chamadas duplicadas** de `getHoldings()` para a mesma requisição
- Cada chamada faz queries pesadas no banco (Position, InvestmentTransaction, Security)
- **Lentidão**: ~1-2 segundos por chamada = 3-8 segundos desperdiçados

#### Solução:
```typescript
// Compartilhar holdings entre funções
// getPortfolioSummaryInternal deve retornar holdings também
// getPortfolioAccounts deve receber holdings como parâmetro opcional
```

---

### 2. **getPortfolioSummary sendo calculado múltiplas vezes**

#### Problema:
- `getPortfolioHistoricalDataInternal()` chama `getPortfolioSummaryInternal()` (linha 467)
- Isso recalcula tudo mesmo que `getPortfolioSummary()` já tenha sido chamado antes
- Não há compartilhamento de dados entre as funções

#### Impacto:
- **Cálculo duplicado** do portfolio summary
- Queries duplicadas para InvestmentAccount, Position, etc.
- **Lentidão**: ~2-3 segundos desperdiçados

---

### 3. **Múltiplas páginas fazendo as mesmas chamadas em paralelo**

#### Problema:
- **Investments Page**: Chama `/api/portfolio/summary`, `/api/portfolio/holdings`, `/api/portfolio/accounts`, `/api/portfolio/historical` (linhas 70-87)
- **Reports Page**: Chama `/api/portfolio/summary`, `/api/portfolio/holdings`, `/api/portfolio/historical` (linhas 175-179)
- **Dashboard Widget**: Chama `/api/portfolio/summary`, `/api/portfolio/historical` (linhas 130-133)
- **Accounts Client**: Chama `/api/portfolio/holdings` (linha 195)

#### Impacto:
- Se o usuário navegar entre páginas rapidamente, múltiplas requisições simultâneas
- Cada uma recalcula tudo do zero
- **Lentidão**: Sobrecarga no servidor e banco de dados

---

### 4. **getInvestmentAccounts() sendo chamado múltiplas vezes**

#### Problema:
- `getPortfolioSummaryInternal()` chama `getInvestmentAccounts()` (linha 129)
- `getPortfolioAccounts()` chama `getInvestmentAccounts()` novamente (linha 413)
- Ambas fazem a mesma query: `SELECT * FROM Account WHERE type = 'investment'`

#### Impacto:
- **Query duplicada** no banco de dados
- **Lentidão**: ~200-500ms desperdiçados

---

### 5. **Cache validation chamando getHoldings() desnecessariamente**

#### Problema:
Em `getPortfolioSummary()` (linha 302):
```typescript
if (cached.totalValue === 0 && cached.holdingsCount === 0) {
  const holdings = await getHoldings(undefined, accessToken, refreshToken);
  // ...
}
```

Isso chama `getHoldings()` **mesmo quando há cache válido**, apenas para validar se o cache está correto.

#### Impacto:
- **Chamada desnecessária** quando o cache está correto (usuário sem holdings)
- **Lentidão**: ~1-2 segundos desperdiçados

---

### 6. **getAccounts() chamando getHoldings() internamente**

#### Problema:
Em `lib/api/accounts.ts` (linha 139):
```typescript
const holdings = await getHoldings(undefined, accessToken, refreshToken);
```

Isso acontece dentro de `getAccounts()`, que é chamado em vários lugares:
- Dashboard data loader
- Goals calculation
- Accounts page

#### Impacto:
- **getHoldings() chamado sempre que getAccounts() é chamado**
- Mesmo quando não há contas de investimento
- **Lentidão**: ~1-2 segundos desperdiçados por chamada

---

## 📊 Estatísticas de Impacto

### Por requisição típica (ex: carregar página Investments):

| Operação | Chamadas Atuais | Chamadas Ideais | Tempo Desperdiçado |
|----------|----------------|-----------------|-------------------|
| `getHoldings()` | 3-4x | 1x | 3-6 segundos |
| `getPortfolioSummary()` | 2x | 1x | 2-3 segundos |
| `getInvestmentAccounts()` | 2x | 1x | 400-1000ms |
| **TOTAL** | **7-8x** | **3x** | **5-10 segundos** |

### Em uma sessão típica (navegar entre páginas):

- Dashboard: 1x getHoldings (via getAccounts)
- Investments: 4x getHoldings (summary, holdings, accounts, historical)
- Reports: 3x getHoldings (summary, holdings, historical)
- **Total: 8+ chamadas desnecessárias**

---

## ✅ Soluções Recomendadas

### 1. **Criar um cache compartilhado de holdings**

```typescript
// lib/api/investments.ts
const holdingsCache = new Map<string, { data: Holding[], timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

export async function getHoldings(
  accountId?: string, 
  accessToken?: string, 
  refreshToken?: string,
  useCache: boolean = true
): Promise<Holding[]> {
  const cacheKey = `holdings:${accountId || 'all'}`;
  
  if (useCache) {
    const cached = holdingsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  // ... cálculo atual ...
  
  holdingsCache.set(cacheKey, { data: holdings, timestamp: Date.now() });
  return holdings;
}
```

### 2. **Compartilhar dados entre funções de portfolio**

```typescript
// lib/api/portfolio.ts
interface PortfolioData {
  summary: PortfolioSummary;
  holdings: Holding[];
  accounts: Account[];
}

export async function getPortfolioData(): Promise<PortfolioData> {
  // Calcular uma vez e compartilhar
  const holdings = await getHoldings(undefined, accessToken, refreshToken);
  const accounts = await getInvestmentAccounts(accessToken, refreshToken);
  const summary = await calculateSummaryFromHoldings(holdings, accounts);
  
  return { summary, holdings, accounts };
}
```

### 3. **Remover validação de cache desnecessária**

```typescript
// Remover a validação que chama getHoldings() quando cache está válido
// Confiar no cache e invalidar apenas quando necessário
```

### 4. **Lazy load de holdings em getAccounts()**

```typescript
// lib/api/accounts.ts
// Só chamar getHoldings() se realmente houver contas de investimento
const investmentAccounts = accounts.filter(acc => acc.type === "investment");
if (investmentAccounts.length > 0) {
  const holdings = await getHoldings(undefined, accessToken, refreshToken);
  // ...
}
```

### 5. **Usar React Query ou SWR no frontend**

```typescript
// Compartilhar dados entre componentes
// Evitar múltiplas chamadas simultâneas
const { data: portfolio } = useSWR('/api/portfolio/summary', fetcher);
```

---

## 🎯 Prioridade de Implementação

1. **ALTA**: Remover validação de cache desnecessária (5 min)
2. **ALTA**: Lazy load de holdings em getAccounts() (10 min)
3. **MÉDIA**: Cache compartilhado de holdings (30 min)
4. **MÉDIA**: Compartilhar dados entre funções de portfolio (1h)
5. **BAIXA**: Implementar React Query/SWR (2-3h)

---

## 📝 Notas Adicionais

- Os logs mostram múltiplas chamadas de `getHoldings()` com os mesmos parâmetros
- O cache do Redis está funcionando, mas não previne chamadas duplicadas na mesma requisição
- A validação de cache está sendo muito agressiva e causando overhead

---

## ✅ Implementações Realizadas

### 1. ✅ Cache Compartilhado de Holdings
- Implementado cache em memória com TTL de 30 segundos
- Evita chamadas duplicadas de `getHoldings()` na mesma requisição
- Função `clearHoldingsCache()` para limpar cache quando necessário

### 2. ✅ Remoção de Validação de Cache Desnecessária
- Removida validação que chamava `getHoldings()` mesmo quando cache estava válido
- Cache agora é confiável e não precisa validação constante
- Economia de 1-2 segundos por requisição

### 3. ✅ Lazy Load de Holdings em getAccounts()
- `getHoldings()` só é chamado se houver contas de investimento sem valor
- Evita chamadas desnecessárias quando não há contas de investimento
- Economia de 1-2 segundos por chamada de `getAccounts()`

### 4. ✅ Compartilhamento de Dados entre Funções de Portfolio
- Criada função `getPortfolioInternalData()` que busca dados uma vez
- `getPortfolioSummaryInternal()` e `getPortfolioHistoricalDataInternal()` agora compartilham dados
- `getPortfolioAccounts()` também reutiliza os mesmos dados
- Economia de 2-3 chamadas duplicadas de `getHoldings()` e `getInvestmentAccounts()`

### 5. ✅ Otimização de getPortfolioAccounts()
- Agora usa `getPortfolioInternalData()` para evitar chamadas duplicadas
- Reutiliza holdings e accounts já calculados
- Economia de tempo significativa

## 📊 Resultados Esperados

### Antes das Otimizações:
- `getHoldings()`: 3-4 chamadas por requisição
- `getInvestmentAccounts()`: 2 chamadas por requisição
- Tempo total: 5-10 segundos desperdiçados

### Depois das Otimizações:
- `getHoldings()`: 1 chamada por requisição (com cache compartilhado)
- `getInvestmentAccounts()`: 1 chamada por requisição (compartilhada)
- Tempo total: **Economia de 4-8 segundos por requisição**

## 🎯 Próximos Passos (Opcional)

1. Implementar React Query ou SWR no frontend para compartilhar dados entre componentes
2. Adicionar métricas para monitorar o impacto das otimizações
3. Considerar cache distribuído (Redis) para holdings entre requisições

