import React from 'react';
import { GlassCard, GlassCardProps } from '../GlassCard';

export interface AdaptiveCardProps extends GlassCardProps {
  /**
   * Responsive padding levels
   * Example: { xs: '$3', md: '$5', lg: '$6' }
   */
  responsivePadding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };

  /**
   * Whether the card should have a max-width on large screens
   * Default: false
   */
  constrained?: boolean;

  children?: React.ReactNode;
}

/**
 * AdaptiveCard - GlassCard with responsive sizing and spacing
 *
 * Features:
 * - All GlassCard glassmorphism effects
 * - Responsive padding (compact on mobile, spacious on tablet)
 * - Optional max-width constraint
 * - Adaptive border radius
 *
 * Usage:
 * ```tsx
 * <AdaptiveCard responsivePadding={{ xs: '$3', md: '$5' }}>
 *   <YourContent />
 * </AdaptiveCard>
 * ```
 */
export function AdaptiveCard({
  responsivePadding = { xs: '$3', sm: '$4', md: '$5', lg: '$6' },
  constrained = false,
  children,
  ...props
}: AdaptiveCardProps) {

  const basePadding = responsivePadding.xs || '$3';

  return (
    <GlassCard
      padding={basePadding}
      $sm={responsivePadding.sm ? { padding: responsivePadding.sm } : undefined}
      $md={responsivePadding.md ? { padding: responsivePadding.md } : undefined}
      $lg={responsivePadding.lg ? { padding: responsivePadding.lg } : undefined}
      $xl={responsivePadding.xl ? { padding: responsivePadding.xl } : undefined}
      maxWidth={constrained ? 800 : undefined}
      marginHorizontal={constrained ? 'auto' : undefined}
      borderRadius="$4"
      $md={{
        borderRadius: '$5',
      }}
      $lg={{
        borderRadius: '$6',
      }}
      {...props}
    >
      {children}
    </GlassCard>
  );
}
