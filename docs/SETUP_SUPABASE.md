# Como Configurar a Connection String do Supabase

## Passo a Passo

### 1. Obter a Connection String do Dashboard Supabase

1. Acesse: https://app.supabase.com
2. Faça login e selecione seu projeto
3. Vá em **Settings** (ícone de engrenagem) > **Database**
4. Role até a seção **Connection string**
5. Selecione a aba **URI** ou **Connection pooling**

### 2. Tipos de Connection String

#### Opção 1: Connection Pooling (Recomendado)
```
postgresql://postgres.dvshwrtzazoetkbzxolv:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Opção 2: Connection Direta
```
postgresql://postgres:[YOUR-PASSWORD]@db.dvshwrtzazoetkbzxolv.supabase.co:5432/postgres
```

### 3. Senha com Caracteres Especiais

Se sua senha contém caracteres especiais (`*`, `]`, `[`, `&`, `%`, etc.), você precisa fazer URL encoding:

**Caracteres que precisam ser codificados:**
- `*` → `%2A`
- `]` → `%5D`
- `[` → `%5B`
- `&` → `%26`
- `%` → `%25`
- `@` → `%40`
- `#` → `%23`
- `?` → `%3F`
- `=` → `%3D`

**Exemplo:**
Se sua senha é `Maverick475869*]`, a connection string deve ser:
```
DATABASE_URL="postgresql://postgres:Maverick475869%2A%5D@db.dvshwrtzazoetkbzxolv.supabase.co:5432/postgres"
```

### 4. Atualizar o arquivo .env

Edite o arquivo `.env` e cole a connection string completa com a senha codificada:

```bash
DATABASE_URL="postgresql://postgres:[SUA-SENHA-CODIFICADA]@db.dvshwrtzazoetkbzxolv.supabase.co:5432/postgres"
```

**OU** use a connection string diretamente do dashboard (já vem com a senha correta).

### 5. Verificar a Configuração

Após configurar, execute:

```bash
npm run db:seed
```

Se der erro de autenticação, verifique:
- A senha está correta?
- Caracteres especiais estão codificados?
- Está usando a senha do banco (não do usuário do dashboard)?

### 6. Obter a Senha do Banco

Se você não lembra da senha do banco:
1. No dashboard Supabase, vá em **Settings** > **Database**
2. Procure por **Database password** ou **Reset database password**
3. Você pode resetar a senha se necessário

## Ferramentas Úteis

Para codificar a senha automaticamente, você pode usar:
- JavaScript: `encodeURIComponent('sua-senha')`
- Online: https://www.urlencoder.org/

