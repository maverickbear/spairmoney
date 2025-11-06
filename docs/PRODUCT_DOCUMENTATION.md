# 📘 Spare Finance - Documentação do Produto

## 🎯 O que é o Spare Finance?

O **Spare Finance** é uma aplicação web completa de gestão financeira pessoal que permite aos usuários controlar suas finanças de forma centralizada e inteligente. Construído com tecnologias modernas (Next.js 15, TypeScript, Supabase), o Spare Finance oferece uma solução completa para gerenciar transações, orçamentos, investimentos, dívidas e metas de poupança.

### Visão Geral

O Spare Finance foi projetado para ser a **única ferramenta** que você precisa para gerenciar suas finanças pessoais. Com uma interface intuitiva, suporte a múltiplos dispositivos e recursos avançados, ele ajuda você a:

- 📊 **Visualizar** sua situação financeira em tempo real
- 💰 **Controlar** receitas e despesas
- 📈 **Planejar** orçamentos mensais
- 🎯 **Acompanhar** metas de poupança
- 💳 **Gerenciar** dívidas e pagamentos
- 📊 **Monitorar** investimentos e portfólio
- 👥 **Compartilhar** com membros da família (multi-tenancy)

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Pagamentos**: Stripe
- **Gráficos**: Recharts
- **Validação**: Zod
- **Formulários**: React Hook Form

### Segurança

- **Row Level Security (RLS)**: Todos os dados são isolados por usuário no nível do banco de dados
- **Autenticação segura**: Via Supabase Auth
- **Multi-tenancy**: Suporte a membros da família com diferentes níveis de acesso

---

## 📱 Features Disponíveis

### 1. 📊 Dashboard

O dashboard é a página inicial do Spare Finance, oferecendo uma visão geral completa das finanças do usuário.

#### Componentes do Dashboard:

- **Summary Cards**:
  - Receita do mês atual
  - Despesas do mês atual
  - Economia (diferença entre receita e despesa)
  - Comparação com o mês anterior

- **Cash Flow Chart**:
  - Gráfico de linha mostrando receitas vs. despesas ao longo do tempo
  - Visualização mensal ou por período customizado

- **Financial Health Widget**:
  - Indicador de saúde financeira geral
  - Métricas calculadas automaticamente
  - Sugestões de melhoria

- **Upcoming Transactions**:
  - Lista de transações programadas/recorrentes
  - Alertas de pagamentos próximos

- **Budget Execution**:
  - Gráfico de barras mostrando orçamento vs. gasto real
  - Indicadores visuais (verde/amarelo/vermelho)
  - Status por categoria

- **Goals Overview**:
  - Resumo visual das metas de poupança
  - Progress rings mostrando progresso
  - ETA (estimativa de tempo até a meta)

- **Category Expenses Chart**:
  - Gráfico de pizza/barra mostrando despesas por categoria
  - Breakdown detalhado

#### Funcionalidades:

- ✅ Seleção de mês/período para visualização
- ✅ Filtros dinâmicos
- ✅ Atualização em tempo real
- ✅ Export de dados (planos pagos)

---

### 2. 💳 Gestão de Transações

Sistema completo de registro e controle de transações financeiras.

#### Tipos de Transação:

- **Receitas** (Income): Salário, freelance, dividendos, etc.
- **Despesas** (Expenses): Compras, contas, serviços, etc.
- **Transferências** (Transfers): Movimentações entre contas

#### Funcionalidades:

- ✅ **CRUD completo**: Criar, editar, visualizar e deletar transações
- ✅ **Categorização**: Associação com categorias e subcategorias
- ✅ **Contas**: Vinculação com contas bancárias
- ✅ **Tags**: Sistema de tags para organização adicional
- ✅ **Descrições**: Campo de notas/descrição
- ✅ **Filtros avançados**:
  - Por data (período customizado)
  - Por categoria/subcategoria
  - Por conta
  - Por tipo (receita/despesa/transferência)
- ✅ **Busca**: Pesquisa por descrição, tags, etc.
- ✅ **Importação CSV**: Importar transações de arquivos CSV com mapeamento de colunas
- ✅ **Exportação CSV**: Exportar transações para análise externa (planos pagos)
- ✅ **Transferências linkadas**: Transferências criam entradas vinculadas em ambas as contas
- ✅ **Validação**: Validação completa de dados antes de salvar

#### Limites por Plano:

- **FREE**: 50 transações/mês
- **BASIC**: 500 transações/mês
- **PREMIUM**: Ilimitado

---

### 3. 🎯 Orçamentos (Budgets)

Sistema de orçamentos mensais por categoria com acompanhamento visual.

#### Funcionalidades:

- ✅ **Orçamento mensal**: Definir valor orçado por categoria
- ✅ **Acompanhamento automático**: Cálculo automático de gasto real vs. orçado
- ✅ **Indicadores visuais**:
  - 🟢 **Verde**: ≤ 90% do orçamento (OK)
  - 🟡 **Amarelo**: 90-100% do orçamento (Atenção)
  - 🔴 **Vermelho**: > 100% do orçamento (Excedido)
- ✅ **Barras de progresso**: Visualização clara do status
- ✅ **Histórico**: Visualização de orçamentos de meses anteriores
- ✅ **Múltiplas categorias**: Orçamento para múltiplas categorias simultaneamente
- ✅ **Notas**: Campo opcional para observações

#### Cálculos Automáticos:

- Gasto real do mês atual
- Percentual utilizado do orçamento
- Valor restante disponível
- Diferença entre orçado e gasto

---

### 4. 📁 Sistema de Categorias

Hierarquia completa de categorização para organização das finanças.

#### Estrutura Hierárquica:

```
Macro (Categoria Principal)
  └── Category (Categoria)
      └── Subcategory (Subcategoria)
```

#### Exemplo:

```
Alimentação (Macro)
  └── Supermercado (Category)
      ├── Alimentos Básicos (Subcategory)
      ├── Carne e Peixe (Subcategory)
      └── Bebidas (Subcategory)
  └── Restaurantes (Category)
      ├── Almoço (Subcategory)
      └── Jantar (Subcategory)
```

#### Funcionalidades:

- ✅ **CRUD completo** para Macros, Categories e Subcategories
- ✅ **Hierarquia visual**: Interface clara mostrando a estrutura
- ✅ **Validação**: Prevenção de duplicatas e categorias órfãs
- ✅ **Reutilização**: Categorias podem ser usadas em múltiplas transações
- ✅ **Organização**: Sistema flexível para diferentes necessidades
- ✅ **Filtros**: Filtros por categoria em relatórios e transações

---

### 5. 💰 Gestão de Contas

Gerenciamento de contas bancárias e financeiras.

#### Funcionalidades:

- ✅ **CRUD completo**: Criar, editar e deletar contas
- ✅ **Tipos de conta**:
  - Conta Corrente
  - Poupança
  - Cartão de Crédito
  - Investimentos
  - Outros
- ✅ **Informações**:
  - Nome da conta
  - Tipo
  - Saldo inicial (opcional)
  - Limite de crédito (para cartões)
- ✅ **Vinculação**: Contas podem ser vinculadas a transações
- ✅ **Saldo calculado**: Saldo automático baseado em transações
- ✅ **Transferências**: Suporte a transferências entre contas

#### Limites por Plano:

- **FREE**: 2 contas
- **BASIC**: 10 contas
- **PREMIUM**: Ilimitado

---

### 6. 🎯 Metas de Poupança (Goals)

Sistema avançado de metas de poupança com alocação automática de renda.

#### Funcionalidades Principais:

- ✅ **Criação de metas**: Múltiplas metas simultâneas
- ✅ **Alocação por % de renda**: Definir percentual da renda mensal para cada meta
- ✅ **Cálculo automático**:
  - **Monthly Contribution**: Contribuição mensal calculada automaticamente
  - **ETA (Estimated Time to Arrival)**: Tempo estimado para atingir a meta
  - **Progress %**: Percentual de progresso visual
- ✅ **Income Basis**: Baseado na média dos últimos 3 meses de renda
- ✅ **Priorização**: Sistema de prioridades (Alta, Média, Baixa)
- ✅ **Validação**: Total de alocação não pode exceder 100%
- ✅ **Top-ups manuais**: Adicionar valores extras manualmente
- ✅ **Withdrawals**: Retirar valores da meta (se necessário)
- ✅ **Progress Ring**: Visualização circular do progresso
- ✅ **ETA Indicator**: Mostra quantos meses até atingir a meta

#### Cálculos Automáticos:

```javascript
// Monthly Income Basis
income_basis = rolling_average(last_3_months_income)

// Monthly Contribution
monthly_contribution = income_basis * (percent / 100)

// Remaining Amount
remaining = target_amount - current_balance

// Months to Goal
months_to_goal = remaining / monthly_contribution

// Progress
progress_pct = (current_balance / target_amount) * 100
```

#### Regras de Negócio:

- Total de % alocada não pode exceder 100%
- Se renda mensal = 0, contribuição = 0 e ETA recalcula
- Metas pausadas não recebem contribuições
- Metas completadas são marcadas automaticamente

---

### 7. 💳 Gestão de Dívidas (Debts)

Sistema completo para gerenciar dívidas e pagamentos.

#### Tipos de Dívida Suportados:

- **Mortgage** (Hipoteca)
- **Car Loan** (Financiamento de Carro)
- **Personal Loan** (Empréstimo Pessoal)
- **Credit Card** (Cartão de Crédito)
- **Student Loan** (Empréstimo Estudantil)
- **Business Loan** (Empréstimo Empresarial)
- **Other** (Outros)

#### Funcionalidades:

- ✅ **CRUD completo**: Criar, editar e deletar dívidas
- ✅ **Informações detalhadas**:
  - Nome da dívida
  - Tipo de empréstimo
  - Valor inicial
  - Entrada (down payment)
  - Saldo atual
  - Taxa de juros anual
  - Prazo total (meses)
  - Data do primeiro pagamento
  - Valor do pagamento mensal
- ✅ **Frequências de pagamento**:
  - Mensal (monthly)
  - Quinzenal (biweekly)
  - Semanal (weekly)
  - Semimestral (semimonthly)
  - Diário (daily)
- ✅ **Cálculos automáticos**:
  - Distribuição de principal vs. juros
  - Saldo restante
  - Meses restantes
  - Juros totais pagos
  - Juros totais restantes
  - Progresso (%)
- ✅ **Pagamentos adicionais**: Suporte a pagamentos extras
- ✅ **Priorização**: Sistema de prioridades (Alta, Média, Baixa)
- ✅ **Pausar dívida**: Marcar dívida como pausada
- ✅ **Quitar dívida**: Marcar como quitada
- ✅ **Registro automático**: Pagamentos podem criar transações automaticamente
- ✅ **Vinculação com contas**: Dívidas podem ser vinculadas a contas

#### Cálculos Implementados:

- Distribuição de principal vs. juros
- Cálculo de pagamentos desde data inicial
- Juros compostos
- Amortização de empréstimos

---

### 8. 📈 Investimentos (Investments)

Sistema completo para gerenciar investimentos e portfólio.

#### Componentes:

##### 8.1 Investment Accounts (Contas de Investimento)

- ✅ **Tipos de conta**:
  - Wealthsimple
  - TFSA (Tax-Free Savings Account)
  - RRSP (Registered Retirement Savings Plan)
  - Crypto Wallet
  - Outros
- ✅ **CRUD completo**: Criar, editar e deletar contas
- ✅ **Vinculação**: Contas podem ser vinculadas a contas bancárias

##### 8.2 Securities (Ativos)

- ✅ **Tipos de ativos**:
  - Stock (Ações)
  - ETF (Exchange-Traded Fund)
  - Crypto (Criptomoedas)
  - Bond (Títulos)
  - REIT (Real Estate Investment Trust)
- ✅ **Informações**:
  - Símbolo (Symbol) - único
  - Nome
  - Classe do ativo
- ✅ **CRUD completo**: Criar, editar e deletar ativos

##### 8.3 Investment Transactions (Transações de Investimento)

- ✅ **Tipos de transação**:
  - **Buy**: Compra de ativos
  - **Sell**: Venda de ativos
  - **Dividend**: Dividendos recebidos
  - **Interest**: Juros recebidos
  - **Transfer In**: Transferência para conta
  - **Transfer Out**: Transferência de conta
- ✅ **Informações por transação**:
  - Data
  - Conta de investimento
  - Ativo (security)
  - Tipo de transação
  - Quantidade
  - Preço unitário
  - Taxas
  - Notas
- ✅ **CRUD completo**: Criar, editar e deletar transações

##### 8.4 Holdings (Posições)

- ✅ **Cálculo automático de holdings**:
  - Quantidade total de cada ativo
  - Preço médio ponderado (Weighted Average Cost)
  - Valor contábil (Book Value)
  - Preço atual (último preço registrado)
  - Valor de mercado (Market Value)
  - Lucro/Prejuízo não realizado (Unrealized P&L)
- ✅ **Método FIFO**: Cálculo de custo usando First-In-First-Out
- ✅ **Múltiplas contas**: Holdings calculados por conta ou globalmente

##### 8.5 Security Prices (Preços)

- ✅ **Histórico de preços**: Registro manual de preços por data
- ✅ **Último preço**: Usado para cálculo de valor de mercado
- ✅ **CRUD completo**: Criar, editar e deletar preços

#### Funcionalidades Avançadas:

- ✅ **Portfolio Value**: Valor total do portfólio
- ✅ **Performance Tracking**: Acompanhamento de performance
- ✅ **P&L Tracking**: Lucros e prejuízos realizados e não realizados
- ✅ **Weighted Average Cost**: Cálculo automático de custo médio

#### Limites por Plano:

- **FREE**: Não disponível
- **BASIC**: Disponível
- **PREMIUM**: Disponível

---

### 9. 📊 Relatórios (Reports)

Sistema de relatórios avançados para análise financeira.

#### Funcionalidades:

- ✅ **Monthly Summary**: Resumo mensal mostrando:
  - Orçado vs. Real por categoria
  - Diferença percentual
  - Status de cada categoria
- ✅ **Top Expenses**: Top 10 despesas do período
- ✅ **Category Breakdown**: Breakdown detalhado por categoria/subcategoria
- ✅ **Filtros**: Filtros por período, categoria, tipo
- ✅ **Visualizações**: Gráficos e tabelas interativas

#### Limites por Plano:

- **FREE**: Relatórios básicos
- **BASIC**: Relatórios avançados
- **PREMIUM**: Relatórios avançados

---

### 10. 📥 Importação/Exportação CSV

Sistema para importar e exportar dados financeiros.

#### Importação CSV:

- ✅ **Mapeamento de colunas**: Interface para mapear colunas do CSV para campos do sistema
- ✅ **Validação**: Validação de dados antes de importar
- ✅ **Preview**: Visualização prévia dos dados antes de importar
- ✅ **Suporte a múltiplos formatos**: Flexibilidade com diferentes formatos de CSV
- ✅ **Transações em lote**: Importar múltiplas transações de uma vez

#### Exportação CSV:

- ✅ **Export de transações**: Exportar transações para análise externa
- ✅ **Filtros**: Exportar apenas transações filtradas
- ✅ **Formatos**: CSV compatível com Excel e outras ferramentas

#### Limites por Plano:

- **FREE**: Não disponível
- **BASIC**: Disponível
- **PREMIUM**: Disponível

---

### 11. 👥 Household Members (Multi-tenancy)

Sistema para adicionar membros da família para acompanhamento financeiro separado.

#### Funcionalidades:

- ✅ **Convidar membros**: Enviar convites por email
- ✅ **Aceitar convites**: Membros podem aceitar convites
- ✅ **Acompanhamento separado**: Cada membro pode ter suas próprias transações, contas e dados
- ✅ **Níveis de acesso**: Diferentes níveis de permissão (Admin e Member)
- ✅ **Status de convite**: Rastreamento de status (pendente, aceito, expirado)
- ✅ **Gerenciamento**: Listar, editar e remover membros
- ✅ **Reenvio de convites**: Reenviar convites expirados

#### Limites por Plano:

- **FREE**: Não disponível (apenas uso individual)
- **BASIC**: Disponível (adicionar membros da família)
- **PREMIUM**: Disponível (adicionar membros da família)

---

### 12. 👤 Perfil e Configurações

Gerenciamento de perfil do usuário.

#### Funcionalidades:

- ✅ **Informações pessoais**:
  - Nome
  - Email
  - Avatar (URL)
- ✅ **Edição de perfil**: Atualizar informações pessoais
- ✅ **Configurações**: Configurações gerais (futuro)

---

### 13. 💳 Sistema de Assinaturas (Billing)

Sistema completo de assinaturas e pagamentos via Stripe.

#### Planos Disponíveis:

##### FREE Plan - $0.00/mês
- 50 transações/mês
- 2 contas
- Dívidas e metas
- Relatórios básicos
- Sem investimentos
- Sem CSV export
- **Sem Household Members** (apenas uso individual)

##### BASIC Plan - $7.99/mês ($79.90/ano)
- 500 transações/mês
- 10 contas
- Investimentos
- Relatórios avançados
- CSV export
- **Household Members** (adicionar membros da família para acompanhamento separado)
- Todas as features do FREE

##### PREMIUM Plan - $14.99/mês ($149.90/ano)
- Transações ilimitadas
- Contas ilimitadas
- Todas as features do BASIC
- **Household Members** (adicionar membros da família para acompanhamento separado)
- Prioridade de suporte (futuro)

#### Funcionalidades:

- ✅ **Checkout**: Processo de checkout via Stripe
- ✅ **Webhooks**: Sincronização automática com Stripe
- ✅ **Billing Portal**: Portal do cliente para gerenciar assinatura
- ✅ **Cancelamento**: Cancelar assinatura a qualquer momento
- ✅ **Upgrade/Downgrade**: Mudar de plano
- ✅ **Limites automáticos**: Sistema de limites baseado no plano
- ✅ **Validação**: Validação de limites antes de criar recursos

---

### 14. 🎨 Interface e UX

#### Funcionalidades de Interface:

- ✅ **Dark Mode**: Suporte completo a modo escuro
- ✅ **Responsive Design**: Design responsivo para mobile, tablet e desktop
- ✅ **Command Palette (KBar)**: Busca rápida de funcionalidades (Cmd+K)
- ✅ **Navigation**: Navegação lateral e inferior (mobile)
- ✅ **Loading States**: Estados de carregamento com skeletons
- ✅ **Error Handling**: Tratamento de erros user-friendly
- ✅ **Form Validation**: Validação em tempo real de formulários
- ✅ **Toast Notifications**: Notificações de sucesso/erro
- ✅ **Accessibility**: Componentes acessíveis

---

## 🔐 Segurança e Privacidade

### Row Level Security (RLS)

- ✅ **Isolamento de dados**: Todos os dados são isolados por usuário no nível do banco
- ✅ **Políticas RLS**: Políticas de segurança implementadas em todas as tabelas
- ✅ **Multi-tenancy seguro**: Dados compartilhados apenas com membros autorizados

### Autenticação

- ✅ **Supabase Auth**: Autenticação segura via Supabase
- ✅ **Sessions**: Sessões seguras e gerenciadas
- ✅ **Password Reset**: Redefinição de senha
- ✅ **Email Verification**: Verificação de email

---

## 📊 Limites e Restrições por Plano

### FREE Plan

| Feature | Limite |
|---------|--------|
| Transações/mês | 50 |
| Contas | 2 |
| Investimentos | ❌ |
| Relatórios Avançados | ❌ |
| CSV Export | ❌ |
| Dívidas | ✅ |
| Metas | ✅ |
| Household Members | ❌ |

### BASIC Plan

| Feature | Limite |
|---------|--------|
| Transações/mês | 500 |
| Contas | 10 |
| Investimentos | ✅ |
| Relatórios Avançados | ✅ |
| CSV Export | ✅ |
| Dívidas | ✅ |
| Metas | ✅ |
| Household Members | ✅ |

### PREMIUM Plan

| Feature | Limite |
|---------|--------|
| Transações/mês | Ilimitado |
| Contas | Ilimitado |
| Investimentos | ✅ |
| Relatórios Avançados | ✅ |
| CSV Export | ✅ |
| Dívidas | ✅ |
| Metas | ✅ |
| Household Members | ✅ |

---

## 🚀 Roadmap e Features Futuras

### Em Planejamento:

- 📱 **App Mobile**: Aplicativo nativo para iOS e Android
- 🔔 **Notificações**: Alertas de pagamentos, limites de orçamento, etc.
- 📧 **Email Reports**: Relatórios automáticos por email
- 🔗 **Integrações**: Integração com bancos (Open Banking)
- 📊 **Análise Avançada**: IA para insights e recomendações
- 💬 **Suporte**: Sistema de suporte integrado
- 🌍 **Multi-idioma**: Suporte a múltiplos idiomas
- 💰 **Moedas**: Suporte a múltiplas moedas
- 📈 **Análise de Investimentos**: Análise avançada de portfólio
- 👥 **Colaboração**: Recursos avançados de colaboração

---

## 📱 Compatibilidade

### Navegadores Suportados:

- ✅ Chrome/Edge (últimas 2 versões)
- ✅ Firefox (últimas 2 versões)
- ✅ Safari (últimas 2 versões)
- ✅ Opera (últimas 2 versões)

### Dispositivos:

- ✅ Desktop (Windows, macOS, Linux)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iOS, Android)

---

## 📞 Suporte e Contato

Para suporte, dúvidas ou sugestões:

- 📧 Email: [suporte@sparefinance.com]
- 📚 Documentação: [docs.sparefinance.com]
- 💬 Chat: Disponível no app (planos pagos)

---

## 📄 Licença

MIT License - Ver arquivo LICENSE para detalhes.

---

**Última Atualização**: Novembro 2024  
**Versão do Documento**: 1.0

