import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, RotateCw, Check, Home } from 'lucide-react-native';
import { GlassButton } from './ui/GlassButton';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import {
  OrientedCalibrationReading,
  createOrientedReading,
  solveMultiPositionCalibration,
  MultiPositionCalibrationResult,
} from '../lib/calibration';
import { Calibration, createCalibration } from '../lib/levelingMath';
import { THEME } from '../theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface CalibrationWizardProps {
  onComplete: (calibration: Calibration, vehicleTilt: { pitch: number; roll: number }) => void;
  onCancel: () => void;
  onGoHome?: (calibration: Calibration, vehicleTilt: { pitch: number; roll: number }) => void;
  isVisible: boolean;
}

type CalibrationStep =
  | 'welcome'
  | 'position_0'
  | 'transition_to_90'
  | 'position_90'
  | 'transition_to_180'
  | 'position_180'
  | 'complete';

const STEP_CONFIG: Record<
  CalibrationStep,
  {
    title: string;
    subtitle: string;
    instruction: string;
    orientation: 0 | 90 | 180 | null;
    uiRotation: number;
  }
> = {
  welcome: {
    title: 'Calibrate Your Level',
    subtitle: 'Quick 3-Step Process',
    instruction:
      "We'll take readings at 3 positions to accurately calibrate your device and measure your vehicle's tilt.\n\nTakes about 30 seconds. Rotate your phone through 3 positions.",
    orientation: null,
    uiRotation: 0,
  },
  position_0: {
    title: 'Step 1 of 3',
    subtitle: 'First Position',
    instruction:
      'Place phone flat on a surface in your RV like a countertop or even the floor.\nPoint the TOP toward the FRONT of the vehicle.\nHold steady, then tap Capture Reading.',
    orientation: 0,
    uiRotation: 0,
  },
  transition_to_90: {
    title: 'Rotate Your Phone',
    subtitle: 'Get Ready for Step 2',
    instruction:
      'Rotate your phone 90° clockwise as shown AFTER you press the Next button.\nThe TOP should point to the RIGHT side of your RV.',
    orientation: null,
    uiRotation: 0,
  },
  position_90: {
    title: 'Step 2 of 3',
    subtitle: 'Second Position',
    instruction:
      'Keep phone flat on the same surface.\nTOP points to the RIGHT side of your RV.\nHold steady, then tap Capture Reading.',
    orientation: 90,
    uiRotation: -90, // Rotate UI counterclockwise so user can read it
  },
  transition_to_180: {
    title: 'Rotate Again',
    subtitle: 'Get Ready for Step 3',
    instruction:
      'Rotate your phone another 90° clockwise\nAFTER you press the Next button.\nThe TOP should point toward the REAR of your RV.',
    orientation: null,
    uiRotation: -90, // Stay in landscape orientation
  },
  position_180: {
    title: 'Step 3 of 3',
    subtitle: 'Final Position',
    instruction:
      'Keep phone flat on the same surface.\nTOP points toward the REAR of your RV.\nHold steady, then tap Capture Reading.',
    orientation: 180,
    uiRotation: -180, // Use -180 (same as 180 visually) so animation from -90 goes the short way (90°)
  },
  complete: {
    title: 'Calibration Complete!',
    subtitle: 'Ready to Level',
    instruction: 'Your device is calibrated. Tap below to see your leveling plan.',
    orientation: null,
    uiRotation: 0,
  },
};

// Animated phone icon component (static position indicator)
function PhoneRotationIndicator({ targetRotation }: { targetRotation: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(targetRotation, {
      damping: 15,
      stiffness: 80,
    });
  }, [targetRotation, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.phoneIndicator, animatedStyle]}>
      <View style={styles.phoneBody}>
        <View style={styles.phoneScreen}>
          <View style={styles.phoneNotch} />
          <Text style={styles.phoneArrow}>↑</Text>
          <Text style={styles.phoneLabel}>TOP</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Looping phone rotation animation for transition screens
// Shows phone rotating from startAngle to endAngle, then resetting
function LoopingPhoneRotation({ startAngle, endAngle }: { startAngle: number; endAngle: number }) {
  const rotation = useSharedValue(startAngle);

  useEffect(() => {
    // Animate: rotate to end position, pause, reset to start, pause, repeat
    rotation.value = startAngle;
    rotation.value = withRepeat(
      withSequence(
        // Rotate to target position (smooth ease)
        withTiming(endAngle, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        // Hold at target position
        withDelay(500, withTiming(endAngle, { duration: 0 })),
        // Quick reset back to start
        withTiming(startAngle, { duration: 400, easing: Easing.out(Easing.ease) }),
        // Brief pause before next loop
        withDelay(300, withTiming(startAngle, { duration: 0 }))
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [startAngle, endAngle, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.loopingPhoneContainer}>
      <Animated.View style={[styles.phoneIndicatorLarge, animatedStyle]}>
        <View style={styles.phoneBodyLarge}>
          <View style={styles.phoneScreenLarge}>
            <View style={styles.phoneNotchLarge} />
            <Text style={styles.phoneArrowLarge}>↑</Text>
            <Text style={styles.phoneLabelLarge}>TOP</Text>
          </View>
        </View>
      </Animated.View>
      {/* Rotation arrow indicator */}
      <View style={styles.rotationArrowContainer}>
        <Text style={styles.rotationArrow}>↻</Text>
      </View>
    </View>
  );
}

// Glowing progress dots
function ProgressIndicator({ currentStep }: { currentStep: CalibrationStep }) {
  const steps: CalibrationStep[] = ['position_0', 'position_90', 'position_180'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = currentIndex > index || currentStep === 'complete';

        return (
          <View key={step} style={styles.progressDotWrapper}>
            <View
              style={[
                styles.progressDot,
                isComplete && styles.progressDotComplete,
                isActive && styles.progressDotActive,
              ]}
            >
              {isComplete && <Check size={12} color="#000" />}
            </View>
            {isActive && <View style={styles.progressDotGlow} />}
            {index < steps.length - 1 && (
              <View style={[styles.progressLine, isComplete && styles.progressLineComplete]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function CalibrationWizard({
  onComplete,
  onCancel,
  onGoHome,
  isVisible,
}: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<CalibrationStep>('welcome');
  const [readings, setReadings] = useState<OrientedCalibrationReading[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [result, setResult] = useState<MultiPositionCalibrationResult | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { pitchDeg, rollDeg, isReliable } = useDeviceAttitude();
  // Animation values
  const containerRotation = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const captureScale = useSharedValue(1);
  const captureGlow = useSharedValue(0);

  // Reset when visibility changes
  useEffect(() => {
    if (!isVisible) {
      globalThis.setTimeout(() => {
        setCurrentStep('welcome');
        setReadings([]);
        setIsCapturing(false);
        setResult(null);
        setShowCancelConfirm(false);
        containerRotation.value = 0;
      }, 300);
    }
  }, [isVisible, containerRotation]);

  // Animate UI rotation when step changes
  useEffect(() => {
    const config = STEP_CONFIG[currentStep];
    containerRotation.value = withSpring(config.uiRotation, {
      damping: 20,
      stiffness: 90,
    });
  }, [currentStep, containerRotation]);

  const handleStartCalibration = useCallback(() => {
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    globalThis.setTimeout(() => setCurrentStep('position_0'), 150);
  }, [contentOpacity]);

  // Handle "Next" button on transition screens
  const handleProceed = useCallback(() => {
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    globalThis.setTimeout(() => {
      if (currentStep === 'transition_to_90') {
        setCurrentStep('position_90');
      } else if (currentStep === 'transition_to_180') {
        setCurrentStep('position_180');
      }
    }, 150);
  }, [currentStep, contentOpacity]);

  const handleCaptureReading = useCallback(() => {
    if (!isReliable || isCapturing) return;

    const config = STEP_CONFIG[currentStep];
    if (config.orientation === null) return;

    setIsCapturing(true);

    // Animate capture button
    captureScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    captureGlow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 500 })
    );

    // Take reading after brief delay for visual feedback
    globalThis.setTimeout(() => {
      const reading = createOrientedReading(pitchDeg, rollDeg, config.orientation as 0 | 90 | 180);
      const newReadings = [...readings, reading];
      setReadings(newReadings);

      // Determine next step - go to transition screen first
      if (config.orientation === 0) {
        contentOpacity.value = withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        globalThis.setTimeout(() => {
          setCurrentStep('transition_to_90'); // Go to transition screen
          setIsCapturing(false);
        }, 150);
      } else if (config.orientation === 90) {
        contentOpacity.value = withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        globalThis.setTimeout(() => {
          setCurrentStep('transition_to_180'); // Go to transition screen
          setIsCapturing(false);
        }, 150);
      } else if (config.orientation === 180) {
        // All readings complete - solve calibration
        const calibrationResult = solveMultiPositionCalibration(newReadings);
        setResult(calibrationResult);
        contentOpacity.value = withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        globalThis.setTimeout(() => {
          setCurrentStep('complete');
          setIsCapturing(false);
        }, 150);
      }
    }, 300);
  }, [
    currentStep,
    isReliable,
    isCapturing,
    pitchDeg,
    rollDeg,
    readings,
    captureScale,
    captureGlow,
    contentOpacity,
  ]);

  const handleComplete = useCallback(() => {
    if (!result) return;

    const calibration = createCalibration({
      pitchOffsetDegrees: result.deviceBias.pitch,
      rollOffsetDegrees: result.deviceBias.roll,
    });

    onComplete(calibration, result.vehicleTilt);
  }, [result, onComplete]);

  // Handle "Go Home" - save calibration but don't show leveling assistant
  const handleGoHome = useCallback(() => {
    if (!result) return;

    const calibration = createCalibration({
      pitchOffsetDegrees: result.deviceBias.pitch,
      rollOffsetDegrees: result.deviceBias.roll,
    });

    if (onGoHome) {
      onGoHome(calibration, result.vehicleTilt);
    } else {
      // Fallback to onComplete if no onGoHome provided
      onComplete(calibration, result.vehicleTilt);
    }
  }, [result, onComplete, onGoHome]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${containerRotation.value}deg` }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const captureButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const captureGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: captureGlow.value,
    transform: [{ scale: interpolate(captureGlow.value, [0, 1], [1, 1.3]) }],
  }));

  const config = STEP_CONFIG[currentStep];
  const isCaptureStep = ['position_0', 'position_90', 'position_180'].includes(currentStep);
  const isTransitionStep = ['transition_to_90', 'transition_to_180'].includes(currentStep);
  const showPhoneIndicator = ['position_0', 'position_90', 'position_180'].includes(currentStep);
  const isRotatedStep = ['position_90', 'transition_to_180'].includes(currentStep);

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View
          style={[isRotatedStep ? styles.contentLandscape : styles.content, contentAnimatedStyle]}
        >
          {/* Landscape layout for rotated steps */}
          {/* Container rotates -90°. With flexDirection: 'column': */}
          {/* My TOP → visual LEFT → user's BOTTOM */}
          {/* My BOTTOM → visual RIGHT → user's TOP */}
          {/* So: first child = user's BOTTOM, last child = user's TOP */}
          {isRotatedStep ? (
            <>
              {/* My TOP: Progress dots (centered horizontally) - only for capture steps */}
              {!isTransitionStep && (
                <View style={styles.landscapeDotsTop}>
                  <ProgressIndicator currentStep={currentStep} />
                </View>
              )}

              {/* Below dots: Title + Subtitle */}
              <View
                style={
                  isTransitionStep ? styles.landscapeTitleAreaNoDots : styles.landscapeTitleArea
                }
              >
                <Text style={styles.titleLandscape}>{config.title}</Text>
                <Text style={styles.subtitleLandscape}>{config.subtitle}</Text>
              </View>

              {/* Content area: Two columns for capture, single centered column for transition */}
              {isTransitionStep && currentStep === 'transition_to_180' ? (
                /* Transition: Stack elements vertically, centered horizontally */
                /* Order: phone (my BOTTOM), rotation icon (middle), text (my TOP) */
                <View style={styles.landscapeCenteredStack}>
                  <LoopingPhoneRotation startAngle={90} endAngle={180} />
                  <View style={styles.instructionCardLandscape}>
                    <Text style={styles.instruction}>{config.instruction}</Text>
                  </View>
                </View>
              ) : (
                /* Capture: Two columns - phone on left, text on right */
                <View style={styles.landscapeTwoColumns}>
                  <View style={styles.landscapeLeftCol}>
                    {showPhoneIndicator && (
                      <PhoneRotationIndicator
                        targetRotation={
                          config.orientation === 0 ? 0 : config.orientation === 90 ? 90 : 180
                        }
                      />
                    )}
                  </View>
                  <View style={styles.landscapeRightCol}>
                    <View style={styles.instructionCardLandscape}>
                      <Text style={styles.instruction}>{config.instruction}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Buttons at bottom, centered, stacked */}
              <View style={styles.landscapeButtonsArea}>
                {isTransitionStep ? (
                  /* Transition screen: Next button */
                  <Pressable
                    style={[styles.captureButtonLandscapeWide, { marginBottom: 8 }]}
                    onPress={handleProceed}
                  >
                    <RotateCw size={18} color="#fff" />
                    <Text style={styles.captureButtonTextCompact}>Next</Text>
                  </Pressable>
                ) : (
                  /* Capture screen: Capture button with glow animation */
                  <View style={styles.captureButtonWrapperLandscape}>
                    <Animated.View
                      style={[styles.captureGlowLandscape, captureGlowAnimatedStyle]}
                    />
                    <Animated.View style={captureButtonAnimatedStyle}>
                      <Pressable
                        style={[
                          styles.captureButtonLandscapeWide,
                          (!isReliable || isCapturing) && styles.captureButtonDisabled,
                        ]}
                        onPress={handleCaptureReading}
                        disabled={!isReliable || isCapturing}
                      >
                        {isCapturing ? (
                          <RotateCw size={18} color="#fff" />
                        ) : (
                          <Target size={18} color="#fff" />
                        )}
                        <Text style={styles.captureButtonTextCompact}>
                          {isCapturing ? 'Capturing...' : 'Capture Reading'}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                )}
                <Pressable
                  style={styles.cancelButtonLandscapeWide}
                  onPress={() => setShowCancelConfirm(true)}
                >
                  <Text style={styles.cancelButtonTextCompact}>Cancel</Text>
                </Pressable>
              </View>
            </>
          ) : isTransitionStep && currentStep === 'transition_to_90' ? (
            <>
              {/* Transition screen - portrait, showing rotation animation */}
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.subtitle}>{config.subtitle}</Text>
              </View>

              {/* Looping phone rotation animation: 0° to 90° */}
              <LoopingPhoneRotation startAngle={0} endAngle={90} />

              {/* Instructions */}
              <View style={styles.instructionCard}>
                <Text style={styles.instruction}>{config.instruction}</Text>
              </View>
            </>
          ) : (
            <>
              {/* Portrait layout for non-rotated steps */}
              {/* Progress indicator */}
              {currentStep !== 'welcome' && currentStep !== 'complete' && !isTransitionStep && (
                <ProgressIndicator currentStep={currentStep} />
              )}

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.subtitle}>{config.subtitle}</Text>
              </View>

              {/* Phone rotation indicator */}
              {showPhoneIndicator && (
                <PhoneRotationIndicator
                  targetRotation={
                    config.orientation === 0 ? 0 : config.orientation === 90 ? 90 : 180
                  }
                />
              )}

              {/* Instructions */}
              <View style={styles.instructionCard}>
                <Text style={styles.instruction}>{config.instruction}</Text>
              </View>
            </>
          )}

          {/* Result display on completion */}
          {currentStep === 'complete' && result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Device Bias</Text>
                  <Text style={styles.resultValue}>
                    {result.deviceBias.pitch.toFixed(1)}° / {result.deviceBias.roll.toFixed(1)}°
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Vehicle Tilt</Text>
                  <Text style={styles.resultValue}>
                    {result.vehicleTilt.pitch.toFixed(1)}° / {result.vehicleTilt.roll.toFixed(1)}°
                  </Text>
                </View>
              </View>
              <View style={[styles.qualityBadge, styles[`quality_${result.quality}`]]}>
                <Text style={styles.qualityText}>
                  {result.quality.charAt(0).toUpperCase() + result.quality.slice(1)} Quality
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons - only show for non-rotated steps (rotated steps have buttons in landscape layout) */}
          {!isRotatedStep && (
            <View style={styles.buttonContainer}>
              {currentStep === 'welcome' && (
                <GlassButton
                  variant="primary"
                  size="md"
                  onPress={handleStartCalibration}
                  icon={<Target size={18} color="#fff" />}
                  style={styles.fullWidthButton}
                >
                  Start Calibration
                </GlassButton>
              )}

              {/* Transition screen - Next button */}
              {isTransitionStep && (
                <GlassButton
                  variant="primary"
                  size="md"
                  onPress={handleProceed}
                  icon={<RotateCw size={18} color="#fff" />}
                  style={styles.fullWidthButton}
                >
                  Next
                </GlassButton>
              )}

              {/* Capture screens - Capture Reading button */}
              {isCaptureStep &&
                (currentStep === 'position_0' || currentStep === 'position_180') && (
                  <View style={styles.captureButtonWrapper}>
                    <Animated.View style={[styles.captureGlow, captureGlowAnimatedStyle]} />
                    <Animated.View style={[captureButtonAnimatedStyle, { width: '100%' }]}>
                      <Pressable
                        style={[
                          styles.captureButton,
                          (!isReliable || isCapturing) && styles.captureButtonDisabled,
                        ]}
                        onPress={handleCaptureReading}
                        disabled={!isReliable || isCapturing}
                      >
                        {isCapturing ? (
                          <RotateCw size={18} color="#fff" />
                        ) : (
                          <Target size={18} color="#fff" />
                        )}
                        <Text style={styles.captureButtonText}>
                          {isCapturing ? 'Capturing...' : 'Capture Reading'}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                )}

              {currentStep === 'complete' && (
                <>
                  <GlassButton
                    variant="success"
                    size="md"
                    onPress={handleComplete}
                    icon={<Check size={18} color="#fff" />}
                    style={styles.fullWidthButton}
                  >
                    View Leveling Plan
                  </GlassButton>
                  <GlassButton
                    variant="default"
                    size="sm"
                    onPress={handleGoHome}
                    icon={<Home size={16} color="#fff" />}
                    style={[styles.fullWidthButton, { marginTop: 8 }]}
                  >
                    Go Home
                  </GlassButton>
                </>
              )}

              {currentStep !== 'complete' && (
                <GlassButton
                  variant="default"
                  size="sm"
                  onPress={() => setShowCancelConfirm(true)}
                  style={[styles.fullWidthButton, { marginTop: 10 }]}
                >
                  Cancel
                </GlassButton>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelConfirm(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalContent,
              { transform: [{ rotate: `${config.uiRotation}deg` }] },
            ]}
          >
            <Text style={styles.confirmModalTitle}>Cancel Calibration?</Text>
            <Text style={styles.confirmModalText}>
              Your calibration progress will be lost. Are you sure you want to cancel?
            </Text>
            <View style={styles.confirmModalButtons}>
              <GlassButton
                variant="primary"
                size="md"
                onPress={() => setShowCancelConfirm(false)}
                style={styles.confirmModalButton}
              >
                Continue Calibration
              </GlassButton>
              <GlassButton
                variant="danger"
                size="md"
                onPress={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                style={styles.confirmModalButton}
              >
                Cancel Anyway
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  content: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    // Top highlight effect
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
  },
  // Landscape layout for rotated steps
  // Container rotates -90°. Using 'column' so children stack top→bottom in container.
  // After rotation: my TOP→visual LEFT, my BOTTOM→visual RIGHT
  // User sees: my BOTTOM at their TOP, my TOP at their BOTTOM
  contentLandscape: {
    flexDirection: 'row', // Children arranged left to right (my view)
    width: 800, // After rotation = YOUR visual height (taller glass)
    height: 380, // After rotation = YOUR visual width (narrower, fits in viewport)
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Column style for landscape layout
  landscapeCol: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  landscapeColRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  landscapeDotsTop: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  landscapeTitleArea: {
    position: 'absolute',
    top: 55, // Position for title below dots on capture screens
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  landscapeTitleAreaNoDots: {
    position: 'absolute',
    top: 40, // Position for title on transition screens (no dots above)
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  landscapeTwoColumns: {
    position: 'absolute',
    top: 105, // Just after title ends (55 + ~50px title height)
    bottom: 136, // Just before buttons start (16 + ~120px button height)
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 100, // Spacing between phone and text box (vertical in user's view)
  },
  landscapeCenteredStack: {
    position: 'absolute',
    top: 80, // Below title area
    bottom: 120, // Above buttons area
    left: 60, // Increase left (user's bottom) to push centered content up
    right: 16,
    flexDirection: 'row', // Row becomes vertical stack after -90° rotation
    justifyContent: 'center', // Center the group vertically
    alignItems: 'center',
    gap: 140, // Space between phone and text box (rotation icon is attached to phone)
  },
  landscapeLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12, // Compensate for phoneIndicator's marginBottom:24 (24/2=12) to center phone visually
  },
  landscapeRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCardLandscape: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  landscapeButtonsArea: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButtonWrapperLandscape: {
    position: 'relative',
    width: 280,
    alignItems: 'center',
    marginBottom: 8,
  },
  captureGlowLandscape: {
    position: 'absolute',
    width: 280,
    height: 48,
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    opacity: 0,
  },
  captureButtonLandscapeWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    gap: 8,
    width: 280,
  },
  cancelButtonLandscapeWide: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
  },
  landscapeColContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  // Landscape-specific text styles
  titleLandscape: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleLandscape: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionLandscape: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Landscape button styles (stacked vertically from user's view)
  captureButtonLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    gap: 6,
    marginTop: 8,
  },
  cancelButtonLandscape: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCompact: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  subtitleCompact: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  instructionCardCompact: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginBottom: 12,
  },
  instructionCompact: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  landscapeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  captureButtonCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    gap: 6,
  },
  captureButtonTextCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButtonCompact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonTextCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressDotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  progressDotComplete: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  progressDotGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    opacity: 0.3,
    left: -6,
    top: -6,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  progressLineComplete: {
    backgroundColor: THEME.colors.success,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  phoneIndicator: {
    marginBottom: 12,
  },
  phoneBody: {
    width: 70,
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    padding: 4,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNotch: {
    position: 'absolute',
    top: 4,
    width: 22,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  phoneArrow: {
    fontSize: 28,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  phoneLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  // Large looping phone animation styles
  loopingPhoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
    position: 'relative',
  },
  phoneIndicatorLarge: {
    // No margin - container handles spacing
  },
  phoneBodyLarge: {
    width: 90,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    padding: 6,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  phoneScreenLarge: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNotchLarge: {
    position: 'absolute',
    top: 6,
    width: 30,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  phoneArrowLarge: {
    fontSize: 36,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  phoneLabelLarge: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  rotationArrowContainer: {
    position: 'absolute',
    right: -70,
    top: '48%',
    transform: [{ translateY: -16 }],
  },
  rotationArrow: {
    fontSize: 36,
    color: THEME.colors.primary,
    opacity: 0.7,
  },
  bubbleLevelContainer: {
    marginBottom: 20,
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: {
    width: '100%',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  qualityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quality_excellent: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  quality_good: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  quality_fair: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  quality_poor: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fullWidthButton: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  captureButtonWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  captureGlow: {
    position: 'absolute',
    width: '100%',
    height: 56,
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    opacity: 0,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    width: '100%',
    gap: 6,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Cancel confirmation modal styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmModalButtons: {
    gap: 10,
  },
  confirmModalButton: {
    width: '100%',
  },
});

export default CalibrationWizard;
