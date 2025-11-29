/**
 * Charcoal + Electric Blue Theme
 * Clean, minimal, high-contrast dark theme
 */

export const THEME = {
  colors: {
    // Base
    background: '#111111',
    surface: '#1a1a1a',
    surfaceLight: '#262626',

    // Primary (Electric Blue)
    primary: '#3b82f6',
    primaryLight: '#60a5fa',

    // Secondary
    secondary: '#262626',

    // Status colors
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',

    // Text
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',

    // Border
    border: '#333333',
    borderLight: '#404040',

    // Level status colors
    levelPerfect: '#22c55e',
    levelNear: '#eab308',
    levelWarning: '#f97316',
    levelDanger: '#ef4444',
  },

  gradients: {
    primary: ['#3b82f6', '#2563eb'],
    success: ['#22c55e', '#16a34a'],
    danger: ['#ef4444', '#dc2626'],
    surface: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
  },

  shadows: {
    glow: {
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    glowSuccess: {
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  layout: {
    radius: {
      sm: 8,
      md: 10,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
    },
  },
};

// Convenience exports
export const colors = THEME.colors;
export const gradients = THEME.gradients;
export const shadows = THEME.shadows;
export const layout = THEME.layout;

// Helper to get level color based on angle
export function getLevelColor(angle: number, threshold = 0.5): string {
  const absAngle = Math.abs(angle);
  if (absAngle <= threshold) return colors.levelPerfect;
  if (absAngle <= threshold * 2) return colors.levelNear;
  if (absAngle <= threshold * 4) return colors.levelWarning;
  return colors.levelDanger;
}

// Helper to get level status text
export function getLevelStatus(angle: number, threshold = 0.5): string {
  const absAngle = Math.abs(angle);
  if (absAngle <= threshold) return 'Level';
  if (absAngle <= threshold * 2) return 'Almost';
  if (absAngle <= threshold * 4) return 'Warning';
  return 'Off Level';
}

export default THEME;
