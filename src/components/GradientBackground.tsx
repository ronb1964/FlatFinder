import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export interface GradientBackgroundProps {
  children?: React.ReactNode;
  colors?: string[];
  animated?: boolean;
  animationDuration?: number;
}

/**
 * GradientBackground - Animated gradient background for screens
 * Provides a subtle animated gradient that slowly shifts
 */
export function GradientBackground({
  children,
  colors = ['#1a1a2e', '#16213e', '#0f172a'],
  animated = true,
  animationDuration = 8000,
}: GradientBackgroundProps) {
  const animationValue = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animationValue.value = withRepeat(
        withTiming(1, {
          duration: animationDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Repeat infinitely
        true // Reverse direction
      );
    }
  }, [animated, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) {
      return {};
    }

    // Animate the gradient positions
    const startX = interpolate(animationValue.value, [0, 1], [0, 0.3]);
    const startY = interpolate(animationValue.value, [0, 1], [0, 0.2]);

    return {
      // This would work with a more advanced gradient solution
      // For now, we'll just use opacity animation
      opacity: interpolate(animationValue.value, [0, 0.5, 1], [1, 0.95, 1]),
    };
  });

  return (
    <AnimatedLinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, animatedStyle]}
    >
      {children}
    </AnimatedLinearGradient>
  );
}

/**
 * LevelScreenGradient - Specialized gradient for the level screen
 * Dark base with subtle blue-purple hints
 */
export function LevelScreenGradient({ children }: { children?: React.ReactNode }) {
  return (
    <GradientBackground
      colors={[
        '#0f0f1e', // Deep dark blue
        '#1a1a2e', // Midnight blue
        '#16213e', // Dark navy
        '#0f172a', // Slate dark
      ]}
      animated={true}
      animationDuration={10000}
    >
      {children}
    </GradientBackground>
  );
}

/**
 * ProfilesScreenGradient - Warmer gradient for profiles
 */
export function ProfilesScreenGradient({ children }: { children?: React.ReactNode }) {
  return (
    <GradientBackground
      colors={[
        '#1a1625', // Dark purple
        '#1e1b2e', // Deep violet
        '#1a1a2e', // Midnight
      ]}
      animated={true}
      animationDuration={12000}
    >
      {children}
    </GradientBackground>
  );
}

/**
 * SettingsScreenGradient - Clean gradient for settings
 */
export function SettingsScreenGradient({ children }: { children?: React.ReactNode }) {
  return (
    <GradientBackground
      colors={[
        '#0f1419', // Very dark
        '#1a1f2e', // Dark blue-grey
        '#16213e', // Navy
      ]}
      animated={false}
    >
      {children}
    </GradientBackground>
  );
}

/**
 * LevelingAssistantGradient - Dynamic gradient for leveling assistant
 */
export function LevelingAssistantGradient({ children }: { children?: React.ReactNode }) {
  return (
    <GradientBackground
      colors={[
        '#1a1a2e', // Midnight blue
        '#16213e', // Dark navy
        '#0f172a', // Slate dark
      ]}
      animated={true}
      animationDuration={8000}
    >
      {children}
    </GradientBackground>
  );
}
