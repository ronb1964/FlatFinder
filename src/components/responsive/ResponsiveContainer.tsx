import React from 'react';
import { YStack, YStackProps } from 'tamagui';

export interface ResponsiveContainerProps extends YStackProps {
  /**
   * Maximum width constraint for large screens
   * - 'sm': 640px (small content)
   * - 'md': 768px (medium content - default)
   * - 'lg': 1024px (large content)
   * - 'xl': 1280px (extra large content)
   * - 'full': No max-width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to center the container horizontally on large screens
   * Default: true
   */
  centered?: boolean;

  children?: React.ReactNode;
}

/**
 * ResponsiveContainer - A container that adapts to screen size
 *
 * Features:
 * - Centers content on large screens
 * - Constrains max width to prevent stretching
 * - Responsive padding (tight on mobile, spacious on tablet)
 * - Works with all Tamagui stack props
 *
 * Usage:
 * ```tsx
 * <ResponsiveContainer maxWidth="md">
 *   <YourContent />
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  maxWidth = 'md',
  centered = true,
  children,
  ...props
}: ResponsiveContainerProps) {

  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm': return 640;
      case 'md': return 768;
      case 'lg': return 1024;
      case 'xl': return 1280;
      case 'full': return '100%';
      default: return 768;
    }
  };

  return (
    <YStack
      width="100%"
      maxWidth={getMaxWidth()}
      marginHorizontal={centered ? 'auto' : undefined}
      paddingHorizontal="$4"
      $gtSm={{
        paddingHorizontal: '$6',
      }}
      $md={{
        paddingHorizontal: '$8',
      }}
      {...props}
    >
      {children}
    </YStack>
  );
}
