import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  trackColor?: string;
  thumbColor?: string;
}

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 24;

export function GlassSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  disabled = false,
  trackColor = '#22c55e',
}: GlassSliderProps) {
  const [trackWidth, setTrackWidth] = React.useState(0);

  // Calculate position from value
  const valueToPosition = (val: number) => {
    const range = maximumValue - minimumValue;
    const normalizedValue = (val - minimumValue) / range;
    return normalizedValue * (trackWidth - THUMB_SIZE);
  };

  // Calculate value from position
  const positionToValue = (pos: number) => {
    const range = maximumValue - minimumValue;
    const normalizedPosition = pos / (trackWidth - THUMB_SIZE);
    let newValue = minimumValue + normalizedPosition * range;

    // Apply step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }

    // Clamp to range
    return Math.max(minimumValue, Math.min(maximumValue, newValue));
  };

  const thumbPosition = useSharedValue(valueToPosition(value));
  const startPosition = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Update thumb position when value changes externally
  React.useEffect(() => {
    if (!isDragging.value && trackWidth > 0) {
      thumbPosition.value = withSpring(valueToPosition(value), {
        damping: 20,
        stiffness: 150,
      });
    }
  }, [value, trackWidth]);

  const updateValue = (pos: number) => {
    const newValue = positionToValue(pos);
    onValueChange(newValue);
  };

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      isDragging.value = true;
      startPosition.value = thumbPosition.value;
    })
    .onUpdate((event) => {
      // Use startPosition + translationX for smooth dragging
      const newPosition = Math.max(
        0,
        Math.min(trackWidth - THUMB_SIZE, startPosition.value + event.translationX)
      );
      thumbPosition.value = newPosition;
      // Update value continuously while dragging for responsive feel
      runOnJS(updateValue)(newPosition);
    })
    .onEnd(() => {
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((event) => {
      const newPosition = Math.max(0, Math.min(trackWidth - THUMB_SIZE, event.x - THUMB_SIZE / 2));
      thumbPosition.value = withSpring(newPosition, { damping: 20, stiffness: 150 });
      runOnJS(updateValue)(newPosition);
    });

  const composedGesture = Gesture.Simultaneous(gesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbPosition.value + THUMB_SIZE / 2,
  }));

  const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    thumbPosition.value = valueToPosition(value);
  };

  const trackContent = (
    <View style={styles.trackContainer} onLayout={handleLayout}>
      {/* Background track */}
      <View style={styles.track}>
        {/* Filled portion with glassy effect */}
        <Animated.View style={[styles.trackFill, fillStyle]}>
          <LinearGradient
            colors={[`${trackColor}`, `${trackColor}cc`, `${trackColor}`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.trackFillGradient}
          />
          {/* Top highlight for glass effect */}
          <View style={styles.trackHighlight} />
        </Animated.View>
      </View>

      {/* Thumb */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.thumbContainer, thumbStyle]}>
          <View style={[styles.thumbGlow, { shadowColor: trackColor }]} />
          <LinearGradient
            colors={['rgba(200, 200, 200, 1)', 'rgba(150, 150, 150, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.thumb}
          >
            <View style={styles.thumbHighlight} />
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </View>
  );

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, disabled && styles.disabled]}>
        <View style={styles.webBackground}>{trackContent}</View>
      </View>
    );
  }

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <BlurView intensity={20} tint="dark" style={styles.blur}>
        {trackContent}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  blur: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  webBackground: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  trackContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: TRACK_HEIGHT,
    marginHorizontal: THUMB_SIZE / 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT,
    overflow: 'hidden',
  },
  trackFillGradient: {
    flex: 1,
    borderRadius: TRACK_HEIGHT,
  },
  trackHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  thumbContainer: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbGlow: {
    position: 'absolute',
    width: THUMB_SIZE + 8,
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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

export default GlassSlider;
