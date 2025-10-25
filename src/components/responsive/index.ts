/**
 * Responsive Layout System
 *
 * A comprehensive set of components for building responsive layouts that adapt
 * to any screen size - from small phones to large desktops.
 *
 * Built on Tamagui's media queries with mobile-first approach.
 */

// Core responsive components
export { ResponsiveContainer } from './ResponsiveContainer';
export type { ResponsiveContainerProps } from './ResponsiveContainer';

export { ResponsiveGrid } from './ResponsiveGrid';
export type { ResponsiveGridProps } from './ResponsiveGrid';

// Typography
export {
  ScalableText,
  ScalableH1,
  ScalableH2,
  ScalableH3,
} from './ScalableText';
export type { ScalableTextProps } from './ScalableText';

// Scroll handling
export {
  ScrollContainer,
  ScrollContainerWithIndicator,
} from './ScrollContainer';
export type { ScrollContainerProps } from './ScrollContainer';

// Button positioning
export {
  StickyActionButtons,
  FloatingActionButtons,
} from './StickyActionButtons';
export type { StickyActionButtonsProps } from './StickyActionButtons';

// Cards
export { AdaptiveCard } from './AdaptiveCard';
export type { AdaptiveCardProps } from './AdaptiveCard';

/**
 * Breakpoint reference:
 *
 * - xs: maxWidth 660px (Small phones - iPhone SE)
 * - sm: maxWidth 800px (Large phones - iPhone 14)
 * - md: minWidth 801px (Tablets - iPad)
 * - lg: minWidth 1024px (Desktop/Large tablets)
 * - xl: minWidth 1280px (Large desktop)
 * - xxl: minWidth 1536px (Extra large desktop)
 *
 * Usage with Tamagui props:
 * ```tsx
 * <YStack
 *   padding="$3"           // Mobile default
 *   $md={{ padding: '$6' }} // Tablets and up
 *   $lg={{ padding: '$8' }} // Desktop and up
 * />
 * ```
 */
