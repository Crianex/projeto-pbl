# Guia de Migração para o Sistema de Cores

Este documento serve como guia para completar a migração de todas as cores hardcoded do projeto para o sistema de cores centralizado.

## ✅ Status da Migração

### Componentes Migrados:
- ✅ `AppLayout.svelte` - Completamente migrado
- ✅ `TableRow.svelte` - Completamente migrado
- ✅ `+page.svelte` (home) - Completamente migrado
- ✅ `login/+page.svelte` - Parcialmente migrado
- ✅ `aluno/problemas/+page.svelte` - Parcialmente migrado

### Componentes Pendentes:
- ❌ `register/+page.svelte`
- ❌ `reset-password/+page.svelte`
- ❌ `professor/relatorios/+page.svelte`
- ❌ `avaliacao/+page.svelte`
- ❌ `Button.svelte`
- ❌ `Input.svelte`
- ❌ `CardSection.svelte`
- ❌ `Toast.svelte`
- ❌ `LoadingSpinner.svelte`
- ❌ `Dialog.svelte`
- ❌ `Container.svelte`
- ❌ `FileUpload.svelte`
- ❌ `Notification.svelte`

## 🎯 Próximos Passos para Completar a Migração

### 1. Componentes Críticos (Alta Prioridade)

#### Button.svelte
```css
/* Substituir */
background: #667eea; /* por */ background: var(--color-primary-main);
color: white; /* por */ color: var(--color-text-white);
border-color: #667eea; /* por */ border-color: var(--color-primary-main);
```

#### Input.svelte
```css
/* Substituir */
border-color: #e53e3e; /* por */ border-color: var(--color-error-main);
background: #f7fafc; /* por */ background: var(--color-bg-light);
color: #a0aec0; /* por */ color: var(--color-text-light);
```

### 2. Páginas de Autenticação

#### register/+page.svelte
```css
/* Cores Google já mapeadas */
fill="#4285F4" /* por */ fill="var(--color-google-blue)"
fill="#34A853" /* por */ fill="var(--color-google-green)"
fill="#FBBC04" /* por */ fill="var(--color-google-yellow)"
fill="#EA4335" /* por */ fill="var(--color-google-red)"

/* Background gradients */
background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%);
/* por */
background: var(--color-bg-gradient);
```

#### reset-password/+page.svelte
Similar ao register, substituir os mesmos padrões.

### 3. Componentes de UI

#### Toast.svelte
```css
/* Backgrounds de estado */
background: linear-gradient(135deg, rgba(72, 187, 120, 0.95) 0%, rgba(56, 178, 172, 0.95) 100%);
/* por */
background: var(--color-success-gradient);
```

#### LoadingSpinner.svelte
```css
/* Cores do spinner */
border-top-color: #667eea; /* por */ border-top-color: var(--color-primary-main);
box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2); /* por */ box-shadow: 0 4px 20px var(--color-shadow-primary);
```

## 📋 Checklist de Migração por Arquivo

### Para cada arquivo .svelte:

1. **Buscar cores hardcoded:**
   ```bash
   # No terminal, buscar por padrões de cor
   grep -n "#[0-9a-fA-F]\{3,6\}" arquivo.svelte
   grep -n "rgba\?" arquivo.svelte
   grep -n "hsla\?" arquivo.svelte
   ```

2. **Identificar o tipo de cor:**
   - 🎨 Cor principal/secundária
   - ✅ Cor de estado (success, error, warning, info)
   - 📝 Cor de texto
   - 🏠 Cor de background
   - 🔘 Cor de borda
   - 👻 Efeito glass
   - 🏢 Cor específica do layout

3. **Substituir pela variável CSS apropriada:**
   ```css
   /* Antes */
   color: #2d3748;
   background: #667eea;
   border: 1px solid #e2e8f0;
   
   /* Depois */
   color: var(--color-text-primary);
   background: var(--color-primary-main);
   border: 1px solid var(--color-border-light);
   ```

4. **Testar o componente após migração**

## 🔍 Mapeamento de Cores Mais Comuns

| Cor Hardcoded | Variável CSS | Uso |
|---------------|--------------|-----|
| `#667eea` | `var(--color-primary-main)` | Cor principal |
| `#764ba2` | `var(--color-secondary-main)` | Cor secundária |
| `#2d3748` | `var(--color-text-primary)` | Texto principal |
| `#4a5568` | `var(--color-text-secondary)` | Texto secundário |
| `#6c757d` | `var(--color-text-muted)` | Texto esmaecido |
| `#ffffff` | `var(--color-text-white)` ou `var(--color-bg-white)` | Branco |
| `#f8f9fa` | `var(--color-bg-light)` | Background claro |
| `#e9ecef` | `var(--color-bg-neutral)` | Background neutro |
| `#48bb78` | `var(--color-success-main)` | Success |
| `#ef4444` | `var(--color-error-main)` | Error |
| `#f6ad55` | `var(--color-warning-main)` | Warning |
| `#3b82f6` | `var(--color-info-main)` | Info |
| `rgba(255, 255, 255, 0.95)` | `var(--color-glass-white)` | Glass effect |

## 🚨 Cores Que Precisam Ser Adicionadas

Se encontrar cores que não estão no sistema, adicione-as seguindo este padrão:

### 1. No arquivo `colors.ts`:
```typescript
// Adicionar na categoria apropriada
newCategory: {
  newColor: '#cor_hex',
  // ...
}
```

### 2. No arquivo `app.css`:
```css
/* Adicionar a variável CSS */
--color-new-category-new-color: #cor_hex;
```

### 3. Documentar no `README_COLORS.md`

## ⚠️ Cuidados Importantes

1. **Testar após cada migração** - Verificar se a aparência não mudou
2. **Manter compatibilidade** - Não quebrar componentes existentes
3. **Consistência** - Usar sempre a mesma variável para a mesma cor
4. **Performance** - Preferir variáveis CSS a valores JavaScript quando possível

## 🎉 Benefícios Após Migração Completa

1. **Temas** - Implementação de dark mode será trivial
2. **Manutenção** - Mudanças globais em um só lugar
3. **Consistência** - Cores padronizadas em todo o projeto
4. **Escalabilidade** - Fácil adicionar novas cores
5. **Performance** - Variáveis CSS nativas são mais rápidas

## 📞 Suporte

- Consulte o `README_COLORS.md` para exemplos de uso
- Verifique o `ColorSystemExample.svelte` para demonstrações
- Use o arquivo `colors.ts` como referência das cores disponíveis

---

**Status do Sistema de Cores: 🟡 Em Migração (30% concluído)**

Para completar: Migrar os componentes pendentes seguindo este guia. 