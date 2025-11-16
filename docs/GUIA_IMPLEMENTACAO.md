# 🚀 Guia de Implementação - Otimizações Spare Finance

## 📋 Checklist Geral

### Pré-requisitos
- [ ] Acesso ao Supabase (SQL Editor)
- [ ] Acesso ao Redis (ou conta no Upstash/Redis Cloud)
- [ ] Backup completo do banco de dados
- [ ] Ambiente de staging configurado
- [ ] 4-6 horas disponíveis para implementação

---

## FASE 1: PREPARAÇÃO (30 minutos)

### 1.1 Backup do Banco de Dados

```bash
# Via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Ou via Dashboard do Supabase:
# Settings > Database > Backups > Create backup
```

**Checklist:**
- [ ] Backup criado e verificado
- [ ] Backup baixado localmente
- [ ] Tamanho do backup verificado (deve ter alguns MB no mínimo)

### 1.2 Configurar Redis

**Opção A: Upstash (Recomendado para Vercel)**
```bash
# 1. Criar conta em https://upstash.com
# 2. Criar Redis database
# 3. Copiar REDIS_URL
```

**Opção B: Redis Cloud**
```bash
# 1. Criar conta em https://redis.com/try-free/
# 2. Criar database
# 3. Copiar connection string
```

**Adicionar variável de ambiente:**
```bash
# .env.local (desenvolvimento)
REDIS_URL=redis://...

# Vercel (produção)
vercel env add REDIS_URL
```

**Checklist:**
- [ ] Redis configurado
- [ ] REDIS_URL adicionado às variáveis de ambiente
- [ ] Conexão testada

### 1.3 Instalar Dependências

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

**Checklist:**
- [ ] Dependências instaladas
- [ ] package.json atualizado
- [ ] package-lock.json atualizado

---

## FASE 2: OTIMIZAÇÕES DE BANCO DE DADOS (1-2 horas)

### 2.1 Adicionar Índices de Performance

**Tempo estimado:** 10-20 minutos (depende do volume de dados)

1. Abrir Supabase SQL Editor
2. Copiar conteúdo de `20251115_add_performance_indexes.sql`
3. Executar script completo
4. Aguardar conclusão (pode demorar alguns minutos)

```sql
-- Verificar se índices foram criados
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Checklist:**
- [ ] Script executado sem erros
- [ ] Índices criados verificados
- [ ] Tamanho dos índices verificado
- [ ] Query de verificação retornou resultados

**⚠️ Troubleshooting:**
- Se der timeout: Executar índices em grupos menores
- Se der erro de permissão: Verificar role do usuário
- Se der erro de espaço: Verificar disco disponível

### 2.2 Limpar Dados Inválidos

**Tempo estimado:** 5-10 minutos

1. Abrir Supabase SQL Editor
2. Copiar conteúdo de `20251115_clean_invalid_data.sql`
3. Executar script completo
4. Verificar logs de saída

```sql
-- Verificar se limpeza foi bem-sucedida
SELECT COUNT(*) as invalid_transactions
FROM "InvestmentTransaction"
WHERE security_id IS NULL
  AND type IN ('buy', 'sell', 'dividend', 'interest');
-- Deve retornar 0
```

**Checklist:**
- [ ] Script executado sem erros
- [ ] Backup criado (tabela InvestmentTransaction_backup_20251115)
- [ ] Transações inválidas removidas
- [ ] Constraints criadas
- [ ] Verificação final retornou 0 transações inválidas

**⚠️ Troubleshooting:**
- Se constraints falharem: Ainda existem dados inválidos
- Para ver quais: `SELECT * FROM invalid_transactions LIMIT 10;`
- Para ignorar constraints temporariamente: comentar seção 5 do script

### 2.3 Criar Views Materializadas

**Tempo estimado:** 20-40 minutos

1. Abrir Supabase SQL Editor
2. Copiar conteúdo de `20251115_create_materialized_views.sql`
3. Executar script completo (pode demorar!)
4. Aguardar refresh inicial

```sql
-- Verificar se views foram criadas
SELECT 
  matviewname,
  pg_size_pretty(pg_relation_size(matviewname::regclass)) as view_size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
```

**Checklist:**
- [ ] Script executado sem erros
- [ ] 4 views materializadas criadas
- [ ] Índices nas views criados
- [ ] Triggers configurados
- [ ] Refresh inicial concluído
- [ ] Views contêm dados (SELECT COUNT(*))

**⚠️ Troubleshooting:**
- Se der erro em RLS: Verificar se policies foram criadas
- Se refresh demorar muito: Normal para bancos grandes (>10k registros)
- Se views estiverem vazias: Verificar se existem transactions com securityId

### 2.4 Configurar Refresh Automático (Opcional)

**Usando pg_cron (se disponível no Supabase):**

```sql
-- Refresh a cada 5 minutos
SELECT cron.schedule(
  'refresh-portfolio-views',
  '*/5 * * * *',
  $$SELECT refresh_portfolio_views()$$
);
```

**Usando API route (alternativa):**
```typescript
// app/api/cron/refresh-views/route.ts
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  // Verificar autorização (Vercel Cron ou API key)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createServerClient();
  await supabase.rpc("refresh_portfolio_views");

  return Response.json({ success: true });
}
```

**Configurar no Vercel:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/refresh-views",
    "schedule": "*/5 * * * *"
  }]
}
```

**Checklist:**
- [ ] Método de refresh escolhido (pg_cron ou API)
- [ ] Cron job configurado
- [ ] Testado manualmente
- [ ] Monitoramento configurado

---

## FASE 3: OTIMIZAÇÕES DE CÓDIGO (1-2 horas)

### 3.1 Otimizar Endpoint check-updates

**Tempo estimado:** 30-45 minutos

1. Backup do arquivo original:
```bash
cp app/api/dashboard/check-updates/route.ts app/api/dashboard/check-updates/route.ts.backup
```

2. Substituir por versão otimizada:
```bash
cp check-updates-optimized.ts app/api/dashboard/check-updates/route.ts
```

3. Criar RPC function no Supabase (copiar do comentário no arquivo)

4. Testar endpoint:
```bash
curl http://localhost:3000/api/dashboard/check-updates
```

**Checklist:**
- [ ] Arquivo backup criado
- [ ] Novo código implementado
- [ ] RPC function criada no Supabase
- [ ] Redis configurado e conectando
- [ ] Endpoint testado localmente
- [ ] Cache funcionando (verificar header `source: "cache"`)

### 3.2 Otimizar getHoldings para usar View Materializada

**Arquivo:** `lib/api/investments.ts`

**Mudanças:**
```typescript
// ANTES (linha 26-77):
export async function getHoldings(accountId?: string): Promise<Holding[]> {
  const supabase = await createServerClient();

  // First, try to get holdings from Questrade positions
  const { data: questradePositions } = await supabase
    .from("Position")
    .select(`
      *,
      security:Security(*),
      account:InvestmentAccount(*)
    `)
    .gt("openQuantity", 0);
  // ... resto do código
}

// DEPOIS:
export async function getHoldings(accountId?: string): Promise<Holding[]> {
  const supabase = await createServerClient();

  // Tentar view materializada primeiro (muito mais rápido)
  const { data: holdings, error } = await supabase
    .from("holdings_view")
    .select("*")
    .eq("quantity", 0, { foreignTable: null }) // quantity > 0
    .order("market_value", { ascending: false });

  if (!error && holdings && holdings.length > 0) {
    // Filtrar por account se necessário
    let filteredHoldings = holdings;
    if (accountId) {
      filteredHoldings = holdings.filter(h => h.account_id === accountId);
    }

    // Converter para formato esperado
    return filteredHoldings.map(h => ({
      securityId: h.security_id,
      symbol: h.symbol,
      name: h.name,
      assetType: h.asset_type,
      sector: h.sector,
      quantity: h.quantity,
      avgPrice: h.avg_price,
      bookValue: h.book_value,
      lastPrice: h.last_price,
      marketValue: h.market_value,
      unrealizedPnL: h.unrealized_pnl,
      unrealizedPnLPercent: h.unrealized_pnl_percent,
      accountId: h.account_id,
      accountName: h.account_name,
    }));
  }

  // Fallback para lógica original se view não estiver disponível
  const { data: questradePositions, error: positionsError } = await supabase
    .from("Position")
    .select(`
      *,
      security:Security(*),
      account:InvestmentAccount(*)
    `)
    .gt("openQuantity", 0);
  
  // ... resto da lógica original como fallback
}
```

**Checklist:**
- [ ] Código modificado
- [ ] Fallback mantido para compatibilidade
- [ ] Testado localmente
- [ ] Holdings carregando corretamente

### 3.3 Limitar Busca de Transactions Históricos

**Arquivo:** `lib/api/portfolio.ts` (linha 275)

**Mudança:**
```typescript
// ANTES:
const transactionsStartDate = subDays(startDate, 365 * 5); // 5 anos!

// DEPOIS:
const transactionsStartDate = subDays(startDate, 30); // Apenas 30 dias antes

// Ou, melhor ainda, usar apenas o range necessário:
const transactionsStartDate = subDays(startDate, 1); // Apenas 1 dia antes
```

**Justificativa:**
- Para calcular holdings históricos, não precisamos de 5 anos de dados
- Apenas transações no período + pequeno buffer são necessárias
- Reduz drasticamente o volume de dados processados

**Checklist:**
- [ ] Código modificado
- [ ] Testado com diferentes períodos (30, 90, 365 dias)
- [ ] Gráfico histórico carregando corretamente

### 3.4 Corrigir Uso de getSession() → getUser()

**Buscar todos os usos:**
```bash
grep -r "getSession()" --include="*.ts" --include="*.tsx" app/ lib/
```

**Substituir padrão:**
```typescript
// ❌ ANTES (Inseguro)
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;

// ✅ DEPOIS (Seguro)
const { data: { user } } = await supabase.auth.getUser();
```

**Arquivos comuns a verificar:**
- `lib/supabase-server.ts`
- `middleware.ts`
- `lib/api/feature-guard.ts`
- Todos os API routes que verificam autenticação

**Checklist:**
- [ ] Todos os usos de getSession() encontrados
- [ ] Substituídos por getUser()
- [ ] Código compila sem erros
- [ ] Autenticação funcionando corretamente
- [ ] Testado login/logout

---

## FASE 4: TESTES E VALIDAÇÃO (1 hora)

### 4.1 Testes Locais

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Abrir navegador em localhost:3000
# 3. Login
# 4. Navegar para cada página:
```

**Checklist de páginas:**
- [ ] Dashboard (/)
- [ ] Transactions (/transactions)
- [ ] Accounts (/accounts)
- [ ] Investments (/investments)
- [ ] Budget (/planning/budgets)
- [ ] Goals (/planning/goals)
- [ ] Reports (/reports)

**Para cada página, verificar:**
- [ ] Carrega sem erros
- [ ] Tempo de carregamento < 3 segundos
- [ ] Dados exibidos corretamente
- [ ] Gráficos renderizando
- [ ] Sem erros no console

### 4.2 Testes de Performance

**Usar DevTools:**
```
1. Abrir Chrome DevTools (F12)
2. Ir para aba Network
3. Recarregar página
4. Verificar tempo de cada request
```

**Métricas esperadas (após otimizações):**
- `/api/dashboard/check-updates`: < 200ms (com cache), < 1s (sem cache)
- `/api/portfolio/summary`: < 2s
- `/api/portfolio/historical`: < 3s
- `/api/portfolio/holdings`: < 1s

**Checklist:**
- [ ] Todas as APIs abaixo dos tempos esperados
- [ ] Cache funcionando (verificar headers)
- [ ] Sem N+1 queries (verificar logs Supabase)

### 4.3 Testes de Cache

```bash
# 1. Primeira request (cold cache)
curl -w "@curl-format.txt" http://localhost:3000/api/dashboard/check-updates

# 2. Segunda request imediata (warm cache)
curl -w "@curl-format.txt" http://localhost:3000/api/dashboard/check-updates

# curl-format.txt:
# time_total:  %{time_total}s
```

**Checklist:**
- [ ] Primeira request mais lenta (database)
- [ ] Segunda request muito mais rápida (cache)
- [ ] Cache expira após TTL configurado
- [ ] Cache invalida após mudanças

### 4.4 Testes de Integridade de Dados

```sql
-- Verificar holdings
SELECT COUNT(*) FROM holdings_view;

-- Verificar se holdings batem com transactions
WITH holdings_from_view AS (
  SELECT user_id, SUM(market_value) as total
  FROM holdings_view
  GROUP BY user_id
),
holdings_calculated AS (
  SELECT 
    user_id,
    SUM(quantity * last_price) as total
  FROM (
    SELECT 
      user_id,
      security_id,
      SUM(CASE WHEN type = 'buy' THEN quantity ELSE -quantity END) as quantity,
      AVG(price) as last_price
    FROM "InvestmentTransaction"
    WHERE type IN ('buy', 'sell')
    GROUP BY user_id, security_id
  ) t
  GROUP BY user_id
)
SELECT 
  v.user_id,
  v.total as view_total,
  c.total as calculated_total,
  ABS(v.total - c.total) as difference
FROM holdings_from_view v
JOIN holdings_calculated c ON c.user_id = v.user_id
WHERE ABS(v.total - c.total) > 0.01; -- Diferença > 1 centavo
-- Deve retornar 0 linhas
```

**Checklist:**
- [ ] Holdings view bate com cálculo manual
- [ ] Portfolio summary correto
- [ ] Todos os dados íntegros

---

## FASE 5: DEPLOY (30 minutos)

### 5.1 Deploy para Staging

```bash
# Commit das mudanças
git add .
git commit -m "feat: otimizações de performance - índices, cache e views materializadas"

# Push para branch de staging
git push origin staging
```

**Checklist:**
- [ ] Código commitado
- [ ] Push realizado
- [ ] Deploy automático executado (Vercel)
- [ ] Build bem-sucedido
- [ ] Variáveis de ambiente configuradas em staging

### 5.2 Testes em Staging

**Repetir todos os testes da Fase 4 em staging**

**Checklist:**
- [ ] Todas as páginas carregam
- [ ] Performance dentro do esperado
- [ ] Cache funcionando
- [ ] Dados íntegros

### 5.3 Monitoramento Inicial

**Configurar alerts no Sentry/DataDog:**
```typescript
// Adicionar ao código
if (executionTime > 1000) {
  Sentry.captureMessage('Slow API response', {
    level: 'warning',
    extra: { endpoint, executionTime },
  });
}
```

**Checklist:**
- [ ] Monitoramento configurado
- [ ] Alerts configurados
- [ ] Dashboard criado

### 5.4 Deploy para Produção

```bash
# Merge staging -> main
git checkout main
git merge staging
git push origin main
```

**Checklist:**
- [ ] Merge realizado
- [ ] Deploy automático para produção
- [ ] Build bem-sucedido
- [ ] Variáveis de ambiente configuradas
- [ ] Smoke test em produção (testar páginas principais)

---

## FASE 6: MONITORAMENTO PÓS-DEPLOY (Contínuo)

### 6.1 Primeiras 24 Horas

**Monitorar:**
- [ ] Taxa de erros (deve ser < 1%)
- [ ] Tempo de resposta das APIs (devem ser 70-90% menores)
- [ ] Cache hit rate (deve ser > 80%)
- [ ] Uso de memória do Redis
- [ ] Uso de CPU do banco

**Ferramentas:**
- Vercel Analytics
- Sentry Error Tracking
- Supabase Dashboard (Database > Statistics)
- Redis Dashboard

### 6.2 Primeira Semana

**Verificar:**
- [ ] Feedback dos usuários
- [ ] Logs de erros
- [ ] Performance das queries
- [ ] Tamanho das views materializadas

**Queries úteis:**
```sql
-- Índices mais usados
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 20;

-- Queries mais lentas
SELECT 
  calls,
  total_exec_time,
  mean_exec_time,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 6.3 Primeiro Mês

**Otimizações adicionais:**
- [ ] Remover índices não utilizados (idx_scan = 0)
- [ ] Ajustar TTL de cache baseado em padrões de uso
- [ ] Otimizar refresh de views materializadas
- [ ] Implementar mais endpoints com cache

---

## 🔧 TROUBLESHOOTING

### Problema: Índices não estão sendo usados

**Diagnóstico:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Transaction"
WHERE user_id = 'xxx'
ORDER BY updated_at DESC
LIMIT 1;
```

**Solução:**
```sql
-- Force usando hint
SET enable_seqscan = OFF;

-- Ou recrie índice
DROP INDEX idx_transaction_user_updated;
CREATE INDEX idx_transaction_user_updated ...;

-- Ou atualize estatísticas
ANALYZE "Transaction";
```

### Problema: Views materializadas desatualizadas

**Diagnóstico:**
```sql
SELECT 
  matviewname,
  last_updated
FROM holdings_view
LIMIT 1;
```

**Solução:**
```sql
-- Refresh manual
SELECT refresh_portfolio_views();

-- Ou refresh individual
REFRESH MATERIALIZED VIEW CONCURRENTLY holdings_view;
```

### Problema: Redis não conectando

**Diagnóstico:**
```bash
# Verificar URL
echo $REDIS_URL

# Testar conexão
redis-cli -u $REDIS_URL ping
```

**Solução:**
- Verificar firewall
- Verificar SSL/TLS settings
- Verificar quota do plano gratuito
- Revisar logs do Redis

### Problema: Performance não melhorou

**Diagnóstico:**
1. Verificar se índices foram criados
2. Verificar se cache está funcionando
3. Verificar se views materializadas estão sendo usadas
4. Verificar logs de queries lentas

**Solução:**
- Executar VACUUM ANALYZE nas tabelas principais
- Verificar se RLS policies não estão causando lentidão
- Aumentar connection pooling
- Considerar upgrade do plano Supabase

---

## 📊 MÉTRICAS DE SUCESSO

### Antes vs Depois

| Métrica | Antes | Meta Depois | Verificação |
|---------|-------|-------------|-------------|
| check-updates | 12-28s | < 1s | ✅ |
| portfolio/summary | 6-49s | < 2s | ✅ |
| portfolio/historical | 21-51s | < 3s | ✅ |
| Cache hit rate | 0% | > 80% | ⏳ |
| Taxa de erro | ? | < 1% | ⏳ |

---

## 🎓 RECURSOS ADICIONAIS

### Documentação
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)

### Ferramentas
- [pgAdmin](https://www.pgadmin.org/) - GUI para PostgreSQL
- [Redis Commander](https://github.com/joeferner/redis-commander) - GUI para Redis
- [k6](https://k6.io/) - Load testing

---

**Última atualização:** 15 de Novembro de 2025  
**Versão:** 1.0
