import { config } from '@tamagui/config/v2'
import { createTamagui } from 'tamagui'
import { createAnimations } from '@tamagui/animations-css'

const animations = createAnimations({
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
  quick: 'cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
  lazy: 'cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s',
})

// Custom gradient colors for modern UI
const customTokens = {
  color: {
    // Primary gradient colors
    primaryGradientStart: '#6366f1',
    primaryGradientEnd: '#8b5cf6',

    // Success gradient
    successGradientStart: '#10b981',
    successGradientEnd: '#22c55e',

    // Warning gradient
    warningGradientStart: '#f59e0b',
    warningGradientEnd: '#f97316',

    // Danger gradient
    dangerGradientStart: '#ef4444',
    dangerGradientEnd: '#dc2626',

    // Info gradient
    infoGradientStart: '#3b82f6',
    infoGradientEnd: '#06b6d4',

    // Glassmorphic overlays
    glassLight: 'rgba(255, 255, 255, 0.1)',
    glassMedium: 'rgba(255, 255, 255, 0.15)',
    glassStrong: 'rgba(255, 255, 255, 0.2)',

    glassDarkLight: 'rgba(0, 0, 0, 0.1)',
    glassDarkMedium: 'rgba(0, 0, 0, 0.2)',
    glassDarkStrong: 'rgba(0, 0, 0, 0.3)',
  },
}

// Responsive breakpoints for mobile-first design
const media = {
  xs: { maxWidth: 660 },      // Small phones (iPhone SE, etc)
  sm: { maxWidth: 800 },      // Large phones (iPhone 14, etc)
  md: { minWidth: 801 },      // Tablets (iPad, etc)
  lg: { minWidth: 1024 },     // Desktop/Large tablets
  xl: { minWidth: 1280 },     // Large desktop
  xxl: { minWidth: 1536 },    // Extra large desktop

  // Utility breakpoints
  gtXs: { minWidth: 661 },    // Greater than xs
  gtSm: { minWidth: 801 },    // Greater than sm
  short: { maxHeight: 700 },  // Short screens
  tall: { minHeight: 800 },   // Tall screens
}

const tamaguiConfig = createTamagui({
  ...config,
  animations,
  media,
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      ...customTokens.color,
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
