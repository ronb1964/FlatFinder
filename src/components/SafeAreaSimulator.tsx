/**
 * SafeAreaSimulator - Shows visual safe area boundaries on web for accurate previewing
 *
 * On web, SafeAreaView from react-native-safe-area-context returns 0 insets because
 * browsers don't have Dynamic Islands or home indicators. This component adds visual
 * indicators and actual padding on web so layouts match real device behavior.
 *
 * On native, this component is transparent - it just passes through to children.
 */

import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface SafeAreaSimulatorProps {
  children: React.ReactNode;
  // Show visual indicators for safe areas (colored bars at top/bottom)
  showIndicators?: boolean;
  // Style for the container
  style?: object;
}

export function SafeAreaSimulator({
  children,
  showIndicators = false,
  style,
}: SafeAreaSimulatorProps) {
  const insets = useSafeInsets();

  // On native, just use the standard SafeAreaView
  if (Platform.OS !== 'web') {
    return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
  }

  // On web, add manual padding to simulate safe areas (matches real device constraints)
  // Only show the visual indicator overlays when showIndicators is true
  return (
    <View style={[styles.container, style]}>
      {/* Top safe area indicator - visual only */}
      {showIndicators && (
        <View style={[styles.safeAreaIndicator, styles.topIndicator, { height: insets.top }]}>
          <Text style={styles.indicatorText}>Safe Area ({insets.top}px)</Text>
        </View>
      )}

      {/* Content with safe area padding always applied to match device layout */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {children}
      </View>

      {/* Bottom safe area indicator - visual only */}
      {showIndicators && (
        <View style={[styles.safeAreaIndicator, styles.bottomIndicator, { height: insets.bottom }]}>
          <Text style={styles.indicatorText}>Safe Area ({insets.bottom}px)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  safeAreaIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  topIndicator: {
    top: 0,
  },
  bottomIndicator: {
    bottom: 0,
  },
  indicatorText: {
    color: 'rgba(255, 100, 100, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default SafeAreaSimulator;
