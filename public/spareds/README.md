# Spare Design System - Public Access

Este diretório contém os tokens do Spare Design System acessíveis publicamente.

## Acesso via API

### Todos os Tokens
```
GET /api/spareds/tokens
```

### Tokens Específicos
```
GET /api/spareds/tokens?type=default-values
GET /api/spareds/tokens?type=foundation
GET /api/spareds/tokens?type=semantic
GET /api/spareds/tokens?type=component
```

### Documentação da API
```
GET /api/spareds/docs
```

## Acesso Direto aos Arquivos JSON

Os arquivos JSON também estão disponíveis diretamente:

- `/spareds/tokens/colors/default-values.json`
- `/spareds/tokens/colors/foundation-tokens.json`
- `/spareds/tokens/colors/semantic-tokens.json`
- `/spareds/tokens/colors/component-tokens.json`

## Exemplo de Uso

### JavaScript/TypeScript (dentro do projeto)
```typescript
import { getToken } from '@/spareds/tokens';
const color = getToken('component.button.primary.bg');
```

### Fetch API (qualquer lugar)
```javascript
// Obter todos os tokens
fetch('https://your-domain.com/api/spareds/tokens')
  .then(res => res.json())
  .then(data => console.log(data));

// Obter tokens de componentes
fetch('https://your-domain.com/api/spareds/tokens?type=component')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Acesso Direto (JSON)
```javascript
// Carregar JSON diretamente
fetch('https://your-domain.com/spareds/tokens/colors/component-tokens.json')
  .then(res => res.json())
  .then(data => console.log(data));
```

## CORS

A API está configurada com CORS habilitado, permitindo acesso de qualquer origem.

## Cache

Os tokens são cacheados por 1 hora (3600 segundos) com revalidação em background.

## Estrutura

```
/spareds/
├── tokens/
│   └── colors/
│       ├── default-values.json    # Nível 1: Valores brutos
│       ├── foundation-tokens.json  # Nível 2: Tokens primitivos
│       ├── semantic-tokens.json    # Nível 3: Tokens semânticos
│       └── component-tokens.json  # Nível 4: Tokens de componentes
└── README.md                       # Este arquivo
```

## Mais Informações

Para documentação completa, consulte:
- `/spareds/README.md` - Documentação principal
- `/spareds/docs/color-system.md` - Sistema de cores
- `/spareds/docs/token-hierarchy.md` - Hierarquia de tokens
- `/spareds/docs/usage-guide.md` - Guia de uso

