# Fix Transaction RLS - Guia de Correção

## Problema Identificado

O RLS (Row Level Security) estava bloqueando o acesso às transações, fazendo com que os valores de "Monthly Income" e "Monthly Expenses" aparecessem como $0.00, mesmo com transações existentes no banco.

**Confirmação**: Quando o RLS foi desabilitado temporariamente, os valores apareceram corretamente, confirmando que o problema era o RLS.

## Solução

A migration `20251126000002_fix_transaction_rls_and_userid.sql` foi criada para:

1. ✅ Garantir que a coluna `userId` existe na tabela `Transaction`
2. ✅ Popular `userId` para todas as transações existentes (baseado no `Account.userId`)
3. ✅ Habilitar RLS na tabela `Transaction`
4. ✅ Criar políticas RLS corretas que permitem acesso baseado em:
   - `Transaction.userId` (propriedade direta)
   - `Account.userId` (propriedade via conta)
   - `AccountOwner` (contas compartilhadas)
   - `HouseholdMember` (membros do household)

## Passos para Aplicar a Correção

### 1. Verificar o Estado Atual

Execute o script de verificação no Supabase SQL Editor:

```bash
# No Supabase Dashboard > SQL Editor, execute:
scripts/verify-transaction-rls.sql
```

Isso mostrará:
- Status do RLS (habilitado/desabilitado)
- Status da coluna `userId`
- Quantidade de transações com/sem `userId`
- Políticas RLS existentes
- Amostra de transações

### 2. Aplicar a Migration

**Opção A: Via Supabase Dashboard (Recomendado)**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/20251126000002_fix_transaction_rls_and_userid.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Execute a migration

**Opção B: Via CLI do Supabase**

```bash
# Se você tem o Supabase CLI instalado:
supabase db push
```

### 3. Verificar se Funcionou

Após aplicar a migration, execute novamente o script de verificação:

```bash
scripts/verify-transaction-rls.sql
```

Você deve ver:
- ✅ RLS Status: **ENABLED**
- ✅ Transactions with userId: **> 0** (todas as transações devem ter userId)
- ✅ Transactions without userId: **0**
- ✅ 4 políticas RLS criadas (SELECT, INSERT, UPDATE, DELETE)

### 4. Testar na Aplicação

1. Acesse o dashboard
2. Verifique se "Monthly Income" e "Monthly Expenses" mostram valores corretos
3. Verifique se o widget "Total Income" mostra o valor correto
4. Tente criar uma nova transação para garantir que funciona

## O que a Migration Faz

### Passo 1: Garante que `userId` existe
```sql
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "userId" UUID;
```

### Passo 2: Popula `userId` para transações existentes
```sql
UPDATE "Transaction" 
SET "userId" = (
  SELECT "Account"."userId" 
  FROM "Account" 
  WHERE "Account"."id" = "Transaction"."accountId"
)
WHERE "userId" IS NULL;
```

### Passo 3: Adiciona constraints e índices
- Foreign key para `User` table
- Índice em `userId` para performance
- Torna `userId` NOT NULL (se todas as transações tiverem userId)

### Passo 4: Habilita RLS
```sql
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
```

### Passo 5: Cria Políticas RLS

As políticas permitem acesso se:
- O usuário é o dono direto da transação (`Transaction.userId = auth.uid()`)
- O usuário é o dono da conta (`Account.userId = auth.uid()`)
- O usuário é um owner via `AccountOwner`
- O usuário é um membro do household via `HouseholdMember`

## Por que isso Resolve o Problema?

**Antes**: As transações não tinham `userId` diretamente, então o RLS tinha que verificar via `Account.userId`. Isso criava queries complexas que podiam falhar ou ser muito lentas.

**Depois**: As transações têm `userId` diretamente, então o RLS pode fazer uma verificação simples e eficiente: `Transaction.userId = auth.uid()`. Isso é muito mais rápido e confiável.

## Troubleshooting

### Erro: "column userId does not exist"
- A migration anterior (`20251126000001_add_user_id_to_transaction.sql`) não foi aplicada
- Execute a migration `20251126000002_fix_transaction_rls_and_userid.sql` que cria a coluna se não existir

### Erro: "new row violates row-level security policy"
- Verifique se o código está incluindo `userId` ao criar transações
- Verifique se o usuário está autenticado corretamente
- Verifique se a política INSERT está correta

### Transações ainda não aparecem
1. Verifique se o RLS está habilitado: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'Transaction';`
2. Verifique se as transações têm `userId`: `SELECT COUNT(*) FROM "Transaction" WHERE "userId" IS NULL;`
3. Verifique se o usuário atual tem transações: `SELECT COUNT(*) FROM "Transaction" WHERE "userId" = auth.uid();`
4. Verifique os logs do console do navegador e do servidor Next.js

### Migration já foi aplicada mas ainda não funciona
1. Verifique se há transações sem `userId`: `SELECT COUNT(*) FROM "Transaction" WHERE "userId" IS NULL;`
2. Se houver, execute manualmente:
   ```sql
   UPDATE "Transaction" 
   SET "userId" = (
     SELECT "Account"."userId" 
     FROM "Account" 
     WHERE "Account"."id" = "Transaction"."accountId"
   )
   WHERE "userId" IS NULL;
   ```

## Próximos Passos

Após aplicar a migration e verificar que funciona:

1. ✅ Remover logs de debug excessivos (se necessário)
2. ✅ Testar criação de novas transações
3. ✅ Testar edição de transações existentes
4. ✅ Testar exclusão de transações
5. ✅ Verificar se contas compartilhadas funcionam corretamente

## Notas Importantes

- ⚠️ **NÃO desabilite o RLS em produção** - isso é um risco de segurança
- ✅ Sempre inclua `userId` ao criar novas transações
- ✅ A migration é idempotente - pode ser executada múltiplas vezes sem problemas
- ✅ A migration verifica se as colunas/constraints já existem antes de criar

