import * as React from 'react';
import { View, ViewProps, Text, TextProps, StyleSheet } from 'react-native';

interface CardProps extends ViewProps {}

const Card = React.forwardRef<View, CardProps>(
  ({ style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[styles.card, style]}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, CardProps>(
  ({ style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[styles.cardHeader, style]}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends TextProps {}

const CardTitle = React.forwardRef<Text, CardTitleProps>(
  ({ style, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.cardTitle, style]}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<Text, CardTitleProps>(
  ({ style, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.cardDescription, style]}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, CardProps>(
  ({ style, ...props }, ref) => {
    return <View ref={ref} style={[styles.cardContent, style]} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, CardProps>(
  ({ style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[styles.cardFooter, style]}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  cardHeader: {
    flexDirection: 'column',
    gap: 6,
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fafafa',
  },
  cardDescription: {
    fontSize: 14,
    color: '#a3a3a3',
  },
  cardContent: {
    padding: 24,
    paddingTop: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 0,
  },
});

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
