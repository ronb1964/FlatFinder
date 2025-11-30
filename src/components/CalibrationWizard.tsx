import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Target, RotateCw, Check } from 'lucide-react-native';
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
    rotation: -90,
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
      globalThis.setTimeout(() => {
        setCurrentStep(0);
        setReadings([]);
        setIsCollecting(false);
        setHasStarted(false);
        uiRotation.value = 0;
      }, 300);
    }
  }, [isVisible, opacity, uiRotation]);

  useEffect(() => {
    const targetRotation = CALIBRATION_STEPS[currentStep]?.rotation || 0;
    uiRotation.value = withSpring(targetRotation * (Math.PI / 180), {
      damping: 15,
      stiffness: 90,
    });
  }, [currentStep, uiRotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${uiRotation.value}rad` }],
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
    <View className="flex-1 bg-[#1b263b] justify-center items-center p-5">
      <Animated.View style={animatedStyle}>
        <View
          className="rounded-3xl p-6 w-full max-w-[400px] border"
          style={{
            backgroundColor: 'rgba(14, 165, 233, 0.08)',
            borderColor: 'rgba(14, 165, 233, 0.3)',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }}
        >
          {/* Header */}
          <View className="items-center gap-4">
            <View
              className="p-3 rounded-full border"
              style={{
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                borderColor: THEME.colors.primary,
              }}
            >
              <Icon size={32} color={THEME.colors.primary} />
            </View>

            <View className="items-center gap-2">
              <Text className="text-white text-2xl font-bold text-center">
                {currentStepData.title}
              </Text>
              <Text
                className="text-center text-lg"
                style={{ color: THEME.colors.textSecondary }}
              >
                {currentStepData.instruction}
              </Text>
            </View>

            {/* Live Bubble Level */}
            <View className="my-4">
              <BubbleLevel
                pitch={pitchDeg}
                roll={rollDeg}
                isLevel={Math.abs(pitchDeg) < 0.5 && Math.abs(rollDeg) < 0.5}
                color={THEME.colors.primary}
                size="compact"
              />
            </View>

            {/* Progress */}
            <View className="w-full gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs" style={{ color: THEME.colors.textMuted }}>
                  Step {currentStep + 1}/4
                </Text>
                <Text className="text-xs" style={{ color: THEME.colors.primary }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-1 rounded-full bg-white/10">
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: THEME.colors.primary,
                    width: `${progress}%`,
                  }}
                />
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              className="w-full py-4 rounded-xl mt-2 items-center"
              style={{
                backgroundColor:
                  !isReliable || isCollecting ? 'rgba(255,255,255,0.1)' : THEME.colors.primary,
              }}
              onPress={!hasStarted ? handleStart : takeReading}
              disabled={!isReliable || isCollecting}
            >
              <Text
                className="font-bold text-lg"
                style={{
                  color: !isReliable || isCollecting ? 'rgba(255,255,255,0.3)' : '#000',
                }}
              >
                {isCollecting
                  ? 'Calibrating...'
                  : !hasStarted
                    ? 'Start Calibration'
                    : 'Capture Reading'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="mt-2 py-2" onPress={onCancel}>
              <Text style={{ color: THEME.colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
