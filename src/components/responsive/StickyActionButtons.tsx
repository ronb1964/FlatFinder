import React from 'react';
import { XStack, YStack, YStackProps } from 'tamagui';
import { Platform } from 'react-native';

export interface StickyActionButtonsProps extends YStackProps {
  /**
   * Layout direction
   * - 'row': Buttons side by side (default)
   * - 'column': Buttons stacked vertically
   */
  direction?: 'row' | 'column';

  /**
   * Whether to show a separator line above buttons
   * Default: true
   */
  showSeparator?: boolean;

  /**
   * Background color (defaults to theme background)
   */
  backgroundColor?: string;

  /**
   * Whether to use absolute positioning (truly sticky at bottom)
   * Default: false (normal flex flow)
   */
  absolute?: boolean;

  children?: React.ReactNode;
}

/**
 * StickyActionButtons - Action buttons that stay visible at bottom
 *
 * Features:
 * - Always visible at bottom of screen
 * - Lives outside ScrollView
 * - Responsive padding
 * - Optional separator line
 * - Supports row or column layout
 *
 * Usage:
 * ```tsx
 * <YStack flex={1}>
 *   <ScrollView flex={1}>
 *     <YourContent />
 *   </ScrollView>
 *
 *   <StickyActionButtons>
 *     <Button>Save</Button>
 *     <Button>Cancel</Button>
 *   </StickyActionButtons>
 * </YStack>
 * ```
 */
export function StickyActionButtons({
  direction = 'row',
  showSeparator = true,
  backgroundColor,
  absolute = false,
  children,
  ...props
}: StickyActionButtonsProps) {

  const Container = direction === 'row' ? XStack : YStack;

  return (
    <YStack
      backgroundColor={backgroundColor || '$background'}
      borderTopWidth={showSeparator ? 1 : 0}
      borderTopColor="rgba(255, 255, 255, 0.1)"
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom="$4"
      $gtSm={{
        paddingHorizontal: '$6',
        paddingTop: '$4',
        paddingBottom: '$5',
      }}
      {...(absolute ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      } : {})}
      {...props}
    >
      <Container
        space="$3"
        justifyContent={direction === 'row' ? 'space-between' : 'flex-start'}
        alignItems="stretch"
        width="100%"
      >
        {children}
      </Container>
    </YStack>
  );
}

/**
 * FloatingActionButtons - Floating action buttons (bottom-right corner style)
 */
export function FloatingActionButtons({
  children,
  ...props
}: YStackProps) {
  return (
    <YStack
      position="absolute"
      bottom="$4"
      right="$4"
      space="$3"
      zIndex={100}
      $md={{
        bottom: '$6',
        right: '$6',
      }}
      {...props}
    >
      {children}
    </YStack>
  );
}
