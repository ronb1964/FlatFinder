import React from 'react';
import { YStack, Spinner, Text, Card } from 'tamagui';
import { Loader2 } from '@tamagui/lucide-icons';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'large',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinnerSize = size === 'large' ? 'large' : 'small';
  const iconSize = size === 'large' ? 48 : 24;

  const content = (
    <YStack space="$4" alignItems="center">
      <Spinner size={spinnerSize} color="$blue9" />
      {message && (
        <Text 
          color="$colorPress" 
          fontSize={size === 'large' ? '$5' : '$3'}
          textAlign="center"
        >
          {message}
        </Text>
      )}
    </YStack>
  );

  if (fullScreen) {
    return (
      <YStack 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        backgroundColor="$background"
        padding="$4"
      >
        <Card
          padding="$6"
          backgroundColor="$gray2"
          borderRadius="$4"
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.9 }}
          opacity={1}
          scale={1}
        >
          {content}
        </Card>
      </YStack>
    );
  }

  return content;
}

interface SensorLoadingProps {
  stage: 'checking' | 'requesting' | 'initializing' | 'error';
  errorMessage?: string;
}

export function SensorLoadingScreen({ stage, errorMessage }: SensorLoadingProps) {
  const messages = {
    checking: 'Checking sensor availability...',
    requesting: 'Requesting sensor permissions...',
    initializing: 'Initializing motion sensors...',
    error: errorMessage || 'Failed to initialize sensors',
  };

  const icons = {
    checking: '🔍',
    requesting: '🔐',
    initializing: '📡',
    error: '⚠️',
  };

  return (
    <YStack 
      flex={1} 
      justifyContent="center" 
      alignItems="center" 
      backgroundColor="$background"
      padding="$4"
    >
      <Card
        padding="$6"
        backgroundColor="$gray2"
        borderRadius="$4"
        maxWidth={400}
        width="100%"
        animation="quick"
        enterStyle={{ opacity: 0, y: 20 }}
        opacity={1}
        y={0}
      >
        <YStack space="$4" alignItems="center">
          <Text fontSize="$10">{icons[stage]}</Text>
          
          {stage !== 'error' && (
            <Spinner size="large" color="$blue9" />
          )}
          
          <Text 
            color={stage === 'error' ? '$red10' : '$colorPress'}
            fontSize="$5"
            textAlign="center"
            fontWeight="600"
          >
            {messages[stage]}
          </Text>

          {stage === 'checking' && (
            <Text color="$gray10" fontSize="$3" textAlign="center">
              Detecting available motion sensors on your device...
            </Text>
          )}

          {stage === 'requesting' && (
            <Text color="$gray10" fontSize="$3" textAlign="center">
              Please allow access to motion sensors when prompted
            </Text>
          )}

          {stage === 'initializing' && (
            <Text color="$gray10" fontSize="$3" textAlign="center">
              Setting up real-time motion tracking...
            </Text>
          )}
        </YStack>
      </Card>
    </YStack>
  );
}