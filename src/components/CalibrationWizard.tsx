import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, H2, Progress, styled, View } from 'tamagui';
import { Target, RotateCw, Check } from '@tamagui/lucide-icons';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { BubbleLevel } from './BubbleLevel';
import {
  CalibrationReading,
  createCalibrationReading,
  calculateAverageCalibration,
} from '../lib/calibration';
import { Calibration } from '../lib/levelingMath';
import { THEME } from '../theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface CalibrationWizardProps {
  onComplete: (calibration: Calibration) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const Container = styled(View, {
  flex: 1,
  backgroundColor: '#1b263b', // Medium slate blue to match new theme
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const GlassCard = styled(View, {
  backgroundColor: 'rgba(14, 165, 233, 0.08)', // Teal/cyan tint
  borderRadius: 24,
  padding: 24,
  width: '100%',
  maxWidth: 400,
  borderWidth: 1,
  borderColor: 'rgba(14, 165, 233, 0.3)', // Cyan border
  shadowColor: '#0ea5e9', // Sky blue shadow
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
});

const CALIBRATION_STEPS = [
  {
    title: 'Position Device',
    instruction: 'Place phone flat, TOP pointing FRONT.',
    icon: Target,
    rotation: 0,
  },
  {
    title: 'First Reading',
    instruction: 'Keep still. Tap to capture.',
    icon: RotateCw,
    rotation: 0,
  },
  {
    title: 'Rotate 90°',
    instruction: 'Turn phone 90° CLOCKWISE.',
    icon: RotateCw,
    rotation: -90, // Rotate UI counter-clockwise to match phone rotation
  },
  {
    title: 'Final Reading',
    instruction: 'Turn another 90°. Capture.',
    icon: Check,
    rotation: -180,
  },
];

export function CalibrationWizard({ onComplete, onCancel, isVisible }: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readings, setReadings] = useState<CalibrationReading[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { pitchDeg, rollDeg, isReliable } = useDeviceAttitude();

  // Animation values
  const uiRotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 500 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      // Reset state after animation
      globalThis.setTimeout(() => {
        setCurrentStep(0);
        setReadings([]);
        setIsCollecting(false);
        setHasStarted(false);
        uiRotation.value = 0;
      }, 300);
    }
  }, [isVisible, opacity, uiRotation]);

  // Update rotation based on step
  useEffect(() => {
    const targetRotation = CALIBRATION_STEPS[currentStep]?.rotation || 0;
    uiRotation.value = withSpring(targetRotation * (Math.PI / 180), {
      damping: 15,
      stiffness: 90,
    });
  }, [currentStep, uiRotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${uiRotation.value} rad` }],
      opacity: opacity.value,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  const handleStart = () => {
    setHasStarted(true);
    setCurrentStep(1);
  };

  const takeReading = () => {
    if (!isReliable) return;

    setIsCollecting(true);

    globalThis.setTimeout(() => {
      const newReading = createCalibrationReading(pitchDeg, rollDeg);
      const updatedReadings = [...readings, newReading];
      setReadings(updatedReadings);
      setIsCollecting(false);

      if (updatedReadings.length >= 3) {
        const calibration = calculateAverageCalibration(updatedReadings);
        onComplete(calibration);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }, 1000);
  };

  const currentStepData = CALIBRATION_STEPS[currentStep];
  const Icon = currentStepData.icon;
  const progress = ((currentStep + 1) / CALIBRATION_STEPS.length) * 100;

  if (!isVisible && opacity.value === 0) return null;

  return (
    <Container>
      <Animated.View style={animatedStyle}>
        <GlassCard>
          {/* Header */}
          <YStack space="$4" alignItems="center">
            <View
              backgroundColor="rgba(0, 243, 255, 0.1)"
              padding="$3"
              borderRadius="$full"
              borderWidth={1}
              borderColor={THEME.colors.primary}
            >
              <Icon size={32} color={THEME.colors.primary} />
            </View>

            <YStack alignItems="center" space="$2">
              <H2 color="white" fontSize="$7" fontWeight="bold" textAlign="center">
                {currentStepData.title}
              </H2>
              <Text color={THEME.colors.textSecondary} textAlign="center" fontSize="$5">
                {currentStepData.instruction}
              </Text>
            </YStack>

            {/* Live Bubble Level */}
            <View marginVertical="$4">
              <BubbleLevel
                pitch={pitchDeg}
                roll={rollDeg}
                isLevel={Math.abs(pitchDeg) < 0.5 && Math.abs(rollDeg) < 0.5}
                color={THEME.colors.primary}
                size="compact"
              />
            </View>

            {/* Progress */}
            <YStack width="100%" space="$2">
              <XStack justifyContent="space-between">
                <Text color={THEME.colors.textMuted} fontSize="$2">
                  Step {currentStep + 1}/4
                </Text>
                <Text color={THEME.colors.primary} fontSize="$2">
                  {Math.round(progress)}%
                </Text>
              </XStack>
              <Progress value={progress} backgroundColor="rgba(255,255,255,0.1)" height={4}>
                <Progress.Indicator backgroundColor={THEME.colors.primary} />
              </Progress>
            </YStack>

            {/* Action Button */}
            <Button
              size="$5"
              backgroundColor={
                !isReliable || isCollecting ? 'rgba(255,255,255,0.1)' : THEME.colors.primary
              }
              color={!isReliable || isCollecting ? 'rgba(255,255,255,0.3)' : '#000'}
              fontWeight="bold"
              onPress={!hasStarted ? handleStart : takeReading}
              disabled={!isReliable || isCollecting}
              pressStyle={{ opacity: 0.8, scale: 0.98 }}
              width="100%"
              marginTop="$2"
            >
              {isCollecting
                ? 'Calibrating...'
                : !hasStarted
                  ? 'Start Calibration'
                  : 'Capture Reading'}
            </Button>

            <Button
              size="$3"
              chromeless
              color={THEME.colors.textMuted}
              onPress={onCancel}
              marginTop="$2"
            >
              Cancel
            </Button>
          </YStack>
        </GlassCard>
      </Animated.View>
    </Container>
  );
}
