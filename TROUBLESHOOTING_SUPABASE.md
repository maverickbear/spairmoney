# Troubleshooting Supabase

## Problema: "Failed to create account"

Se você está recebendo erros ao criar contas ou outras entidades no Supabase, verifique os seguintes pontos:

### 1. Row Level Security (RLS)

O Supabase pode ter Row Level Security habilitado nas tabelas. Para desabilitar temporariamente (apenas para desenvolvimento):

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** > **Policies**
3. Para cada tabela (`Account`, `Transaction`, `Budget`, etc.):
   - Verifique se há políticas RLS habilitadas
   - Para desenvolvimento, você pode **desabilitar RLS** temporariamente:
     ```sql
     ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Budget" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Subcategory" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Macro" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "InvestmentAccount" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "InvestmentTransaction" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "Security" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "SecurityPrice" DISABLE ROW LEVEL SECURITY;
     ```

### 2. Verificar Tabelas

Certifique-se de que todas as tabelas existem no banco de dados. Execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. Verificar Permissões

O schema já tem `GRANT ALL` para as roles `anon`, `authenticated`, e `service_role`. Se você estiver usando a chave `anon`, certifique-se de que as permissões estão corretas.

### 4. Formato de Timestamps

Os timestamps estão sendo formatados corretamente para `timestamp(3) without time zone` através da função `getCurrentTimestamp()` em `lib/utils/timestamp.ts`.

### 5. Debug

Para ver o erro real do Supabase, verifique os logs do console do navegador e do servidor Next.js. O código agora mostra mensagens de erro mais detalhadas.

## Categorias

**Nota**: As categorias são gerenciadas via script de seed. Este é um placeholder para funcionalidade futura de gerenciamento de categorias pela interface.

Para adicionar novas categorias, execute o script de seed ou adicione manualmente via SQL Editor do Supabase.

