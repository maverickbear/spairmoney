# Sistema de Cores

Documentação completa do sistema de cores do Spare Design System.

## Paleta de Cores

### Cores Primárias

A cor primária do Spare Finance é um azul vibrante que representa confiança e tecnologia financeira.

| Token | Valor | Uso |
|-------|-------|-----|
| `primary.900` | `#0D0D5A` | Backgrounds escuros, gradientes |
| `primary.800` | `#1A1A7A` | Estados hover escuros |
| `primary.700` | `#1A1A8F` | Texto em backgrounds claros |
| `primary.600` | `#2A2AB8` | Estados hover |
| `primary.500` | `#4A4AF2` | Cor primária base |
| `primary.400` | `#6D6DFF` | Estados hover claros |
| `primary.300` | `#8B8BFF` | Backgrounds claros, overlays |

**Uso Semântico**:
- `color.semantic.primary` → Ações principais, links, elementos de destaque
- `button.primary.bg` → Botões primários
- `navigation.link-active` → Links ativos na navegação

### Escala de Cinza

Escala neutra para textos, backgrounds e bordas.

| Token | Valor | Uso |
|-------|-------|-----|
| `gray.50` | `#f5f5f7` | Backgrounds muito claros |
| `gray.100` | `#d1d5db` | Backgrounds claros, bordas sutis |
| `gray.200` | `#9ca3af` | Bordas, textos desabilitados |
| `gray.300` | `#6b7280` | Textos secundários |
| `gray.400` | `#374151` | Textos secundários escuros |
| `gray.500` | `#1d1d1f` | Textos primários |

**Uso Semântico**:
- `color.text.primary` → Texto principal (light mode)
- `color.text.primary-dark` → Texto principal (dark mode)
- `color.bg.primary` → Background principal
- `color.border.default` → Bordas padrão

### Cores de Status

Cores semânticas para comunicar estados e feedback.

#### Success (Verde)
- `green.500` (`#10b981`) - Sucesso padrão
- `green.400` (`#22c55e`) - Emerald, variante mais clara
- `green.300` (`#34d399`) - Sucesso suave

**Uso**: Mensagens de sucesso, badges, indicadores positivos

#### Error (Vermelho)
- `red.500` (`#ef4444`) - Erro padrão
- `red.400` (`#f87171`) - Erro suave
- `red.600` (`#f43f5e`) - Rose, variante mais escura

**Uso**: Mensagens de erro, ações destrutivas, alertas críticos

#### Warning (Amarelo/Âmbar)
- `amber.500` (`#f59e0b`) - Aviso padrão
- `amber.400` (`#eab308`) - Amarelo, variante mais clara
- `amber.600` (`#fb923c`) - Laranja, variante mais escura

**Uso**: Avisos, notificações, estados de atenção

#### Info (Azul)
- `blue.500` (`#3b82f6`) - Info padrão
- `blue.400` (`#0ea5e9`) - Sky, variante mais clara
- `blue.600` (`#6366f1`) - Indigo, variante mais escura

**Uso**: Informações, tooltips, estados informativos

### Cores de Categorias

Cores específicas para categorização de transações e dados financeiros.

#### Cores Principais
- **Blue** (`#3b82f6`) - Aluguel, Software, Ações
- **Green** (`#10b981`) - Manutenção, Fitness, RRSP
- **Emerald** (`#22c55e`) - Compras, Fundo de Emergência, Salário
- **Amber** (`#f59e0b`) - Restaurantes, Eventos, Gig Work
- **Red** (`#ef4444`) - Médico, Empréstimos, Overdraft
- **Purple** (`#8b5cf6`) - Educação, Streaming, Assinaturas
- **Cyan** (`#06b6d4`) - Utilidades, Viagens, Renda de Aluguel
- **Orange** (`#f97316`) - Veículo, Cripto, Inesperado
- **Pink** (`#ec4899`) - Cuidados Pessoais, Roupas, Presentes
- **Teal** (`#14b8a6`) - Casa & Estilo, Pet Care, Reembolsos
- **Indigo** (`#6366f1`) - Trânsito Público, Eletrônicos, Livros
- **Violet** (`#a855f7`) - Atividades, Gaming
- **Lime** (`#84cc16`) - Categoria alternativa
- **Rose** (`#f43f5e`) - Itens de Bebê
- **Sky** (`#0ea5e9`) - Seguro Residencial, TFSA, Benefícios
- **Yellow** (`#eab308`) - Lanches & Bebidas, Compensação Extra

**Uso**: Gráficos de categorias, badges de transações, visualizações de dados

### Cores de Gráficos

Cores específicas para visualizações e gráficos.

| Token | Valor | Uso |
|-------|-------|-----|
| `chart.income` | `#34d399` | Receitas em gráficos |
| `chart.income-light` | `#6ee7b7` | Receitas (variante clara) |
| `chart.expenses` | `#f87171` | Despesas em gráficos |
| `chart.expenses-light` | `#fca5a5` | Despesas (variante clara) |
| `chart.assets` | `#22c55e` | Ativos |
| `chart.debts` | `#ef4444` | Dívidas |
| `chart.health-score-start` | `#ef4444` | Gradiente health score (início) |
| `chart.health-score-mid` | `#fb923c` | Gradiente health score (meio) |
| `chart.health-score-end` | `#22c55e` | Gradiente health score (fim) |
| `chart.default` | `#8884d8` | Cor padrão para gráficos |

### Gradientes

Gradientes usados em seções especiais do app.

#### Hero Gradient
- **Light**: `#1A1A8F` → `#2A2AB8` → `#4A4AF2`
- **Dark**: `#0D0D5A` → `#1A1A7A` → `#2A2AB8`

**Uso**: Seção hero da landing page

#### Landing Gradient
- **Dark**: `#1a5f3f` → `#1e7a4e` → `#155a3a`
- **Light**: `#4ade80` → `#34d399`

**Uso**: Seções da landing page

## Modo Escuro (Dark Mode)

O sistema suporta dark mode através de tokens específicos:

- `color.text.primary-dark` → Texto principal no dark mode
- `color.bg.primary-dark` → Background principal no dark mode
- `color.card.bg-dark` → Background de cards no dark mode

**Padrão**: Tokens com sufixo `-dark` são usados automaticamente quando o dark mode está ativo.

## Acessibilidade

### Contraste

Todos os tokens seguem as diretrizes WCAG 2.1:

- **Texto normal**: Mínimo 4.5:1 de contraste
- **Texto grande**: Mínimo 3:1 de contraste
- **Componentes UI**: Mínimo 3:1 de contraste

### Combinações Recomendadas

| Background | Texto | Contraste |
|------------|-------|-----------|
| `primary.500` | `text.inverse` | ✅ 4.5:1 |
| `gray.50` | `text.primary` | ✅ 4.5:1 |
| `gray.500` | `text.primary-dark` | ✅ 4.5:1 |
| `success` | `text.inverse` | ✅ 4.5:1 |
| `error` | `text.inverse` | ✅ 4.5:1 |

## Uso em Componentes

### Botões

```typescript
// Botão primário
button.primary.bg → color.semantic.primary
button.primary.text → color.text.inverse

// Botão secundário
button.secondary.bg → color.bg.tertiary
button.secondary.text → color.text.primary

// Botão destrutivo
button.destructive.bg → color.semantic.error
button.destructive.text → color.text.inverse
```

### Cards

```typescript
card.bg → color.card.bg
card.border → color.card.border
card.fg → color.card.fg
```

### Inputs

```typescript
input.bg → color.input.bg
input.border → color.input.border
input.border-focus → color.input.border-focus
input.text → color.input.text
```

## Mapeamento de Categorias

Para mapear categorias de transações para cores, use:

```typescript
import { colors } from '@/spareds/tokens';

// Cores disponíveis
colors.semantic.category.blue
colors.semantic.category.green
colors.semantic.category.emerald
// ... etc
```

## Próximos Passos

- Consulte a [Hierarquia de Tokens](./token-hierarchy.md) para entender como os tokens são organizados
- Veja o [Guia de Uso](./usage-guide.md) para exemplos práticos

