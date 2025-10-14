import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H1, H2, Card, useTheme, View } from 'tamagui';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Target, Settings, Zap, AlertTriangle, Volume2, VolumeX } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { useDeviceAttitude } from '../../src/hooks/useDeviceAttitude';
import { useAudioFeedback } from '../../src/hooks/useAudioFeedback';
import { BubbleLevel } from '../../src/components/BubbleLevel';
import { LevelingAssistant } from '../../src/components/LevelingAssistant';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientButton } from '../../src/components/GradientButton';
import { LevelScreenGradient } from '../../src/components/GradientBackground';
import {
  ScrollContainer,
  ResponsiveContainer,
  ScalableText,
  ScalableH1,
  StickyActionButtons,
} from '../../src/components/responsive';

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
  const { activeProfile, settings, calibrateActiveProfile, loadProfiles, loadSettings, updateSettings } = useAppStore();
  
  const [calibratedValues, setCalibratedValues] = useState({ pitch: 0, roll: 0 });
  const [levelStatus, setLevelStatus] = useState(getLevelStatus({ pitch: 0, roll: 0 }));
  const [lastHapticLevel, setLastHapticLevel] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showLevelingAssistant, setShowLevelingAssistant] = useState(false);
  const [safetyWarningDismissed, setSafetyWarningDismissed] = useState(false);

  // Audio feedback for hands-free leveling
  useAudioFeedback({
    pitch: calibratedValues.pitch,
    roll: calibratedValues.roll,
    isLevel: levelStatus.isLevel,
    settings,
  });

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

    // Collect multiple readings to average out sensor noise
    const readings = [];
    readings.push({ pitch: pitchDeg, roll: rollDeg });

    // Take 4 more readings over 400ms (100ms intervals)
    let sampleCount = 0;
    const sampleInterval = setInterval(() => {
      readings.push({ pitch: pitchDeg, roll: rollDeg });
      sampleCount++;

      if (sampleCount >= 4) {
        clearInterval(sampleInterval);

        // Calculate average of all readings
        const avgPitch = readings.reduce((sum, r) => sum + r.pitch, 0) / readings.length;
        const avgRoll = readings.reduce((sum, r) => sum + r.roll, 0) / readings.length;

        // Calculate and save calibration offsets using averaged values
        const offsets = calculateCalibrationOffsets({ pitch: avgPitch, roll: avgRoll });
        calibrateActiveProfile(offsets);

        setTimeout(() => {
          setIsCalibrating(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
      }
    }, 100);
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
    <LevelScreenGradient>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1}>
          {/* Floating Audio Toggle Button */}
          <GlassCard
            position="absolute"
            top="$3"
            right="$3"
            zIndex={999}
            padding="$2"
            backgroundColor={settings.audioEnabled ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)"}
            borderColor={settings.audioEnabled ? "rgba(59, 130, 246, 0.4)" : "rgba(239, 68, 68, 0.4)"}
            borderWidth={2}
            borderRadius="$10"
            pressStyle={{ scale: 0.95, opacity: 0.8 }}
            onPress={() => updateSettings({ audioEnabled: !settings.audioEnabled })}
            blurIntensity={12}
          >
            {settings.audioEnabled ? (
              <Volume2 size={20} color="#3b82f6" />
            ) : (
              <VolumeX size={20} color="#ef4444" />
            )}
          </GlassCard>

          <ScrollContainer flex={1} showFadeIndicator={true}>
            <ResponsiveContainer maxWidth="lg">
              <YStack
                space="$4"
                paddingVertical="$4"
                $md={{ space: '$5', paddingVertical: '$6' }}
              >
          {/* Safety Warning - Overlay with Glass Effect */}
          {showSafetyWarning && (
            <GlassCard
              position="absolute"
              top="$4"
              left="$4"
              right="$4"
              zIndex={1000}
              backgroundColor="rgba(239, 68, 68, 0.9)"
              borderColor="rgba(255, 255, 255, 0.3)"
              borderWidth={2}
              borderRadius="$6"
              padding="$3"
              shadowColor="rgba(239, 68, 68, 0.5)"
              shadowOffset={{ width: 0, height: 8 }}
              shadowOpacity={0.4}
              shadowRadius={16}
              pressStyle={{ scale: 0.98 }}
              onPress={() => setSafetyWarningDismissed(true)}
              blurIntensity={15}
            >
              <XStack space="$2" alignItems="center">
                <AlertTriangle size={24} color="#ffffff" />
                <YStack flex={1}>
                  <Text color="#ffffff" fontWeight="700" fontSize="$5">
                    ⚠️ Safety Warning
                  </Text>
                  <Text color="#ffffff" fontSize="$3" marginTop="$1">
                    Slope may be unsafe for leveling. Consider finding a flatter spot.
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.9)" fontSize="$2" marginTop="$2" fontWeight="600">
                    Tap to acknowledge
                  </Text>
                </YStack>
              </XStack>
            </GlassCard>
          )}

        {/* Header */}
        <YStack alignItems="center">
          <ScalableH1
            base="$9"
            md="$10"
            lg="$11"
            color={levelStatus.color}
            fontWeight="bold"
            paddingBottom="$6"
          >
            {levelStatus.description}
          </ScalableH1>
        </YStack>

        {/* Bubble Level */}
        <YStack
          justifyContent="center"
          alignItems="center"
          paddingVertical="$4"
          marginTop="$3"
          $md={{
            paddingVertical: '$6',
            marginTop: '$4',
          }}
        >
          <BubbleLevel
            pitch={calibratedValues.pitch}
            roll={calibratedValues.roll}
            isLevel={levelStatus.isLevel}
            color={levelStatus.color}
          />
        </YStack>

        {/* Numeric Display */}
        <GlassCard
          padding="$4"
          backgroundColor={levelStatus.isLevel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
          borderColor={levelStatus.isLevel ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.2)'}
          borderWidth={2}
          marginHorizontal="$2"
          marginTop={70}
          borderRadius="$6"
          blurIntensity={12}
          shadowColor={levelStatus.isLevel ? '#10b981' : 'rgba(0, 0, 0, 0.3)'}
          shadowOffset={{ width: 0, height: 8 }}
          shadowOpacity={0.3}
          shadowRadius={16}
        >
          <XStack justifyContent="space-around">
            <YStack alignItems="center" space="$2">
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="$3" fontWeight="600">
                Pitch
              </Text>
              <Text
                fontSize="$8"
                fontWeight="bold"
                color={levelStatus.isLevel ? '#22c55e' : '#ffffff'}
              >
                {calibratedValues.pitch >= 0 ? '+' : ''}{calibratedValues.pitch.toFixed(1)}°
              </Text>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="$3">
                {calibratedValues.pitch > 0 ? 'Nose Up' : calibratedValues.pitch < 0 ? 'Nose Down' : 'Level'}
              </Text>
            </YStack>

            <YStack alignItems="center" space="$2">
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="$3" fontWeight="600">
                Roll
              </Text>
              <Text
                fontSize="$8"
                fontWeight="bold"
                color={levelStatus.isLevel ? '#22c55e' : '#ffffff'}
              >
                {calibratedValues.roll >= 0 ? '+' : ''}{calibratedValues.roll.toFixed(1)}°
              </Text>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="$3">
                {calibratedValues.roll > 0 ? 'Right High' : calibratedValues.roll < 0 ? 'Left High' : 'Level'}
              </Text>
            </YStack>
          </XStack>
        </GlassCard>

        {/* Sensor Permission Button for iOS */}
        {permissionStatus === 'denied' || (!isReliable && errorMessage.includes('sensor')) ? (
          <Button
            size="$4"
            backgroundColor="$red9"
            pressStyle={{ scale: 0.95 }}
            onPress={requestSensorPermission}
            icon={Target}
            marginTop="$4"
          >
            Enable Motion Sensors
          </Button>
        ) : null}

        {/* Active Profile Indicator */}
        {activeProfile ? (
          <GlassCard
            padding="$3"
            backgroundColor="rgba(16, 185, 129, 0.2)"
            borderColor="rgba(34, 197, 94, 0.5)"
            borderWidth={2}
            marginHorizontal="$2"
            marginTop="$4"
            borderRadius="$5"
            blurIntensity={10}
          >
            <XStack justifyContent="center" alignItems="center" space="$2">
              <YStack width={10} height={10} borderRadius={5} backgroundColor="#22c55e" />
              <Text color="rgba(255, 255, 255, 0.9)" fontSize="$3" fontWeight="600">
                Active Vehicle:
              </Text>
              <Text fontWeight="bold" fontSize="$4" color="#22c55e">
                {activeProfile.name}
              </Text>
            </XStack>
          </GlassCard>
        ) : (
          <GlassCard
            padding="$3"
            backgroundColor="rgba(239, 68, 68, 0.2)"
            borderColor="rgba(239, 68, 68, 0.5)"
            borderWidth={2}
            marginHorizontal="$2"
            marginTop="$4"
            borderRadius="$5"
            blurIntensity={10}
          >
            <XStack justifyContent="center" alignItems="center" space="$2">
              <YStack width={10} height={10} borderRadius={5} backgroundColor="#ef4444" />
              <Text color="rgba(255, 255, 255, 0.9)" fontSize="$3" fontWeight="600">
                No Vehicle Selected - Go to Profiles
              </Text>
            </XStack>
          </GlassCard>
        )}
              </YStack>
            </ResponsiveContainer>
          </ScrollContainer>

          {/* Sticky Action Buttons - Always Visible */}
          <StickyActionButtons direction="column">
            <XStack space="$3" width="100%">
              <GradientButton
                flex={1}
                gradientType={isCalibrating ? 'success' : 'info'}
                onPress={handleQuickCalibrate}
                icon={isCalibrating ? RefreshCw : Target}
                disabled={isCalibrating || !isReliable}
              >
                {isCalibrating ? 'Calibrating...' : 'Quick Set'}
              </GradientButton>

              <GradientButton
                flex={1}
                gradientType="primary"
                onPress={handleCalibrate}
                icon={Settings}
              >
                Calibration
              </GradientButton>
            </XStack>

            <GradientButton
              gradientType="warning"
              onPress={handleShowLevelingAssistant}
              icon={Zap}
              size="$5"
            >
              Leveling Assistant
            </GradientButton>
          </StickyActionButtons>
        </YStack>
      </SafeAreaView>
    </LevelScreenGradient>
  );
}