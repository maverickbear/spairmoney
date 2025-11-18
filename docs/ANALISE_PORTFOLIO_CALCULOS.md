# Análise Completa: Cálculos de Portfolio Summary e Portfolio Performance

## Data: 2025-01-18

## 1. Como os Cálculos DEVEM Ser Feitos

### 1.1 Portfolio Summary

O Portfolio Summary deve calcular:

#### **Total Value (totalValue)**
- **Com contas Questrade conectadas:**
  - Soma `totalEquity` de todas as contas Questrade (ou `marketValue + cash` se `totalEquity` não estiver disponível)
  - Adiciona o `marketValue` de holdings de contas não-Questrade
  - **Fórmula:** `questradeValue + nonQuestradeHoldingsValue`

- **Sem contas Questrade:**
  - Soma `marketValue` de todos os holdings
  - **Fórmula:** `SUM(holdings.marketValue)`

#### **Total Cost (totalCost)**
- Soma `bookValue` de todos os holdings
- **Fórmula:** `SUM(holdings.bookValue)`

#### **Total Return (totalReturn)**
- Diferença entre valor total e custo total
- **Fórmula:** `totalValue - totalCost`

#### **Total Return Percent (totalReturnPercent)**
- Percentual de retorno sobre o custo
- **Fórmula:** `(totalReturn / totalCost) * 100` (se totalCost > 0)

#### **Day Change (dayChange)**
- Diferença entre valor atual e valor de ontem
- Calculado usando preços históricos da tabela `SecurityPrice`
- **Fórmula:** `totalValue - yesterdayValue`

#### **Day Change Percent (dayChangePercent)**
- Percentual de mudança do dia
- **Fórmula:** `(dayChange / yesterdayValue) * 100`

### 1.2 Portfolio Performance (Historical Data)

O Portfolio Performance deve:

1. **Reconstruir holdings ao longo do tempo** processando transações cronologicamente
2. **Usar preços históricos** da tabela `SecurityPrice` quando disponíveis
3. **Calcular valor do portfolio** para cada dia: `SUM(quantity * price)` para cada holding
4. **Garantir que o valor de hoje** seja sempre o valor atual do summary (incluindo Questrade)

**Processo:**
- Processar todas as transações `buy` e `sell` em ordem cronológica
- Manter estado de holdings (quantity, avgPrice) ao longo do tempo
- Para cada data, calcular: `SUM(holding.quantity * historicalPrice)`
- Se não houver preço histórico, usar `avgPrice` como fallback

### 1.3 Holdings Calculation

Os holdings podem ser calculados de 3 formas (em ordem de prioridade):

1. **Materialized View `holdings_view`** (mais rápido)
2. **Questrade Positions** (se disponível e conectado)
3. **Fallback: Calcular a partir de transações** (mais lento)

**Cálculo de Holdings a partir de transações:**
- **Quantity:** `SUM(buy.quantity) - SUM(sell.quantity)`
- **Book Value:** 
  - Para compras: adiciona `(quantity * price + fees)`
  - Para vendas: subtrai `(quantity * avgPrice)` (custo médio, não preço de venda)
- **Avg Price:** `bookValue / quantity` (se quantity > 0)
- **Market Value:** `quantity * lastPrice`
- **Unrealized PnL:** `marketValue - bookValue`

## 2. Problemas Identificados

### 🔴 **PROBLEMA CRÍTICO #1: Cálculo Incorreto de Book Value na View Materializada**

**Localização:** `supabase/schema_reference.sql` linha 1060

**Problema:**
A view `holdings_view` calcula o `book_value` para vendas subtraindo o **preço de venda** ao invés do **custo médio**:

```sql
-- ATUAL (INCORRETO):
WHEN it.type = 'sell' THEN 
  -((COALESCE(it.quantity, 0) * COALESCE(it.price, 0)) - COALESCE(it.fees, 0))
```

**O que deveria ser:**
Para vendas, deve subtrair o **custo médio** (avgPrice) multiplicado pela quantidade, não o preço de venda.

**Impacto:**
- Book value fica incorreto após vendas
- Total cost fica incorreto
- Total return e total return percent ficam incorretos
- Avg price fica incorreto (porque divide book_value incorreto pela quantity)

**Solução:**
A view materializada não pode calcular custo médio dinamicamente durante a agregação. Precisa:
1. Calcular holdings incrementalmente (não por agregação simples)
2. Ou usar uma função que processa transações em ordem cronológica
3. Ou corrigir o cálculo no código TypeScript (já está correto em `lib/api/investments.ts`)

### 🟡 **PROBLEMA #2: Cálculo Histórico Pode Perder Holdings Iniciais**

**Localização:** `lib/api/portfolio.ts` linha 396

**Problema:**
O cálculo histórico só busca transações dos últimos 30 dias antes do período:

```typescript
const transactionsStartDate = subDays(startDate, 30); // Only 30 days before
```

**Impacto:**
- Se houver holdings que foram comprados há mais de 30 dias antes do período analisado, eles não serão incluídos
- O valor histórico ficará incorreto para períodos longos
- Holdings iniciais não serão considerados

**Solução:**
Buscar todas as transações desde o início ou desde a primeira transação do usuário, não apenas 30 dias antes.

### 🟡 **PROBLEMA #3: Inconsistência Entre Questrade e Transações Manuais**

**Localização:** `lib/api/portfolio.ts` linhas 120-148

**Problema:**
O sistema tenta usar valores do Questrade quando disponível, mas:
- Se houver transações manuais em contas Questrade, elas podem não estar refletidas no `totalEquity` do Questrade
- O sistema soma Questrade + holdings não-Questrade, mas pode estar duplicando ou perdendo valores

**Impacto:**
- Valores podem estar inconsistentes entre Questrade e transações manuais
- Total value pode estar incorreto se houver mistura de dados

**Solução:**
- Garantir que transações manuais em contas Questrade sejam sincronizadas
- Ou usar apenas uma fonte de dados por conta (Questrade OU transações manuais)

### 🟡 **PROBLEMA #4: View Materializada Pode Estar Desatualizada**

**Localização:** `supabase/schema_reference.sql` linhas 191-212

**Problema:**
A view materializada precisa ser refrescada após mudanças, mas:
- O trigger apenas notifica (`pg_notify`), não refresca automaticamente
- Não há garantia de que a view está sempre atualizada
- O código TypeScript tem fallback, mas pode estar usando dados desatualizados

**Impacto:**
- Holdings podem estar desatualizados se a view não foi refrescada
- Valores podem estar incorretos até o próximo refresh

**Solução:**
- Implementar refresh automático via cron job
- Ou refrescar a view após cada inserção/atualização de transação (pode ser lento)

### 🟡 **PROBLEMA #5: Cálculo de Avg Price na View é Circular**

**Localização:** `supabase/schema_reference.sql` linha 1083

**Problema:**
A view calcula `avg_price` dividindo `book_value` pela `quantity`:

```sql
CASE 
  WHEN (ta.total_buy_qty - ta.total_sell_qty) > 0 
  THEN ta.book_value / (ta.total_buy_qty - ta.total_sell_qty)
  ELSE 0 
END as avg_price
```

Mas o `book_value` está incorreto (problema #1), então o `avg_price` também fica incorreto.

**Impacto:**
- Avg price incorreto
- Cálculos que dependem de avg price ficam incorretos

### 🟢 **PROBLEMA MENOR #6: Day Change Pode Falhar Silenciosamente**

**Localização:** `lib/api/portfolio.ts` linhas 159-230

**Problema:**
Se não houver preços históricos, o day change fica 0 sem avisar o usuário:

```typescript
} else {
  console.warn("No historical prices found for day change calculation");
}
```

**Impacto:**
- Day change mostra 0 quando deveria mostrar um valor ou erro
- Usuário não sabe que o cálculo falhou

**Solução:**
- Melhorar tratamento de erros
- Mostrar indicador visual quando dados não estão disponíveis

## 3. Como as Transações de Investimentos São Recebidas

### 3.1 Fluxo de Recebimento

1. **API Endpoint:** `/api/investments/transactions` (POST)
2. **Validação:** Usa `InvestmentTransactionFormData` schema
3. **Criação de Security:** Se não existir, cria automaticamente
4. **Inserção na Tabela:** `InvestmentTransaction` no Supabase
5. **Preço Atual:** Se fornecido, cria entrada em `SecurityPrice`
6. **Trigger:** Notifica refresh da view materializada (mas não refresca automaticamente)

### 3.2 Estrutura de Dados

**InvestmentTransaction:**
- `id`: UUID
- `accountId`: ID da conta de investimento
- `securityId`: ID do security (pode ser null para transfer_in/transfer_out)
- `date`: Data da transação
- `type`: 'buy' | 'sell' | 'dividend' | 'interest' | 'transfer_in' | 'transfer_out'
- `quantity`: Quantidade (pode ser null)
- `price`: Preço unitário (pode ser null)
- `fees`: Taxas
- `notes`: Notas opcionais

### 3.3 Processamento

**No código TypeScript (`lib/api/investments.ts`):**
- Processa transações em ordem cronológica
- Para `buy`: adiciona quantity e custo ao holding
- Para `sell`: subtrai quantity e custo médio do holding
- Calcula avgPrice usando weighted average
- Busca último preço de `SecurityPrice` para calcular marketValue

**Na view materializada:**
- Agrega todas as transações por security+account
- Calcula total_buy_qty, total_sell_qty, book_value
- **PROBLEMA:** book_value para vendas está incorreto (veja problema #1)

## 4. Recomendações de Correção

### Prioridade ALTA

1. **Corrigir cálculo de book_value na view materializada**
   
   **Problema:** A view usa agregação simples que não funciona para vendas (precisa do custo médio).
   
   **Solução 1 (Recomendada):** Desabilitar uso da view e confiar apenas no cálculo TypeScript
   - O código em `lib/api/investments.ts` já está correto (linhas 220-234)
   - A view é apenas uma otimização, mas está incorreta
   - Modificar `getHoldings()` para sempre usar fallback (cálculo TypeScript)
   
   **Solução 2:** Criar função PostgreSQL que processa transações incrementalmente
   ```sql
   CREATE OR REPLACE FUNCTION calculate_holdings()
   RETURNS TABLE(...) AS $$
   -- Processar transações em ordem cronológica
   -- Calcular book_value corretamente para vendas
   $$;
   ```
   
   **Solução 3:** Corrigir a view para calcular book_value corretamente
   - Não é possível fazer isso com agregação simples
   - Precisaria de window functions ou função auxiliar
   - Complexidade alta, não recomendado

2. **Corrigir busca de transações históricas**
   
   **Localização:** `lib/api/portfolio.ts` linha 396
   
   **Problema:** Só busca 30 dias antes do período
   
   **Solução:** Buscar desde a primeira transação do usuário
   ```typescript
   // Buscar primeira transação do usuário
   const { data: firstTx } = await supabase
     .from("InvestmentTransaction")
     .select("date")
     .eq("accountId", accountIds) // todas as contas do usuário
     .order("date", { ascending: true })
     .limit(1);
   
   const transactionsStartDate = firstTx?.date 
     ? new Date(firstTx.date) 
     : subDays(startDate, 365); // fallback: 1 ano antes
   ```

### Prioridade MÉDIA

3. **Implementar refresh automático da view**
   - Criar cron job que refresca a view periodicamente
   - Ou refrescar após cada transação (pode ser lento)

4. **Melhorar sincronização Questrade vs Manual**
   - Documentar qual fonte de dados tem prioridade
   - Garantir que não há duplicação

### Prioridade BAIXA

5. **Melhorar tratamento de erros**
   - Mostrar indicadores quando dados não estão disponíveis
   - Melhorar logs e debugging

## 5. Arquivos Relevantes

### Cálculos
- `lib/api/portfolio.ts` - Cálculos de summary e histórico
- `lib/api/investments.ts` - Cálculo de holdings a partir de transações
- `lib/utils/portfolio-utils.ts` - Funções utilitárias

### Views Materializadas
- `supabase/schema_reference.sql` - Definição da view `holdings_view`
- `docs/20251115_create_materialized_views.sql` - Criação da view

### API Endpoints
- `app/api/portfolio/summary/route.ts` - Endpoint de summary
- `app/api/portfolio/historical/route.ts` - Endpoint de histórico
- `app/api/investments/transactions/route.ts` - Endpoint de transações

### Componentes UI
- `components/portfolio/portfolio-summary-cards.tsx` - Cards de summary
- `components/portfolio/portfolio-performance-chart.tsx` - Gráfico de performance
- `app/(protected)/investments/page.tsx` - Página principal

## 6. Próximos Passos

1. ✅ Análise completa realizada
2. ⏳ **URGENTE:** Desabilitar uso da view materializada ou corrigir cálculo
3. ⏳ Corrigir busca de transações históricas (buscar desde primeira transação)
4. ⏳ Implementar refresh automático da view (se mantiver uso)
5. ⏳ Testar cálculos após correções
6. ⏳ Validar com dados reais

## 7. Exemplo de Cálculo Correto vs Incorreto

### Cenário de Teste:
1. Compra 10 ações a $100 cada + $5 fees = $1005 total
2. Vende 5 ações a $120 cada - $5 fees = $595 recebido

### Cálculo CORRETO (TypeScript):
- **Após compra:**
  - Quantity: 10
  - Book Value: $1005
  - Avg Price: $100.50
  
- **Após venda:**
  - Quantity: 5
  - Book Value: $1005 - (5 * $100.50) = $502.50 ✅
  - Avg Price: $100.50 (mantém)
  - Market Value: 5 * $120 = $600
  - Unrealized PnL: $600 - $502.50 = $97.50

### Cálculo INCORRETO (View Materializada):
- **Após compra:**
  - total_buy_qty: 10
  - book_value: $1005 ✅
  
- **Após venda:**
  - total_sell_qty: 5
  - book_value: $1005 - ($595) = $410 ❌ (ERRADO!)
  - avg_price: $410 / 5 = $82 ❌ (ERRADO!)
  - Market Value: 5 * $120 = $600
  - Unrealized PnL: $600 - $410 = $190 ❌ (ERRADO! Deveria ser $97.50)

**Diferença:** O cálculo incorreto mostra um PnL de $190 quando deveria ser $97.50 - uma diferença de quase 100%!

