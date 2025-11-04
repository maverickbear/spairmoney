# Guia de Migração Manual para Supabase

Este guia mostra como fazer a migração manual do banco de dados para o Supabase.

## Passo 1: Criar as Tabelas e Dados Iniciais

### Opção A: Script Completo (Recomendado) ⭐

1. Acesse o **SQL Editor** no Supabase:
   - Dashboard > **SQL Editor** (menu lateral)
   - Ou: **Settings** > **Database** > **SQL Editor**

2. Copie e cole o conteúdo do arquivo `prisma/migrations/complete_migration.sql`
   - Este arquivo contém TUDO: criação de tabelas + dados de categorias/subcategorias
   - Cria todas as 10 tabelas
   - Insere todos os Macros, Categories e Subcategories automaticamente

3. Clique em **Run** ou pressione `Ctrl+Enter` (ou `Cmd+Enter` no Mac)

4. Verifique se tudo foi criado:
   - Vá em **Table Editor** (menu lateral)
   - Verifique as tabelas: Account, Macro, Category, Subcategory, etc.
   - Verifique os dados: Vá na tabela `Macro` e veja os 11 macros criados
   - Verifique `Category` e `Subcategory` para ver todos os dados inseridos

### Opção B: Script Separado (Para mais controle)

Se preferir criar tabelas e dados separadamente:

1. Execute `manual_migration.sql` primeiro (cria apenas as tabelas)
2. Depois execute `seed_data.sql` (insere os dados de categorias)

### Opção B: Usar o Prisma Migrate (Alternativa)

Se preferir usar o Prisma para criar as tabelas:

```bash
# 1. Configure o DATABASE_URL no .env
# 2. Gere o Prisma Client
npm run prisma:generate

# 3. Faça push do schema (cria as tabelas)
npm run db:push
```

## Passo 2: Migrar Dados do SQLite (Se aplicável)

Se você tem dados no SQLite local e quer migrá-los:

### 2.1. Exportar dados do SQLite

```bash
# Instalar sqlite3 se não tiver
# macOS: brew install sqlite3
# Linux: sudo apt-get install sqlite3

# Exportar para CSV ou SQL
sqlite3 prisma/dev.db ".mode csv" ".output accounts.csv" "SELECT * FROM Account;"
sqlite3 prisma/dev.db ".mode csv" ".output transactions.csv" "SELECT * FROM Transaction;"
# Repita para cada tabela...
```

### 2.2. Importar dados no Supabase

1. Vá no **Table Editor** do Supabase
2. Selecione a tabela (ex: `Account`)
3. Clique em **Insert** > **Import data via CSV**
4. Faça upload do arquivo CSV
5. Mapeie as colunas e importe

**OU** use o SQL Editor para inserir dados via SQL:

```sql
-- Exemplo: Inserir contas
INSERT INTO "Account" (id, name, type, "createdAt", "updatedAt")
VALUES 
  ('clx1234567890', 'Checking', 'checking', NOW(), NOW()),
  ('clx0987654321', 'Credit Card', 'credit', NOW(), NOW());
```

## Passo 3: Popular com Dados de Seed

Se não tem dados antigos, execute o seed script:

```bash
npm run db:seed
```

**Nota:** O seed script já está configurado e criará todos os dados de exemplo.

## Passo 4: Verificar a Migração

1. **Verificar Tabelas:**
   - Table Editor > Verifique se todas as tabelas existem
   - Verifique se têm dados (se aplicável)

2. **Testar a Aplicação:**
   ```bash
   npm run dev
   ```
   - Acesse http://localhost:3000
   - Teste as funcionalidades principais
   - Verifique se os dados aparecem corretamente

## Passo 5: Configurar Permissões (RLS - Row Level Security)

O Supabase usa Row Level Security por padrão. Se necessário, você pode:

1. Ir em **Authentication** > **Policies**
2. Criar políticas para permitir acesso às tabelas
3. Ou desabilitar RLS temporariamente para desenvolvimento (não recomendado para produção)

**Para desabilitar RLS temporariamente:**

```sql
-- No SQL Editor, execute para cada tabela:
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
-- etc...
```

**Ou criar políticas permissivas:**

```sql
-- Permitir todas as operações para usuários autenticados
CREATE POLICY "Enable all for authenticated users" ON "Account"
  FOR ALL USING (true) WITH CHECK (true);

-- Repita para outras tabelas conforme necessário
```

## Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de que executou o script SQL completo
- Verifique se está usando o schema correto (geralmente "public")

### Erro: "permission denied"
- Verifique as políticas RLS
- Ou desabilite RLS temporariamente para desenvolvimento

### Dados não aparecem
- Verifique se os dados foram importados corretamente
- Execute o seed script se necessário
- Verifique os logs do console da aplicação

### Problemas de Encoding
- Certifique-se de que o SQL Editor está usando UTF-8
- Verifique se caracteres especiais foram importados corretamente

## Arquivos Úteis

- `prisma/migrations/complete_migration.sql` - ⭐ **RECOMENDADO** - Script completo (tabelas + dados iniciais)
- `prisma/migrations/manual_migration.sql` - Script apenas para criar as tabelas
- `prisma/migrations/seed_data.sql` - Script apenas para inserir dados de categorias/subcategorias
- `prisma/seed.ts` - Script TypeScript para popular o banco com dados completos de exemplo (inclui transações, etc.)
- `prisma/schema.prisma` - Schema Prisma (referência)

## Próximos Passos

Após a migração:
1. Teste todas as funcionalidades da aplicação
2. Configure autenticação se necessário (Supabase Auth)
3. Configure backups automáticos no Supabase
4. Configure políticas RLS adequadas para produção

