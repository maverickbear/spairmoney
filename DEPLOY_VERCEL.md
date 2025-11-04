# Guia de Deploy na Vercel

Este guia explica como fazer o deploy gratuito do Spare Finance na Vercel.

## Pré-requisitos

- Conta no GitHub
- Conta no Supabase (já configurada)
- Variáveis de ambiente do Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Passo 1: Preparar o Repositório GitHub

1. Se ainda não tiver um repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Crie um novo repositório no GitHub e faça o push:
   ```bash
   git remote add origin https://github.com/seu-usuario/spare-finance.git
   git branch -M main
   git push -u origin main
   ```

## Passo 2: Criar Conta na Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **Sign Up**
3. Escolha **Continue with GitHub**
4. Autorize a Vercel a acessar seus repositórios

## Passo 3: Fazer Deploy do Projeto

1. No dashboard da Vercel, clique em **Add New Project**
2. Selecione o repositório `spare-finance`
3. A Vercel detectará automaticamente que é um projeto Next.js

## Passo 4: Configurar Variáveis de Ambiente

Antes de fazer o deploy, configure as variáveis de ambiente:

1. Na tela de configuração do projeto, vá até **Environment Variables**
2. Adicione as seguintes variáveis:

   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
     **Value**: Sua URL do Supabase (ex: `https://xxxxx.supabase.co`)

   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     **Value**: Sua chave anônima do Supabase

3. Clique em **Add** para cada variável
4. Selecione **Production**, **Preview** e **Development** para cada variável

## Passo 5: Deploy

1. Clique em **Deploy**
2. Aguarde o build completar (pode levar alguns minutos)
3. Quando terminar, você verá um link do tipo: `https://spare-finance-xxxxx.vercel.app`

## Passo 6: Testar

1. Acesse o link fornecido pela Vercel
2. Teste todas as funcionalidades:
   - Login/Autenticação (se aplicável)
   - Criar transações
   - Visualizar relatórios
   - Gerenciar orçamentos

## Deploy Automático

A partir de agora, toda vez que você fizer push para o branch `main` no GitHub, a Vercel fará um novo deploy automaticamente.

### Deploy de Preview

Quando você criar um Pull Request, a Vercel criará automaticamente um link de preview para testar as mudanças antes de fazer merge.

## Configurações Adicionais

### Domínio Customizado (Opcional)

Se você tiver um domínio próprio:

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Siga as instruções para configurar os DNS

### Variáveis de Ambiente por Ambiente

Você pode ter diferentes variáveis para produção, preview e desenvolvimento:

- **Production**: Usado no domínio principal
- **Preview**: Usado em PRs e branches
- **Development**: Usado no desenvolvimento local com Vercel CLI

## Troubleshooting

### Build Falha

1. Verifique os logs de build na Vercel
2. Certifique-se de que todas as variáveis de ambiente estão configuradas
3. Teste o build localmente: `npm run build`

### Erro de Variáveis de Ambiente

1. Verifique se as variáveis estão com os nomes corretos:
   - `NEXT_PUBLIC_SUPABASE_URL` (não `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (não `SUPABASE_ANON_KEY`)

2. Certifique-se de que as variáveis estão disponíveis para o ambiente correto

### Erro de Conexão com Supabase

1. Verifique se o Supabase está ativo
2. Verifique se as URLs e chaves estão corretas
3. Verifique as políticas de Row Level Security (RLS) no Supabase

## Recursos Gratuitos

### Vercel (Plano Hobby)
- ✅ 100GB bandwidth/mês
- ✅ Deploys ilimitados
- ✅ Domínio `.vercel.app` gratuito
- ✅ SSL automático
- ✅ Deploy automático via GitHub

### Supabase (Plano Free)
- ✅ 500MB database
- ✅ 2GB bandwidth/mês
- ✅ 50,000 monthly active users
- ✅ API REST automática

## Suporte

- Documentação Vercel: [https://vercel.com/docs](https://vercel.com/docs)
- Documentação Next.js: [https://nextjs.org/docs](https://nextjs.org/docs)
- Documentação Supabase: [https://supabase.com/docs](https://supabase.com/docs)

