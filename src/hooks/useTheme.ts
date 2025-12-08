/**
 * useTheme Hook
 *
 * Provides the current theme based on:
 * 1. User preference (themePreference setting in appStore)
 * 2. System color scheme (iOS/Android dark/light mode)
 *
 * Behavior:
 * - 'system': Follow device dark/light mode setting
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 */

import { useColorScheme } from 'react-native';
import { useAppStore } from '../state/appStore';
import { darkTheme, lightTheme, Theme } from '../theme';

/**
 * Hook that returns the current theme based on user preference and system settings.
 *
 * @returns The current Theme object (either darkTheme or lightTheme)
 */
export function useTheme(): Theme {
  // Get system color scheme (returns 'dark', 'light', or null)
  const systemColorScheme = useColorScheme();

  // Get user's theme preference from settings
  const themePreference = useAppStore((state) => state.settings.themePreference);

  // Determine which theme to use based on preference
  let isDark: boolean;
  switch (themePreference) {
    case 'light':
      isDark = false;
      break;
    case 'dark':
      isDark = true;
      break;
    case 'system':
    default:
      // Follow system preference, default to dark if system is null
      isDark = systemColorScheme !== 'light';
      break;
  }

  return isDark ? darkTheme : lightTheme;
}

/**
 * Hook that returns just the isDark boolean for simple checks.
 */
export function useIsDarkMode(): boolean {
  const theme = useTheme();
  return theme.mode === 'dark';
}

export default useTheme;
