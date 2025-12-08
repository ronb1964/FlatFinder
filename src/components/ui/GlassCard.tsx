import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderColor?: string;
  glowColor?: string;
  variant?: 'default' | 'success' | 'primary';
  compact?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 25,
  tint = 'dark',
  borderColor,
  glowColor,
  variant = 'default',
  compact = false,
}: GlassCardProps) {
  const variantColors = {
    default: {
      border: borderColor || 'rgba(255, 255, 255, 0.1)',
      glow: glowColor || 'rgba(59, 130, 246, 0.1)',
      gradient: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'],
    },
    success: {
      border: borderColor || 'rgba(34, 197, 94, 0.3)',
      glow: glowColor || 'rgba(34, 197, 94, 0.15)',
      gradient: ['rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.04)'],
    },
    primary: {
      border: borderColor || 'rgba(59, 130, 246, 0.3)',
      glow: glowColor || 'rgba(59, 130, 246, 0.15)',
      gradient: ['rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.04)'],
    },
  };

  const colors = variantColors[variant];

  const padding = compact ? 10 : 16;

  // Web fallback - BlurView doesn't work well on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={colors.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderColor: colors.border,
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
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
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <LinearGradient
          colors={colors.gradient as [string, string]}
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
