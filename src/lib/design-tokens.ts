/**
 * Design Tokens for AGI Agent Automation
 * Production-grade design system tokens for consistent theming
 */

export const designTokens = {
  colors: {
    // Primary brand colors
    primary: 'hsl(200, 98%, 39%)',
    primaryForeground: 'hsl(0, 0%, 98%)',
    primaryGlow: 'hsl(200, 100%, 80%)',
    primaryMuted: 'hsl(200, 50%, 20%)',

    // Agent/Employee colors
    agent: 'hsl(280, 60%, 50%)',
    agentForeground: 'hsl(0, 0%, 98%)',
    agentGlow: 'hsl(280, 100%, 85%)',

    // Workforce colors
    workforce: 'hsl(45, 93%, 47%)',
    workforceForeground: 'hsl(30, 10%, 9%)',
    workforceGlow: 'hsl(45, 100%, 85%)',

    // System colors
    background: 'hsl(240, 10%, 3.9%)',
    foreground: 'hsl(0, 0%, 98%)',
    surface: 'hsl(240, 9%, 6%)',
    surfaceElevated: 'hsl(240, 8%, 9%)',

    // State colors
    success: 'hsl(120, 60%, 50%)',
    successForeground: 'hsl(0, 0%, 98%)',
    error: 'hsl(0, 84%, 60%)',
    errorForeground: 'hsl(0, 0%, 98%)',
    warning: 'hsl(38, 92%, 50%)',
    warningForeground: 'hsl(0, 0%, 98%)',

    // UI components
    card: 'hsl(240, 8%, 9%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(240, 6%, 15%)',
    muted: 'hsl(240, 6%, 15%)',
    mutedForeground: 'hsl(240, 5%, 64.9%)',
    accent: 'hsl(240, 6%, 12%)',
    accentForeground: 'hsl(0, 0%, 98%)',
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '5rem', // 80px
    '5xl': '6rem', // 96px
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

    // Custom glow shadows
    glowPrimary: '0 4px 20px hsl(200 98% 39% / 0.25)',
    glowAgent: '0 4px 20px hsl(280 60% 50% / 0.25)',
    glowWorkforce: '0 4px 20px hsl(45 93% 47% / 0.25)',
    glowElevated: '0 8px 32px hsl(240 10% 3.9% / 0.8)',
  },

  animation: {
    // Durations
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms',
    },

    // Easing curves
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// Type definitions for design tokens
export type DesignTokens = typeof designTokens;
export type ColorTokens = keyof typeof designTokens.colors;
export type SpacingTokens = keyof typeof designTokens.spacing;
export type TypographyTokens = keyof typeof designTokens.typography.fontSize;

// Utility functions for accessing tokens
export const getColor = (token: ColorTokens): string => {
  return designTokens.colors[token];
};

export const getSpacing = (token: SpacingTokens): string => {
  return designTokens.spacing[token];
};

// Theme variants for different contexts
export const themeVariants = {
  chat: {
    user: {
      bg: 'bg-primary',
      text: 'text-primary-foreground',
      shadow: 'glow-primary',
    },
    assistant: {
      bg: 'bg-surface-elevated',
      text: 'text-foreground',
      border: 'border-border',
    },
    system: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
    },
  },

  status: {
    success: {
      bg: 'bg-success',
      text: 'text-success-foreground',
      border: 'border-success',
    },
    error: {
      bg: 'bg-error',
      text: 'text-error-foreground',
      border: 'border-error',
    },
    warning: {
      bg: 'bg-warning',
      text: 'text-warning-foreground',
      border: 'border-warning',
    },
  },

  brand: {
    agent: {
      bg: 'bg-agent',
      text: 'text-agent-foreground',
      shadow: 'glow-agent',
    },
    workforce: {
      bg: 'bg-workforce',
      text: 'text-workforce-foreground',
      shadow: 'glow-workforce',
    },
  },
} as const;

// Responsive design utilities
export const breakpointValues = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const isBreakpoint = (
  breakpoint: keyof typeof breakpointValues
): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpointValues[breakpoint];
};

// Animation presets
export const animationPresets = {
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-300',
  slideOutToBottom: 'animate-out slide-out-to-bottom-2 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-300',
  slideOutToRight: 'animate-out slide-out-to-right-2 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-300',
  pulseGlow: 'animate-pulse-glow',
} as const;
