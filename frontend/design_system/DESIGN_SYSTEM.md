# Design System PBL

Um sistema de design abrangente para o projeto PBL (Problem-Based Learning), construído com Svelte e TypeScript. Este sistema fornece componentes reutilizáveis, tokens de design e padrões de estilo consistentes para o sistema de avaliação baseado em problemas.

> 🎓 **Adaptado especificamente para educação**: Este design system foi customizado para suportar metodologias de aprendizagem ativa, com componentes otimizados para avaliações peer-to-peer, dashboards educacionais e interfaces de gestão acadêmica.

## 📁 Structure

```
design_system/
├── components/          # Reusable UI components
├── tokens/             # Design tokens (colors, typography)
├── index.ts           # Main exports
└── DESIGN_SYSTEM.md   # This documentation
```

## 🎨 Tokens de Design

### Sistema de Cores

O sistema de cores do PBL utiliza propriedades personalizadas CSS definidas em `src/app.css` e expostas através dos tokens de design. O projeto utiliza principalmente uma paleta verde (nature) que reflete a identidade educacional e sustentável do PBL.

```typescript
import { colors } from '$lib/design_system';

// Cores principais do projeto PBL
colors.primary.main         // #667eea - Azul principal
colors.primary.light        // #5a67d8 - Azul claro
colors.primary.dark         // #4f5bd5 - Azul escuro
colors.primary.gradient     // Gradiente azul

colors.secondary.main       // #764ba2 - Roxo secundário
colors.secondary.light      // #8b6bb1
colors.secondary.dark       // #5e3a82

// Sistema de cores verde (nature) - identidade principal
colors.nature.main          // #168F41 - Verde principal PBL
colors.nature.light         // #22C55E - Verde claro
colors.nature.dark          // #014619 - Verde escuro
colors.nature.lighter       // #4ADE80 - Verde mais claro
colors.nature.darker        // #052E16 - Verde mais escuro
colors.nature.gradient      // Gradiente verde
colors.nature.background    // Fundo verde suave
colors.nature.border        // Borda verde

// Cores de estado específicas do PBL
colors.success.main         // #48bb78 - Sucesso
colors.error.main           // #ef4444 - Erro
colors.warning.main         // #f6ad55 - Aviso
colors.info.main            // #3b82f6 - Informação

// Cores de texto otimizadas para PBL
colors.text.primary         // #2d3748 - Texto principal
colors.text.secondary       // #4a5568 - Texto secundário
colors.text.white           // #ffffff - Texto branco
colors.font.heading         // #1a202c - Cabeçalhos
colors.font.body            // #4a5568 - Corpo do texto
colors.font.caption         // #a0aec0 - Legendas

// Glass effects para modernidade
colors.glass.natureWhite   // Vidro verde claro
colors.glass.natureBorder  // Borda de vidro verde

// Cores de feedback específicas do sistema
colors.feedback.online      // #22c55e - Status online
colors.feedback.offline     // #6b7280 - Status offline
colors.feedback.pending     // #f59e0b - Pendente
colors.feedback.completed   // #10b981 - Concluído
```

### Tipografia

O sistema tipográfico do PBL oferece famílias de fontes consistentes, tamanhos e pesos otimizados para a experiência educacional.

```typescript
import { typography } from '$lib/design_system';

// Famílias de fonte do PBL
typography.fontBody     // Arial, system fonts - legibilidade principal
typography.fontMono     // 'Fira Mono' - código e dados

// Cores de texto específicas do PBL
typography.colors.heading          // #1a202c - Cabeçalhos principais
typography.colors.headingDark      // #000000 - Cabeçalhos em destaque
typography.colors.body             // #4a5568 - Texto corpo
typography.colors.bodyDark         // #2d3748 - Texto corpo enfatizado
typography.colors.caption          // #a0aec0 - Legendas e metadados
typography.colors.link             // #3182ce - Links
typography.colors.natureHeading    // #014619 - Cabeçalhos tema nature
typography.colors.natureBody       // #1a5d1a - Texto tema nature

// Escala tipográfica otimizada para PBL
typography.scale.h1         // { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 } - Títulos principais
typography.scale.h2         // { fontSize: '2rem', fontWeight: 700, lineHeight: 1.25 } - Seções importantes
typography.scale.h3         // { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 } - Subsecções
typography.scale.h4         // { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 } - Títulos menores
typography.scale.h5         // { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 } - Subtítulos
typography.scale.h6         // { fontSize: '1rem', fontWeight: 500, lineHeight: 1.45 } - Títulos pequenos

typography.scale.body       // { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 } - Texto padrão
typography.scale.bodyLarge  // { fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.55 } - Texto destacado
typography.scale.bodySmall  // { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 } - Texto secundário

typography.scale.button     // { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 } - Texto de botões
typography.scale.label      // { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.2 } - Labels
typography.scale.caption    // { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4 } - Legendas
typography.scale.small      // { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 } - Texto muito pequeno

typography.scale.code       // { fontSize: '0.875rem', fontFamily: 'mono' } - Código inline
typography.scale.codeBlock  // { fontSize: '0.875rem', fontFamily: 'mono' } - Blocos de código
```

## 🧩 Components

### Componentes Principais

#### BrandLogo
O logo oficial do sistema PBL com animação e múltiplas variantes.

```svelte
<script>
  import { BrandLogo } from '$lib/design_system';
</script>

<!-- Logo completo com slogan -->
<BrandLogo variant="default" animated={true} showSlogan={true} />

<!-- Logo compacto -->
<BrandLogo variant="compact" animated={false} />

<!-- Apenas texto -->
<BrandLogo variant="text-only" />
```

**Props:**
- `variant`: "default" | "compact" | "text-only" (default: "default")
- `animated`: boolean (default: true) - Ativa animação de digitação
- `showSlogan`: boolean (default: true) - Mostra "Sistema de Avaliação PBL"

**Características:**
- Animação automática de digitação (PBL.sys)
- Gradientes verdes da identidade PBL
- Responsivo e acessível
- Suporte a dark mode e high contrast

#### Typography
Um componente flexível de texto que aplica estilos tipográficos consistentes.

```svelte
<script>
  import { Typography } from '$lib/design_system';
</script>

<Typography as="h1" color="heading">Título Principal PBL</Typography>
<Typography as="h2" color="natureHeading">Seção Verde</Typography>
<Typography as="p" color="body">Texto corpo do sistema</Typography>
<Typography as="caption" color="caption">Metadados e legendas</Typography>
```

**Props:**
- `as`: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "caption" (default: "p")
- `color`: "heading" | "headingDark" | "body" | "bodyDark" | "caption" | "natureHeading" | "natureBody" (default: "body")
- `weight`: number (peso personalizado da fonte)
- `className`: string (classes CSS adicionais)

#### Card
A container component for grouping content with consistent styling.

```svelte
<script>
  import { Card } from '$lib/design_system';
</script>

<Card padding="md" variant="default">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</Card>

<Card padding="lg" variant="elevated" clickable>
  <p>Clickable elevated card</p>
</Card>
```

**Props:**
- `padding`: "sm" | "md" | "lg" (default: "md")
- `variant`: "default" | "elevated" | "bordered" (default: "default")
- `clickable`: boolean (makes card interactive)
- `fullWidth`: boolean (removes max-width constraint)
- `className`: string

### Form Components

#### Button
A versatile button component with multiple variants and states.

```svelte
<script>
  import { Button } from '$lib/design_system';
</script>

<Button variant="primary" size="large">Primary Action</Button>
<Button variant="secondary" size="md">Secondary Action</Button>
<Button variant="outline" size="sm">Outline Button</Button>
<Button variant="ghost" disabled>Disabled Button</Button>
<Button variant="danger" loading>Loading Button</Button>
<Button href="/some-link">Link Button</Button>
```

**Props:**
- `variant`: "primary" | "secondary" | "danger" | "ghost" | "warning" | "outline" | "neutral"
- `size`: "sm" | "md" | "large" | "icon" (default: "md")
- `disabled`: boolean
- `type`: "button" | "submit" | "reset" (default: "button")
- `loading`: boolean (shows spinner)
- `href`: string (makes it a link)

#### Input
A styled input component.

```svelte
<script>
  import { Input } from '$lib/design_system';
</script>

<Input
  type="email"
  placeholder="Enter your email"
  label="Email Address"
  required
/>
```

#### Dropdown
A feature-rich dropdown component.

```svelte
<script>
  import { Dropdown } from '$lib/design_system';

  let selectedValue = null;
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ];

  function handleChange(event) {
    selectedValue = event.detail.value;
  }
</script>

<Dropdown
  {options}
  value={selectedValue}
  placeholder="Select an option"
  variant="primary"
  size="md"
  label="Choose Option"
  on:change={handleChange}
/>
```

**Props:**
- `options`: Array<{ value: any; label: string }>
- `value`: any (selected value)
- `placeholder`: string
- `disabled`: boolean
- `variant`: "primary" | "secondary" | "outline" | "neutral"
- `size`: "sm" | "md" | "large"
- `label`: string
- `error`: string | null
- `id`: string

### Layout Components

#### Container
A responsive container component.

```svelte
<script>
  import { Container } from '$lib/design_system';
</script>

<Container size="lg">
  <!-- Content -->
</Container>
```

#### Grid
A flexible grid system.

```svelte
<script>
  import { Grid } from '$lib/design_system';
</script>

<Grid columns={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

#### Drawer
A slide-out drawer component for mobile navigation and overlays.

```svelte
<script>
  import { Drawer } from '$lib/design_system';

  let isOpen = false;
</script>

<Drawer bind:open={isOpen} placement="left" size="md" on:close={() => isOpen = false}>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</Drawer>
```

**Props:**
- `open`: boolean (bindable) – controls drawer visibility
- `placement`: "left" | "right" (default: "left") – drawer slide direction
- `size`: "sm" | "md" | "lg" | "xl" (default: "md") – drawer width
- `closeOnOutsideClick`: boolean (default: true) – close on backdrop click
- `closeOnEscape`: boolean (default: true) – close on Escape key

**Events:**
- `close` – fired when drawer should be closed

#### HamburgerMenu
An animated hamburger menu button for triggering mobile navigation.

```svelte
<script>
  import { HamburgerMenu } from '$lib/design_system';

  function handleToggle() {
    // Toggle drawer or menu
  }
</script>

<HamburgerMenu
  open={isMenuOpen}
  on:toggle={handleToggle}
  variant="primary"
  size="md"
/>
```

**Props:**
- `open`: boolean – controls animation state
- `variant`: "default" | "primary" | "secondary" (default: "default") – color theme
- `size`: "sm" | "md" | "lg" (default: "md") – button size
- `className`: string – additional CSS classes

**Events:**
- `toggle` – fired when button is clicked

#### StatusBadge
Um componente específico do PBL para mostrar status de avaliações, usuários e atividades.

```svelte
<script>
  import { StatusBadge } from '$lib/design_system';
</script>

<!-- Status de avaliação -->
<StatusBadge status="pending" size="md" />
<StatusBadge status="completed" size="md" />
<StatusBadge status="reviewing" text="Em Revisão" />

<!-- Status de usuário -->
<StatusBadge status="online" variant="outlined" />
<StatusBadge status="offline" variant="filled" />

<!-- Status personalizado -->
<StatusBadge status="approved" text="Aprovado pelo Professor" size="lg" />
<StatusBadge status="submitted" text="Entregue" showIcon={false} />
```

**Props:**
- `status`: "pending" | "completed" | "online" | "offline" | "submitted" | "reviewing" | "approved" | "rejected" (default: "pending")
- `text`: string (texto personalizado, senão usa texto padrão)
- `size`: "sm" | "md" | "lg" (default: "md")
- `variant`: "default" | "outlined" | "filled" (default: "default")
- `showIcon`: boolean (default: true) - mostra ícone do status

**Características específicas do PBL:**
- Status específicos para avaliações (pending, reviewing, approved, rejected)
- Status de entrega (submitted, completed)
- Status de usuário (online, offline)
- Animação de pulsação para status "online"
- Cores otimizadas para feedback educacional
- Acessibilidade com roles e aria-labels apropriados

### Feedback Components

#### Modal
A dialog overlay component.

```svelte
<script>
  import { Modal } from '$lib/design_system';

  let isOpen = false;
</script>

<Modal {isOpen} on:close={() => isOpen = false}>
  <h2>Modal Title</h2>
  <p>Modal content...</p>
</Modal>
```

#### Toast
A notification component.

```svelte
<script>
  import { Toast } from '$lib/design_system';
</script>

<Toast variant="success" message="Operation completed successfully!" />
```

#### LoadingSpinner
A loading indicator.

```svelte
<script>
  import { LoadingSpinner } from '$lib/design_system';
</script>

<LoadingSpinner size="md" />
```

### Menus

#### Menu
A lightweight contextual menu that pairs naturally with `Button` and follows the same visual language (rounded radius, border thickness, shadows).

```svelte
<script>
  import { Button, Menu } from '$lib/design_system';
  let open = false;
  function onAction() {
    console.log('Action clicked');
  }
</script>

<Menu bind:open={open} placement="bottom-end">
  <Button slot="trigger" variant="ghost" size="sm">⋮</Button>

  <div slot="content">
    <button class="menu-item" on:click={onAction}>Editar</button>
    <button class="menu-item danger" on:click={onAction}>Excluir</button>
  </div>
</Menu>
```

Props:
- `open`: boolean (bindable) – controls visibility
- `placement`: "bottom-start" | "bottom-end" | "top-start" | "top-end" (default: "bottom-end")

Slots:
- `trigger`: Element that toggles the menu (commonly a `Button` with `variant="ghost"`)
- `content`: The menu body. Use `.menu-item` elements inside for proper look and feel.

Styling guidance:
- Use `.menu-item` for default items and `.menu-item.danger` for destructive actions
- Items inherit the design tokens to match the default button styling (radius, borders, shadows)

## 🚀 Usage

### Importing Components

```typescript
// Import individual components
import { Button, Card, Typography } from '$lib/design_system';

// Import design tokens
import { colors, typography } from '$lib/design_system';
```

### Styling Approach

The design system uses:
- **CSS Custom Properties** for theming and consistent values
- **Utility-first classes** for rapid prototyping
- **Component-based architecture** for maintainability
- **Responsive design** with mobile-first approach
- **TypeScript** for type safety

### CSS Custom Properties

Key CSS variables used throughout the system:

```css
/* Colors */
--color-primary-main: #your-primary-color;
--color-secondary-main: #your-secondary-color;
--color-nature-main: #your-nature-color;
--color-error-main: #your-error-color;
--color-warning-main: #your-warning-color;

/* Typography */
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Border radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

## 📱 Responsive Design

All components are built mobile-first with responsive breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Components automatically adjust padding, sizing, and layout based on screen size.

## 🎯 Best Practices

### Component Usage
1. **Always use semantic HTML** - Components like Typography and Button handle this automatically
2. **Provide proper labels** for form components
3. **Use appropriate variants** for different contexts
4. **Handle loading states** for async operations
5. **Test accessibility** with keyboard navigation and screen readers

### Styling Guidelines
1. **Use design tokens** instead of hardcoded values
2. **Follow the spacing scale** for consistent layouts
3. **Use semantic color names** (primary, secondary, error, etc.)
4. **Maintain proper contrast ratios** for accessibility
5. **Test on multiple devices** and screen sizes

### Performance
1. **Lazy load** heavy components when possible
2. **Use CSS containment** for complex layouts
3. **Minimize re-renders** by using proper key props
4. **Optimize bundle size** by importing only needed components

## 🤝 Contributing

### Adding New Components
1. Create the component in `components/`
2. Export it from `index.ts`
3. Add TypeScript types for all props
4. Include comprehensive documentation
5. Add responsive styles and accessibility features
6. Test across different screen sizes

### Modifying Existing Components
1. Maintain backward compatibility
2. Update documentation for any prop changes
3. Test existing implementations
4. Consider the impact on the design system

### Design Token Updates
1. Update CSS custom properties in `src/app.css`
2. Reflect changes in the token files
3. Ensure all components using the token still work
4. Update documentation with examples

## 📚 Examples

### Complete Form Example
```svelte
<script>
  import { Card, Input, Button, Dropdown, Typography } from '$lib/design_system';

  let formData = {
    name: '',
    email: '',
    role: null
  };

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'admin', label: 'Administrator' }
  ];

  function handleSubmit() {
    console.log('Form submitted:', formData);
  }
</script>

<Card padding="lg" variant="default">
  <Typography as="h2" color="heading">User Registration</Typography>

  <form on:submit|preventDefault={handleSubmit}>
    <Input
      label="Full Name"
      placeholder="Enter your full name"
      bind:value={formData.name}
      required
    />

    <Input
      type="email"
      label="Email Address"
      placeholder="Enter your email"
      bind:value={formData.email}
      required
    />

    <Dropdown
      label="Role"
      placeholder="Select your role"
      options={roles}
      bind:value={formData.role}
      required
    />

    <Button variant="primary" size="large" type="submit">
      Register
    </Button>
  </form>
</Card>
```

## 🎓 Filosofia do Design PBL

Este design system foi especificamente adaptado para suportar a metodologia Problem-Based Learning (PBL), com foco em:

### Princípios Educacionais
- **Clareza**: Componentes que facilitam a compreensão de informações complexas
- **Feedback Visual**: Status claros para avaliações e progresso do aluno
- **Acessibilidade**: Suporte completo para diferentes necessidades de aprendizagem
- **Responsividade**: Funcionamento otimizado em dispositivos móveis para aprendizagem flexível

### Identidade Visual PBL
- **Verde Nature**: Cor principal que representa crescimento e sustentabilidade educacional
- **Gradientes Modernos**: Visual contemporâneo que engaja estudantes
- **Tipografia Legível**: Escalas otimizadas para leitura prolongada de conteúdo educacional
- **Componentes Específicos**: StatusBadge, BrandLogo e outros elementos únicos do PBL

### Casos de Uso Específicos
- Sistemas de avaliação peer-to-peer
- Dashboards de progresso estudantil
- Interfaces de submissão de problemas
- Painéis administrativos para coordenadores
- Visualização de matrizes de avaliação

Este design system fornece uma base sólida para construir interfaces de usuário consistentes, acessíveis e sustentáveis em todo o ecossistema do projeto PBL, sempre priorizando a experiência educacional e o sucesso do aprendizado baseado em problemas.
