import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { ScrollView, View, StyleSheet, useColorScheme } from 'react-native';
import type { ScrollViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

// How close to the bottom (in px) before the chevron hides
const BOTTOM_THRESHOLD = 20;

// Dark mode: white glow. Light mode: dark navy glow.
const DARK_STROKE = 'white';
const LIGHT_STROKE = '#1e3c78';

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

function ChevronSVG({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? DARK_STROKE : LIGHT_STROKE;
  // feGaussianBlur stdDeviation 0.5 ≈ CSS blur(1px)
  // Two blur passes create the layered diffuse glow matching the approved spec
  return (
    <Svg width={42} height={42} viewBox="0 0 24 24">
      <Defs>
        <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur1" />
          <FeGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
          <FeMerge>
            <FeMergeNode in="blur2" />
            <FeMergeNode in="blur1" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <Path
        d="M6 9 L12 15 L18 9"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
      />
    </Svg>
  );
}

const ScrollViewWithChevron = forwardRef<ScrollView, Props>(
  (
    { children, onScroll, onLayout, onContentSizeChange, style, contentContainerStyle, ...props },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme !== 'light';

    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    // Derived: should chevron be shown?
    const hasOverflow = contentHeight > containerHeight + BOTTOM_THRESHOLD;
    const isAtBottom = scrollY + containerHeight >= contentHeight - BOTTOM_THRESHOLD;
    const showChevron = hasOverflow && !isAtBottom;

    // Animated values
    const breatheOpacity = useSharedValue(0.6);
    const visibilityOpacity = useSharedValue(0);

    // Start/stop breathe animation based on visibility
    useEffect(() => {
      if (showChevron) {
        // Fade in chevron container
        visibilityOpacity.value = withTiming(1, { duration: 300 });
        // Start breathe loop: 0.60 → 0.08 → 0.60, 2.4s cycle
        breatheOpacity.value = withRepeat(
          withSequence(
            withTiming(0.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite
          false
        );
      } else {
        // Fade out over 0.6s, then stop breathe
        visibilityOpacity.value = withTiming(0, { duration: 600 });
        cancelAnimation(breatheOpacity);
        breatheOpacity.value = 0.6; // reset for next appearance
      }
    }, [showChevron]);

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
      opacity: breatheOpacity.value * visibilityOpacity.value,
    }));

    const handleLayout = useCallback(
      (e: Parameters<NonNullable<ScrollViewProps['onLayout']>>[0]) => {
        setContainerHeight(e.nativeEvent.layout.height);
        onLayout?.(e);
      },
      [onLayout]
    );

    const handleContentSizeChange = useCallback(
      (w: number, h: number) => {
        setContentHeight(h);
        onContentSizeChange?.(w, h);
      },
      [onContentSizeChange]
    );

    const handleScroll = useCallback(
      (e: Parameters<NonNullable<ScrollViewProps['onScroll']>>[0]) => {
        setScrollY(e.nativeEvent.contentOffset.y);
        onScroll?.(e);
      },
      [onScroll]
    );

    return (
      <View style={[styles.container, style]}>
        <ScrollView
          ref={ref}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={contentContainerStyle}
          {...props}
        >
          {children}
        </ScrollView>

        {/* Chevron overlay — pointer-events none so it cannot be tapped */}
        <Animated.View style={[styles.chevronContainer, chevronAnimatedStyle]} pointerEvents="none">
          <ChevronSVG isDark={isDark} />
        </Animated.View>
      </View>
    );
  }
);

ScrollViewWithChevron.displayName = 'ScrollViewWithChevron';

export default ScrollViewWithChevron;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  chevronContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
