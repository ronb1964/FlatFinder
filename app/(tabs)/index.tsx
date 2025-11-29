import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Target, Settings, Zap, AlertTriangle } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useDeviceAttitude } from '../../src/hooks/useDeviceAttitude';
import { BubbleLevel } from '../../src/components/BubbleLevel';
import { LevelingAssistant } from '../../src/components/LevelingAssistant';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';

import { useAppStore } from '../../src/state/appStore';
import {
  applyCalibration,
  calculateCalibrationOffsets,
  getLevelStatus,
} from '../../src/lib/calibration';

function KeepAwakeWrapper() {
  useKeepAwake();
  return null;
}

export default function LevelScreen() {
  const { pitchDeg, rollDeg, yawDeg, isAvailable, isReliable, permissionStatus, errorMessage } =
    useDeviceAttitude();
  const { activeProfile, settings, calibrateActiveProfile } = useAppStore();
  const { height: screenHeight } = useWindowDimensions();

  // Responsive sizing based on screen height
  const isSmallScreen = screenHeight < 700;

  const [calibratedValues, setCalibratedValues] = useState({ pitch: 0, roll: 0 });
  const [levelStatus, setLevelStatus] = useState(getLevelStatus({ pitch: 0, roll: 0 }));
  const [lastHapticLevel, setLastHapticLevel] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showLevelingAssistant, setShowLevelingAssistant] = useState(false);
  const [cautionDismissed, setCautionDismissed] = useState(false);
  const [safetyWarningDismissed, setSafetyWarningDismissed] = useState(false);

  const requestSensorPermission = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
    if (
      win &&
      win.DeviceOrientationEvent &&
      typeof win.DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        await win.DeviceOrientationEvent.requestPermission();
        win.location.reload();
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    }
  };

  useEffect(() => {
    const offsets = activeProfile?.calibration || { pitchOffsetDegrees: 0, rollOffsetDegrees: 0 };
    const calibrated = applyCalibration({ pitch: pitchDeg, roll: rollDeg }, offsets);
    setCalibratedValues(calibrated);

    const status = getLevelStatus(calibrated);
    setLevelStatus(status);

    const maxAngle = Math.max(Math.abs(calibrated.pitch), Math.abs(calibrated.roll));
    const needsCaution = maxAngle > 6.0;
    const isUnsafe = maxAngle > 10.0;

    // Reset dismissed states when angle drops below thresholds
    if (!needsCaution && cautionDismissed) {
      setCautionDismissed(false);
    }
    if (!isUnsafe && safetyWarningDismissed) {
      setSafetyWarningDismissed(false);
    }

    if (settings.hapticsEnabled) {
      if (status.isLevel && !lastHapticLevel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!status.isLevel && lastHapticLevel) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLastHapticLevel(status.isLevel);
    }
  }, [
    pitchDeg,
    rollDeg,
    activeProfile,
    settings.hapticsEnabled,
    lastHapticLevel,
    cautionDismissed,
    safetyWarningDismissed,
  ]);

  const handleCalibrate = () => {
    router.push('/calibration');
  };

  const handleShowLevelingAssistant = () => {
    setShowLevelingAssistant(true);
  };

  const handleQuickCalibrate = () => {
    setIsCalibrating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const offsets = calculateCalibrationOffsets({ pitch: pitchDeg, roll: rollDeg });
    calibrateActiveProfile(offsets);

    globalThis.setTimeout(() => {
      setIsCalibrating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);
  };

  if (isAvailable === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Device sensors not available</Text>
          <Text style={styles.errorText}>
            This device does not support motion sensors required for leveling.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAvailable === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Checking sensor availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxAngle = Math.max(Math.abs(calibratedValues.pitch), Math.abs(calibratedValues.roll));
  const needsCaution = maxAngle > 6.0 && maxAngle <= 10.0;
  const isUnsafe = maxAngle > 10.0;
  const showCaution = needsCaution && !cautionDismissed;
  const showSafetyWarning = isUnsafe && !safetyWarningDismissed;

  if (showLevelingAssistant) {
    return <LevelingAssistant onBack={() => setShowLevelingAssistant(false)} />;
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0d0d12']} style={styles.gradient}>
      {Platform.OS !== 'web' && <KeepAwakeWrapper />}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Caution Warning (yellow) - 6° to 10° */}
          {showCaution && (
            <Pressable onPress={() => setCautionDismissed(true)} style={styles.warningContainer}>
              <GlassCard
                variant="default"
                borderColor="rgba(234, 179, 8, 0.5)"
                glowColor="rgba(234, 179, 8, 0.2)"
              >
                <View style={styles.warningContent}>
                  <AlertTriangle size={20} color="#eab308" />
                  <View style={styles.warningTextContainer}>
                    <Text style={styles.cautionTitle}>Caution</Text>
                    <Text style={styles.warningText}>
                      Steep slope detected. Use wheel chocks and stabilizing jacks.
                    </Text>
                    <Text style={styles.warningDismiss}>Tap to dismiss</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          )}

          {/* Safety Warning (red) - above 10° */}
          {showSafetyWarning && (
            <Pressable
              onPress={() => setSafetyWarningDismissed(true)}
              style={styles.warningContainer}
            >
              <GlassCard
                variant="default"
                borderColor="rgba(239, 68, 68, 0.5)"
                glowColor="rgba(239, 68, 68, 0.2)"
              >
                <View style={styles.warningContent}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <View style={styles.warningTextContainer}>
                    <Text style={styles.warningTitle}>Safety Warning</Text>
                    <Text style={styles.warningText}>
                      Slope may be unsafe for leveling. Consider finding a flatter spot.
                    </Text>
                    <Text style={styles.warningDismiss}>Tap to acknowledge</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          )}

          {/* Top Section - Header + Bubble Level */}
          <View style={styles.topSection}>
            {/* Header */}
            <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
              <Text
                style={[
                  styles.statusText,
                  { color: levelStatus.color },
                  isSmallScreen && styles.statusTextSmall,
                ]}
              >
                {levelStatus.description}
              </Text>
            </View>

            {/* Bubble Level */}
            <View style={styles.levelContainer}>
              <BubbleLevel
                pitch={calibratedValues.pitch}
                roll={calibratedValues.roll}
                isLevel={levelStatus.isLevel}
                heading={yawDeg}
                size="full"
              />
            </View>
          </View>

          {/* Bottom Section - Cards + Buttons */}
          <View style={styles.bottomSection}>
            {/* Numeric Display - Glass Card */}
            <View style={[styles.cardContainer, isSmallScreen && styles.cardContainerSmall]}>
              <GlassCard
                variant={levelStatus.isLevel ? 'success' : 'default'}
                compact={isSmallScreen}
              >
                <View style={[styles.numericDisplay, isSmallScreen && styles.numericDisplaySmall]}>
                  <View style={styles.valueColumn}>
                    <Text style={[styles.valueLabel, isSmallScreen && styles.valueLabelSmall]}>
                      Pitch
                    </Text>
                    <Text
                      style={[
                        styles.valueNumber,
                        { color: levelStatus.color },
                        isSmallScreen && styles.valueNumberSmall,
                      ]}
                    >
                      {calibratedValues.pitch >= 0 ? '+' : ''}
                      {calibratedValues.pitch.toFixed(1)}°
                    </Text>
                    {!isSmallScreen && (
                      <Text style={styles.valueHint}>
                        {calibratedValues.pitch > 0
                          ? 'Nose Up'
                          : calibratedValues.pitch < 0
                            ? 'Nose Down'
                            : 'Level'}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.divider, isSmallScreen && styles.dividerSmall]} />

                  <View style={styles.valueColumn}>
                    <Text style={[styles.valueLabel, isSmallScreen && styles.valueLabelSmall]}>
                      Roll
                    </Text>
                    <Text
                      style={[
                        styles.valueNumber,
                        { color: levelStatus.color },
                        isSmallScreen && styles.valueNumberSmall,
                      ]}
                    >
                      {calibratedValues.roll >= 0 ? '+' : ''}
                      {calibratedValues.roll.toFixed(1)}°
                    </Text>
                    {!isSmallScreen && (
                      <Text style={styles.valueHint}>
                        {calibratedValues.roll > 0
                          ? 'Right High'
                          : calibratedValues.roll < 0
                            ? 'Left High'
                            : 'Level'}
                      </Text>
                    )}
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Sensor Permission Button */}
            {(permissionStatus === 'denied' ||
              (!isReliable && errorMessage?.includes('sensor'))) && (
              <View style={styles.permissionContainer}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  onPress={requestSensorPermission}
                  icon={<Target size={20} color="#fff" />}
                >
                  Enable Motion Sensors
                </GlassButton>
              </View>
            )}

            {/* Action Buttons - Glass Style */}
            <View style={[styles.buttonContainer, isSmallScreen && styles.buttonContainerSmall]}>
              <View style={styles.buttonRow}>
                <View style={styles.buttonHalf}>
                  <GlassButton
                    variant={isCalibrating ? 'success' : 'ghost'}
                    size={isSmallScreen ? 'sm' : 'md'}
                    onPress={handleQuickCalibrate}
                    disabled={isCalibrating || !isReliable}
                    icon={
                      isCalibrating ? (
                        <RefreshCw size={16} color="#fff" />
                      ) : (
                        <Target size={16} color="#a3a3a3" />
                      )
                    }
                  >
                    {isCalibrating ? 'Setting...' : 'Quick Set'}
                  </GlassButton>
                </View>

                <View style={styles.buttonHalf}>
                  <GlassButton
                    variant="primary"
                    size={isSmallScreen ? 'sm' : 'md'}
                    onPress={handleCalibrate}
                    icon={<Settings size={16} color="#fff" />}
                  >
                    Calibration
                  </GlassButton>
                </View>
              </View>

              <GlassButton
                variant="primary"
                size={isSmallScreen ? 'md' : 'lg'}
                onPress={handleShowLevelingAssistant}
                icon={<Zap size={18} color="#fff" />}
                style={styles.assistantButton}
              >
                Leveling Assistant
              </GlassButton>
            </View>

            {/* Active Profile Indicator */}
            {activeProfile && (
              <View
                style={[styles.profileContainer, isSmallScreen && styles.profileContainerSmall]}
              >
                <GlassCard variant="default" compact>
                  <View style={styles.profileContent}>
                    <Text style={styles.profileLabel}>Profile:</Text>
                    <Text style={styles.profileName}>{activeProfile.name}</Text>
                  </View>
                </GlassCard>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#a3a3a3',
  },
  warningContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  cautionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#eab308',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#fafafa',
    marginBottom: 4,
  },
  warningDismiss: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSection: {
    paddingBottom: 70, // Account for tab bar
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  levelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  numericDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  valueColumn: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 14,
    color: '#a3a3a3',
    marginBottom: 4,
  },
  valueNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  valueHint: {
    fontSize: 12,
    color: '#737373',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Responsive styles for small screens
  headerSmall: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  statusTextSmall: {
    fontSize: 28,
  },
  cardContainerSmall: {
    marginTop: 8,
  },
  profileContainerSmall: {
    marginTop: 8,
  },
  numericDisplaySmall: {
    paddingVertical: 0,
  },
  valueLabelSmall: {
    fontSize: 12,
    marginBottom: 2,
  },
  valueNumberSmall: {
    fontSize: 22,
  },
  dividerSmall: {
    height: 35,
  },
  buttonContainerSmall: {
    marginTop: 8,
    gap: 8,
  },
  permissionContainer: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  assistantButton: {
    marginTop: 4,
  },
  profileContainer: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profileLabel: {
    fontSize: 12,
    color: '#737373',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fafafa',
  },
});
