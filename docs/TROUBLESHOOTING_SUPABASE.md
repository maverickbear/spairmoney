# Troubleshooting Supabase

## Problema: "Failed to create account"

Se você está recebendo erros ao criar contas ou outras entidades no Supabase, verifique os seguintes pontos:

### 1. Row Level Security (RLS)

**⚠️ IMPORTANTE**: Esta aplicação implementa RLS (Row Level Security) para isolamento de dados entre usuários. Veja [RLS_SECURITY.md](./RLS_SECURITY.md) para documentação completa.

**Problema**: "new row violates row-level security policy"

**Causa**: Tentando inserir um registro sem `userId` ou com `userId` incorreto.

**Solução**:
1. Certifique-se de que está incluindo `userId` ao criar registros
2. Verifique se o usuário está autenticado corretamente
3. Para tabelas relacionadas (Transaction, Subcategory), certifique-se de que o registro pai pertence ao usuário

**Exemplo de código correto**:
```typescript
const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();

const { data: account } = await supabase
  .from("Account")
  .insert({
    name: "Checking",
    type: "checking",
    userId: user.id  // ✅ OBRIGATÓRIO
  });
```

**Para desenvolvimento/teste** (NÃO recomendado para produção):
Se precisar desabilitar RLS temporariamente para testes:
```sql
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
-- etc...
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

