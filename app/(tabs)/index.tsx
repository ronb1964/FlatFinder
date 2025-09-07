import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H1, H2, Card, useTheme, View } from 'tamagui';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Target, Settings, Zap, AlertTriangle } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { useDeviceAttitude } from '../../src/hooks/useDeviceAttitude';
import { BubbleLevel } from '../../src/components/BubbleLevel';
import { LevelingAssistant } from '../../src/components/LevelingAssistant';

import { useAppStore } from '../../src/state/appStore';
import {
  applyCalibration,
  calculateCalibrationOffsets,
  getLevelStatus,
} from '../../src/lib/calibration';

export default function LevelScreen() {
  // Use keep awake only on native platforms to avoid web errors
  if (Platform.OS !== 'web') {
    useKeepAwake();
  }
  
  const theme = useTheme();
  
  const { pitchDeg, rollDeg, isAvailable, isReliable, permissionStatus, errorMessage } = useDeviceAttitude();
  const { activeProfile, settings, calibrateActiveProfile, loadProfiles, loadSettings } = useAppStore();
  
  const [calibratedValues, setCalibratedValues] = useState({ pitch: 0, roll: 0 });
  const [levelStatus, setLevelStatus] = useState(getLevelStatus({ pitch: 0, roll: 0 }));
  const [lastHapticLevel, setLastHapticLevel] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showLevelingAssistant, setShowLevelingAssistant] = useState(false);
  const [safetyWarningDismissed, setSafetyWarningDismissed] = useState(false);
  
  const requestSensorPermission = async () => {
    // This will trigger the iOS permission dialog
    if (typeof window !== 'undefined' && (window as any).DeviceOrientationEvent) {
      const DeviceOrientationEvent = (window as any).DeviceOrientationEvent;
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          await DeviceOrientationEvent.requestPermission();
          // Force re-initialization of sensors
          window.location.reload();
        } catch (error) {
          console.error('Permission request failed:', error);
        }
      }
    }
  };

  // Load settings and profiles on app startup
  useEffect(() => {
    const initializeApp = async () => {
      await loadSettings();
      await loadProfiles();
    };
    initializeApp();
  }, [loadSettings, loadProfiles]);

  // Apply calibration and check safety
  useEffect(() => {
    const offsets = activeProfile?.calibration || { pitchOffsetDegrees: 0, rollOffsetDegrees: 0 };
    const calibrated = applyCalibration({ pitch: pitchDeg, roll: rollDeg }, offsets);
    setCalibratedValues(calibrated);
    
    const status = getLevelStatus(calibrated);
    setLevelStatus(status);

    // Check if slope is unsafe (> 8 degrees in either direction)
    const maxAngle = Math.max(Math.abs(calibrated.pitch), Math.abs(calibrated.roll));
    const isUnsafe = maxAngle > 8.0;
    
    // Reset safety warning dismissal if we're back to safe angles
    if (!isUnsafe && safetyWarningDismissed) {
      setSafetyWarningDismissed(false);
    }

    // Haptic feedback when crossing level threshold
    if (settings.hapticsEnabled) {
      if (status.isLevel && !lastHapticLevel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!status.isLevel && lastHapticLevel) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLastHapticLevel(status.isLevel);
    }
  }, [pitchDeg, rollDeg, activeProfile, settings.hapticsEnabled, lastHapticLevel, safetyWarningDismissed]);

  const handleCalibrate = () => {
    router.push('/calibration');
  };

  const handleShowLevelingAssistant = () => {
    setShowLevelingAssistant(true);
  };

  const handleQuickCalibrate = () => {
    setIsCalibrating(true);
    
    // Haptic feedback for calibration
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Calculate and save calibration offsets
    const offsets = calculateCalibrationOffsets({ pitch: pitchDeg, roll: rollDeg });
    calibrateActiveProfile(offsets);
    
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

  // Calculate if current slope is unsafe
  const maxAngle = Math.max(Math.abs(calibratedValues.pitch), Math.abs(calibratedValues.roll));
  const isUnsafe = maxAngle > 8.0;
  const showSafetyWarning = isUnsafe && !safetyWarningDismissed;
  


  // If leveling assistant is open, show only that
  if (showLevelingAssistant) {
    return (
      <LevelingAssistant onBack={() => setShowLevelingAssistant(false)} />
    );
  }

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: theme.background?.val || '#000'
    }}>
      <YStack 
        flex={1} 
        padding="$4" 
      >
        {/* Safety Warning - Overlay */}
        {showSafetyWarning && (
          <Card
            position="absolute"
            top="$4"
            left="$4"
            right="$4"
            zIndex={1000}
            backgroundColor="rgba(239, 68, 68, 0.95)"
            borderColor="rgba(239, 68, 68, 0.8)"
            borderWidth={2}
            borderRadius="$4"
            padding="$2"
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.3}
            shadowRadius={4}
            pressStyle={{ scale: 0.98 }}
            onPress={() => setSafetyWarningDismissed(true)}
          >
            <XStack space="$2" alignItems="center">
              <AlertTriangle size={20} color="#ffffff" />
              <YStack flex={1}>
                <Text color="#ffffff" fontWeight="700" fontSize="$4">
                  ⚠️ Safety Warning
                </Text>
                <Text color="#ffffff" fontSize="$3">
                  Slope may be unsafe for leveling. Consider finding a flatter spot.
                </Text>
                <Text color="rgba(255, 255, 255, 0.8)" fontSize="$2" marginTop="$1">
                  Tap to acknowledge
                </Text>
              </YStack>
            </XStack>
          </Card>
        )}

        {/* Header */}
        <YStack alignItems="center">
          <H1 
            color={levelStatus.color} 
            fontSize="$9" 
            fontWeight="bold"
            paddingBottom="$6"
          >
            {levelStatus.description}
          </H1>

        </YStack>

        {/* Bubble Level */}
        <YStack 
          flex={0.7} 
          justifyContent="center" 
          alignItems="center" 
          paddingVertical="$2"
          marginTop="$3"
        >
          <BubbleLevel
            pitch={calibratedValues.pitch}
            roll={calibratedValues.roll}
            isLevel={levelStatus.isLevel}
            color={levelStatus.color}
          />
        </YStack>

        {/* Numeric Display */}
        <Card 
          padding="$2" 
          backgroundColor={levelStatus.isLevel ? '$green2' : '$background'}
          borderColor={levelStatus.color}
          borderWidth={2}
          marginHorizontal="$2"
          marginTop="$10"
        >
          <XStack justifyContent="space-around">
            <YStack alignItems="center" space="$1">
              <Text color="$colorPress" fontSize="$3">
                Pitch
              </Text>
              <Text 
                fontSize="$6" 
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
                fontSize="$6" 
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

        {/* Sensor Permission Button for iOS */}
        {permissionStatus === 'denied' || (!isReliable && errorMessage.includes('sensor')) ? (
          <Button
            size="$4"
            backgroundColor="$red9"
            pressStyle={{ scale: 0.95 }}
            onPress={requestSensorPermission}
            icon={Target}
            marginHorizontal="$2"
            marginTop="$6"
          >
            Enable Motion Sensors
          </Button>
        ) : null}

        {/* Action Buttons */}
        <YStack space="$2" paddingTop="$1" marginHorizontal="$1" marginTop="$6">
          <XStack space="$3">
            <Button
              flex={1}
              size="$5"
              height="$5"
              backgroundColor={isCalibrating ? '$green9' : '$gray9'}
              pressStyle={{ scale: 0.96 }}
              onPress={handleQuickCalibrate}
              disabled={isCalibrating || !isReliable}
              icon={isCalibrating ? RefreshCw : Target}
              fontSize="$3"
            >
              {isCalibrating ? 'Calibrating...' : 'Quick Set'}
            </Button>
            
            <Button
              flex={1}
              size="$5"
              height="$5"
              backgroundColor="$blue9"
              pressStyle={{ scale: 0.96 }}
              onPress={handleCalibrate}
              icon={Settings}
              fontSize="$3"
            >
              Calibration
            </Button>
          </XStack>
          
          <Button
            size="$5"
            height="$6"
            backgroundColor="$orange9"
            pressStyle={{ scale: 0.96 }}
            onPress={handleShowLevelingAssistant}
            icon={Zap}
            fontSize="$4"
          >
            Leveling Assistant
          </Button>
        </YStack>

        {/* Active Profile Indicator */}
        {activeProfile ? (
          <Card padding="$3" backgroundColor="$green2" borderColor="$green9" borderWidth={1} marginHorizontal="$2" marginTop="$4">
            <XStack justifyContent="center" alignItems="center" space="$2">
              <YStack width={8} height={8} borderRadius={4} backgroundColor="$green9" />
              <Text color="$green11" fontSize="$3" fontWeight="600">
                Active Vehicle:
              </Text>
              <Text fontWeight="bold" fontSize="$3" color="$green11">
                {activeProfile.name}
              </Text>
            </XStack>
          </Card>
        ) : (
          <Card padding="$3" backgroundColor="$red2" borderColor="$red9" borderWidth={1} marginHorizontal="$2" marginTop="$4">
            <XStack justifyContent="center" alignItems="center" space="$2">
              <YStack width={8} height={8} borderRadius={4} backgroundColor="$red9" />
              <Text color="$red11" fontSize="$3" fontWeight="600">
                No Vehicle Selected - Go to Profiles
              </Text>
            </XStack>
          </Card>
        )}
      </YStack>
    </SafeAreaView>
  );
}