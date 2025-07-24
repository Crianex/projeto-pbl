# Sistema de Cores do Projeto

Este documento descreve o sistema de cores centralizado implementado no projeto, incluindo todas as cores utilizadas nos componentes e como utilizá-las.

## 📁 Localização

- **Sistema de Cores:** `frontend/src/lib/components/colors.ts`
- **CSS Global:** `frontend/src/app.css`
- **Exportações:** `frontend/src/lib/components/index.ts`

## 🎨 Estrutura do Sistema de Cores

### Cores Principais do Tema

```css
/* Cores primárias */
--color-primary-main: #667eea;
--color-primary-light: #5a67d8;
--color-primary-dark: #4f5bd5;
--color-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Cores secundárias */
--color-secondary-main: #764ba2;
--color-secondary-light: #8b6bb1;
--color-secondary-dark: #5e3a82;
```

### Cores de Estado

```css
/* Sucesso */
--color-success-main: #48bb78;
--color-success-light: #68d391;
--color-success-dark: #38a169;
--color-success-gradient: linear-gradient(135deg, #48bb78 0%, #38b2ac 100%);
--color-success-background: rgba(72, 187, 120, 0.1);
--color-success-border: rgba(72, 187, 120, 0.2);

/* Erro */
--color-error-main: #ef4444;
--color-error-light: #f87171;
--color-error-dark: #dc2626;
--color-error-darker: #b91c1c;
--color-error-background: rgba(255, 245, 245, 0.8);
--color-error-background-dark: #fee2e2;
--color-error-border: #ef4444;

/* Aviso */
--color-warning-main: #f6ad55;
--color-warning-light: #fbb66b;
--color-warning-dark: #ed8936;
--color-warning-gradient: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);

/* Informação */
--color-info-main: #3b82f6;
--color-info-light: #60a5fa;
--color-info-dark: #2563eb;
--color-info-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
```

### Cores de Texto

```css
--color-text-primary: #2d3748;    /* Texto principal */
--color-text-secondary: #4a5568;  /* Texto secundário */
--color-text-muted: #6c757d;      /* Texto esmaecido */
--color-text-disabled: #718096;   /* Texto desabilitado */
--color-text-light: #a0aec0;      /* Texto claro */
--color-text-white: #ffffff;      /* Texto branco */
--color-text-black: rgba(0, 0, 0, 0.7); /* Texto preto com opacidade */
```

### Cores de Background

```css
--color-bg-white: #ffffff;
--color-bg-light: #f8f9fa;
--color-bg-neutral: #e9ecef;
--color-bg-dark: #343a40;
--color-bg-gradient: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%);
--color-bg-hero-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--color-bg-text-gradient: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
```

### Cores de Borda

```css
--color-border-light: #e2e8f0;
--color-border-main: #dee2e6;
--color-border-dark: #e9ecef;
--color-border-focus: #667eea;
--color-border-error: #ef4444;
```

### Cores Especiais

```css
/* Google (para autenticação) */
--color-google-blue: #4285F4;
--color-google-green: #34A853;
--color-google-yellow: #FBBC04;
--color-google-red: #EA4335;

/* Glass Effect */
--color-glass-white: rgba(255, 255, 255, 0.95);
--color-glass-light: rgba(255, 255, 255, 0.1);
--color-glass-border: rgba(255, 255, 255, 0.2);
--color-glass-backdrop: rgba(255, 255, 255, 0.75);

/* Feedback */
--color-feedback-online: #22c55e;
--color-feedback-offline: #6b7280;
--color-feedback-pending: #f59e0b;
--color-feedback-completed: #10b981;
```

## 💼 Como Usar

### 1. Em CSS/SCSS

```css
.meu-componente {
    background: var(--color-primary-main);
    color: var(--color-text-white);
    border: 1px solid var(--color-border-light);
    box-shadow: 0 4px 12px var(--color-shadow-primary);
}

.botao-sucesso {
    background: var(--color-success-gradient);
    border-color: var(--color-success-main);
}
```

### 2. Em Componentes Svelte

```svelte
<script>
    import { colors, colorUtils } from '$lib/components/colors';
</script>

<div 
    style="
        background: {colors.primary.gradient};
        color: {colors.text.white};
        box-shadow: {colorUtils.boxShadow(colors.primary.main, 0.2)};
    "
>
    Meu componente
</div>
```

### 3. Usando Funções Utilitárias

```javascript
import { colorUtils } from '$lib/components/colors';

// Adicionar transparência
const corComAlpha = colorUtils.withAlpha('#667eea', 0.5);
// Resultado: rgba(102, 126, 234, 0.5)

// Criar gradiente personalizado
const gradiente = colorUtils.gradient('#667eea', '#764ba2', '90deg');
// Resultado: linear-gradient(90deg, #667eea 0%, #764ba2 100%)

// Criar box-shadow com cor
const sombra = colorUtils.boxShadow('#667eea', 0.3);
// Resultado: 0 4px 12px rgba(102, 126, 234, 0.3)
```

## 🔧 Manutenção

### Adicionando Novas Cores

1. **No arquivo colors.ts:**
```typescript
export const colors = {
    // ... cores existentes
    nova_categoria: {
        main: '#nova_cor',
        light: '#nova_cor_clara',
        dark: '#nova_cor_escura'
    }
};
```

2. **No arquivo app.css:**
```css
/* Nova categoria */
--color-nova-categoria-main: #nova_cor;
--color-nova-categoria-light: #nova_cor_clara;
--color-nova-categoria-dark: #nova_cor_escura;
```

### Atualizando Cores Existentes

1. Modifique a cor no arquivo `colors.ts`
2. Atualize a variável CSS correspondente no `app.css`
3. Teste em todos os componentes que usam essa cor

## 📊 Mapeamento de Cores por Componente

### Button.svelte
- `--color-button-primary` → `--color-primary-main`
- `--color-button-primary-hover` → `--color-primary-light`
- `--color-button-secondary` → `--color-bg-white`
- `--color-button-danger` → `--color-error-main`

### Input.svelte
- `--color-input-background` → `--color-bg-white`
- `--color-input-border` → `--color-border-light`
- `--color-input-focus` → `--color-primary-main`
- `--color-input-error` → `--color-error-main`

### Table.svelte
- `--color-table-header` → `--color-bg-light`
- `--color-table-border` → `--color-border-light`
- `--color-table-hover` → `--color-bg-light`

## 🎯 Benefícios

1. **Consistência:** Todas as cores são centralizadas e padronizadas
2. **Manutenibilidade:** Mudanças globais podem ser feitas em um só lugar
3. **Escalabilidade:** Fácil adicionar novas cores sem quebrar o sistema
4. **Performance:** Uso de variáveis CSS nativas para melhor performance
5. **Acessibilidade:** Cores com contraste adequado e suporte a temas

## 🚀 Exemplos Práticos

### Criando um Card com o Sistema de Cores

```svelte
<div class="premium-card">
    <h3>Título do Card</h3>
    <p>Conteúdo do card aqui</p>
    <button class="card-button">Ação</button>
</div>

<style>
    .premium-card {
        background: var(--color-glass-white);
        border: 1px solid var(--color-glass-border);
        border-radius: 16px;
        padding: 2rem;
        backdrop-filter: blur(20px);
        box-shadow: 
            0 15px 35px var(--color-shadow-light),
            0 8px 20px var(--color-shadow-main);
    }
    
    .premium-card h3 {
        color: var(--color-text-primary);
        margin-bottom: 1rem;
    }
    
    .premium-card p {
        color: var(--color-text-secondary);
        margin-bottom: 1.5rem;
    }
    
    .card-button {
        background: var(--color-primary-gradient);
        color: var(--color-text-white);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .card-button:hover {
        box-shadow: 0 4px 12px var(--color-shadow-primary);
        transform: translateY(-2px);
    }
</style>
```

### Tema Escuro (Futuro)

O sistema está preparado para suporte a temas. Para implementar tema escuro:

```css
[data-theme="dark"] {
    --color-bg-white: #1a1a1a;
    --color-bg-light: #2d2d2d;
    --color-text-primary: #ffffff;
    --color-text-secondary: #a0a0a0;
    /* ... outras variações */
}
```

---

*Este sistema de cores foi implementado para garantir consistência visual e facilitar a manutenção do projeto. Para dúvidas ou sugestões, consulte a documentação dos componentes individuais.* 