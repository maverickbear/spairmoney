# Integração com Supabase

Este projeto está configurado para usar Supabase como banco de dados PostgreSQL.

## Configuração

### 1. Obter Connection String do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **Database**
4. Role até a seção **Connection string**
5. Copie a connection string (use a versão com connection pooling se disponível)

### 2. Configurar .env.local

Edite o arquivo `.env.local` e substitua `[YOUR-PASSWORD]` pela senha do seu banco de dados:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.dvshwrtzazoetkbzxolv.supabase.co:5432/postgres"
```

**Importante:** Não commite o arquivo `.env.local` no Git (já está no .gitignore)

### 3. Executar Migrations

Após configurar o DATABASE_URL:

```bash
# Gerar Prisma Client para PostgreSQL
npm run prisma:generate

# Fazer push do schema para o Supabase
npm run db:push

# Popular o banco com dados de exemplo
npm run db:seed
```

## Estrutura

- `lib/supabase.ts` - Cliente Supabase para uso no cliente (client components)
- `lib/supabase-server.ts` - Cliente Supabase para uso no servidor (server components/API routes)
- `prisma/schema.prisma` - Schema do banco de dados (agora usando PostgreSQL)

## Migração de SQLite para PostgreSQL

Se você tinha dados no SQLite local:
1. Os dados não serão migrados automaticamente
2. Você precisará executar o seed novamente após configurar o Supabase
3. Para migrar dados existentes, você precisaria exportar do SQLite e importar no PostgreSQL manualmente

## Notas

- O Prisma agora usa PostgreSQL em vez de SQLite
- Todas as funcionalidades permanecem as mesmas
- O Supabase também oferece autenticação, storage e outros recursos que podem ser adicionados posteriormente

