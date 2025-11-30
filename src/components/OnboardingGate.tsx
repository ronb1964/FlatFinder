import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAppStore } from '../state/appStore';

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

    const firstSegment = segments[0];
    const inOnboarding = firstSegment === 'onboarding';
    const hasCompletedOnboarding = settings.hasCompletedOnboarding === true;

    if (hasCompletedOnboarding === false && inOnboarding === false) {
      // User hasn't completed onboarding and isn't in onboarding flow
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding === true && inOnboarding === true) {
      // User has completed onboarding but is in onboarding flow
      router.replace('/(tabs)');
    }
  }, [isLoading, segments, settings.hasCompletedOnboarding]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
