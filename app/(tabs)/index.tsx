import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Modal,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { SafeAreaSimulator } from '../../src/components/SafeAreaSimulator';
import {
  RefreshCw,
  Target,
  Settings,
  Zap,
  AlertTriangle,
  Check,
  CheckCircle,
  Caravan,
} from 'lucide-react-native';
import { MotorhomeIcon, VanIcon } from '../../src/components/icons/VehicleIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useDeviceAttitude } from '../../src/hooks/useDeviceAttitude';
import { useSafeInsets } from '../../src/hooks/useSafeInsets';
import { BubbleLevel } from '../../src/components/BubbleLevel';
import { LevelingAssistant } from '../../src/components/LevelingAssistant';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';

import { useAppStore } from '../../src/state/appStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useLevelSounds } from '../../src/hooks/useLevelSounds';
import {
  applyCalibration,
  calculateCalibrationOffsets,
  getLevelStatus,
} from '../../src/lib/calibration';

// Get cardinal direction from heading
function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

export default function LevelScreen() {
  const { pitchDeg, rollDeg, yawDeg, isAvailable, isReliable, permissionStatus, errorMessage } =
    useDeviceAttitude();
  const {
    activeProfile,
    settings,
    calibrateActiveProfile,
    showLevelingAssistant,
    setShowLevelingAssistant,
  } = useAppStore();
  const { showLeveling } = useLocalSearchParams<{ showLeveling?: string }>();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeInsets();
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const isFocused = useIsFocused(); // Track if this tab is active

  // Calculate if bubble level is visible (for audio/haptic feedback)
  const bubbleLevelVisible = isFocused && !showLevelingAssistant;

  // Level sounds (repeating when bubble is in level zone)
  const { updateAudioFeedback, stopRepeating } = useLevelSounds({
    enabled: settings.audioEnabled,
    isActive: bubbleLevelVisible,
  });

  // Theme-aware colors for this screen
  const screenColors = {
    // Background gradient - blue-gray for light mode
    gradientColors: isDark
      ? (['#0a0a0f', '#111118', '#0d0d12'] as const)
      : (['#dce4ed', '#d6dfe9', '#dae3ec'] as const),
    // Text colors
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    // Modal/card backgrounds
    modalBg: isDark ? '#1a1a1f' : '#ffffff',
    modalBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    // SVG triangle fills - blue-gray tint for light mode to blend with background
    triangleFill: isDark ? '#1a1a1a' : '#e2eaf3',
    triangleStroke: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100, 130, 170, 0.25)',
    triangleGradientStart: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    triangleGradientEnd: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    // Profile card
    profileCardBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    profileCardBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
    profileHighlight: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
    profileIconBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
    profileIconBorder: isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.25)',
    // Heading card - lighter than pitch/roll with stronger blue accent
    headingCardBg: isDark ? 'rgba(17, 17, 17, 0.85)' : 'rgba(240, 245, 252, 0.95)',
    headingCardBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)',
    // Dismiss text
    dismissText: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    // Divider
    divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    // Warning backgrounds
    warningBg: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.12)',
    warningBorder: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.25)',
    // Calibration buttons - high saturation for light mode
    // Green for "Use Last Calibration" (success)
    calibrationPrimaryBg: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.8)',
    calibrationPrimaryBorder: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.9)',
    // Orange for "Quick Calibrate" (warning) - matches home screen
    calibrationWarningBg: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.85)',
    calibrationWarningBorder: isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.95)',
    // Teal for "Full Calibration" (secondary) - matches home screen
    calibrationSecondaryBg: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.8)',
    calibrationSecondaryBorder: isDark ? 'rgba(34, 211, 238, 0.5)' : 'rgba(6, 182, 212, 0.9)',
  };

  // Calculate actual usable height (screen height minus safe areas and tab bar)
  // Tab bar is approximately 49px on iOS
  const TAB_BAR_HEIGHT = 49;
  const usableHeight = screenHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT;

  // Responsive sizing based on USABLE height (not full screen height)
  // This ensures layouts work correctly on actual devices
  const isSmallScreen = usableHeight < 550; // ~700 - 150 (safe areas + tab)
  const isVerySmallScreen = usableHeight < 480;

  // Calculate max bubble size to fit within usable space
  // Reserve space for: status text (~40), pitch/roll arc (~50),
  // Quick+Full buttons (~120), Leveling Assistant (~55), Active Profile (~65), padding (~20)
  // Total reserved = ~350px
  const reservedVerticalSpace = isSmallScreen ? 320 : 350;
  const maxBubbleSize = Math.min(
    usableHeight - reservedVerticalSpace,
    screenWidth - 32, // 16px padding on each side
    260 // Larger cap for better visibility
  );

  const [calibratedValues, setCalibratedValues] = useState({ pitch: 0, roll: 0 });
  const [levelStatus, setLevelStatus] = useState(getLevelStatus({ pitch: 0, roll: 0 }));
  const [lastHapticLevel, setLastHapticLevel] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [cautionDismissed, setCautionDismissed] = useState(false);
  const [safetyWarningDismissed, setSafetyWarningDismissed] = useState(false);
  const [showQuickCalModal, setShowQuickCalModal] = useState(false);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false);
  const [calibrationPromptAnimation] = useState(new Animated.Value(0));
  const [justCalibratedFromHome, setJustCalibratedFromHome] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  // Track if scrolling is needed (content taller than container)
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Halo animations for status text
  const perfectGlowOpacity = useRef(new Animated.Value(0)).current;
  const nearlyGlowOpacity = useRef(new Animated.Value(0)).current;
  const lastGlowState = useRef<'none' | 'green' | 'green-perfect' | 'yellow'>('none');

  // Check if we should show leveling assistant (from calibration completion)
  useEffect(() => {
    if (showLeveling === 'true') {
      setShowLevelingAssistant(true);
      // Clear the param from URL to prevent re-triggering on refresh
      router.setParams({ showLeveling: undefined });
    }
  }, [showLeveling, setShowLevelingAssistant]);

  // Enable scrolling only when content is taller than container
  useEffect(() => {
    if (contentHeight > 0 && containerHeight > 0) {
      // The scrollContent has paddingBottom: 90 for tab bar spacing.
      // This padding is included in contentHeight, so we need to account for it.
      // Only enable scrolling if actual content (minus padding) exceeds container.
      const CONTENT_PADDING_BOTTOM = 90;
      const actualContentHeight = contentHeight - CONTENT_PADDING_BOTTOM;
      setScrollEnabled(actualContentHeight > containerHeight);
    }
  }, [contentHeight, containerHeight]);

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

    const status = getLevelStatus(calibrated, settings.levelThreshold);
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

    // Determine if at perfect level vs just level
    const isPerfect = status.description === 'Perfect Level!';

    // Haptic feedback (one-shot when crossing level threshold)
    if (settings.hapticsEnabled && bubbleLevelVisible) {
      if (status.isLevel && !lastHapticLevel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!status.isLevel && lastHapticLevel) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLastHapticLevel(status.isLevel);
    }

    // Audio feedback (repeating while in level zone, speed varies with deviation)
    // Calculate total deviation from level (using max of pitch/roll for consistency)
    const totalDeviation = Math.max(Math.abs(calibrated.pitch), Math.abs(calibrated.roll));
    if (bubbleLevelVisible && settings.audioEnabled) {
      updateAudioFeedback(totalDeviation, settings.levelThreshold);
    } else {
      stopRepeating();
    }
    const targetGlow: 'none' | 'green' | 'green-perfect' | 'yellow' = status.isLevel
      ? isPerfect
        ? 'green-perfect'
        : 'green'
      : status.nearLevel
        ? 'yellow'
        : 'none';
    const greenIntensity = isPerfect ? 1.0 : 0.6;

    // Only animate if the glow state actually changed
    if (targetGlow !== lastGlowState.current) {
      lastGlowState.current = targetGlow;

      if (targetGlow === 'green' || targetGlow === 'green-perfect') {
        // Level/Perfect level - hide yellow immediately, fade in green
        Animated.parallel([
          Animated.timing(nearlyGlowOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(perfectGlowOpacity, {
            toValue: greenIntensity,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (targetGlow === 'yellow') {
        // Nearly level - hide green immediately, fade in yellow (reduced intensity)
        Animated.parallel([
          Animated.timing(perfectGlowOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(nearlyGlowOpacity, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Not level at all - hide both immediately
        Animated.parallel([
          Animated.timing(perfectGlowOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(nearlyGlowOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [
    pitchDeg,
    rollDeg,
    activeProfile,
    settings.hapticsEnabled,
    settings.audioEnabled,
    settings.levelThreshold,
    lastHapticLevel,
    cautionDismissed,
    safetyWarningDismissed,
    perfectGlowOpacity,
    nearlyGlowOpacity,
    bubbleLevelVisible,
    updateAudioFeedback,
    stopRepeating,
  ]);

  const handleCalibrate = () => {
    // If no vehicle profile exists, redirect to profiles page
    if (!activeProfile) {
      router.push('/(tabs)/profiles');
      return;
    }
    router.push('/calibration');
  };

  // Check if profile has been calibrated (non-zero offsets)
  const hasCalibration =
    activeProfile?.calibration &&
    (activeProfile.calibration.pitchOffsetDegrees !== 0 ||
      activeProfile.calibration.rollOffsetDegrees !== 0);

  // Open calibration prompt modal
  const openCalibrationPrompt = () => {
    setShowCalibrationPrompt(true);
    Animated.spring(calibrationPromptAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Close calibration prompt modal
  const closeCalibrationPrompt = () => {
    Animated.timing(calibrationPromptAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowCalibrationPrompt(false);
    });
  };

  const handleShowLevelingAssistant = () => {
    // If no vehicle profile exists, redirect to profiles page
    if (!activeProfile) {
      router.push('/(tabs)/profiles');
      return;
    }
    // If we just calibrated from the home screen, skip the prompt and go directly to leveling assistant
    if (justCalibratedFromHome) {
      setJustCalibratedFromHome(false); // Clear the flag
      setShowLevelingAssistant(true);
      return;
    }
    // Otherwise show calibration prompt modal
    openCalibrationPrompt();
  };

  // Use last calibration and show leveling assistant
  const handleUseLastCalibration = () => {
    closeCalibrationPrompt();
    globalThis.setTimeout(() => {
      setShowLevelingAssistant(true);
    }, 200);
  };

  // Quick calibrate from prompt, then show leveling
  const handleQuickCalibrateFromPrompt = () => {
    closeCalibrationPrompt();
    setIsCalibrating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const offsets = calculateCalibrationOffsets({ pitch: pitchDeg, roll: rollDeg });
    calibrateActiveProfile(offsets);

    globalThis.setTimeout(() => {
      setIsCalibrating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLevelingAssistant(true);
    }, 500);
  };

  // Full calibration from prompt
  const handleFullCalibrationFromPrompt = () => {
    closeCalibrationPrompt();
    globalThis.setTimeout(() => {
      router.push('/calibration');
    }, 200);
  };

  // Open the Quick Calibrate confirmation modal with animation
  const openQuickCalModal = () => {
    // If no vehicle profile exists, redirect to profiles page
    if (!activeProfile) {
      router.push('/(tabs)/profiles');
      return;
    }
    setShowQuickCalModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Close the modal with animation
  const closeQuickCalModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowQuickCalModal(false);
    });
  };

  // Perform the actual quick calibration
  const handleQuickCalibrate = () => {
    closeQuickCalModal();
    setIsCalibrating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const offsets = calculateCalibrationOffsets({ pitch: pitchDeg, roll: rollDeg });
    calibrateActiveProfile(offsets);

    globalThis.setTimeout(() => {
      setIsCalibrating(false);
      setJustCalibratedFromHome(true); // Skip calibration prompt if they tap Leveling Assistant next
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);
  };

  if (isAvailable === false) {
    return (
      <SafeAreaSimulator style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorTitle, { color: screenColors.text }]}>
            Device sensors not available
          </Text>
          <Text style={[styles.errorText, { color: screenColors.textSecondary }]}>
            This device does not support motion sensors required for leveling.
          </Text>
        </View>
      </SafeAreaSimulator>
    );
  }

  if (isAvailable === null) {
    return (
      <SafeAreaSimulator style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: screenColors.textSecondary }]}>
            Checking sensor availability...
          </Text>
        </View>
      </SafeAreaSimulator>
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
    <LinearGradient colors={screenColors.gradientColors} style={styles.gradient}>
      <SafeAreaSimulator style={styles.safeArea} showIndicators={false}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            // Center content vertically when scrolling is disabled
            !scrollEnabled && { flexGrow: 1, justifyContent: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          bounces={scrollEnabled}
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
        >
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
                    <Text style={[styles.warningText, { color: screenColors.text }]}>
                      Steep slope detected. Use wheel chocks and stabilizing jacks.
                    </Text>
                    <Text style={[styles.warningDismiss, { color: screenColors.dismissText }]}>
                      Tap to dismiss
                    </Text>
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
                    <Text style={[styles.warningText, { color: screenColors.text }]}>
                      Slope may be unsafe for leveling. Consider finding a flatter spot.
                    </Text>
                    <Text style={[styles.warningDismiss, { color: screenColors.dismissText }]}>
                      Tap to acknowledge
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          )}

          {/* Level Display Group - Header + Bubble + Readings (stay together) */}
          <View
            style={[
              styles.levelDisplayGroup,
              isSmallScreen && styles.levelDisplayGroupSmall,
              isVerySmallScreen && styles.levelDisplayGroupVerySmall,
            ]}
          >
            {/* Header with halo effect */}
            <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
              <View style={styles.statusContainer}>
                {/* Green glow - CSS blur for web, SVG gradient for native */}
                {Platform.OS === 'web' ? (
                  <Animated.View
                    style={[styles.statusGlowGreenWeb, { opacity: perfectGlowOpacity }]}
                  />
                ) : (
                  <Animated.View
                    style={[styles.statusGlowWrapper, { opacity: perfectGlowOpacity }]}
                  >
                    <Svg width={400} height={160} viewBox="0 0 400 160">
                      <Defs>
                        <RadialGradient id="greenGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                          <Stop offset="0%" stopColor="#22c55e" stopOpacity="1.0" />
                          <Stop offset="15%" stopColor="#22c55e" stopOpacity="0.85" />
                          <Stop offset="35%" stopColor="#22c55e" stopOpacity="0.55" />
                          <Stop offset="55%" stopColor="#22c55e" stopOpacity="0.3" />
                          <Stop offset="75%" stopColor="#22c55e" stopOpacity="0.12" />
                          <Stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </RadialGradient>
                      </Defs>
                      <Ellipse cx="200" cy="80" rx="200" ry="80" fill="url(#greenGlow)" />
                    </Svg>
                  </Animated.View>
                )}
                {/* Yellow glow - CSS blur for web, SVG gradient for native */}
                {Platform.OS === 'web' ? (
                  <Animated.View
                    style={[styles.statusGlowYellowWeb, { opacity: nearlyGlowOpacity }]}
                  />
                ) : (
                  <Animated.View style={[styles.statusGlowWrapper, { opacity: nearlyGlowOpacity }]}>
                    <Svg width={380} height={150} viewBox="0 0 380 150">
                      <Defs>
                        <RadialGradient id="yellowGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                          <Stop offset="0%" stopColor="#eab308" stopOpacity="1.0" />
                          <Stop offset="15%" stopColor="#eab308" stopOpacity="0.8" />
                          <Stop offset="35%" stopColor="#eab308" stopOpacity="0.5" />
                          <Stop offset="55%" stopColor="#eab308" stopOpacity="0.25" />
                          <Stop offset="75%" stopColor="#eab308" stopOpacity="0.1" />
                          <Stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                        </RadialGradient>
                      </Defs>
                      <Ellipse cx="190" cy="75" rx="190" ry="75" fill="url(#yellowGlow)" />
                    </Svg>
                  </Animated.View>
                )}
                {/* Hide status text when a warning card is already showing —
                    the warning conveys the same info and both together clutter the layout */}
                {!showCaution && !showSafetyWarning && (
                  <Text
                    style={[
                      styles.statusText,
                      { color: levelStatus.color },
                      isSmallScreen && styles.statusTextSmall,
                      isVerySmallScreen && styles.statusTextVerySmall,
                    ]}
                    allowFontScaling={false}
                  >
                    {levelStatus.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Bubble Level */}
            <View style={styles.levelContainer}>
              <BubbleLevel
                pitch={calibratedValues.pitch}
                roll={calibratedValues.roll}
                isLevel={levelStatus.isLevel}
                nearLevel={levelStatus.nearLevel}
                heading={yawDeg}
                showHeading={false}
                size="full"
                maxSize={maxBubbleSize}
              />
            </View>

            {/* Pitch/Roll Triangles - RIGHT ANGLE triangles on each side of bubble */}
            {(() => {
              // Match bubble geometry
              const bubblePadding = maxBubbleSize * 0.1;
              const bubbleViewBoxSize = maxBubbleSize + bubblePadding * 2;
              const bubbleViewBoxRadius = bubbleViewBoxSize / 2;
              const visibleRimRadius = bubbleViewBoxRadius * 0.833;

              // SVG wider than bubble to accommodate triangle extending outward
              const horizontalPadding = 50; // Extra space on each side
              const svgWidth = bubbleViewBoxSize + horizontalPadding * 2;
              const centerX = svgWidth / 2;

              // Triangle outer edges - gap from bubble rim
              const outwardShift = 45; // Moved left 10px more to increase area
              const leftEdge = centerX - visibleRimRadius - outwardShift;
              const rightEdge = centerX + visibleRimRadius + outwardShift;

              // Triangle size
              const legLength = 155; // Increased from 135 to make room for text
              const topPadding = 30; // Extra space at top for shifted triangles (must be >= leftYOffset)
              const svgHeight = legLength + topPadding;

              // Gap between curved hypotenuse and bubble rim (adjustable)
              const gapFromRim = 15; // Increased from 10

              // marginTop controls how much triangles overlap with bubble
              const marginTop = -155;

              // Triangle vertices - left triangle shifted up to center hypotenuse on bubble arc
              // Now using topPadding as baseline instead of 0
              const leftYOffset = 30; // Offset from top padding (larger = higher)
              const bottomOffset = 5; // Move bottom edge up by this amount
              const topCutoff = 80; // Calculated: L1.y = 80 gives 10px above text, matching 10px below
              const L1 = { x: leftEdge, y: topPadding - leftYOffset + topCutoff };
              const L2 = { x: leftEdge, y: topPadding - leftYOffset + legLength - bottomOffset };
              const L3 = {
                x: leftEdge + legLength,
                y: topPadding - leftYOffset + legLength - bottomOffset,
              };

              // Right card mirrors left card
              const R1 = { x: rightEdge, y: topPadding - leftYOffset + topCutoff }; // Same Y as L1
              const R2 = { x: rightEdge, y: topPadding - leftYOffset + legLength - bottomOffset }; // Same Y as L2
              const R3 = {
                x: rightEdge - legLength,
                y: topPadding - leftYOffset + legLength - bottomOffset,
              }; // Same Y as L3

              // Calculate bubble center in triangles' coordinate system
              const bubbleCenterY = Math.abs(marginTop) - bubbleViewBoxRadius;

              // The curved part follows bubble rim at gapFromRim distance
              const curveRadius = visibleRimRadius + gapFromRim;

              // For horizontal top edge: find where horizontal line at L1.y intersects the arc
              // Circle equation: (x - centerX)² + (y - bubbleCenterY)² = curveRadius²
              // Solve for x at y = L1.y
              const topY = L1.y;
              const dy = topY - bubbleCenterY;
              const arcStartX =
                centerX - Math.sqrt(Math.max(0, curveRadius * curveRadius - dy * dy));
              const arcStart = { x: arcStartX, y: topY };

              // For L3, calculate angle-based intersection as before
              const angleToL3 = Math.atan2(L3.y - bubbleCenterY, L3.x - centerX);
              const arcEnd = {
                x: centerX + curveRadius * Math.cos(angleToL3),
                y: bubbleCenterY + curveRadius * Math.sin(angleToL3),
              };

              // Corner radius for the 90° corner (matches GlassButton)
              const buttonRadius = 12;

              // Points for rounded corner at L2 (bottom-left, 90° corner)
              const L2_beforeCorner = { x: L2.x + buttonRadius, y: L2.y }; // Coming from right
              const L2_afterCorner = { x: L2.x, y: L2.y - buttonRadius }; // Going up

              // Points for rounded corner at L1 (top-left corner)
              const L1_beforeCorner = { x: L1.x, y: L1.y + buttonRadius }; // Coming from below
              const L1_afterCorner = { x: L1.x + buttonRadius, y: L1.y }; // Going right

              // Roundover at top-right corner where flat top meets concave arc
              const roundoverRadius = 8;

              // Calculate point on arc slightly past arcStart (toward arcEnd)
              // Arc goes counterclockwise, which in SVG Y-down means DECREASING angle
              const arcStartAngle = Math.atan2(arcStart.y - bubbleCenterY, arcStart.x - centerX);
              const angleDecrement = roundoverRadius / curveRadius;
              const arcRoundoverEnd = {
                x: centerX + curveRadius * Math.cos(arcStartAngle - angleDecrement),
                y: bubbleCenterY + curveRadius * Math.sin(arcStartAngle - angleDecrement),
              };

              // Q curve: from (arcStart.x - r, arcStart.y) with control at arcStart to arcRoundoverEnd
              const leftPath = `
                M ${L1_afterCorner.x} ${L1_afterCorner.y}
                L ${arcStart.x - roundoverRadius} ${arcStart.y}
                Q ${arcStart.x} ${arcStart.y} ${arcRoundoverEnd.x} ${arcRoundoverEnd.y}
                A ${curveRadius} ${curveRadius} 0 0 0 ${arcEnd.x} ${arcEnd.y}
                L ${L3.x} ${L3.y}
                L ${L2_beforeCorner.x} ${L2_beforeCorner.y}
                Q ${L2.x} ${L2.y} ${L2_afterCorner.x} ${L2_afterCorner.y}
                L ${L1_beforeCorner.x} ${L1_beforeCorner.y}
                Q ${L1.x} ${L1.y} ${L1_afterCorner.x} ${L1_afterCorner.y}
                Z
              `;

              // Right card arc calculations (mirrored - arc on LEFT side of card)
              // Arc start: where horizontal line at R1.y intersects arc (on RIGHT side of circle, so +sqrt)
              const rightTopY = R1.y;
              const rightDy = rightTopY - bubbleCenterY;
              const rightArcStartX =
                centerX + Math.sqrt(Math.max(0, curveRadius * curveRadius - rightDy * rightDy));
              const rightArcStart = { x: rightArcStartX, y: rightTopY };

              // Arc end: where arc meets R3 area
              const angleToR3 = Math.atan2(R3.y - bubbleCenterY, R3.x - centerX);
              const rightArcEnd = {
                x: centerX + curveRadius * Math.cos(angleToR3),
                y: bubbleCenterY + curveRadius * Math.sin(angleToR3),
              };

              // Rounded corners for right card
              // R2 = bottom-right (90° corner)
              const R2_beforeCorner = { x: R2.x - buttonRadius, y: R2.y }; // Coming from left
              const R2_afterCorner = { x: R2.x, y: R2.y - buttonRadius }; // Going up

              // R1 = top-right corner
              const R1_beforeCorner = { x: R1.x, y: R1.y + buttonRadius }; // Coming from below
              const R1_afterCorner = { x: R1.x - buttonRadius, y: R1.y }; // Going left

              // Roundover at top-left corner of right card (where flat top meets concave arc)
              // Arc goes clockwise on right side, which in SVG Y-down means INCREASING angle
              const rightArcStartAngle = Math.atan2(
                rightArcStart.y - bubbleCenterY,
                rightArcStart.x - centerX
              );
              const rightAngleIncrement = roundoverRadius / curveRadius;
              const rightArcRoundoverEnd = {
                x: centerX + curveRadius * Math.cos(rightArcStartAngle + rightAngleIncrement),
                y: bubbleCenterY + curveRadius * Math.sin(rightArcStartAngle + rightAngleIncrement),
              };

              // Right path: mirrored version of left path
              // Goes: R1 corner -> flat left to arc -> roundover -> arc -> R3 -> R2 corner -> up to R1
              const rightPath = `
                M ${R1_afterCorner.x} ${R1_afterCorner.y}
                L ${rightArcStart.x + roundoverRadius} ${rightArcStart.y}
                Q ${rightArcStart.x} ${rightArcStart.y} ${rightArcRoundoverEnd.x} ${rightArcRoundoverEnd.y}
                A ${curveRadius} ${curveRadius} 0 0 1 ${rightArcEnd.x} ${rightArcEnd.y}
                L ${R3.x} ${R3.y}
                L ${R2_beforeCorner.x} ${R2_beforeCorner.y}
                Q ${R2.x} ${R2.y} ${R2_afterCorner.x} ${R2_afterCorner.y}
                L ${R1_beforeCorner.x} ${R1_beforeCorner.y}
                Q ${R1.x} ${R1.y} ${R1_afterCorner.x} ${R1_afterCorner.y}
                Z
              `;

              return (
                <View
                  style={[
                    styles.trianglesContainer,
                    { marginTop, width: svgWidth, height: svgHeight },
                  ]}
                >
                  <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                    <Defs>
                      <SvgLinearGradient id="glassGradientTri" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={screenColors.triangleGradientStart} />
                        <Stop offset="100%" stopColor={screenColors.triangleGradientEnd} />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Left Triangle - Pitch */}
                    <Path
                      d={leftPath}
                      fill={screenColors.triangleFill}
                      fillOpacity={0.9}
                      stroke={screenColors.triangleStroke}
                      strokeWidth={1}
                    />

                    {/* Right Triangle - Roll */}
                    <Path
                      d={rightPath}
                      fill={screenColors.triangleFill}
                      fillOpacity={0.9}
                      stroke={screenColors.triangleStroke}
                      strokeWidth={1}
                    />
                  </Svg>

                  {/* Pitch text - positioned near the 90° corner (L2) */}
                  <View
                    style={[
                      styles.triangleContentAbsolute,
                      {
                        left: L2.x + 16,
                        bottom: svgHeight - L2.y + 10,
                        alignItems: 'flex-start',
                      },
                    ]}
                  >
                    <Text style={[styles.arcValueLabel, { color: screenColors.textSecondary }]}>
                      Pitch
                    </Text>
                    <Text style={[styles.arcValueNumber, { color: levelStatus.color }]}>
                      {calibratedValues.pitch >= 0 ? '+' : ''}
                      {calibratedValues.pitch.toFixed(1)}°
                    </Text>
                    <Text style={[styles.arcValueHint, { color: screenColors.textMuted }]}>
                      {calibratedValues.pitch > 0
                        ? 'Nose Up'
                        : calibratedValues.pitch < 0
                          ? 'Nose Down'
                          : 'Level'}
                    </Text>
                  </View>

                  {/* Roll text - positioned near the 90° corner (R2), mirrored alignment */}
                  <View
                    style={[
                      styles.triangleContentAbsolute,
                      {
                        right: svgWidth - R2.x + 16,
                        bottom: svgHeight - R2.y + 10,
                        alignItems: 'flex-end',
                      },
                    ]}
                  >
                    <Text style={[styles.arcValueLabel, { color: screenColors.textSecondary }]}>
                      Roll
                    </Text>
                    <Text style={[styles.arcValueNumber, { color: levelStatus.color }]}>
                      {calibratedValues.roll >= 0 ? '+' : ''}
                      {calibratedValues.roll.toFixed(1)}°
                    </Text>
                    <Text style={[styles.arcValueHint, { color: screenColors.textMuted }]}>
                      {calibratedValues.roll > 0
                        ? 'Right Up'
                        : calibratedValues.roll < 0
                          ? 'Left Up'
                          : 'Level'}
                    </Text>
                  </View>

                  {/* Heading Card - centered at bottom where cards meet, overlays everything */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: svgHeight - L3.y - 5,
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      zIndex: 10,
                    }}
                  >
                    <View
                      style={[
                        styles.externalHeadingCard,
                        {
                          backgroundColor: screenColors.headingCardBg,
                          borderColor: screenColors.headingCardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.externalHeadingValue, { color: screenColors.text }]}>
                        {Math.round(((yawDeg % 360) + 360) % 360)}°
                      </Text>
                      <Text style={styles.externalHeadingDirection}>
                        {getCardinalDirection(((yawDeg % 360) + 360) % 360)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Action Buttons Group - Separate from level display */}
          <View
            style={[styles.actionButtonsGroup, isSmallScreen && styles.actionButtonsGroupSmall]}
          >
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
              <GlassButton
                variant={isCalibrating ? 'success' : 'warning'}
                size={isSmallScreen ? 'sm' : 'md'}
                onPress={openQuickCalModal}
                disabled={isCalibrating || !isReliable}
                icon={
                  isCalibrating ? (
                    <RefreshCw size={16} color="#fff" />
                  ) : (
                    <Target size={16} color="#fff" />
                  )
                }
              >
                {isCalibrating ? 'Calibrating...' : 'Quick Calibrate'}
              </GlassButton>

              <GlassButton
                variant="secondary"
                size={isSmallScreen ? 'sm' : 'md'}
                onPress={handleCalibrate}
                icon={<Settings size={16} color="#fff" />}
              >
                Full Calibration
              </GlassButton>
            </View>

            {/* Leveling Assistant - Main feature, separated from calibration tools */}
            <View
              style={[styles.assistantContainer, isSmallScreen && styles.assistantContainerSmall]}
            >
              <GlassButton
                variant="primary"
                size={isSmallScreen ? 'md' : 'lg'}
                onPress={handleShowLevelingAssistant}
                icon={<Zap size={isSmallScreen ? 16 : 18} color="#fff" />}
              >
                Leveling Assistant
              </GlassButton>
            </View>

            {/* Spacer to push profile card down on web (native handles this automatically) */}
            {Platform.OS === 'web' && <View style={styles.webSpacer} />}

            {/* Active Profile Indicator */}
            <Pressable
              style={[styles.profileContainer, isSmallScreen && styles.profileContainerSmall]}
              onPress={() => router.push('/(tabs)/profiles')}
            >
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: screenColors.profileCardBg,
                    borderColor: screenColors.profileCardBorder,
                  },
                  isSmallScreen && styles.profileCardSmall,
                  !activeProfile && styles.profileCardEmpty,
                ]}
              >
                {/* Glass highlight bar */}
                <View
                  style={[
                    styles.profileHighlight,
                    { backgroundColor: screenColors.profileHighlight },
                  ]}
                />
                <View style={styles.profileContent}>
                  <View
                    style={[
                      styles.profileIconContainer,
                      {
                        backgroundColor: screenColors.profileIconBg,
                        borderColor: screenColors.profileIconBorder,
                      },
                      isSmallScreen && styles.profileIconContainerSmall,
                      !activeProfile && styles.profileIconContainerEmpty,
                    ]}
                  >
                    {activeProfile ? (
                      activeProfile.type === 'trailer' ? (
                        <Caravan size={isSmallScreen ? 14 : 16} color="#60a5fa" />
                      ) : activeProfile.type === 'motorhome' ? (
                        <MotorhomeIcon size={isSmallScreen ? 16 : 18} color="#60a5fa" />
                      ) : (
                        <VanIcon size={isSmallScreen ? 14 : 16} color="#60a5fa" />
                      )
                    ) : (
                      <AlertTriangle size={isSmallScreen ? 14 : 16} color="#f87171" />
                    )}
                  </View>
                  <View style={styles.profileTextContainer}>
                    <Text
                      style={[
                        styles.profileLabel,
                        { color: screenColors.textMuted },
                        isSmallScreen && styles.profileLabelSmall,
                        !activeProfile && styles.profileLabelEmpty,
                      ]}
                    >
                      {activeProfile ? 'Active Profile' : 'No Vehicle Profile'}
                    </Text>
                    <Text
                      style={[
                        styles.profileName,
                        { color: screenColors.text },
                        isSmallScreen && styles.profileNameSmall,
                        !activeProfile && styles.profileNameEmpty,
                      ]}
                    >
                      {activeProfile ? activeProfile.name : 'Tap to add a vehicle'}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* Quick Calibrate Confirmation Modal */}
        <Modal
          visible={showQuickCalModal}
          transparent
          animationType="none"
          onRequestClose={closeQuickCalModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeQuickCalModal}>
            <Animated.View
              style={[
                styles.quickCalModal,
                {
                  backgroundColor: screenColors.modalBg,
                  borderColor: screenColors.modalBorder,
                  opacity: modalAnimation,
                  transform: [
                    {
                      scale: modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Target size={28} color="#3b82f6" />
                  <Text style={[styles.modalTitle, { color: screenColors.text }]}>
                    Quick Calibrate
                  </Text>
                </View>

                {/* Warning Message */}
                <View
                  style={[
                    styles.modalWarning,
                    {
                      backgroundColor: screenColors.warningBg,
                      borderColor: screenColors.warningBorder,
                    },
                  ]}
                >
                  <AlertTriangle size={20} color="#eab308" />
                  <Text style={styles.modalWarningText}>
                    Phone must be on a known level surface
                  </Text>
                </View>

                <Text style={[styles.modalDescription, { color: screenColors.textSecondary }]}>
                  This sets your current position as &quot;level.&quot; Use a hardware bubble level
                  to verify the surface first.
                </Text>

                {/* Action Buttons - Stacked vertically */}
                <View style={styles.modalButtonsStacked}>
                  <GlassButton
                    variant="success"
                    size="md"
                    onPress={handleQuickCalibrate}
                    icon={<CheckCircle size={18} color="#fff" />}
                  >
                    Calibrate
                  </GlassButton>
                  <GlassButton variant="default" size="md" onPress={closeQuickCalModal}>
                    Cancel
                  </GlassButton>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Calibration Prompt Modal - shows options before entering Leveling Assistant */}
        <Modal
          visible={showCalibrationPrompt}
          transparent
          animationType="none"
          onRequestClose={closeCalibrationPrompt}
        >
          <Pressable style={styles.modalOverlay} onPress={closeCalibrationPrompt}>
            <Animated.View
              style={[
                styles.calibrationPromptModal,
                {
                  backgroundColor: screenColors.modalBg,
                  borderColor: screenColors.modalBorder,
                  opacity: calibrationPromptAnimation,
                  transform: [
                    {
                      scale: calibrationPromptAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <View style={styles.calibrationPromptHeader}>
                  <Zap size={28} color="#3b82f6" />
                  <Text style={[styles.calibrationPromptTitle, { color: screenColors.text }]}>
                    Leveling Assistant
                  </Text>
                </View>

                {/* Message based on calibration status */}
                {hasCalibration ? (
                  <View style={styles.calibrationPromptMessage}>
                    <AlertTriangle size={18} color="#eab308" />
                    <Text style={styles.calibrationPromptMessageText}>
                      If your vehicle has moved since last calibration, please calibrate again for
                      accurate results.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.calibrationPromptWarning}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <Text style={styles.calibrationPromptWarningText}>
                      Calibration required for accurate leveling measurements.
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.calibrationPromptButtons}>
                  {hasCalibration && (
                    <Pressable
                      style={[
                        styles.calibrationPromptPrimaryBtn,
                        {
                          backgroundColor: screenColors.calibrationPrimaryBg,
                          borderColor: screenColors.calibrationPrimaryBorder,
                        },
                      ]}
                      onPress={handleUseLastCalibration}
                    >
                      <Check size={18} color="#fff" />
                      <Text style={styles.calibrationPromptBtnText}>Use Last Calibration</Text>
                    </Pressable>
                  )}

                  <View style={styles.calibrationOptionGroup}>
                    <Pressable
                      style={[
                        styles.calibrationPromptSecondaryBtn,
                        {
                          backgroundColor: screenColors.calibrationWarningBg,
                          borderColor: screenColors.calibrationWarningBorder,
                        },
                        !hasCalibration && [
                          styles.calibrationPromptPrimaryBtn,
                          {
                            backgroundColor: screenColors.calibrationWarningBg,
                            borderColor: screenColors.calibrationWarningBorder,
                          },
                        ],
                      ]}
                      onPress={handleQuickCalibrateFromPrompt}
                      disabled={!isReliable}
                    >
                      <Target size={18} color="#fff" />
                      <Text style={styles.calibrationPromptBtnText}>Quick Calibrate</Text>
                    </Pressable>
                    <Text style={[styles.calibrationOptionDesc, { color: screenColors.textMuted }]}>
                      Sets current position as level. Place phone on a surface you know is level.
                    </Text>
                  </View>

                  <View style={styles.calibrationOptionGroup}>
                    <Pressable
                      style={[
                        styles.calibrationPromptSecondaryBtn,
                        {
                          backgroundColor: screenColors.calibrationSecondaryBg,
                          borderColor: screenColors.calibrationSecondaryBorder,
                        },
                      ]}
                      onPress={handleFullCalibrationFromPrompt}
                    >
                      <Settings size={18} color="#fff" />
                      <Text style={styles.calibrationPromptBtnText}>Full Calibration</Text>
                    </Pressable>
                    <Text style={[styles.calibrationOptionDesc, { color: screenColors.textMuted }]}>
                      3-step process that works on any surface. Most accurate option.
                    </Text>
                  </View>

                  {/* Cancel Button */}
                  <GlassButton
                    variant="default"
                    size="md"
                    onPress={closeCalibrationPrompt}
                    style={{ marginTop: 8 }}
                  >
                    Cancel
                  </GlassButton>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </SafeAreaSimulator>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90, // Account for tab bar (70px) + spacing (20px)
    flexGrow: 1,
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
  levelDisplayGroup: {
    // This group contains bubble level + pitch/roll card - they stay together
    alignItems: 'center',
    paddingTop: 6,
  },
  levelDisplayGroupSmall: {
    paddingTop: 8,
  },
  levelDisplayGroupVerySmall: {
    paddingTop: 4,
  },
  actionButtonsGroup: {
    // Action buttons below level display - flex to fill available space
    marginTop: -23,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  actionButtonsGroupSmall: {
    marginTop: 8,
    paddingBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  // SVG glow wrapper - absolutely fills container, centers SVG (for native)
  statusGlowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Allow glow to extend beyond container bounds
    overflow: 'visible',
  },
  // Web-specific glow using CSS blur (works great on web)
  statusGlowGreenWeb: {
    position: 'absolute',
    top: -8,
    left: -20,
    right: -20,
    bottom: -8,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    filter: 'blur(20px)',
  },
  statusGlowYellowWeb: {
    position: 'absolute',
    top: -6,
    left: -16,
    right: -16,
    bottom: -6,
    borderRadius: 25,
    backgroundColor: 'rgba(234, 179, 8, 0.22)',
    filter: 'blur(18px)',
  },
  statusText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    // Soft black outline to help text pop against glow
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  levelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    marginTop: 4,
    marginHorizontal: 4,
    width: '100%',
  },
  // Arc card that wraps under the bubble with curved top
  arcCardWrapper: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  arcCardSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  arcCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 0, // Controlled by inline style
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  arcValueLeft: {
    alignItems: 'center',
  },
  arcValueRight: {
    alignItems: 'center',
  },
  arcValueLabel: {
    fontSize: 9,
    color: '#a3a3a3',
    marginBottom: 1,
  },
  arcValueNumber: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 1,
  },
  arcValueHint: {
    fontSize: 8,
    color: '#737373',
  },
  valueNumberCompact: {
    fontSize: 18,
    fontWeight: '700',
  },
  numericDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 2,
  },
  valueColumn: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 11,
    color: '#a3a3a3',
    marginBottom: 1,
  },
  valueLabelSmall: {
    fontSize: 10,
    color: '#a3a3a3',
    marginBottom: 1,
  },
  valueNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 1,
  },
  valueNumberSmall: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 1,
  },
  valueHint: {
    fontSize: 10,
    color: '#737373',
  },
  valueHintSmall: {
    fontSize: 9,
    color: '#737373',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerSmall: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Responsive styles for small screens
  headerSmall: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  statusTextSmall: {
    fontSize: 26,
  },
  statusTextVerySmall: {
    fontSize: 22,
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
  buttonContainerSmall: {
    marginTop: 8,
    gap: 8,
  },
  permissionContainer: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  assistantContainer: {
    marginTop: 24,
  },
  assistantContainerSmall: {
    marginTop: 12,
  },
  // Spacer for web to push profile card down to match native layout
  webSpacer: {
    flexGrow: 1,
    minHeight: 20,
  },
  profileContainer: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  profileHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 11,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fafafa',
  },
  // Small screen profile styles
  profileCardSmall: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  profileIconContainerSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  profileLabelSmall: {
    fontSize: 10,
    marginBottom: 1,
  },
  profileNameSmall: {
    fontSize: 13,
  },
  // Empty profile state styles - attention-grabbing
  profileCardEmpty: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  profileIconContainerEmpty: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  profileLabelEmpty: {
    color: '#f87171',
  },
  profileNameEmpty: {
    color: '#fca5a5',
  },
  // Quick Calibrate Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  quickCalModal: {
    backgroundColor: '#1a1a1f',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fafafa',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  modalWarningText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#eab308',
  },
  modalDescription: {
    fontSize: 14,
    color: '#a3a3a3',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonsStacked: {
    flexDirection: 'column',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f87171',
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Calibration Prompt Modal Styles
  calibrationPromptModal: {
    backgroundColor: '#1a1a1f',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  calibrationPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  calibrationPromptTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fafafa',
  },
  calibrationPromptMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  calibrationPromptMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#eab308',
    lineHeight: 20,
  },
  calibrationPromptWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  calibrationPromptWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#f87171',
    lineHeight: 20,
  },
  calibrationPromptButtons: {
    gap: 10,
    marginBottom: 12,
  },
  calibrationPromptPrimaryBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    gap: 8,
  },
  calibrationPromptSecondaryBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: 8,
  },
  calibrationPromptBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  calibrationPromptHelper: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
  },
  calibrationOptionGroup: {
    gap: 4,
  },
  calibrationOptionDesc: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // Triangle styles for pitch/roll
  trianglesContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  trianglesSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  triangleContentAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // External heading card styles (matches original BubbleLevel heading)
  externalHeadingContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  externalHeadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    gap: 6,
  },
  externalHeadingValue: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  externalHeadingDirection: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
});
