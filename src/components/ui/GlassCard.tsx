import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderColor?: string;
  glowColor?: string;
  variant?: 'default' | 'success' | 'primary';
  compact?: boolean;
  /** Force light mode regardless of system theme (for outdoor visibility) */
  forceLightMode?: boolean;
}

// Generate variant colors based on current theme
function getVariantColors(
  theme: Theme,
  borderColor?: string,
  glowColor?: string,
  forceLightMode?: boolean
) {
  const isDark = theme.mode === 'dark' && !forceLightMode;

  return {
    default: {
      border: borderColor || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.2)'),
      glow: glowColor || (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'),
      gradient: isDark
        ? (['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] as [string, string])
        : (['rgba(200, 215, 235, 0.5)', 'rgba(200, 215, 235, 0.3)'] as [string, string]),
      bg: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(220, 230, 242, 0.95)',
    },
    success: {
      border: borderColor || (isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)'),
      glow: glowColor || (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'),
      gradient: isDark
        ? (['rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.04)'] as [string, string])
        : (['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.08)'] as [string, string]),
      bg: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(220, 230, 242, 0.95)',
    },
    primary: {
      border: borderColor || (isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'),
      glow: glowColor || (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
      gradient: isDark
        ? (['rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.04)'] as [string, string])
        : (['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.08)'] as [string, string]),
      bg: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(220, 230, 242, 0.95)',
    },
  };
}

export function GlassCard({
  children,
  style,
  intensity = 25,
  tint,
  borderColor,
  glowColor,
  variant = 'default',
  compact = false,
  forceLightMode = false,
}: GlassCardProps) {
  const theme = useTheme();

  // Determine effective dark mode (respecting forceLightMode override)
  const effectivelyDark = theme.mode === 'dark' && !forceLightMode;

  // Use provided tint or default based on effective theme
  const blurTint = tint || (effectivelyDark ? 'dark' : 'light');

  const variantColors = getVariantColors(theme, borderColor, glowColor, forceLightMode);
  const colors = variantColors[variant];

  const padding = compact ? 10 : 16;

  // Web fallback - BlurView doesn't work well on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderColor: colors.border,
              backgroundColor: colors.bg,
              padding,
            },
          ]}
        >
          {/* Top highlight */}
          <View style={[styles.highlight, { backgroundColor: colors.glow }]} />
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={blurTint} style={styles.blur}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderColor: colors.border, padding }]}
        >
          {/* Top highlight for glass effect */}
          <View style={[styles.highlight, { backgroundColor: colors.glow }]} />
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  blur: {
    // Removed flex: 1 - let content determine height
  },
  gradient: {
    // Removed flex: 1 - let content determine height
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default GlassCard;
