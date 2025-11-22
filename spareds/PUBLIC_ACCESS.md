# Acesso Público ao Spare Design System

O Spare Design System está disponível publicamente através de múltiplos métodos.

## Métodos de Acesso

### 1. API REST Endpoints

#### Obter Todos os Tokens
```bash
GET /api/spareds/tokens
```

#### Obter Tokens Específicos
```bash
GET /api/spareds/tokens?type=default-values
GET /api/spareds/tokens?type=foundation
GET /api/spareds/tokens?type=semantic
GET /api/spareds/tokens?type=component
```

#### Documentação da API
```bash
GET /api/spareds/docs
```

### 2. Arquivos JSON Estáticos

Os arquivos JSON estão disponíveis na pasta `public`:

```
https://your-domain.com/spareds/tokens/colors/default-values.json
https://your-domain.com/spareds/tokens/colors/foundation-tokens.json
https://your-domain.com/spareds/tokens/colors/semantic-tokens.json
https://your-domain.com/spareds/tokens/colors/component-tokens.json
```

### 3. Importação Direta (TypeScript/JavaScript)

Dentro do projeto:
```typescript
import { getToken, tokens } from '@/spareds/tokens';
```

## Exemplos de Uso

### JavaScript/TypeScript (Fetch)
```typescript
// Obter todos os tokens
const response = await fetch('/api/spareds/tokens');
const allTokens = await response.json();

// Obter tokens de componentes
const componentResponse = await fetch('/api/spareds/tokens?type=component');
const componentTokens = await componentResponse.json();

// Usar um token específico
const buttonBg = componentTokens.button?.primary?.bg?.value;
```

### JavaScript (JSON Direto)
```typescript
// Carregar JSON diretamente
const response = await fetch('/spareds/tokens/colors/component-tokens.json');
const tokens = await response.json();
```

### cURL
```bash
# Obter todos os tokens
curl https://your-domain.com/api/spareds/tokens

# Obter tokens semânticos
curl https://your-domain.com/api/spareds/tokens?type=semantic

# Obter documentação
curl https://your-domain.com/api/spareds/docs
```

## CORS

A API está configurada com CORS habilitado (`Access-Control-Allow-Origin: *`), permitindo acesso de qualquer origem.

## Cache

- **API**: Cache de 1 hora (3600s) com revalidação em background
- **JSON Estáticos**: Cache do navegador/CDN padrão

## Estrutura de Resposta da API

### Todos os Tokens
```json
{
  "defaultValues": { ... },
  "foundation": { ... },
  "semantic": { ... },
  "component": { ... },
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2025-02-03T...",
    "documentation": "/api/spareds/docs"
  }
}
```

### Tokens Específicos
Retorna apenas o objeto JSON do tipo solicitado.

## Segurança

- Apenas métodos GET são permitidos
- CORS configurado para acesso público
- Sem autenticação necessária (dados públicos)
- Headers de segurança aplicados

## Atualização

Os tokens são atualizados automaticamente quando os arquivos em `/spareds/tokens/` são modificados. Os arquivos em `/public/spareds/` devem ser sincronizados manualmente ou via script de build.

