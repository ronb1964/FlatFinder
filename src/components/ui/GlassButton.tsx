import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../theme';

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
  /** Force light mode regardless of system theme (for outdoor visibility) */
  forceLightMode?: boolean;
}

// Generate variant styles based on current theme
// Note: Colored buttons use high saturation for visibility, especially in light mode
function getVariantStyles(theme: Theme, forceLightMode?: boolean) {
  const isDark = theme.mode === 'dark' && !forceLightMode;

  return {
    default: {
      gradient: isDark
        ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']
        : ['rgba(180, 195, 215, 0.5)', 'rgba(180, 195, 215, 0.3)'],
      border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 170, 0.35)',
      text: theme.colors.text,
      glow: 'transparent',
      bg: isDark ? 'rgba(38, 38, 38, 0.8)' : 'rgba(200, 212, 228, 0.95)',
    },
    primary: {
      // Blue - high saturation for visibility
      gradient: isDark
        ? ['rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.3)']
        : ['rgba(59, 130, 246, 0.85)', 'rgba(59, 130, 246, 0.7)'],
      border: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.9)',
      text: '#ffffff',
      glow: 'rgba(59, 130, 246, 0.3)',
      bg: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.8)',
    },
    secondary: {
      // Teal/Cyan - high saturation for visibility
      gradient: isDark
        ? ['rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 0.3)']
        : ['rgba(6, 182, 212, 0.85)', 'rgba(6, 182, 212, 0.7)'],
      border: isDark ? 'rgba(34, 211, 238, 0.5)' : 'rgba(6, 182, 212, 0.9)',
      text: '#ffffff',
      glow: 'rgba(6, 182, 212, 0.3)',
      bg: isDark ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.8)',
    },
    warning: {
      // Orange/Amber - high saturation for visibility
      gradient: isDark
        ? ['rgba(245, 158, 11, 0.55)', 'rgba(245, 158, 11, 0.35)']
        : ['rgba(245, 158, 11, 0.9)', 'rgba(245, 158, 11, 0.75)'],
      border: isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.95)',
      text: '#ffffff',
      glow: 'rgba(245, 158, 11, 0.3)',
      bg: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.85)',
    },
    success: {
      // Green - high saturation for visibility
      gradient: isDark
        ? ['rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.3)']
        : ['rgba(34, 197, 94, 0.85)', 'rgba(34, 197, 94, 0.7)'],
      border: isDark ? 'rgba(74, 222, 128, 0.5)' : 'rgba(34, 197, 94, 0.9)',
      text: '#ffffff',
      glow: 'rgba(34, 197, 94, 0.3)',
      bg: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.8)',
    },
    ghost: {
      gradient: isDark
        ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
        : ['rgba(180, 195, 215, 0.4)', 'rgba(180, 195, 215, 0.25)'],
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.3)',
      text: theme.colors.textSecondary,
      glow: 'transparent',
      bg: isDark ? 'rgba(38, 38, 38, 0.8)' : 'rgba(200, 212, 228, 0.9)',
    },
    danger: {
      // Red - high saturation for visibility
      gradient: isDark
        ? ['rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.2)']
        : ['rgba(239, 68, 68, 0.7)', 'rgba(239, 68, 68, 0.55)'],
      border: isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.8)',
      text: isDark ? '#f87171' : '#dc2626',
      glow: 'rgba(239, 68, 68, 0.2)',
      bg: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.65)',
    },
  };
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
  forceLightMode = false,
}: GlassButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const variantStyles = getVariantStyles(theme, forceLightMode);

  const sizeStyles = {
    sm: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
    md: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
    lg: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 12, fontSize: 18 },
  };

  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  // Highlight color based on theme
  const highlightColor =
    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)';

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
      {/* Top highlight for glass effect */}
      <View style={[styles.highlight, { backgroundColor: highlightColor }]} />
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <View style={styles.textWrapper}>
          <Text
            style={[
              styles.text,
              { color: colors.text, fontSize: sizing.fontSize, lineHeight: sizing.fontSize * 1.2 },
              textStyle,
            ]}
          >
            {children}
          </Text>
        </View>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </LinearGradient>
  );

  // Web fallback (no BlurView)
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
            <View style={styles.textWrapper}>
              <Text
                style={[
                  styles.text,
                  {
                    color: colors.text,
                    fontSize: sizing.fontSize,
                    lineHeight: sizing.fontSize * 1.2,
                  },
                  textStyle,
                ]}
              >
                {children}
              </Text>
            </View>
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
      {/* BlurView tint based on theme */}
      <BlurView intensity={20} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.blur}>
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
  textWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
    // Prevent iOS Dynamic Type from causing vertical misalignment
    includeFontPadding: false, // Android: removes extra padding
    textAlignVertical: 'center', // Android: explicit vertical centering
  },
});

export default GlassButton;
