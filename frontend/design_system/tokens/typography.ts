// Typography tokens for PBL Project Design System
// Mapped to CSS variables defined in src/app.css

export const typography = {
    // Famílias de fonte do projeto PBL
    fontBody: 'var(--font-body)',     // Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif
    fontMono: 'var(--font-mono)',     // 'Fira Mono', monospace
    
    // Cores de texto específicas do PBL
    colors: {
        // Cores padrão
        heading: 'var(--color-font-heading)',           // #1a202c
        headingLight: 'var(--color-font-heading-light)', // #2d3748
        headingDark: 'var(--color-font-heading-dark)',   // #000000
        body: 'var(--color-font-body)',                  // #4a5568
        bodyLight: 'var(--color-font-body-light)',       // #718096
        bodyDark: 'var(--color-font-body-dark)',         // #2d3748
        caption: 'var(--color-font-caption)',            // #a0aec0
        captionLight: 'var(--color-font-caption-light)', // #cbd5e0
        
        // Cores específicas do PBL
        link: 'var(--color-font-link)',                  // #3182ce
        linkHover: 'var(--color-font-link-hover)',       // #2c5282
        linkActive: 'var(--color-font-link-active)',     // #1a365d
        code: 'var(--color-font-code)',                  // #2d3748
        codeBg: 'var(--color-font-code-bg)',             // #f7fafc
        quote: 'var(--color-font-quote)',                // #4a5568
        quoteBg: 'var(--color-font-quote-bg)',           // #f7fafc
        quoteBorder: 'var(--color-font-quote-border)',   // #e2e8f0
        
        // Cores nature específicas do PBL
        natureHeading: 'var(--color-font-nature-heading)',         // #014619
        natureHeadingLight: 'var(--color-font-nature-heading-light)', // #168F41
        natureHeadingDark: 'var(--color-font-nature-heading-dark)',   // #052E16
        natureBody: 'var(--color-font-nature-body)'                   // #1a5d1a
    },
    
    // Escala tipográfica otimizada para PBL
    scale: {
        // Cabeçalhos
        h1: { 
            fontSize: '2.5rem',      // 40px - Para títulos principais
            fontWeight: 800, 
            lineHeight: 1.2,
            letterSpacing: '-0.025em'
        },
        h2: { 
            fontSize: '2rem',        // 32px - Para seções importantes
            fontWeight: 700, 
            lineHeight: 1.25,
            letterSpacing: '-0.02em'
        },
        h3: { 
            fontSize: '1.5rem',      // 24px - Para subsecções
            fontWeight: 600, 
            lineHeight: 1.3,
            letterSpacing: '-0.01em'
        },
        h4: { 
            fontSize: '1.25rem',     // 20px - Para títulos menores
            fontWeight: 600, 
            lineHeight: 1.35
        },
        h5: { 
            fontSize: '1.125rem',    // 18px - Para subtítulos
            fontWeight: 500, 
            lineHeight: 1.4
        },
        h6: { 
            fontSize: '1rem',        // 16px - Para títulos pequenos
            fontWeight: 500, 
            lineHeight: 1.45
        },
        
        // Texto corpo
        body: { 
            fontSize: '1rem',        // 16px - Texto padrão
            fontWeight: 400, 
            lineHeight: 1.6          // Melhor legibilidade
        },
        bodyLarge: { 
            fontSize: '1.125rem',    // 18px - Texto destacado
            fontWeight: 400, 
            lineHeight: 1.55
        },
        bodySmall: { 
            fontSize: '0.875rem',    // 14px - Texto secundário
            fontWeight: 400, 
            lineHeight: 1.5
        },
        
        // Elementos especiais
        caption: { 
            fontSize: '0.875rem',    // 14px - Legendas e metadados
            fontWeight: 400, 
            lineHeight: 1.4
        },
        small: { 
            fontSize: '0.75rem',     // 12px - Texto muito pequeno
            fontWeight: 400, 
            lineHeight: 1.4
        },
        
        // Texto de interface
        button: { 
            fontSize: '0.875rem',    // 14px - Texto de botões
            fontWeight: 600, 
            lineHeight: 1.2,
            letterSpacing: '0.025em'
        },
        label: { 
            fontSize: '0.875rem',    // 14px - Labels de formulário
            fontWeight: 500, 
            lineHeight: 1.2
        },
        
        // Código e dados
        code: { 
            fontSize: '0.875rem',    // 14px - Código inline
            fontWeight: 400, 
            lineHeight: 1.4,
            fontFamily: 'var(--font-mono)'
        },
        codeBlock: { 
            fontSize: '0.875rem',    // 14px - Blocos de código
            fontWeight: 400, 
            lineHeight: 1.6,
            fontFamily: 'var(--font-mono)'
        }
    }
} as const;
