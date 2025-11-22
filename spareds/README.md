# Spare Design System (SpareDS)

Design system completo de tokens semânticos para o Spare Finance, seguindo uma hierarquia de 4 níveis que promove consistência, manutenibilidade e escalabilidade.

## Visão Geral

O Spare Design System organiza todos os valores de design (cores, espaçamentos, tipografia, etc.) em uma estrutura hierárquica clara, permitindo que designers e desenvolvedores trabalhem com tokens semânticos ao invés de valores hardcoded.

## Estrutura de Tokens (4 Níveis)

O sistema segue uma hierarquia de 4 níveis, do mais específico ao mais abstrato:

1. **Default Values** - Valores brutos (hex, pixels, etc.)
2. **Foundation Tokens** - Tokens primitivos fundamentais
3. **Semantic Tokens** - Tokens com propósito semântico
4. **Component Tokens** - Tokens específicos de componentes

### Exemplo de Hierarquia

```
Default Value:     #4A4AF2
    ↓
Foundation Token:  color.primary.500
    ↓
Semantic Token:    color.semantic.primary
    ↓
Component Token:   button.primary.bg
```

## Estrutura de Arquivos

```
/spareds/
├── README.md                    # Este arquivo
├── tokens/
│   ├── colors/
│   │   ├── default-values.json  # Nível 1: Valores brutos
│   │   ├── foundation-tokens.json # Nível 2: Tokens primitivos
│   │   ├── semantic-tokens.json  # Nível 3: Tokens semânticos
│   │   └── component-tokens.json # Nível 4: Tokens de componentes
│   ├── typography/
│   ├── spacing/
│   └── index.ts                 # Export centralizado
├── docs/
│   ├── color-system.md          # Sistema de cores completo
│   ├── token-hierarchy.md       # Explicação da hierarquia
│   └── usage-guide.md           # Guia de uso prático
└── examples/
    └── usage-examples.tsx       # Exemplos de código
```

## 🏠 Home Screen

Acesse a interface visual do design system em:
- **Web**: `/spareds` - Home screen interativa com visualização de tokens

## Acesso Público

O Spare Design System está disponível publicamente através de múltiplos métodos:

### 1. API REST (Recomendado)
```bash
# Obter todos os tokens
GET /api/spareds/tokens

# Obter tokens específicos
GET /api/spareds/tokens?type=component
GET /api/spareds/tokens?type=semantic
GET /api/spareds/tokens?type=foundation
GET /api/spareds/tokens?type=default-values

# Documentação da API
GET /api/spareds/docs
```

### 2. Arquivos JSON Estáticos
```
/spareds/tokens/colors/default-values.json
/spareds/tokens/colors/foundation-tokens.json
/spareds/tokens/colors/semantic-tokens.json
/spareds/tokens/colors/component-tokens.json
```

### 3. Importação Direta (TypeScript/JavaScript)
```typescript
import { tokens, colors, getToken } from '@/spareds/tokens';
```

**📖 Veja [PUBLIC_ACCESS.md](./PUBLIC_ACCESS.md) para mais detalhes sobre acesso público.**

## Uso Rápido

### Importar Tokens (Dentro do Projeto)

```typescript
import { tokens, colors, getToken } from '@/spareds/tokens';

// Acessar tokens diretamente
const primaryColor = tokens.semantic.color.semantic.primary;

// Usar helper function
const buttonBg = getToken('component.button.primary.bg');
```

### Usar via API (Qualquer Origem)

```typescript
// Obter todos os tokens
const response = await fetch('/api/spareds/tokens');
const allTokens = await response.json();

// Obter tokens de componentes
const componentResponse = await fetch('/api/spareds/tokens?type=component');
const componentTokens = await componentResponse.json();
```

### Usar em Componentes React

```tsx
import { getToken } from '@/spareds/tokens';

function Button() {
  const bgColor = getToken('component.button.primary.bg');
  
  return (
    <button style={{ backgroundColor: bgColor }}>
      Click me
    </button>
  );
}
```

## Documentação Completa

- **[Acesso Público](./PUBLIC_ACCESS.md)** - Como acessar os tokens publicamente
- **[Sistema de Cores](./docs/color-system.md)** - Paleta completa de cores e suas aplicações
- **[Hierarquia de Tokens](./docs/token-hierarchy.md)** - Explicação detalhada dos 4 níveis
- **[Guia de Uso](./docs/usage-guide.md)** - Exemplos práticos e melhores práticas

## Princípios

1. **Semântica sobre Valores**: Use tokens semânticos ao invés de valores hardcoded
2. **Hierarquia Clara**: Respeite a hierarquia de 4 níveis
3. **Consistência**: Use os mesmos tokens para os mesmos propósitos
4. **Manutenibilidade**: Mudanças em valores brutos propagam automaticamente
5. **Escalabilidade**: Fácil adicionar novos tokens seguindo a estrutura

## Contribuindo

Ao adicionar novas cores ou tokens:

1. Adicione o valor bruto em `default-values.json`
2. Crie o foundation token correspondente
3. Mapeie para um semantic token se aplicável
4. Crie component tokens para componentes específicos
5. Atualize a documentação

## Licença

Este design system é parte do projeto Spare Finance.

