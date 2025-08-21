import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H1, H2, Card, useTheme } from 'tamagui';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Target } from '@tamagui/lucide-icons';

import { useDeviceAttitude } from '../../src/hooks/useDeviceAttitude';
import { BubbleLevel } from '../../src/components/BubbleLevel';
import { useAppStore } from '../../src/state/appStore';
import {
  applyCalibration,
  calculateCalibrationOffsets,
  getLevelStatus,
} from '../../src/lib/calibration';

export default function LevelScreen() {
  useKeepAwake();
  const theme = useTheme();
  
  const { pitchDeg, rollDeg, isAvailable, isReliable } = useDeviceAttitude();
  const { activeProfile, settings, calibrateActiveProfile } = useAppStore();
  
  const [calibratedValues, setCalibratedValues] = useState({ pitch: 0, roll: 0 });
  const [levelStatus, setLevelStatus] = useState(getLevelStatus({ pitch: 0, roll: 0 }));
  const [lastHapticLevel, setLastHapticLevel] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Apply calibration
  useEffect(() => {
    const offsets = activeProfile?.calibration || { pitch: 0, roll: 0 };
    const calibrated = applyCalibration({ pitch: pitchDeg, roll: rollDeg }, offsets);
    setCalibratedValues(calibrated);
    
    const status = getLevelStatus(calibrated);
    setLevelStatus(status);

    // Haptic feedback when crossing level threshold
    if (settings.hapticsEnabled) {
      if (status.isLevel && !lastHapticLevel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!status.isLevel && lastHapticLevel) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLastHapticLevel(status.isLevel);
    }
  }, [pitchDeg, rollDeg, activeProfile, settings.hapticsEnabled, lastHapticLevel]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    
    // Haptic feedback for calibration
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Calculate and save calibration offsets
    const offsets = calculateCalibrationOffsets({ pitch: pitchDeg, roll: rollDeg });
    calibrateActiveProfile({ pitch: offsets.pitchOffsetDegrees, roll: offsets.rollOffsetDegrees });
    
    setTimeout(() => {
      setIsCalibrating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);
  };

  if (isAvailable === false) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <H2 color="$color">Device sensors not available</H2>
          <Text color="$colorPress">
            This device doesn't support motion sensors required for leveling.
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  if (isAvailable === null) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text>Checking sensor availability...</Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val || '#000' }}>
      <YStack flex={1} padding="$4" space="$4">
        {/* Header */}
        <YStack alignItems="center" space="$2">
          <H1 
            color={levelStatus.color} 
            fontSize="$9" 
            fontWeight="bold"
          >
            {levelStatus.description}
          </H1>
          {!isReliable && (
            <Text color="$yellow10" fontSize="$3">
              ⚠️ Sensor reading may be unreliable
            </Text>
          )}
        </YStack>

        {/* Bubble Level */}
        <YStack flex={1} justifyContent="center" alignItems="center">
          <BubbleLevel
            pitch={calibratedValues.pitch}
            roll={calibratedValues.roll}
            isLevel={levelStatus.isLevel}
            color={levelStatus.color}
          />
        </YStack>

        {/* Numeric Display */}
        <Card 
          padding="$4" 
          backgroundColor={levelStatus.isLevel ? '$green2' : '$background'}
          borderColor={levelStatus.color}
          borderWidth={2}
        >
          <XStack justifyContent="space-around">
            <YStack alignItems="center" space="$1">
              <Text color="$colorPress" fontSize="$3">
                Pitch
              </Text>
              <Text 
                fontSize="$8" 
                fontWeight="bold" 
                color={levelStatus.color}
              >
                {calibratedValues.pitch >= 0 ? '+' : ''}{calibratedValues.pitch.toFixed(1)}°
              </Text>
              <Text color="$colorPress" fontSize="$2">
                {calibratedValues.pitch > 0 ? 'Nose Up' : calibratedValues.pitch < 0 ? 'Nose Down' : 'Level'}
              </Text>
            </YStack>

            <YStack alignItems="center" space="$1">
              <Text color="$colorPress" fontSize="$3">
                Roll
              </Text>
              <Text 
                fontSize="$8" 
                fontWeight="bold" 
                color={levelStatus.color}
              >
                {calibratedValues.roll >= 0 ? '+' : ''}{calibratedValues.roll.toFixed(1)}°
              </Text>
              <Text color="$colorPress" fontSize="$2">
                {calibratedValues.roll > 0 ? 'Right High' : calibratedValues.roll < 0 ? 'Left High' : 'Level'}
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Calibration Button */}
        <Button
          size="$5"
          backgroundColor={isCalibrating ? '$green9' : '$blue9'}
          pressStyle={{ scale: 0.95 }}
          onPress={handleCalibrate}
          disabled={isCalibrating}
          icon={isCalibrating ? RefreshCw : Target}
        >
          {isCalibrating ? 'Calibrating...' : 'Set as Level'}
        </Button>

        {/* Active Profile Indicator */}
        {activeProfile && (
          <Card padding="$2" backgroundColor="$gray2">
            <XStack justifyContent="center" alignItems="center" space="$2">
              <Text color="$colorPress" fontSize="$2">
                Profile:
              </Text>
              <Text fontWeight="bold" fontSize="$2">
                {activeProfile.name}
              </Text>
            </XStack>
          </Card>
        )}
      </YStack>
    </SafeAreaView>
  );
}