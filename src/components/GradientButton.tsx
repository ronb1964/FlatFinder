import React from 'react';
import { Button, ButtonProps, XStack, Text, styled, useTheme } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export type GradientType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface GradientButtonProps extends Omit<ButtonProps, 'onPress'> {
  gradientType?: GradientType;
  onPress?: () => void;
  children?: React.ReactNode;
  icon?: any;
  haptics?: boolean;
}

const gradientColors: Record<GradientType, string[]> = {
  primary: ['#6366f1', '#8b5cf6'],
  success: ['#10b981', '#22c55e'],
  warning: ['#f59e0b', '#f97316'],
  danger: ['#ef4444', '#dc2626'],
  info: ['#3b82f6', '#06b6d4'],
};

/**
 * GradientButton - A modern button with gradient background
 * Includes haptic feedback and smooth press animations
 */
export function GradientButton({
  gradientType = 'primary',
  onPress,
  children,
  icon: Icon,
  haptics = true,
  disabled = false,
  size = '$4',
  ...props
}: GradientButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    if (haptics && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const colors = gradientColors[gradientType];

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={{
        flex: props.flex as any,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: isPressed ? 0.96 : 1 }],
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          shadowColor: colors[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="center"
          space="$2"
        >
          {Icon && <Icon size={20} color="white" />}
          {typeof children === 'string' ? (
            <Text color="white" fontSize="$4" fontWeight="bold">
              {children}
            </Text>
          ) : (
            children
          )}
        </XStack>
      </LinearGradient>
    </Pressable>
  );
}

/**
 * GlassGradientButton - Combines glassmorphism with gradient borders
 */
export function GlassGradientButton({
  gradientType = 'primary',
  onPress,
  children,
  icon: Icon,
  ...props
}: GradientButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const colors = gradientColors[gradientType];

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={{
        borderRadius: 12,
        padding: 2,
        transform: [{ scale: isPressed ? 0.96 : 1 }],
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          padding: 2,
        }}
      >
        <XStack
          backgroundColor="rgba(0, 0, 0, 0.5)"
          paddingHorizontal="$4"
          paddingVertical="$3"
          borderRadius={10}
          alignItems="center"
          justifyContent="center"
          space="$2"
          style={{
            // @ts-ignore
            backdropFilter: 'blur(10px)',
          }}
        >
          {Icon && <Icon size={20} color="white" />}
          {typeof children === 'string' ? (
            <Text color="white" fontSize="$4" fontWeight="600">
              {children}
            </Text>
          ) : (
            children
          )}
        </XStack>
      </LinearGradient>
    </Pressable>
  );
}
