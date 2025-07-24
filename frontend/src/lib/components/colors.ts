// Sistema de Cores Centralizado
// Este arquivo define todas as cores utilizadas no projeto

export const colors = {
  // Cores Principais do Tema
  primary: {
    main: '#667eea',
    light: '#5a67d8',
    dark: '#4f5bd5',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  
  secondary: {
    main: '#764ba2',
    light: '#8b6bb1',
    dark: '#5e3a82'
  },
  
  // Cores de Estado
  success: {
    main: '#48bb78',
    light: '#68d391',
    dark: '#38a169',
    gradient: 'linear-gradient(135deg, #48bb78 0%, #38b2ac 100%)',
    background: 'rgba(72, 187, 120, 0.1)',
    border: 'rgba(72, 187, 120, 0.2)'
  },
  
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    darker: '#b91c1c',
    background: 'rgba(255, 245, 245, 0.8)',
    backgroundDark: '#fee2e2',
    border: '#ef4444'
  },
  
  warning: {
    main: '#f6ad55',
    light: '#fbb66b',
    dark: '#ed8936',
    gradient: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)'
  },
  
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  
  // Cores de Texto
  text: {
    primary: '#2d3748',
    secondary: '#4a5568',
    muted: '#6c757d',
    disabled: '#718096',
    light: '#a0aec0',
    white: '#ffffff',
    black: 'rgba(0, 0, 0, 0.7)'
  },
  
  // Cores de Background
  background: {
    white: '#ffffff',
    light: '#f8f9fa',
    neutral: '#e9ecef',
    dark: '#343a40',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
    heroGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)'
  },
  
  // Cores de Borda
  border: {
    light: '#e2e8f0',
    main: '#dee2e6',
    dark: '#e9ecef',
    focus: '#667eea',
    error: '#ef4444'
  },
  
  // Cores de Sombra
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    main: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
    primary: 'rgba(102, 126, 234, 0.3)',
    success: 'rgba(72, 187, 120, 0.3)',
    error: 'rgba(229, 62, 62, 0.08)'
  },
  
  // Cores Google (para autenticação)
  google: {
    blue: '#4285F4',
    green: '#34A853',
    yellow: '#FBBC04',
    red: '#EA4335'
  },
  
  // Cores de Glass Effect
  glass: {
    white: 'rgba(255, 255, 255, 0.95)',
    light: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    backdrop: 'rgba(255, 255, 255, 0.75)'
  },
  
  // Cores específicas do tema original
  theme: {
    primary: '#ff3e00',
    secondary: '#4075a6',
    bg0: 'rgb(202, 216, 228)',
    bg1: 'hsl(209, 36%, 86%)',
    bg2: 'hsl(224, 44%, 95%)'
  },
  
  // Cores de feedback específicas
  feedback: {
    online: '#22c55e',
    offline: '#6b7280',
    pending: '#f59e0b',
    completed: '#10b981'
  },
  
  // Cores específicas para layout e sistema
  layout: {
    sidebarBg: '#f8f9fa',
    sidebarBorder: '#e9ecef',
    sidebarText: '#495057',
    sidebarActive: '#212529',
    sidebarHover: '#e9ecef',
    overlay: 'rgba(0, 0, 0, 0.5)',
    logout: '#dc3545'
  },
  
  // Cores administrativas
  admin: {
    reportError: '#721c24',
    reportErrorBg: '#f8d7da',
    reportErrorBorder: '#f5c6cb',
    adminPrimary: '#007bff',
    adminSecondary: '#2c3e50'
  },
  
  // Cores específicas encontradas no projeto
  specific: {
    checkboxAccent: '#697077',
    loginError: '#c53030',
    loginErrorBorder: '#fc8181',
    dropShadow: 'rgba(0, 0, 0, 0.2)',
    formSecondary: '#374151',
    hoverBorder: '#9ca3af',
    selfEvaluation: '#0d6efd'
  }
};

// Funções utilitárias para manipulação de cores
export const colorUtils = {
  // Adiciona transparência a uma cor hex
  withAlpha: (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  
  // Gera gradiente personalizado
  gradient: (color1: string, color2: string, direction = '135deg'): string => {
    return `linear-gradient(${direction}, ${color1} 0%, ${color2} 100%)`;
  },
  
  // Gera box-shadow com cor personalizada
  boxShadow: (color: string, intensity = 0.1): string => {
    return `0 4px 12px ${colorUtils.withAlpha(color, intensity)}`;
  }
};

// Tipos TypeScript para o sistema de cores
export type ColorPalette = typeof colors;
export type ColorUtils = typeof colorUtils; 