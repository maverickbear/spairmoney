# Integração Plaid - Documentação Completa

## Visão Geral

A integração com Plaid permite que usuários conectem suas contas bancárias ao Spare Finance e importem transações automaticamente. Esta funcionalidade está disponível apenas para planos pagos (Basic e Premium).

## Arquitetura

### Estrutura do Banco de Dados

A integração utiliza três tabelas principais:

#### 1. Tabela `Account` (atualizada)
Novos campos adicionados:
- `plaidItemId` (TEXT): ID do item Plaid
- `plaidAccountId` (TEXT): ID da conta específica no Plaid
- `isConnected` (BOOLEAN): Indica se a conta está conectada ao Plaid
- `lastSyncedAt` (TIMESTAMP): Última sincronização de transações
- `syncEnabled` (BOOLEAN): Se a sincronização automática está habilitada
- `plaidMask` (TEXT): Últimos 4 dígitos da conta
- `plaidOfficialName` (TEXT): Nome oficial da conta
- `plaidVerificationStatus` (TEXT): Status de verificação da conta

#### 2. Tabela `PlaidConnection`
Armazena informações sobre a conexão Plaid:
```sql
CREATE TABLE "PlaidConnection" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "itemId" TEXT NOT NULL UNIQUE,
    "accessToken" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT
);
```

#### 3. Tabela `TransactionSync`
Rastreia transações sincronizadas do Plaid:
```sql
CREATE TABLE "TransactionSync" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
    "plaidTransactionId" TEXT NOT NULL UNIQUE,
    "transactionId" TEXT REFERENCES "Transaction"("id") ON DELETE SET NULL,
    "syncDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "status" TEXT DEFAULT 'synced'
);
```

#### 4. Tabela `Transaction` (atualizada)
Novo campo adicionado:
- `plaidMetadata` (JSONB): Metadados adicionais do Plaid armazenados como JSON

#### 5. Tabela `PlaidLiability`
Armazena informações de passivos (dívidas) do Plaid:
```sql
CREATE TABLE "PlaidLiability" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
    "liabilityType" TEXT NOT NULL, -- 'credit_card', 'student_loan', 'mortgage', 'auto_loan', 'personal_loan', etc.
    "apr" DOUBLE PRECISION,
    "interestRate" DOUBLE PRECISION,
    "minimumPayment" DOUBLE PRECISION,
    "lastPaymentAmount" DOUBLE PRECISION,
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDueDate" TIMESTAMP(3),
    "lastStatementBalance" DOUBLE PRECISION,
    "lastStatementDate" TIMESTAMP(3),
    "creditLimit" DOUBLE PRECISION,
    "currentBalance" DOUBLE PRECISION,
    "availableCredit" DOUBLE PRECISION,
    "plaidAccountId" TEXT,
    "plaidItemId" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

## Fluxo de Integração

### 1. Conectar Conta Bancária

#### Passo 1: Criar Link Token
**Endpoint:** `POST /api/plaid/create-link-token`

**Descrição:** Cria um token temporário para inicializar o Plaid Link.

**Resposta:**
```json
{
  "link_token": "link-sandbox-abc123..."
}
```

#### Passo 2: Abrir Plaid Link
O componente `ConnectBankButton` usa o `react-plaid-link` para abrir o modal do Plaid Link.

#### Passo 3: Trocar Public Token
**Endpoint:** `POST /api/plaid/exchange-public-token`

**Body:**
```json
{
  "public_token": "public-sandbox-abc123...",
  "metadata": {
    "institution": {
      "institution_id": "ins_109508",
      "name": "First Platypus Bank"
    },
    "accounts": [
      {
        "id": "BxBXxLj1m4HMXBxm9WTZixXZbVb6ABnP5qMJEN",
        "name": "Plaid Checking",
        "type": "depository",
        "subtype": "checking"
      }
    ]
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "itemId": "item_abc123...",
  "accounts": ["account_id_1", "account_id_2"]
}
```

### 2. Sincronização de Transações

#### Sincronização Automática
Após conectar uma conta, as transações são sincronizadas automaticamente.

#### Sincronização Manual
**Endpoint:** `POST /api/plaid/sync-transactions`

**Body:**
```json
{
  "accountId": "account_id_here"
}
```

**Resposta:**
```json
{
  "success": true,
  "synced": 15,
  "skipped": 3
}
```

### 3. Desconectar Conta

**Endpoint:** `POST /api/plaid/disconnect`

**Body:**
```json
{
  "accountId": "account_id_here"
}
```

## Ambiente Sandbox - Dados para Teste

### Credenciais de Teste

O Plaid Sandbox usa credenciais pré-configuradas para testes. Não é necessário usar credenciais reais.

### Números de Telefone para Teste

Use qualquer um dos seguintes números de telefone:

| Número | Descrição |
|--------|-----------|
| `415-555-0001` | Número padrão para testes |
| `415-555-0002` | Alternativo |
| `415-555-0003` | Alternativo |

**Código de Verificação:**
- **Código padrão:** `1234`
- **Alternativo:** `0000`

### Instituições Bancárias de Teste

#### First Platypus Bank
- **Institution ID:** `ins_109508`
- **Nome:** First Platypus Bank
- **Tipo:** Banco padrão para testes

#### Bank of America (Sandbox)
- **Institution ID:** `ins_109509`
- **Nome:** Bank of America

#### Chase (Sandbox)
- **Institution ID:** `ins_109510`
- **Nome:** Chase

### Credenciais de Login para Teste

Use qualquer uma das seguintes combinações:

#### Opção 1: Credenciais Simples
- **Username:** `user_good`
- **Password:** `pass_good`

#### Opção 2: Credenciais Alternativas
- **Username:** `user_custom`
- **Password:** `pass_good`

#### Opção 3: Para Erros de Teste
- **Username:** `user_locked` (simula conta bloqueada)
- **Password:** `pass_good`

### Contas de Teste Disponíveis

Após fazer login, você verá as seguintes contas:

#### Conta Checking (Depósito)
- **Nome:** "Plaid Checking"
- **Tipo:** `depository`
- **Subtipo:** `checking`
- **Saldo:** Varia (geralmente $110.00)

#### Conta Savings (Poupança)
- **Nome:** "Plaid Savings"
- **Tipo:** `depository`
- **Subtipo:** `savings`
- **Saldo:** Varia (geralmente $200.00)

#### Conta de Crédito
- **Nome:** "Plaid Credit Card"
- **Tipo:** `credit`
- **Subtipo:** `credit card`
- **Saldo:** Varia (geralmente $410.00)

### Transações de Teste

O Plaid Sandbox gera automaticamente transações de teste. Geralmente você verá:

- **6-14 transações** por conta
- **Período:** Últimos 30 dias
- **Tipos:** Compras, depósitos, transferências

#### Exemplos de Transações
- "Uber 063015 SF**POOL**"
- "Starbucks Store #12345"
- "Amazon.com"
- "Direct Deposit"
- "ATM Withdrawal"

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local`:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_secret_here
PLAID_ENV=sandbox  # ou 'development' ou 'production'
```

### Obter Credenciais

1. Acesse [Plaid Dashboard](https://dashboard.plaid.com/)
2. Crie uma conta ou faça login
3. Vá para **Team Settings > Keys**
4. Copie o **Client ID** e **Secret** (use as credenciais do ambiente Sandbox para testes)

## Componentes Frontend

### ConnectBankButton
**Localização:** `components/banking/connect-bank-button.tsx`

**Funcionalidade:**
- Abre o modal Plaid Link
- Gerencia o estado de carregamento
- Exibe mensagens de erro/sucesso

**Uso:**
```tsx
<FeatureGuard feature="hasBankIntegration">
  <ConnectBankButton onSuccess={() => loadAccounts()} />
</FeatureGuard>
```

### BankConnectionStatus
**Localização:** `components/banking/bank-connection-status.tsx`

**Funcionalidade:**
- Exibe status da conexão
- Mostra última sincronização
- Botões para sincronizar/desconectar

## API Routes

### `/api/plaid/create-link-token`
Cria um token para inicializar o Plaid Link.

**Método:** POST  
**Autenticação:** Requerida  
**Feature Guard:** `hasBankIntegration`

### `/api/plaid/exchange-public-token`
Troca o public token por um access token permanente.

**Método:** POST  
**Body:**
```json
{
  "public_token": "string",
  "metadata": {
    "institution": {
      "institution_id": "string",
      "name": "string"
    },
    "accounts": [...]
  }
}
```

### `/api/plaid/sync-transactions`
Sincroniza transações de uma conta conectada.

**Método:** POST  
**Body:**
```json
{
  "accountId": "string"
}
```

### `/api/plaid/disconnect`
Desconecta uma conta bancária.

**Método:** POST  
**Body:**
```json
{
  "accountId": "string"
}
```

### `/api/plaid/sync-liabilities`
Sincroniza passivos (dívidas) de uma conexão Plaid.

**Método:** POST  
**Body:**
```json
{
  "itemId": "string"
}
```

**Resposta:**
```json
{
  "success": true,
  "synced": 2,
  "updated": 1,
  "errors": 0
}
```

## Mapeamento de Transações

### Plaid → Spare Finance

| Plaid | Spare Finance |
|-------|---------------|
| `amount < 0` | `type: 'expense'` |
| `amount > 0` | `type: 'income'` |
| `amount` (absoluto) | `amount` |
| `date` | `date` |
| `name` ou `merchant_name` | `description` |
| `account_id` | `accountId` |

### Metadados do Plaid (plaidMetadata)

Os metadados adicionais do Plaid são armazenados no campo `plaidMetadata` (JSONB) da tabela `Transaction`. A estrutura inclui:

```typescript
{
  // Categorias
  category?: string[] | null;                    // Array de categorias do Plaid
  category_id?: string | null;                   // ID da categoria
  personal_finance_category?: {                  // Categoria de finanças pessoais
    primary?: string | null;                        // Categoria primária
    detailed?: string | null;                     // Categoria detalhada
    confidence_level?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  } | null;
  
  // Localização
  location?: {
    address?: string | null;
    city?: string | null;
    region?: string | null;
    postal_code?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
  } | null;
  
  // Metadados de pagamento
  payment_meta?: {
    reference_number?: string | null;
    ppd_id?: string | null;
    payee?: string | null;
    by_order_of?: string | null;
    payer?: string | null;
    payment_method?: string | null;
    payment_processor?: string | null;
    reason?: string | null;
  } | null;
  
  // Status e datas
  pending?: boolean | null;                      // Se a transação está pendente
  authorized_date?: string | null;                // Data de autorização
  authorized_datetime?: string | null;            // Data/hora de autorização
  datetime?: string | null;                       // Data/hora da transação
  
  // Moeda
  iso_currency_code?: string | null;             // Código ISO da moeda (ex: "USD", "BRL")
  unofficial_currency_code?: string | null;       // Código não oficial da moeda
  
  // Códigos
  transaction_code?: string | null;              // Código da transação
  account_owner?: string | null;                  // Proprietário da conta
  pending_transaction_id?: string | null;         // ID da transação pendente relacionada
}
```

### Lógica de Tipo

```typescript
const isExpense = plaidTx.amount < 0;
const transactionData = {
  type: isExpense ? 'expense' : 'income',
  amount: Math.abs(plaidTx.amount),
  // ...
};
```

## Segurança

### Content Security Policy

O `next.config.ts` foi atualizado para permitir scripts do Plaid:

```typescript
{
  key: "Content-Security-Policy",
  value: [
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.plaid.com",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.plaid.com",
    "frame-src 'self' https://js.stripe.com https://cdn.plaid.com https://*.plaid.com",
    // ...
  ].join("; "),
}
```

### Permissions Policy

Permissão de câmera para escaneamento de cartões:

```typescript
{
  key: "Permissions-Policy",
  value: "camera=(self \"https://cdn.plaid.com\"), microphone=(), geolocation=()",
}
```

### Armazenamento de Tokens

- **Access Tokens:** Armazenados criptografados no banco de dados
- **Public Tokens:** Usados apenas uma vez e descartados
- **Link Tokens:** Temporários, expiram após uso

## Troubleshooting

### Problema: Botão "Connect Bank Account" desabilitado

**Solução:**
1. Verifique se o usuário tem um plano pago (Basic ou Premium)
2. Verifique se `PLAID_CLIENT_ID` e `PLAID_SECRET` estão configurados
3. Verifique os logs do console para erros

### Problema: Modal do Plaid Link não abre

**Solução:**
1. Verifique o Content Security Policy no `next.config.ts`
2. Verifique se o link token foi criado com sucesso
3. Verifique os logs do console para erros do Plaid

### Problema: Transações não aparecem

**Solução:**
1. Verifique se a sincronização foi executada
2. Verifique o filtro de data (padrão: últimos 30 dias)
3. Verifique os logs do servidor para erros de sincronização
4. Verifique se as transações foram criadas no banco de dados

### Problema: Erro "Invalid phone number"

**Solução:**
- Use um dos números de teste listados acima
- Use o código de verificação `1234`

### Problema: Erro "INVALID_PHONE_NUMBER"

**Solução:**
- No ambiente sandbox, use números de teste específicos
- O número `415-555-0001` sempre funciona

## Testes

### Teste Completo de Integração

1. **Conectar Conta:**
   - Clique em "Connect Bank Account"
   - Selecione "First Platypus Bank"
   - Use `user_good` / `pass_good`
   - Use telefone `415-555-0001`
   - Use código `1234`

2. **Verificar Contas:**
   - Verifique se as contas aparecem na página de Accounts
   - Verifique se o status mostra "Connected"

3. **Sincronizar Transações:**
   - As transações devem sincronizar automaticamente
   - Ou clique em "Sync" manualmente

4. **Verificar Transações:**
   - Vá para a página de Transactions
   - Verifique se as transações aparecem
   - Verifique se as categorias podem ser editadas

### Teste de Erros

#### Testar Conta Bloqueada
- Username: `user_locked`
- Password: `pass_good`
- Deve mostrar erro apropriado

#### Testar Credenciais Inválidas
- Username: `user_bad`
- Password: `pass_bad`
- Deve mostrar erro de autenticação

## Limitações do Sandbox

1. **Transações Limitadas:** Apenas 6-14 transações por conta
2. **Período Fixo:** Transações dos últimos 30 dias
3. **Dados Estáticos:** Não refletem transações em tempo real
4. **Sem Webhooks:** Webhooks não funcionam no sandbox

## Dados Coletados do Plaid

### Informações de Contas
- ID da conta (`account_id`)
- Nome da conta (`name`)
- Nome oficial (`official_name`)
- Últimos 4 dígitos (`mask`)
- Tipo e subtipo (`type`, `subtype`)
- Saldos (`balances.available`, `balances.current`)
- Status de verificação (`verification_status`)

### Informações de Transações
- Dados básicos: ID, data, valor, descrição
- Categorias: categorias do Plaid e categorias de finanças pessoais
- Localização: endereço, cidade, região, coordenadas
- Metadados de pagamento: beneficiário, pagador, método de pagamento
- Status: pendente vs confirmada, datas de autorização
- Moeda: código ISO e código não oficial

### Informações de Passivos (Liabilities)
- Cartões de crédito: limite, saldo atual, crédito disponível, APR, pagamento mínimo, datas de vencimento
- Empréstimos estudantis: taxa de juros, pagamento mínimo, datas de vencimento
- Mortgages (hipotecas): taxa de juros, pagamento mensal, datas de vencimento

## Próximos Passos (Produção)

1. **Configurar Webhooks:**
   - Receber notificações de novas transações
   - Atualizar status de conexões

2. **Sincronização Automática:**
   - Implementar cron job para sincronização periódica
   - Usar webhooks para sincronização em tempo real

3. **Tratamento de Erros:**
   - Implementar retry logic
   - Notificar usuários sobre problemas de conexão

4. **Otimizações:**
   - Cache de transações
   - Sincronização incremental
   - Batch processing

5. **Análises Avançadas:**
   - Utilizar dados de localização para análise geográfica de gastos
   - Usar categorias do Plaid para melhorar sugestões de categoria
   - Analisar passivos para insights de endividamento

## Referências

- [Plaid API Documentation](https://plaid.com/docs/)
- [Plaid Sandbox Guide](https://plaid.com/docs/sandbox/)
- [Plaid Link Documentation](https://plaid.com/docs/link/)
- [react-plaid-link](https://github.com/plaid/react-plaid-link)

## Suporte

Para problemas ou dúvidas sobre a integração Plaid:
1. Verifique os logs do servidor
2. Verifique os logs do console do navegador
3. Consulte a documentação oficial do Plaid
4. Entre em contato com o suporte do Plaid se necessário

