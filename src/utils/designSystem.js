// Global Design System for Pulse
// Centralized theme configuration

export const colors = {
  // Background
  bg: {
    primary: '#000000',
    secondary: '#0A0A0A',
    card: 'rgba(255, 255, 255, 0.05)',
    glass: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Accents
  accent: {
    primary: '#00D9FF', // Bright cyan
    secondary: '#9D4EDD', // Purple/violet
    success: '#FF9500', // Orange/amber for START buttons
    successDark: '#FF6B00', // Darker orange for gradients
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    muted: '#666666',
  },
  
  // Borders
  border: {
    default: 'rgba(255, 255, 255, 0.1)',
    subtle: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Status
  status: {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

export const typography = {
  // Font sizes
  size: {
    pageTitle: '32px', // or 36px for hero
    sectionHeader: '24px', // or 28px for emphasis
    cardTitle: '18px', // or 20px
    body: '16px',
    secondary: '14px',
    small: '12px', // or 13px
    tiny: '11px',
  },
  
  // Font weights
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  // 8px grid system
  xs: '8px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '40px',
  '2xl': '48px',
  
  // Container
  containerPadding: '24px',
  cardPadding: '20px', // or 24px for larger cards
  sectionGap: '32px', // or 40px for larger sections
  cardGap: '16px',
};

export const borderRadius = {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  subtle: '0 2px 8px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(0, 217, 255, 0.3)',
  glowOrange: '0 0 20px rgba(255, 149, 0, 0.3)',
};

export const transitions = {
  fast: '100ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
};

export const zIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  tooltip: 50,
};

// Button styles
export const buttonStyles = {
  primary: {
    background: `linear-gradient(135deg, ${colors.accent.success} 0%, ${colors.accent.successDark} 100%)`,
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
    borderRadius: borderRadius.md,
    padding: '16px 32px',
    boxShadow: shadows.glowOrange,
    hover: {
      transform: 'scale(1.02)',
    },
    active: {
      transform: 'scale(0.95)',
    },
  },
  secondary: {
    background: colors.bg.glass,
    color: colors.accent.primary,
    border: `1px solid ${colors.accent.primary}`,
    borderRadius: borderRadius.md,
    padding: '16px 32px',
    hover: {
      background: 'rgba(0, 217, 255, 0.1)',
    },
    active: {
      transform: 'scale(0.95)',
    },
  },
  icon: {
    size: '44px',
    iconSize: '24px',
    borderRadius: borderRadius.full,
    activeColor: colors.accent.primary,
    inactiveColor: colors.text.muted,
  },
};

// Card styles
export const cardStyles = {
  default: {
    background: colors.bg.glass,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.border.default}`,
    padding: spacing.cardPadding,
    backdropFilter: 'blur(20px)',
    hover: {
      transform: 'scale(1.02)',
    },
  },
};

