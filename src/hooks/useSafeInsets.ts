/**
 * Custom safe area insets hook that provides realistic values on web
 *
 * Problem: On web, useSafeAreaInsets() returns zeros because browsers don't
 * simulate iOS safe areas. This causes layouts to look correct in the browser
 * but overflow on actual devices.
 *
 * Solution: On web, return mock values matching iPhone 14 Pro Max.
 * On native, pass through the real values from useSafeAreaInsets().
 *
 * iPhone 14 Pro Max safe area values:
 * - Top: 59px (Dynamic Island area)
 * - Bottom: 34px (Home indicator area)
 * - Left/Right: 0px (portrait mode)
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

// Mock values for iPhone 14 Pro Max in portrait mode
// - Top: 59px (Dynamic Island area)
// - Bottom: 0px (tab bar handles all bottom safe area internally)
// The tab bar component already accounts for the home indicator area.
const WEB_MOCK_INSETS: EdgeInsets = {
  top: 59, // Dynamic Island
  bottom: 0, // Tab bar handles bottom safe area
  left: 0,
  right: 0,
};

/**
 * Returns safe area insets with realistic values on web.
 *
 * On native: returns real device insets
 * On web: returns mock iPhone 14 Pro Max insets for accurate layout testing
 */
export function useSafeInsets(): EdgeInsets {
  const nativeInsets = useSafeAreaInsets();

  // On web, return mock values so layouts match real device behavior
  if (Platform.OS === 'web') {
    return WEB_MOCK_INSETS;
  }

  // On native, return actual device insets
  return nativeInsets;
}

/**
 * Calculate the usable screen height after accounting for safe areas and tab bar.
 *
 * @param screenHeight - The full screen height from useWindowDimensions()
 * @param includeTabBar - Whether to subtract tab bar height (default: true)
 * @returns The usable content height
 */
export function useUsableHeight(screenHeight: number, includeTabBar: boolean = true): number {
  const insets = useSafeInsets();

  // Tab bar is approximately 49px on iOS, plus bottom safe area
  const TAB_BAR_HEIGHT = 49;

  let usableHeight = screenHeight - insets.top - insets.bottom;

  if (includeTabBar) {
    usableHeight -= TAB_BAR_HEIGHT;
  }

  return usableHeight;
}
