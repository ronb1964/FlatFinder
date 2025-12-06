import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function GlassButton({
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
  variant = 'default',
  size = 'md',
  icon,
  rightIcon,
}: GlassButtonProps) {
  const scale = useSharedValue(1);

  const variantStyles = {
    default: {
      gradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)'],
      border: 'rgba(255, 255, 255, 0.15)',
      text: '#fafafa',
      glow: 'transparent',
      bg: 'rgba(38, 38, 38, 0.8)',
    },
    primary: {
      gradient: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.2)'],
      border: 'rgba(96, 165, 250, 0.5)',
      text: '#ffffff',
      glow: 'rgba(59, 130, 246, 0.3)',
      bg: 'rgba(59, 130, 246, 0.3)',
    },
    secondary: {
      // Teal/Cyan for Full Calibration
      gradient: ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.2)'],
      border: 'rgba(34, 211, 238, 0.5)',
      text: '#ffffff',
      glow: 'rgba(6, 182, 212, 0.3)',
      bg: 'rgba(6, 182, 212, 0.3)',
    },
    warning: {
      // Orange/Amber for Quick Calibrate
      gradient: ['rgba(245, 158, 11, 0.4)', 'rgba(245, 158, 11, 0.2)'],
      border: 'rgba(251, 191, 36, 0.5)',
      text: '#ffffff',
      glow: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.3)',
    },
    success: {
      gradient: ['rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.2)'],
      border: 'rgba(74, 222, 128, 0.5)',
      text: '#ffffff',
      glow: 'rgba(34, 197, 94, 0.3)',
      bg: 'rgba(34, 197, 94, 0.3)',
    },
    ghost: {
      gradient: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
      border: 'rgba(255, 255, 255, 0.1)',
      text: '#a3a3a3',
      glow: 'transparent',
      bg: 'rgba(38, 38, 38, 0.8)',
    },
    danger: {
      gradient: ['rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 0.1)'],
      border: 'rgba(239, 68, 68, 0.4)',
      text: '#f87171',
      glow: 'rgba(239, 68, 68, 0.2)',
      bg: 'rgba(239, 68, 68, 0.15)',
    },
  };

  const sizeStyles = {
    sm: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
    md: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
    lg: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 12, fontSize: 18 },
  };

  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const buttonContent = (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.gradient,
        {
          borderColor: colors.border,
          minHeight: sizing.minHeight,
          paddingHorizontal: sizing.paddingHorizontal,
          paddingVertical: sizing.paddingVertical,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* Top highlight */}
      <View style={[styles.highlight, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.text, { color: colors.text, fontSize: sizing.fontSize }, textStyle]}>
          {children}
        </Text>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </LinearGradient>
  );

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.container, animatedStyle, style]}
      >
        <View
          style={[
            styles.webFallback,
            {
              borderColor: colors.border,
              minHeight: sizing.minHeight,
              paddingHorizontal: sizing.paddingHorizontal,
              paddingVertical: sizing.paddingVertical,
              backgroundColor: colors.bg,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              style={[styles.text, { color: colors.text, fontSize: sizing.fontSize }, textStyle]}
            >
              {children}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, animatedStyle, style]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blur}>
        {buttonContent}
      </BlurView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  webFallback: {
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  icon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default GlassButton;
