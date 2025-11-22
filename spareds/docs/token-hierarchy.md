# Hierarquia de Tokens

Este documento explica em detalhes a hierarquia de 4 níveis do Spare Design System.

## Visão Geral

A hierarquia de tokens permite que valores brutos sejam abstraídos em níveis cada vez mais semânticos, promovendo reutilização e manutenibilidade.

```
┌─────────────────────────────────────────────────────────┐
│  Level 4: Component Tokens                              │
│  button-primary-bg, card-bg, input-border               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Level 3: Semantic Tokens                                │
│  color-bg-primary, color-text-primary, color-border     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Level 2: Foundation Tokens                               │
│  primary-500, gray-900, blue-400                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Level 1: Default Values                                 │
│  #4A4AF2, #1A1A8F, 4px                                  │
└─────────────────────────────────────────────────────────┘
```

## Nível 1: Default Values

**Propósito**: Armazenar valores brutos e primitivos.

**Características**:
- Valores literais (hex, pixels, etc.)
- Não têm significado semântico
- Base para todos os outros níveis
- Raramente usados diretamente no código

**Exemplos**:
```json
{
  "primary": {
    "blue-500": { "value": "#4A4AF2" },
    "blue-700": { "value": "#1A1A8F" }
  },
  "gray": {
    "gray-500": { "value": "#1d1d1f" }
  }
}
```

**Quando usar**: Apenas ao criar novos foundation tokens.

## Nível 2: Foundation Tokens

**Propósito**: Organizar valores brutos em escalas e famílias de cores.

**Características**:
- Agrupam valores relacionados
- Criam escalas consistentes (50-900)
- Ainda não têm significado semântico
- Referenciam default values

**Exemplos**:
```json
{
  "color": {
    "primary": {
      "500": { "value": "{default-values.primary.blue-500}" },
      "700": { "value": "{default-values.primary.blue-700}" }
    },
    "gray": {
      "500": { "value": "{default-values.gray.gray-500}" }
    }
  }
}
```

**Quando usar**: Ao criar semantic tokens ou quando precisar de uma cor específica da paleta.

## Nível 3: Semantic Tokens

**Propósito**: Dar significado e propósito aos valores.

**Características**:
- Descrevem o "porquê" ao invés do "quê"
- Independentes de componentes específicos
- Suportam temas (light/dark)
- Referenciam foundation tokens

**Exemplos**:
```json
{
  "color": {
    "semantic": {
      "primary": { "value": "{color.primary.500}" }
    },
    "text": {
      "primary": { "value": "{color.gray.500}" },
      "primary-dark": { "value": "{color.gray.50}" }
    },
    "bg": {
      "primary": { "value": "{color.gray.50}" },
      "primary-dark": { "value": "{color.gray.500}" }
    }
  }
}
```

**Quando usar**: Na maioria dos casos, especialmente para cores de texto, background, borders, etc.

## Nível 4: Component Tokens

**Propósito**: Aplicar tokens semânticos a componentes específicos.

**Características**:
- Específicos para componentes UI
- Referenciam semantic tokens
- Podem ter variantes (hover, active, disabled)
- Facilitam manutenção de componentes

**Exemplos**:
```json
{
  "button": {
    "primary": {
      "bg": { "value": "{color.semantic.primary}" },
      "text": { "value": "{color.text.inverse}" }
    }
  },
  "card": {
    "bg": { "value": "{color.card.bg}" },
    "border": { "value": "{color.card.border}" }
  }
}
```

**Quando usar**: Ao estilizar componentes específicos.

## Fluxo de Referência

Os tokens podem referenciar outros tokens usando a sintaxe `{token.path}`:

```json
{
  "component": {
    "button": {
      "primary": {
        "bg": { 
          "value": "{color.semantic.primary}"  // ← Referencia semantic token
        }
      }
    }
  }
}
```

Onde `color.semantic.primary` por sua vez referencia:
```json
{
  "color": {
    "semantic": {
      "primary": { 
        "value": "{color.primary.500}"  // ← Referencia foundation token
      }
    }
  }
}
```

E `color.primary.500` referencia:
```json
{
  "color": {
    "primary": {
      "500": { 
        "value": "{default-values.primary.blue-500}"  // ← Referencia default value
      }
    }
  }
}
```

## Benefícios da Hierarquia

1. **Manutenibilidade**: Mudar um default value propaga para todos os níveis
2. **Consistência**: Garante uso consistente de cores em todo o app
3. **Flexibilidade**: Fácil criar novos tokens seguindo a estrutura
4. **Semântica**: Código mais legível e autodocumentado
5. **Temas**: Suporte fácil a light/dark mode

## Regras de Uso

### ✅ Faça

- Use component tokens em componentes
- Use semantic tokens para estilos gerais
- Crie novos tokens seguindo a hierarquia
- Documente tokens customizados

### ❌ Não Faça

- Não use default values diretamente no código
- Não pule níveis na hierarquia
- Não crie tokens duplicados
- Não use valores hardcoded quando existe um token

## Exemplos Práticos

### Exemplo 1: Criar um Novo Botão

```typescript
// ❌ Ruim - valor hardcoded
<button style={{ backgroundColor: '#4A4AF2' }}>Click</button>

// ✅ Bom - usa component token
import { getToken } from '@/spareds/tokens';
<button style={{ backgroundColor: getToken('component.button.primary.bg') }}>
  Click
</button>
```

### Exemplo 2: Criar um Novo Token

1. Adicione default value (se não existir):
```json
{
  "accent": {
    "purple-500": { "value": "#8b5cf6" }
  }
}
```

2. Crie foundation token:
```json
{
  "color": {
    "accent": {
      "500": { "value": "{default-values.accent.purple-500}" }
    }
  }
}
```

3. Crie semantic token:
```json
{
  "color": {
    "semantic": {
      "accent": { "value": "{color.accent.500}" }
    }
  }
}
```

4. Crie component token (se necessário):
```json
{
  "button": {
    "accent": {
      "bg": { "value": "{color.semantic.accent}" }
    }
  }
}
```

## Próximos Passos

- Leia o [Guia de Uso](./usage-guide.md) para exemplos práticos
- Consulte o [Sistema de Cores](./color-system.md) para a paleta completa

