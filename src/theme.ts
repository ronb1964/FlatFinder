/**
 * FlatFinder Theme System
 * Supports both dark and light themes with "Liquid Glass" aesthetic
 */

// Theme mode type
export type ThemeMode = 'dark' | 'light';

// Theme structure type
export interface Theme {
  mode: ThemeMode;
  colors: {
    // Base backgrounds
    background: string;
    surface: string;
    surfaceLight: string;

    // Glass effect colors (for the liquid glass aesthetic)
    glass: {
      tint: string; // Subtle overlay tint
      tintStrong: string; // Stronger overlay for buttons
      border: string; // Glass edge border
      highlight: string; // Bright reflection highlight
    };

    // Primary (Electric Blue)
    primary: string;
    primaryLight: string;
    primaryGlass: string; // Semi-transparent primary for overlays
    primaryBorder: string; // Primary color for borders

    // Secondary
    secondary: string;

    // Status colors
    success: string;
    successGlass: string;
    warning: string;
    warningGlass: string;
    danger: string;
    dangerGlass: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;

    // Border
    border: string;
    borderLight: string;

    // Level status colors
    levelPerfect: string;
    levelNear: string;
    levelWarning: string;
    levelDanger: string;

    // Shadow base color
    shadowColor: string;
  };

  gradients: {
    primary: string[];
    success: string[];
    danger: string[];
    surface: string[];
  };

  shadows: {
    glow: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    glowSuccess: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };

  layout: {
    radius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      full: number;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
    };
  };
}

// =============================================================================
// DARK THEME (Charcoal + Electric Blue)
// =============================================================================
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Base - near black backgrounds
    background: '#111111',
    surface: '#1a1a1a',
    surfaceLight: '#262626',

    // Glass effects - white tints on dark
    glass: {
      tint: 'rgba(255, 255, 255, 0.05)',
      tintStrong: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.15)',
      highlight: 'rgba(255, 255, 255, 0.25)',
    },

    // Primary (Electric Blue)
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryGlass: 'rgba(59, 130, 246, 0.3)',
    primaryBorder: 'rgba(96, 165, 250, 0.5)',

    // Secondary
    secondary: '#262626',

    // Status colors with glass variants
    success: '#22c55e',
    successGlass: 'rgba(34, 197, 94, 0.3)',
    warning: '#eab308',
    warningGlass: 'rgba(234, 179, 8, 0.3)',
    danger: '#ef4444',
    dangerGlass: 'rgba(239, 68, 68, 0.25)',

    // Text - light on dark
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

    // Shadow
    shadowColor: '#000000',
  },

  gradients: {
    primary: ['#3b82f6', '#2563eb'],
    success: ['#22c55e', '#16a34a'],
    danger: ['#ef4444', '#dc2626'],
    surface: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
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

// =============================================================================
// LIGHT THEME (Soft White + Electric Blue)
// =============================================================================
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Base - blue-gray backgrounds for better contrast and softer feel
    background: '#dce4ed',
    surface: '#e8eef5',
    surfaceLight: '#e2eaf3',

    // Glass effects - dark tints on light with bright highlights
    glass: {
      tint: 'rgba(0, 0, 0, 0.03)',
      tintStrong: 'rgba(0, 0, 0, 0.06)',
      border: 'rgba(0, 0, 0, 0.08)',
      highlight: 'rgba(255, 255, 255, 0.9)',
    },

    // Primary (slightly darker blue for contrast on light)
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryGlass: 'rgba(59, 130, 246, 0.12)',
    primaryBorder: 'rgba(59, 130, 246, 0.3)',

    // Secondary
    secondary: '#e5e5e5',

    // Status colors - slightly darker for contrast on light
    success: '#16a34a',
    successGlass: 'rgba(34, 197, 94, 0.15)',
    warning: '#ca8a04',
    warningGlass: 'rgba(234, 179, 8, 0.15)',
    danger: '#dc2626',
    dangerGlass: 'rgba(239, 68, 68, 0.12)',

    // Text - dark on light
    text: '#1a1a1a',
    textSecondary: '#525252',
    textMuted: '#737373',

    // Border
    border: '#e5e5e5',
    borderLight: '#d4d4d4',

    // Level status colors - same as dark, they work on both
    levelPerfect: '#16a34a',
    levelNear: '#ca8a04',
    levelWarning: '#ea580c',
    levelDanger: '#dc2626',

    // Shadow
    shadowColor: '#000000',
  },

  gradients: {
    primary: ['#3b82f6', '#2563eb'],
    success: ['#22c55e', '#16a34a'],
    danger: ['#ef4444', '#dc2626'],
    surface: ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.04)'],
  },

  shadows: {
    glow: {
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    glowSuccess: {
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  },

  layout: darkTheme.layout, // Same layout values for both themes
};

// =============================================================================
// BACKWARD COMPATIBILITY - Keep existing THEME export as dark theme
// =============================================================================
export const THEME = darkTheme;

// Convenience exports (for backward compatibility)
export const colors = THEME.colors;
export const gradients = THEME.gradients;
export const shadows = THEME.shadows;
export const layout = THEME.layout;

// Helper to get level color based on angle (uses passed theme or defaults to dark)
export function getLevelColor(angle: number, threshold = 0.5, theme: Theme = darkTheme): string {
  const absAngle = Math.abs(angle);
  if (absAngle <= threshold) return theme.colors.levelPerfect;
  if (absAngle <= threshold * 2) return theme.colors.levelNear;
  if (absAngle <= threshold * 4) return theme.colors.levelWarning;
  return theme.colors.levelDanger;
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
