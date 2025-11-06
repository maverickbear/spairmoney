# 📊 Análise de Pricing - Spare Finance

## 📋 Resumo Executivo

Este documento apresenta uma análise completa de pricing para os planos do Spare Finance, considerando custos operacionais, margem de lucro desejada e competitividade no mercado.

### Recomendação Final

| Plano | Mensal | Anual (17% desconto) | Status |
|-------|--------|---------------------|--------|
| **FREE** | $0.00 | $0.00 | ✅ Mantém |
| **BASIC** | $7.99 | $79.90 | ⬇️ Redução de $9.99 |
| **PREMIUM** | $14.99 | $149.90 | ⬇️ Redução de $19.99 |

---

## 🎯 Features do Spare Finance

### Funcionalidades Principais

- ✅ **Gestão de Transações** (com limites por plano)
- ✅ **Contas Bancárias Múltiplas**
- ✅ **Orçamentos Mensais** com indicadores visuais
- ✅ **Categorias Hierárquicas** (Macro → Categoria → Subcategoria)
- ✅ **Investimentos** (holdings, transações, preços, portfolio)
- ✅ **Gestão de Dívidas** (com priorização e pagamento)
- ✅ **Metas de Poupança** (com % de renda e ETA)
- ✅ **Relatórios Avançados** (análise detalhada)
- ✅ **Importação/Exportação CSV**
- ✅ **Dashboard** com gráficos e visualizações
- ✅ **Multi-tenancy** (membros/convidados)
- ✅ **Dark Mode**

### Comparação de Features por Plano

| Feature | FREE | BASIC | PREMIUM |
|---------|------|-------|---------|
| Transações/mês | 50 | 500 | Ilimitado |
| Contas | 2 | 10 | Ilimitado |
| Investimentos | ❌ | ✅ | ✅ |
| Relatórios Avançados | ❌ | ✅ | ✅ |
| CSV Export | ❌ | ✅ | ✅ |
| Dívidas | ✅ | ✅ | ✅ |
| Metas | ✅ | ✅ | ✅ |

---

## 💰 Análise de Custos

### Custos Fixos Mensais (Base)

| Item | Custo Mensal | Descrição |
|------|--------------|-----------|
| **Supabase Pro** | ~$25 | Após free tier (500MB DB) |
| **Vercel** | $0-20 | Depende do tráfego |
| **Domínio** | ~$1 | Registro anual dividido |
| **Email/SMS** | $0-10 | Depende do volume |
| **Total Fixo** | **~$26-56** | Base operacional |

### Custos Variáveis por Usuário Pago

| Item | Custo/Usuário | Descrição |
|------|---------------|-----------|
| **Taxa Stripe** | ~$0.75 | 2.9% + $0.30 por transação |
| **Supabase Storage** | $0.01-0.05 | Storage/bandwidth adicional |
| **Suporte** | $0.50-2 | Tempo de suporte estimado |
| **Custo Total/Usuário** | **~$0.60-3** | Por usuário pago/mês |

### Custo Médio por Usuário

- **Plano FREE**: ~$0.01-0.05/usuário/mês (apenas storage/bandwidth)
- **Plano BASIC**: ~$2.25/usuário/mês (custo operacional + taxas)
- **Plano PREMIUM**: ~$3.25/usuário/mês (mais recursos, mais custo)

---

## 💵 Análise de Pricing Recomendada

### Plano FREE - $0.00/mês

**Mantém como está**

- **Custo**: ~$0.01-0.05/usuário/mês
- **Função**: Acquisition funnel, test drive
- **Limites**: 50 transações, 2 contas
- **Justificativa**: Plano freemium essencial para aquisição

---

### Plano BASIC - $7.99/mês ($79.90/ano)

**Redução de $9.99 → $7.99**

#### Cálculo de Custos:
```
Custo Operacional: ~$1.50/usuário/mês
Taxa Stripe (2.9% + $0.30): ~$0.75/usuário/mês
Custo Total: ~$2.25/usuário/mês
```

#### Margem de Lucro:
```
Receita: $7.99
Custo: $2.25
Lucro: $5.74 (72% de margem)
```

#### Anual:
```
$79.90/ano = $6.66/mês equivalente
Desconto: 17% (vs. mensal)
```

#### Justificativa:
- ✅ **Mais acessível** que $9.99 (aumenta conversão)
- ✅ **Alinhado com mercado** ($6-12/mês para apps similares)
- ✅ **Margem confortável** (72% após todos os custos)
- ✅ **Competitivo** com PocketGuard, outros apps

#### Features:
- 500 transações/mês
- 10 contas
- Investimentos
- Relatórios avançados
- CSV export
- Dívidas e metas

---

### Plano PREMIUM - $14.99/mês ($149.90/ano)

**Redução de $19.99 → $14.99**

#### Cálculo de Custos:
```
Custo Operacional: ~$2.50/usuário/mês (mais recursos)
Taxa Stripe: ~$0.75/usuário/mês
Custo Total: ~$3.25/usuário/mês
```

#### Margem de Lucro:
```
Receita: $14.99
Custo: $3.25
Lucro: $11.74 (78% de margem)
```

#### Anual:
```
$149.90/ano = $12.49/mês equivalente
Desconto: 17% (vs. mensal)
```

#### Justificativa:
- ✅ **Preço mais competitivo** que $19.99
- ✅ **Margem alta** (78% após custos)
- ✅ **Incentiva upgrade** do Basic ($7 gap é ideal)
- ✅ **Alinhado com valor percebido**

#### Features:
- Transações ilimitadas
- Contas ilimitadas
- Todas as features do Basic
- Prioridade de suporte (futuro)

---

## 📊 Comparação com Concorrentes

| Serviço | Preço Mensal | Anual | Notas |
|---------|--------------|-------|-------|
| **YNAB** | $14.99 | $99 | Foco em budgets |
| **Mint** | Grátis | - | Encerrado (2024) |
| **Personal Capital** | Grátis | - | Foco em investimentos |
| **PocketGuard** | $7.99 | $74.99 | Similar ao Basic |
| **Spare Finance** | $7.99 / $14.99 | $79.90 / $149.90 | **Recomendado** |

### Posicionamento de Mercado

- **FREE**: Competitivo com Mint (antigo)
- **BASIC**: Alinhado com PocketGuard ($7.99)
- **PREMIUM**: Entre Basic e YNAB ($14.99)

---

## 📈 Cenários de Lucratividade

### Cenário 1: 100 Usuários Pagos
**Distribuição**: 80 Basic + 20 Premium

```
Receita Mensal:
- Basic: 80 × $7.99 = $639.20
- Premium: 20 × $14.99 = $299.80
Total: $939.00

Custos:
- Fixos: $56
- Variáveis: 100 × $2.50 = $250
Total: $306

Lucro Mensal: $633 (67% de margem)
Lucro Anual: $7,596
```

### Cenário 2: 500 Usuários Pagos
**Distribuição**: 400 Basic + 100 Premium

```
Receita Mensal:
- Basic: 400 × $7.99 = $3,196
- Premium: 100 × $14.99 = $1,499
Total: $4,695

Custos:
- Fixos: $56
- Variáveis: 500 × $2.50 = $1,250
Total: $1,306

Lucro Mensal: $3,389 (72% de margem)
Lucro Anual: $40,668
```

### Cenário 3: 1,000 Usuários Pagos
**Distribuição**: 800 Basic + 200 Premium

```
Receita Mensal:
- Basic: 800 × $7.99 = $6,392
- Premium: 200 × $14.99 = $2,998
Total: $9,390

Custos:
- Fixos: $56
- Variáveis: 1,000 × $2.50 = $2,500
Total: $2,556

Lucro Mensal: $6,834 (73% de margem)
Lucro Anual: $82,008
```

---

## 🎯 Estratégia de Pricing

### Princípios Aplicados

1. **Value-Based Pricing**: Baseado no valor percebido pelo cliente
2. **Cost-Plus Margin**: Margem de 70-80% após todos os custos
3. **Market Positioning**: Competitivo com concorrentes diretos
4. **Psychological Pricing**: $7.99 e $14.99 (preços "quebrados")

### Desconto Anual

- **17% de desconto** no plano anual
- Incentiva receita antecipada
- Reduz churn (compromisso anual)
- Melhora cash flow

### Gaps de Preço

- **FREE → BASIC**: $0 → $7.99 (gap de $7.99)
- **BASIC → PREMIUM**: $7.99 → $14.99 (gap de $7.00)

**Análise**: Gaps balanceados, incentivam upgrades progressivos.

---

## ✅ Checklist de Implementação

### Atualização de Preços

- [ ] Atualizar valores no banco de dados (SQL abaixo)
- [ ] Atualizar produtos no Stripe Dashboard
- [ ] Criar novos Price IDs no Stripe
- [ ] Atualizar `stripePriceIdMonthly` e `stripePriceIdYearly` no banco
- [ ] Atualizar componentes de UI (plan-selector.tsx)
- [ ] Atualizar documentação (BILLING_SETUP.md)
- [ ] Testar fluxo de checkout completo
- [ ] Testar webhook de atualização de preços

### SQL para Atualização

```sql
-- Atualizar preços do plano BASIC
UPDATE "Plan"
SET 
  "priceMonthly" = 7.99,
  "priceYearly" = 79.90,
  "updatedAt" = NOW()
WHERE "id" = 'basic';

-- Atualizar preços do plano PREMIUM
UPDATE "Plan"
SET 
  "priceMonthly" = 14.99,
  "priceYearly" = 149.90,
  "updatedAt" = NOW()
WHERE "id" = 'premium';
```

### Comunicação

- [ ] Anunciar mudança de preços para usuários existentes
- [ ] Oferecer lock-in de preço antigo para usuários atuais (opcional)
- [ ] Atualizar página de pricing
- [ ] Atualizar landing page
- [ ] Criar email de anúncio (se aplicável)

---

## 🔄 Considerações Adicionais

### Trial Period

**Recomendação**: Oferecer trial de 7-14 dias no Premium
- Aumenta conversão
- Reduz fricção de upgrade
- Permite testar features avançadas

### Freemium Strategy

O plano FREE com 50 transações/mês é adequado:
- ✅ Permite testar funcionalidades básicas
- ✅ Não é muito restritivo (50 transações = ~1.6/dia)
- ✅ Incentiva upgrade para uso regular

### Upgrade Incentives

**Recomendação**: Destacar funcionalidades-chave:
- **Basic**: "Desbloqueie investimentos e relatórios"
- **Premium**: "Ilimitado para usuários avançados"

### Revisão Periódica

**Recomendação**: Revisar pricing a cada 3-6 meses baseado em:
- Taxa de conversão (FREE → BASIC → PREMIUM)
- Churn rate
- Feedback de usuários
- Custos reais vs. estimados
- Competição de mercado

---

## 📝 Notas Finais

### Por que esta estrutura funciona?

1. **Acessível**: Preços competitivos aumentam adoção
2. **Lucrativa**: Margem de 70-80% garante sustentabilidade
3. **Escalável**: Custos variáveis permitem crescimento
4. **Flexível**: Estrutura permite ajustes futuros

### Próximos Passos

1. ✅ Revisar análise de custos com dados reais (após 1 mês)
2. ✅ Monitorar conversão FREE → BASIC → PREMIUM
3. ✅ Ajustar pricing baseado em feedback
4. ✅ Considerar planos adicionais (família, empresarial) no futuro

---

## 📅 Histórico de Revisões

| Data | Versão | Mudanças |
|------|--------|----------|
| 2024-11-XX | 1.0 | Análise inicial e recomendação |

---

**Autor**: Análise de Pricing - Spare Finance  
**Última Atualização**: Novembro 2024

