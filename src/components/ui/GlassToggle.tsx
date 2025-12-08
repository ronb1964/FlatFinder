import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface GlassToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_MARGIN = 3;

export function GlassToggle({ value, onValueChange, disabled = false }: GlassToggleProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: progress.value * (TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2),
        },
      ],
    };
  });

  const thumbGlowStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0)', 'rgba(59, 130, 246, 0.6)']
    );
    return {
      shadowColor: glowColor,
      backgroundColor: interpolateColor(progress.value, [0, 1], ['#a3a3a3', '#3b82f6']),
    };
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  // Theme-aware track colors
  const trackColors = {
    bgOn: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    bgOff: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderOn: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.4)',
    borderOff: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
    highlightOn: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
    highlightOff: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
  };

  const trackContent = (
    <View
      style={[
        styles.trackInner,
        {
          backgroundColor: value ? trackColors.bgOn : trackColors.bgOff,
          borderColor: value ? trackColors.borderOn : trackColors.borderOff,
        },
      ]}
    >
      {/* Track highlight */}
      <View
        style={[
          styles.trackHighlight,
          {
            backgroundColor: value ? trackColors.highlightOn : trackColors.highlightOff,
          },
        ]}
      />

      {/* Thumb */}
      <Animated.View style={[styles.thumb, thumbStyle, thumbGlowStyle]}>
        <LinearGradient
          colors={
            value
              ? ['rgba(255, 255, 255, 1)', 'rgba(220, 220, 220, 1)']
              : ['rgba(200, 200, 200, 1)', 'rgba(170, 170, 170, 1)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.thumbGradient}
        >
          {/* Thumb inner highlight */}
          <View style={styles.thumbHighlight} />
        </LinearGradient>
      </Animated.View>
    </View>
  );

  // Web fallback - BlurView doesn't work well on web
  if (Platform.OS === 'web') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[styles.container, disabled && styles.disabled]}
      >
        <View
          style={[
            styles.webTrack,
            { backgroundColor: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(200, 212, 228, 0.9)' },
          ]}
        >
          {trackContent}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        {trackContent}
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  blur: {
    flex: 1,
    borderRadius: TRACK_HEIGHT / 2,
  },
  webTrack: {
    flex: 1,
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackInner: {
    flex: 1,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: THUMB_MARGIN,
  },
  trackHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopLeftRadius: TRACK_HEIGHT / 2,
    borderTopRightRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbGradient: {
    flex: 1,
    borderRadius: THUMB_SIZE / 2,
    overflow: 'hidden',
  },
  thumbHighlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default GlassToggle;
