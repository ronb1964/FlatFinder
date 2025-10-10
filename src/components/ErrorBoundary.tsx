import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { YStack, H2, Paragraph, Button as TamaguiButton, Card } from 'tamagui';
import { AlertTriangle, RefreshCw } from '@tamagui/lucide-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
          <Card
            padding="$4"
            backgroundColor="$red2"
            borderColor="$red6"
            borderWidth={2}
            borderRadius="$4"
            maxWidth={400}
            width="100%"
          >
            <YStack space="$3" alignItems="center">
              <AlertTriangle size={48} color="$red9" />
              
              <H2 color="$red11" textAlign="center">
                Something went wrong
              </H2>
              
              <Paragraph color="$red10" textAlign="center">
                The app encountered an unexpected error. Please try restarting or contact support if the problem persists.
              </Paragraph>

              {__DEV__ && this.state.error && (
                <Card
                  padding="$2"
                  backgroundColor="$gray2"
                  borderRadius="$2"
                  width="100%"
                >
                  <ScrollView style={{ maxHeight: 200 }}>
                    <Text style={styles.errorText}>
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <Text style={styles.stackText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </ScrollView>
                </Card>
              )}

              <TamaguiButton
                size="$4"
                backgroundColor="$blue9"
                icon={RefreshCw}
                onPress={this.handleReset}
              >
                Try Again
              </TamaguiButton>
            </YStack>
          </Card>
        </YStack>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#ff0000',
    marginBottom: 8,
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666',
  },
});

export default ErrorBoundary;