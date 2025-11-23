# Configurando Domínio Próprio para Google Auth

Este guia explica como configurar o Google OAuth para usar seu domínio próprio em vez do domínio padrão do Supabase.

## 📋 Pré-requisitos

- Domínio próprio configurado e apontando para sua aplicação
- Acesso ao Google Cloud Console
- Acesso ao painel do Supabase (se usando Supabase hospedado)
- Variável de ambiente `NEXT_PUBLIC_APP_URL` configurada com seu domínio

## 🔧 Passo 1: Configurar Google Cloud Console

### 1.1 Criar/Configurar OAuth 2.0 Client ID

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto ou crie um novo
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Se solicitado, configure a tela de consentimento OAuth primeiro

### 1.2 Configurar URIs de Redirecionamento

No OAuth client, adicione as seguintes URIs de redirecionamento autorizadas:

**Para Supabase Hospedado:**
```
https://seu-dominio.com/auth/callback
https://[seu-projeto].supabase.co/auth/v1/callback
```

**Para Supabase Self-hosted:**
```
https://seu-dominio.com/auth/callback
https://auth.seu-dominio.com/auth/v1/callback
```

**Importante:** 
- Substitua `seu-dominio.com` pelo seu domínio real
- Mantenha ambas as URIs (sua e do Supabase) para garantir compatibilidade
- Use `https://` (não `http://`) em produção

### 1.3 Obter Credenciais

Anote:
- **Client ID** (ex: `123456789-abc.apps.googleusercontent.com`)
- **Client Secret** (ex: `GOCSPX-xxxxxxxxxxxxx`)

## 🔧 Passo 2: Configurar Supabase

### 2.1 Supabase Hospedado (Cloud)

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para **Authentication** > **Providers**
4. Clique em **Google**
5. Configure:
   - **Enable Google provider**: ✅ Ativado
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
6. Em **Redirect URLs**, adicione:
   ```
   https://seu-dominio.com/auth/callback
   ```
7. Salve as configurações

### 2.2 Supabase Self-hosted

Se você está usando Supabase self-hosted, configure as variáveis de ambiente no GoTrue:

**No arquivo `docker-compose.yml` ou variáveis de ambiente:**

```yaml
auth:
  environment:
    GOTRUE_SITE_URL: https://seu-dominio.com
    GOTRUE_URI_ALLOW_LIST: https://seu-dominio.com,https://auth.seu-dominio.com
    GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
    GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: seu-client-id
    GOTRUE_EXTERNAL_GOOGLE_SECRET: seu-client-secret
    GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: https://seu-dominio.com/auth/callback
```

## 🔧 Passo 3: Configurar Variáveis de Ambiente

Certifique-se de que sua aplicação tem a variável de ambiente configurada:

```env
# .env.local ou .env.production
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

**Importante:** 
- Use `https://` em produção (não `http://`)
- Não inclua barra final (`/`) no final da URL
- Esta variável já está sendo usada no código em `lib/api/auth-client.ts`

## 🔧 Passo 4: Verificar Configuração no Código

O código já está configurado corretamente. A função `signInWithGoogle()` em `lib/api/auth-client.ts` usa:

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
const redirectTo = `${appUrl}/auth/callback`;
```

Isso garante que o redirecionamento use seu domínio próprio.

## ✅ Passo 5: Testar

1. **Teste Local (Desenvolvimento):**
   ```bash
   # Certifique-se de que NEXT_PUBLIC_APP_URL está configurado
   NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run dev
   ```

2. **Teste em Produção:**
   - Acesse `https://seu-dominio.com/auth/login`
   - Clique em "Sign in with Google"
   - Verifique se o redirecionamento usa seu domínio
   - Após autenticação, você deve ser redirecionado para `https://seu-dominio.com/auth/callback`

## 🔍 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** A URI de redirecionamento não está autorizada no Google Cloud Console.

**Solução:**
1. Verifique se adicionou `https://seu-dominio.com/auth/callback` no Google Cloud Console
2. Verifique se a URL está exatamente igual (sem barra final, com `https://`)
3. Aguarde alguns minutos após salvar (pode levar tempo para propagar)

### Erro: "Invalid client"

**Causa:** Client ID ou Client Secret incorretos no Supabase.

**Solução:**
1. Verifique se copiou corretamente o Client ID e Secret do Google Cloud Console
2. Verifique se não há espaços extras ao copiar/colar
3. Reconfigure no painel do Supabase

### Redirecionamento ainda usa domínio do Supabase

**Causa:** `NEXT_PUBLIC_APP_URL` não está configurado ou está incorreto.

**Solução:**
1. Verifique a variável de ambiente `NEXT_PUBLIC_APP_URL`
2. Certifique-se de que está usando `https://` em produção
3. Reinicie o servidor após alterar variáveis de ambiente

### Domínio não verificado no Google

**Causa:** Google pode exigir verificação de propriedade do domínio.

**Solução:**
1. Acesse [Google Search Console](https://search.google.com/search-console)
2. Adicione e verifique seu domínio
3. Isso pode ser necessário para alguns recursos avançados do OAuth

## 📝 Notas Importantes

1. **Segurança:**
   - Nunca exponha o Client Secret no código frontend
   - Use variáveis de ambiente para todas as credenciais
   - Mantenha o Client Secret seguro e rotacione se comprometido

2. **Ambientes:**
   - Configure URIs separadas para desenvolvimento e produção
   - Use `localhost:3000` para desenvolvimento local
   - Use seu domínio de produção para produção

3. **Compatibilidade:**
   - Mantenha ambas as URIs (sua e do Supabase) autorizadas no Google
   - Isso garante que funcione mesmo durante migrações

4. **SSL/TLS:**
   - Google OAuth requer HTTPS em produção
   - Use certificados SSL válidos (Let's Encrypt, etc.)

## 🔗 Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)

