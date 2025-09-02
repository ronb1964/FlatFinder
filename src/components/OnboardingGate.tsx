import React, { useEffect, useState } from 'react';
import { router, useSegments } from 'expo-router';
import { useAppStore } from '../state/appStore';
import { YStack, Text } from 'tamagui';

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const segments = useSegments();
  const { settings, loadSettings } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      await loadSettings();
      setIsLoading(false);
    };
    
    initializeApp();
  }, [loadSettings]);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const hasCompletedOnboarding = settings.hasCompletedOnboarding;

    if (!hasCompletedOnboarding && !inOnboarding) {
      // User hasn't completed onboarding and isn't in onboarding flow
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      // User has completed onboarding but is in onboarding flow
      router.replace('/(tabs)');
    }
  }, [isLoading, segments, settings.hasCompletedOnboarding]);

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </YStack>
    );
  }

  return <>{children}</>;
}
