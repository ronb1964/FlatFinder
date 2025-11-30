import * as React from 'react';
import { Pressable, PressableProps, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ variant = 'default', size = 'default', children, style, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          pressed && styles.pressed,
          style as ViewStyle,
        ]}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.textBase, textVariantStyles[variant], textSizeStyles[size]]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#262626',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const sizeStyles = StyleSheet.create({
  default: {
    height: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sm: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lg: {
    height: 56,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  icon: {
    height: 48,
    width: 48,
  },
});

const textVariantStyles = StyleSheet.create({
  default: {
    color: '#ffffff',
  },
  secondary: {
    color: '#fafafa',
  },
  destructive: {
    color: '#fafafa',
  },
  outline: {
    color: '#fafafa',
  },
  ghost: {
    color: '#fafafa',
  },
});

const textSizeStyles = StyleSheet.create({
  default: {
    fontSize: 16,
  },
  sm: {
    fontSize: 14,
  },
  lg: {
    fontSize: 18,
  },
  icon: {
    fontSize: 16,
  },
});

export { Button };
export type { ButtonProps };
