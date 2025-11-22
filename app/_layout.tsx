import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { useFonts } from 'expo-font';
import tamaguiConfig from '../tamagui.config';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform } from 'react-native';
import { OnboardingGate } from '../src/components/OnboardingGate';
import { DebugControls } from '../src/components/DebugControls';
import { useEffect } from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

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

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme || 'light'}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <OnboardingGate>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <DebugControls />
      </OnboardingGate>
    </TamaguiProvider>
  );
}
