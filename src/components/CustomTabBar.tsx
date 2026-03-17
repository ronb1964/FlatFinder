import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Car, Settings } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../state/appStore';

// Simple bubble level icon component
function BubbleLevelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Outer circle (the level) */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
      {/* Inner circle (the bubble) */}
      <Circle cx="12" cy="12" r="4" fill={color} />
    </Svg>
  );
}

// Tab width calculation
const TAB_COUNT = 3;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const [tabBarWidth, setTabBarWidth] = React.useState(0);
  const tabWidth = tabBarWidth / TAB_COUNT;
  const setShowLevelingAssistant = useAppStore((s) => s.setShowLevelingAssistant);

  // Animated value for pill position
  const pillPosition = useSharedValue(state.index * tabWidth);

  // Update pill position when tab changes
  // Faster animation with subtle bounce effect
  useEffect(() => {
    pillPosition.value = withSpring(state.index * tabWidth, {
      damping: 12, // Lower = more bounce
      stiffness: 400, // Higher = faster
      mass: 0.4, // Lower = more responsive
    });
  }, [state.index, tabWidth, pillPosition]);

  // Animated style for the sliding pill
  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillPosition.value }],
  }));

  // Get icon for each tab
  const getTabIcon = (routeName: string, color: string, size: number) => {
    switch (routeName) {
      case 'index':
        return <BubbleLevelIcon size={size} color={color} />;
      case 'profiles':
        return <Car size={size} color={color} />;
      case 'settings':
        return <Settings size={size} color={color} />;
      default:
        return null;
    }
  };

  // Get label for each tab
  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'profiles':
        return 'Profiles';
      case 'settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  // Theme-aware colors
  const colors = {
    background: isDark
      ? Platform.OS === 'web'
        ? 'rgba(17, 17, 23, 0.95)'
        : 'rgba(10, 10, 15, 0.85)'
      : Platform.OS === 'web'
        ? 'rgba(200, 212, 228, 0.95)' // Blue-gray for web
        : 'rgba(200, 212, 228, 0.9)', // Blue-gray for native
    borderTop: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)',
    pillBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
    pillBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)',
    active: isDark ? '#ffffff' : '#1a1a1a',
    inactive: theme.colors.textMuted,
  };

  return (
    <View style={styles.container} onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}>
      {/* Background blur for native */}
      {Platform.OS !== 'web' && (
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}

      {/* Background overlay */}
      <View
        style={[
          styles.background,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderTop,
          },
        ]}
      />

      {/* Sliding pill indicator */}
      {tabWidth > 0 && (
        <Animated.View style={[styles.pillContainer, pillAnimatedStyle]}>
          <View
            style={[
              styles.pill,
              {
                width: tabWidth - 16,
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            // If clicking Home tab, always reset the leveling assistant view
            if (route.name === 'index') {
              setShowLevelingAssistant(false);
            }

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? colors.active : colors.inactive;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as Record<string, unknown>).tabBarTestID as string}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              {getTabIcon(route.name, color, 24)}
              <Text style={[styles.label, { color }]}>{getTabLabel(route.name)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Layout calculations:
// Container height: 70px total
// Safe area padding at bottom: 8px
// Usable height: 62px
// Pill height: 50px (thinner/cleaner look)
// Top margin: (62 - 50) / 2 = 6px
// Pill occupies: 6px to 56px (top to bottom within usable area)

const CONTAINER_HEIGHT = 70;
const SAFE_AREA_BOTTOM = 8;
const USABLE_HEIGHT = CONTAINER_HEIGHT - SAFE_AREA_BOTTOM; // 62px
const PILL_HEIGHT = 50;
const PILL_TOP = (USABLE_HEIGHT - PILL_HEIGHT) / 2; // 6px

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CONTAINER_HEIGHT,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
  },
  pillContainer: {
    position: 'absolute',
    top: PILL_TOP,
    left: 8,
    height: PILL_HEIGHT,
    justifyContent: 'center',
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabsContainer: {
    position: 'absolute',
    top: PILL_TOP,
    left: 0,
    right: 0,
    height: PILL_HEIGHT,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
