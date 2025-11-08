# Configuração de Email para Convites de Membros

Este documento explica como configurar o envio de emails para convites de membros da família usando o Resend.

## Pré-requisitos

1. **Conta no Resend**: Crie uma conta gratuita em [resend.com](https://resend.com)
2. O plano gratuito do Resend oferece:
   - 3.000 emails/mês
   - 100 emails/dia
   - Suporte para desenvolvimento e produção

## Passo 1: Criar Conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Clique em **Sign Up** e crie sua conta
3. Verifique seu email se necessário

## Passo 2: Obter API Key

1. Após fazer login, vá para **API Keys** no menu lateral
2. Clique em **Create API Key**
3. Dê um nome para a chave (ex: "Spare Finance Production")
4. Selecione as permissões necessárias (normalmente **Sending access**)
5. Copie a API key gerada (você só verá ela uma vez!)

## Passo 3: Configurar Domínio (Opcional para Produção)

Para usar seu próprio domínio no email (recomendado para produção):

1. Vá em **Domains** no menu lateral
2. Clique em **Add Domain**
3. Siga as instruções para adicionar registros DNS:
   - Adicione os registros SPF, DKIM e DMARC no seu provedor de DNS
4. Aguarde a verificação (pode levar algumas horas)

**Nota**: O email padrão configurado é `naor@maverickbear.co`. Para usar este email, você precisa verificar o domínio `maverickbear.co` no Resend (veja Passo 3). Se não verificar o domínio, você pode usar temporariamente `onboarding@resend.dev` para testes, mas ele tem limitações.

## Passo 4: Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email remetente (opcional - padrão: naor@maverickbear.co)
# Se não configurado, usará naor@maverickbear.co automaticamente
RESEND_FROM_EMAIL=naor@maverickbear.co

# URL da aplicação (para links nos emails)
NEXT_PUBLIC_APP_URL=https://sparefinance.com/
```

### Para Produção (Vercel)

1. Acesse o dashboard do seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as variáveis:
   - `RESEND_API_KEY`: Sua API key do Resend
   - `RESEND_FROM_EMAIL`: Email remetente (opcional - padrão: `naor@maverickbear.co`)
   - `NEXT_PUBLIC_APP_URL`: URL da sua aplicação (ex: `https://spare-finance.vercel.app`)

## Passo 5: Testar

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página de membros e convide alguém
3. Verifique se o email foi enviado:
   - Verifique a caixa de entrada do destinatário
   - Verifique os logs do console para mensagens de sucesso/erro
   - Acesse o dashboard do Resend em **Logs** para ver o status dos emails

## Troubleshooting

### Email não está sendo enviado

1. **Verifique se a API key está configurada**:
   - Confirme que `RESEND_API_KEY` está no `.env.local`
   - Reinicie o servidor após adicionar a variável

2. **Verifique os logs**:
   - Procure por mensagens de aviso no console
   - Verifique o dashboard do Resend em **Logs**

3. **Verifique o email remetente**:
   - O email padrão é `naor@maverickbear.co`
   - Para usar este email, você precisa verificar o domínio `maverickbear.co` no Resend
   - Se não verificar o domínio, use temporariamente `onboarding@resend.dev` para testes

### Erro de autenticação

- Verifique se a API key está correta
- Certifique-se de que não há espaços extras na chave
- Recrie a API key se necessário

### Emails indo para spam

- Configure SPF, DKIM e DMARC corretamente no seu domínio
- Use um domínio verificado ao invés de `onboarding@resend.dev`
- Adicione o domínio do Resend aos seus registros DNS

## Estrutura do Email

O email de convite inclui:
- Nome do membro convidado
- Nome e email do dono da conta
- Link para aceitar o convite
- Design responsivo e profissional

## Arquivos Relacionados

- `lib/utils/email.ts`: Função de envio de emails
- `lib/api/members.ts`: Função `inviteMember` que envia o email
- `app/members/accept/page.tsx`: Página para aceitar convites

## Segurança

- O token de convite é único e seguro (UUID)
- O link expira quando o convite é aceito
- Apenas o email correto pode aceitar o convite
- O token não expira automaticamente, mas pode ser invalidado removendo o membro

