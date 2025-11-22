# Guia de Uso

Guia prático para usar os tokens do Spare Design System no seu código.

## Instalação e Importação

### Importar Tokens

```typescript
// Importar tudo
import { tokens, colors, getToken } from '@/spareds/tokens';

// Importar específico
import { componentTokensTokens } from '@/spareds/tokens';
```

## Uso Básico

### Acessar Tokens Diretamente

```typescript
import { tokens } from '@/spareds/tokens';

// Acessar semantic token
const primaryColor = tokens.semantic.color.semantic.primary;

// Acessar component token
const buttonBg = tokens.component.button.primary.bg;
```

### Usar Helper Function

```typescript
import { getToken } from '@/spareds/tokens';

// Usar caminho completo
const buttonBg = getToken('component.button.primary.bg');
const textColor = getToken('color.text.primary');
```

## Exemplos por Caso de Uso

### 1. Estilizar um Botão

```tsx
import { getToken } from '@/spareds/tokens';

function PrimaryButton({ children }: { children: React.ReactNode }) {
  const bgColor = getToken('component.button.primary.bg');
  const textColor = getToken('component.button.primary.text');
  const hoverBg = getToken('component.button.primary.bg-hover');
  
  return (
    <button
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bgColor;
      }}
    >
      {children}
    </button>
  );
}
```

### 2. Usar com Tailwind CSS

```tsx
import { getToken } from '@/spareds/tokens';

function Card() {
  const cardBg = getToken('component.card.bg');
  const cardBorder = getToken('component.card.border');
  
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: '1px',
      }}
    >
      Card content
    </div>
  );
}
```

### 3. Criar Tema CSS Custom Properties

```typescript
import { tokens } from '@/spareds/tokens';

// Converter tokens para CSS variables
function generateCSSVariables() {
  const variables: Record<string, string> = {};
  
  // Converter semantic tokens
  Object.entries(tokens.semantic.color.semantic).forEach(([key, value]) => {
    variables[`--color-semantic-${key}`] = value.value;
  });
  
  // Converter component tokens
  Object.entries(tokens.component.button.primary).forEach(([key, value]) => {
    variables[`--button-primary-${key}`] = value.value;
  });
  
  return variables;
}

// Usar em CSS
const cssVars = generateCSSVariables();
// Aplicar ao :root ou elemento específico
```

### 4. Usar em Gráficos

```tsx
import { getToken } from '@/spareds/tokens';
import { LineChart, Line } from 'recharts';

function IncomeExpensesChart({ data }: { data: any[] }) {
  const incomeColor = getToken('component.chart.income');
  const expensesColor = getToken('component.chart.expenses');
  
  return (
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="income"
        stroke={incomeColor}
        strokeWidth={2}
      />
      <Line
        type="monotone"
        dataKey="expenses"
        stroke={expensesColor}
        strokeWidth={2}
      />
    </LineChart>
  );
}
```

### 5. Mapear Cores de Categorias

```tsx
import { colors } from '@/spareds/tokens';

function CategoryBadge({ category }: { category: string }) {
  // Mapear categoria para cor
  const categoryColors: Record<string, string> = {
    'Rent': colors.semantic.category.blue,
    'Groceries': colors.semantic.category.emerald,
    'Restaurants': colors.semantic.category.amber,
    // ... mais mapeamentos
  };
  
  const color = categoryColors[category] || colors.semantic.category.gray;
  
  return (
    <span
      style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {category}
    </span>
  );
}
```

### 6. Suporte a Dark Mode

```tsx
import { getToken } from '@/spareds/tokens';
import { useTheme } from 'next-themes';

function ThemedCard({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgColor = isDark
    ? getToken('component.card.bg-dark')
    : getToken('component.card.bg');
  
  const textColor = isDark
    ? getToken('component.card.fg-dark')
    : getToken('component.card.fg');
  
  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {children}
    </div>
  );
}
```

### 7. Criar Hook Customizado

```tsx
import { getToken } from '@/spareds/tokens';
import { useMemo } from 'react';

function useDesignTokens() {
  return useMemo(() => ({
    // Cores semânticas
    primary: getToken('color.semantic.primary'),
    success: getToken('color.semantic.success'),
    error: getToken('color.semantic.error'),
    warning: getToken('color.semantic.warning'),
    
    // Cores de texto
    textPrimary: getToken('color.text.primary'),
    textSecondary: getToken('color.text.secondary'),
    
    // Cores de background
    bgPrimary: getToken('color.bg.primary'),
    bgSecondary: getToken('color.bg.secondary'),
    
    // Componentes
    buttonPrimary: {
      bg: getToken('component.button.primary.bg'),
      text: getToken('component.button.primary.text'),
    },
  }), []);
}

// Uso
function MyComponent() {
  const tokens = useDesignTokens();
  
  return (
    <button
      style={{
        backgroundColor: tokens.buttonPrimary.bg,
        color: tokens.buttonPrimary.text,
      }}
    >
      Click me
    </button>
  );
}
```

## Melhores Práticas

### ✅ Faça

1. **Use Component Tokens em Componentes**
   ```tsx
   // ✅ Bom
   const bg = getToken('component.button.primary.bg');
   
   // ❌ Ruim
   const bg = '#4A4AF2';
   ```

2. **Use Semantic Tokens para Estilos Gerais**
   ```tsx
   // ✅ Bom
   const textColor = getToken('color.text.primary');
   
   // ❌ Ruim
   const textColor = '#1d1d1f';
   ```

3. **Crie Helpers para Tokens Comuns**
   ```tsx
   // ✅ Bom
   const theme = {
     primary: getToken('color.semantic.primary'),
     text: getToken('color.text.primary'),
   };
   ```

### ❌ Evite

1. **Não Use Valores Hardcoded**
   ```tsx
   // ❌ Ruim
   <div style={{ color: '#4A4AF2' }}>Text</div>
   
   // ✅ Bom
   <div style={{ color: getToken('color.semantic.primary') }}>Text</div>
   ```

2. **Não Pule Níveis**
   ```tsx
   // ❌ Ruim - pulando semantic token
   const bg = getToken('color.primary.500');
   
   // ✅ Bom
   const bg = getToken('component.button.primary.bg');
   ```

3. **Não Crie Tokens Duplicados**
   ```tsx
   // ❌ Ruim - criando token que já existe
   const myPrimary = '#4A4AF2';
   
   // ✅ Bom - use o token existente
   const myPrimary = getToken('color.semantic.primary');
   ```

## Resolução de Referências

Os tokens podem referenciar outros tokens. A função `resolveToken` resolve essas referências:

```typescript
import { resolveToken } from '@/spareds/tokens';

// Token que referencia outro
const tokenValue = '{color.semantic.primary}';

// Resolver referência
const resolved = resolveToken(tokenValue);
// Retorna o valor final: '#4A4AF2'
```

## Integração com Ferramentas

### Style Dictionary

Para usar com Style Dictionary (geração de tokens para múltiplas plataformas):

```json
{
  "source": ["spareds/tokens/**/*.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "dist/css/",
      "files": [{
        "destination": "tokens.css",
        "format": "css/variables"
      }]
    }
  }
}
```

### Figma Tokens

Para sincronizar com Figma, exporte os tokens no formato do Figma Tokens plugin.

## Troubleshooting

### Token não encontrado

```typescript
const token = getToken('component.button.primary.bg');
if (!token) {
  console.warn('Token not found, using fallback');
  // Usar fallback
}
```

### Referência circular

Evite criar referências circulares entre tokens. Se necessário, use valores diretos.

## Próximos Passos

- Consulte a [Hierarquia de Tokens](./token-hierarchy.md) para entender a estrutura
- Veja o [Sistema de Cores](./color-system.md) para a paleta completa
- Explore os [Exemplos](../examples/usage-examples.tsx) para mais casos de uso

