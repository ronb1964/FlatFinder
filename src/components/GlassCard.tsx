import React from 'react';
import { Card, CardProps } from 'tamagui';
import { Platform } from 'react-native';

export interface GlassCardProps extends CardProps {
  blurIntensity?: number;
  glassOpacity?: 'light' | 'medium' | 'strong';
  children?: React.ReactNode;
}

/**
 * GlassCard - A glassmorphic card component with frosted glass effect
 * Uses CSS backdrop-filter on web
 * Uses native BlurView on iOS/Android (will be implemented when deployed to phone)
 */
export function GlassCard({
  blurIntensity = 10,
  glassOpacity = 'medium',
  children,
  ...props
}: GlassCardProps) {

  const getGlassColor = () => {
    const opacityMap = {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.2)',
    };
    return opacityMap[glassOpacity];
  };

  // For web and native, use CSS backdrop-filter
  // Native BlurView will be added when we deploy to phone
  return (
    <Card
      {...props}
      backgroundColor={getGlassColor()}
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.18)"
      shadowColor="rgba(0, 0, 0, 0.3)"
      shadowOffset={{ width: 0, height: 8 }}
      shadowOpacity={0.3}
      shadowRadius={12}
      style={[
        props.style,
        Platform.OS === 'web' ? {
          // @ts-ignore - backdrop-filter is valid CSS but not in React Native types
          backdropFilter: `blur(${blurIntensity}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px) saturate(180%)`,
        } : {},
      ]}
    >
      {children}
    </Card>
  );
}

/**
 * DarkGlassCard - Dark variant for use on light backgrounds
 */
export function DarkGlassCard({
  glassOpacity = 'medium',
  blurIntensity = 10,
  ...props
}: GlassCardProps) {
  const getGlassColor = () => {
    const opacityMap = {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.2)',
      strong: 'rgba(0, 0, 0, 0.3)',
    };
    return opacityMap[glassOpacity];
  };

  return (
    <Card
      {...props}
      backgroundColor={getGlassColor()}
      borderWidth={1}
      borderColor="rgba(0, 0, 0, 0.18)"
      style={[
        props.style,
        Platform.OS === 'web' ? {
          // @ts-ignore
          backdropFilter: `blur(${blurIntensity}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px) saturate(180%)`,
        } : {},
      ]}
    />
  );
}
