import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

interface TextProps extends RNTextProps {
  variant?: 'default' | 'muted' | 'destructive';
}

const Text = React.forwardRef<RNText, TextProps>(
  ({ style, variant = 'default', ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        style={[styles.base, styles[variant], style]}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

const styles = StyleSheet.create({
  base: {
    color: '#fafafa',
  },
  default: {},
  muted: {
    color: '#a3a3a3',
  },
  destructive: {
    color: '#ef4444',
  },
});

export { Text };
export type { TextProps };
