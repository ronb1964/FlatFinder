import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OnboardingGate } from '../src/components/OnboardingGate';
import { DebugControls } from '../src/components/DebugControls';
import { useAppStore } from '../src/state/appStore';
import { useTheme } from '../src/hooks/useTheme';
import { useEffect } from 'react';

export default function RootLayout() {
  // Get the current theme (respects system + user preference)
  const theme = useTheme();

  const loadProfiles = useAppStore((state) => state.loadProfiles);
  const loadSettings = useAppStore((state) => state.loadSettings);

  // Load profiles and settings on app startup
  useEffect(() => {
    loadProfiles();
    loadSettings();
  }, [loadProfiles, loadSettings]);

  // Proper mobile viewport setup
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Set proper viewport meta tag
      // eslint-disable-next-line no-undef
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        // eslint-disable-next-line no-undef
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        // eslint-disable-next-line no-undef
        document.head.appendChild(viewport);
      }
      viewport.setAttribute(
        'content',
        'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover'
      );
    }
  }, []);

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* StatusBar: light content on dark bg, dark content on light bg */}
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingGate>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        {Platform.OS === 'web' && <DebugControls />}
      </OnboardingGate>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
