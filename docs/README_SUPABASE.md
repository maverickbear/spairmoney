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

As migrations são gerenciadas diretamente no Supabase via SQL. Os arquivos de migration estão em `supabase/migrations/`.

Para aplicar as migrations:
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute os arquivos de migration na ordem

### 4. Popular o banco com dados de exemplo

```bash
npm run db:seed
```

## Estrutura

- `lib/supabase.ts` - Cliente Supabase para uso no cliente (client components)
- `lib/supabase-server.ts` - Cliente Supabase para uso no servidor (server components/API routes)
- `supabase/migrations/` - Arquivos SQL de migration do banco de dados

## Notas

- O projeto usa Supabase (PostgreSQL) diretamente via `@supabase/supabase-js`
- Todas as funcionalidades usam o cliente Supabase
- O Supabase também oferece autenticação, storage e outros recursos que podem ser adicionados posteriormente

