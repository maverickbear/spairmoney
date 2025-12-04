# Spare Finance Logos

Esta pasta contém os logos da Spare Finance em diferentes variantes.

## Estrutura de Arquivos

Os logos devem ser nomeados conforme a seguinte estrutura e adicionados nesta pasta:

### Ícones (para nav fechado e lugares pequenos)
- `1024-icon-black.svg` - Ícone "S" preto em fundo verde (rounded square) - **Usado pelo componente**
- `1024-icon-white.svg` - Ícone "S" branco em fundo preto (rounded square) - **Usado pelo componente**
- `icon-purple.svg` - Ícone "S" roxo em fundo branco (legado)
- `icon-white.svg` - Ícone "S" branco em fundo roxo (legado)

### Wordmark (legado - agora usa logo completo)
- `wordmark-purple.svg` - Logo "SPARE FINANCE" apenas texto (legado, não usado mais)
- `wordmark-white.svg` - Logo "SPARE FINANCE" apenas texto (legado, não usado mais)
- **Nota**: O componente `Logo` com `variant="wordmark"` agora usa automaticamente os logos completos (full) em vez dos wordmarks antigos.

### Full Logo (ícone + texto) - SVG (Recomendado)
- `sparefiance-logo-black.svg` - Logo completo preto para fundos claros (SVG)
- `sparefiance-logo-white.svg` - Logo completo branco para fundos escuros (SVG)
- `sparefiance-logo-full-white.svg` - Logo completo branco (variante alternativa, SVG)

### Full Logo (ícone + texto) - PNG (Fallback)
- `sparefiance-logo-black.png` - Logo completo preto para fundos claros (PNG)
- `sparefiance-logo-white.png` - Logo completo branco para fundos escuros (PNG)
- `sparefiance-logo-full-white.png` - Logo completo branco (variante alternativa, PNG)

**Nota**: O componente `Logo` com `variant="full"` usa automaticamente os novos logos SVG quando disponíveis (preferência sobre PNG).

### Ícones de Alta Resolução (1024px) - SVG (Recomendado)
- `1024-icon-green.svg` - Ícone verde 1024x1024 (usado para gerar ícones PWA)
- `1024-icon-black.svg` - Ícone preto 1024x1024 (fundo verde)
- `1024-icon-white.svg` - Ícone branco 1024x1024 (fundo preto)

### Ícones de Alta Resolução (1024px) - PNG
- `1024-icon-green.png` - Ícone verde 1024x1024 (usado para gerar ícones PWA)
- `1024-icon-black.png` - Ícone preto 1024x1024
- `1024-icon-white.png` - Ícone branco 1024x1024
- `1024-icon-black-transparent.png` - Ícone preto transparente 1024x1024
- `1024-icon-white-transparent.png` - Ícone branco transparente 1024x1024
- `icon-green-transparent.png` - Ícone verde transparente (tamanho menor)

## Formatos Suportados

Os logos podem ser em formato SVG (recomendado) ou PNG. O componente Next.js Image suporta ambos.

## Uso

Use o componente `Logo` de `@/components/common/logo`:

```tsx
import { Logo } from "@/components/common/logo";

// Ícone pequeno (nav fechado) - padrão: 40x40
<Logo variant="icon" color="purple" height={40} />

// Logo completo adaptativo - padrão: 180x40
<Logo variant="full" color="auto" height={40} />

// Wordmark para headers - padrão: 150x40
<Logo variant="wordmark" color="white" height={40} />

// Com texto ao lado (apenas para variant="icon")
<Logo variant="icon" color="purple" showText />
```

## Variantes

- **icon**: Apenas o ícone "S" - use para nav fechado ou espaços pequenos
- **wordmark**: Logo completo (ícone + texto) - mantido para compatibilidade, usa os mesmos arquivos que "full"
- **full**: Ícone + texto completo - use como logo principal

## Cores

- **purple**: Logo roxo/azul para fundos claros
- **white**: Logo branco para fundos escuros
- **auto**: Escolhe automaticamente baseado no tema (usa purple por padrão)

## Onde os Logos são Usados

Todos os logos têm altura fixa de **40px**:

- **Landing Header**: Full logo 180x40 (white quando não scrolled, adapta ao tema quando scrolled)
- **Landing Footer**: Full logo 180x40 (adapta ao tema)
- **Sidebar Nav**: Icon 40x40 quando colapsado (usa 1024-icon-black.svg ou 1024-icon-white.svg), Wordmark 150x40 quando expandido
- **Mobile Header**: Icon 32x32 (usa 1024-icon-black.svg ou 1024-icon-white.svg)
- **Login/Signup Pages**: Wordmark 150x40 (adapta ao tema)

## Fallback

Se as imagens não carregarem, o componente mostra um fallback visual apropriado para a variante "icon".

