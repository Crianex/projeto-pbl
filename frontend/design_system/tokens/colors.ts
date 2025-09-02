// Color tokens for PBL Project Design System
// Mapped to CSS variables defined in src/app.css
// Usage: import { colors } from '$lib/design_system/colors'

export const colors = {
    // Cores principais do projeto PBL
    primary: {
        main: 'var(--color-primary-main)',         // #667eea
        light: 'var(--color-primary-light)',       // #5a67d8
        dark: 'var(--color-primary-dark)',         // #4f5bd5
        gradient: 'var(--color-primary-gradient)'
    },
    secondary: {
        main: 'var(--color-secondary-main)',       // #764ba2
        light: 'var(--color-secondary-light)',     // #8b6bb1
        dark: 'var(--color-secondary-dark)'        // #5e3a82
    },
    // Sistema de cores verde (nature) - principal do PBL
    nature: {
        main: 'var(--color-nature-main)',          // #168F41
        light: 'var(--color-nature-light)',        // #22C55E
        dark: 'var(--color-nature-dark)',          // #014619
        lighter: 'var(--color-nature-lighter)',    // #4ADE80
        darker: 'var(--color-nature-darker)',      // #052E16
        gradient: 'var(--color-nature-gradient)',
        lightGradient: 'var(--color-nature-light-gradient)',
        background: 'var(--color-nature-background)',
        backgroundLight: 'var(--color-nature-background-light)',
        backgroundDark: 'var(--color-nature-background-dark)',
        border: 'var(--color-nature-border)',
        borderLight: 'var(--color-nature-border-light)',
        shadow: 'var(--color-nature-shadow)',
        shadowLight: 'var(--color-nature-shadow-light)'
    },
    // Cores de estado
    success: {
        main: 'var(--color-success-main)',         // #48bb78
        light: 'var(--color-success-light)',       // #68d391
        dark: 'var(--color-success-dark)',         // #38a169
        gradient: 'var(--color-success-gradient)',
        background: 'var(--color-success-background)',
        border: 'var(--color-success-border)'
    },
    error: {
        main: 'var(--color-error-main)',           // #ef4444
        light: 'var(--color-error-light)',         // #f87171
        dark: 'var(--color-error-dark)',           // #dc2626
        darker: 'var(--color-error-darker)',       // #b91c1c
        background: 'var(--color-error-background)',
        backgroundDark: 'var(--color-error-background-dark)',
        border: 'var(--color-error-border)'
    },
    warning: {
        main: 'var(--color-warning-main)',         // #f6ad55
        light: 'var(--color-warning-light)',       // #fbb66b
        dark: 'var(--color-warning-dark)',         // #ed8936
        gradient: 'var(--color-warning-gradient)'
    },
    info: {
        main: 'var(--color-info-main)',            // #3b82f6
        light: 'var(--color-info-light)',          // #60a5fa
        dark: 'var(--color-info-dark)',            // #2563eb
        gradient: 'var(--color-info-gradient)'
    },
    // Cores de texto do PBL
    text: {
        primary: 'var(--color-text-primary)',      // #2d3748
        secondary: 'var(--color-text-secondary)',  // #4a5568
        muted: 'var(--color-text-muted)',          // #6c757d
        disabled: 'var(--color-text-disabled)',    // #718096
        light: 'var(--color-text-light)',          // #a0aec0
        white: 'var(--color-text-white)',          // #ffffff
        black: 'var(--color-text-black)'           // rgba(0, 0, 0, 0.7)
    },
    // Cores de fontes específicas
    font: {
        heading: 'var(--color-font-heading)',      // #1a202c
        headingLight: 'var(--color-font-heading-light)',
        headingDark: 'var(--color-font-heading-dark)',
        body: 'var(--color-font-body)',            // #4a5568
        bodyLight: 'var(--color-font-body-light)',
        bodyDark: 'var(--color-font-body-dark)',
        caption: 'var(--color-font-caption)',      // #a0aec0
        captionLight: 'var(--color-font-caption-light)',
        link: 'var(--color-font-link)',
        linkHover: 'var(--color-font-link-hover)',
        linkActive: 'var(--color-font-link-active)'
    },
    // Cores de background
    background: {
        main: 'var(--color-bg-white)',            // #ffffff
        light: 'var(--color-bg-light)',           // #f8f9fa
        neutral: 'var(--color-bg-neutral)',       // #e9ecef
        dark: 'var(--color-bg-dark)',             // #343a40
        gradient: 'var(--color-bg-gradient)',
        heroGradient: 'var(--color-bg-hero-gradient)',
        textGradient: 'var(--color-bg-text-gradient)'
    },
    // Cores de borda
    border: {
        light: 'var(--color-border-light)',       // #e2e8f0
        main: 'var(--color-border-main)',         // #dee2e6
        dark: 'var(--color-border-dark)',         // #e9ecef
        focus: 'var(--color-border-focus)',       // #667eea
        error: 'var(--color-border-error)'        // #ef4444
    },
    // Glass effects específicos do PBL
    glass: {
        white: 'var(--color-glass-white)',
        light: 'var(--color-glass-light)',
        border: 'var(--color-glass-border)',
        backdrop: 'var(--color-glass-backdrop)',
        // Glass effect verde
        natureWhite: 'var(--color-nature-glass-white)',
        natureLight: 'var(--color-nature-glass-light)',
        natureMedium: 'var(--color-nature-glass-medium)',
        natureBorder: 'var(--color-nature-glass-border)',
        natureBackdrop: 'var(--color-nature-glass-backdrop)'
    },
    // Cores especiais do PBL
    feedback: {
        online: 'var(--color-feedback-online)',      // #22c55e
        offline: 'var(--color-feedback-offline)',    // #6b7280
        pending: 'var(--color-feedback-pending)',    // #f59e0b
        completed: 'var(--color-feedback-completed)' // #10b981
    },
    // Google colors para autenticação
    google: {
        blue: 'var(--color-google-blue)',      // #4285F4
        green: 'var(--color-google-green)',    // #34A853
        yellow: 'var(--color-google-yellow)',  // #FBBC04
        red: 'var(--color-google-red)'         // #EA4335
    }
} as const;
