import React from 'react';
import { XStack, YStack, YStackProps } from 'tamagui';
import { StyleSheet } from 'react-native';

export interface ResponsiveGridProps extends YStackProps {
  /**
   * Number of columns at different breakpoints
   * Examples:
   * - cols={2} // Always 2 columns
   * - cols={{ xs: 1, sm: 2, md: 3 }} // Adaptive columns
   */
  cols?: number | {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };

  /**
   * Gap between grid items (Tamagui space token)
   */
  gap?: string | number;

  children?: React.ReactNode;
}

/**
 * ResponsiveGrid - A grid layout that adapts columns based on screen size
 *
 * Features:
 * - Adaptive column count (1-col mobile, 2-col tablet, 3-col desktop)
 * - Responsive gaps
 * - Flexbox-based for smooth transitions
 *
 * Usage:
 * ```tsx
 * <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 3 }} gap="$3">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  cols = 1,
  gap = '$3',
  children,
  ...props
}: ResponsiveGridProps) {

  // Convert cols to object format if it's a number
  const colConfig = typeof cols === 'number'
    ? { xs: cols, sm: cols, md: cols, lg: cols, xl: cols }
    : { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, ...cols };

  return (
    <YStack
      flexWrap="wrap"
      flexDirection="row"
      marginHorizontal={`-${typeof gap === 'string' ? gap.replace('$', '') : gap / 2}`}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;

        return (
          <YStack
            flexBasis={`${100 / (colConfig.xs || 1)}%`}
            $sm={{
              flexBasis: `${100 / (colConfig.sm || 1)}%`,
            }}
            $md={{
              flexBasis: `${100 / (colConfig.md || 2)}%`,
            }}
            $lg={{
              flexBasis: `${100 / (colConfig.lg || 3)}%`,
            }}
            $xl={{
              flexBasis: `${100 / (colConfig.xl || 3)}%`,
            }}
            padding={gap}
          >
            {child}
          </YStack>
        );
      })}
    </YStack>
  );
}
