import React, { useState, useRef } from 'react';
import { ScrollView, YStack, YStackProps } from 'tamagui';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface ScrollContainerProps extends YStackProps {
  /**
   * Show fade indicator at bottom when more content is available
   * Default: true
   */
  showFadeIndicator?: boolean;

  /**
   * Show scroll indicator/scrollbar
   * Default: false
   */
  showScrollIndicator?: boolean;

  /**
   * Disable scrolling (useful during calibration, etc)
   * Default: false
   */
  scrollEnabled?: boolean;

  children?: React.ReactNode;
}

/**
 * ScrollContainer - Smart scrollable container with visual indicators
 *
 * Features:
 * - Fade effect at bottom when more content exists
 * - Optional scroll indicators
 * - Can be disabled for stability (calibration mode)
 * - Handles all ScrollView props
 *
 * Usage:
 * ```tsx
 * <ScrollContainer showFadeIndicator={true}>
 *   <YourLongContent />
 * </ScrollContainer>
 * ```
 */
export function ScrollContainer({
  showFadeIndicator = true,
  showScrollIndicator = false,
  scrollEnabled = true,
  children,
  ...props
}: ScrollContainerProps) {
  const [showBottomFade, setShowBottomFade] = useState(true);
  const scrollViewRef = useRef<any>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Check if scrolled to bottom (within 20px threshold)
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setShowBottomFade(!isNearBottom);
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    // Check if content is scrollable
    if (scrollViewRef.current) {
      scrollViewRef.current.measure(
        (_x: number, _y: number, _width: number, height: number) => {
          setShowBottomFade(contentHeight > height);
        }
      );
    }
  };

  return (
    <YStack flex={1} position="relative" {...props}>
      <ScrollView
        ref={scrollViewRef}
        flex={1}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showScrollIndicator}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      {/* Fade indicator at bottom */}
      {showFadeIndicator && showBottomFade && scrollEnabled && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={60}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
            style={{ flex: 1 }}
          />
        </YStack>
      )}
    </YStack>
  );
}

/**
 * ScrollContainerWithIndicator - Scroll container with explicit "scroll for more" hint
 */
export function ScrollContainerWithIndicator({
  children,
  ...props
}: ScrollContainerProps) {
  const [showScrollHint, setShowScrollHint] = useState(true);

  return (
    <YStack flex={1} position="relative">
      <ScrollContainer
        {...props}
        onScroll={(e) => {
          setShowScrollHint(false);
          props.onScroll?.(e);
        }}
      >
        {children}
      </ScrollContainer>

      {/* Scroll hint with arrow */}
      {showScrollHint && (
        <YStack
          position="absolute"
          bottom={20}
          alignSelf="center"
          backgroundColor="rgba(99, 102, 241, 0.9)"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$4"
          pointerEvents="none"
          animation="quick"
          y={showScrollHint ? 0 : 20}
          opacity={showScrollHint ? 1 : 0}
        >
          <YStack alignItems="center" space="$1">
            <YStack fontSize="$3" color="white">
              ↓
            </YStack>
            <YStack fontSize="$2" color="white" fontWeight="600">
              Scroll for more
            </YStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
