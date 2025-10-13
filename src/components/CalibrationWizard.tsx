import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, H2, H3, Card, Progress, styled, ScrollView, View as TamaguiView } from 'tamagui';
import { Target, RotateCw, Check, AlertCircle, Star, Smartphone } from '@tamagui/lucide-icons';
import { RotatingViewport } from './RotatingViewport';
import { Animated, Platform, View } from 'react-native';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { BubbleLevel } from './BubbleLevel';
import {
  CalibrationReading,
  createCalibrationReading,
  calculateAverageCalibration,
  assessCalibrationQuality
} from '../lib/calibration';
import { sampleSensorData } from '../lib/sensorSampling';

import { Calibration } from '../lib/levelingMath';

interface CalibrationWizardProps {
  onComplete: (calibration: Calibration) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const InstructionCard = styled(Card, {
  padding: '$4',
  backgroundColor: '$blue2',
  borderColor: '$blue6',
  borderWidth: 1,
  borderRadius: '$4',
});

const CALIBRATION_STEPS = [
  {
    title: 'Step 1: Position Your Device',
    instruction: 'Place your phone FLAT on a stable surface inside your RV. The TOP of your phone (where the camera is) must point toward the FRONT of your vehicle. Don\'t worry if your phone has a camera bump - the calibration process will compensate for any tilt.',
    detailInstruction: '📱 Screen facing UP • Phone completely flat • Top edge pointing to vehicle front • Use a table or countertop',
    icon: Target,
  },
  {
    title: 'Step 2: Take First Reading',
    instruction: 'Without moving your phone, tap "Take Reading 1" below. Keep the phone perfectly still while we measure.',
    detailInstruction: '⚠️ Do not touch or move the phone • Wait for the reading to complete • This captures your baseline orientation',
    icon: RotateCw,
    showRotationWarning: true,
  },
  {
    title: 'Step 3: Take Second Reading',
    instruction: 'Without moving your phone, tap "Take Reading 2" below. Keep the phone perfectly still while we measure.',
    detailInstruction: '⚠️ Do not touch or move the phone • Wait for the reading to complete • This captures your rotated orientation',
    rotationDirection: 'clockwise' as const,
    icon: RotateCw,
    showRotationWarning: true,
  },
  {
    title: 'Step 4: Take Final Reading',
    instruction: 'Without moving your phone, tap "Take Final Reading" below. Keep the phone perfectly still while we measure. After this reading completes, you can rotate your phone back to normal orientation.',
    detailInstruction: '⚠️ Do not touch or move the phone • Wait for the reading to complete • Final step - then you can return phone to normal position',
    rotationDirection: 'clockwise' as const,
    rotationDegrees: 180,
    icon: Check,
  },
];

// Rotation Animation Component with curved arrow
const RotationIndicator = ({
  direction,
  degrees = 90,
  startDegrees = 0,
  showCheckmark = false,
  compact = false
}: {
  direction: 'clockwise' | 'counterclockwise';
  degrees?: number;
  startDegrees?: number;
  showCheckmark?: boolean;
  compact?: boolean;
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.sequence([
        // Rotate from start to end position
        Animated.timing(rotateValue, {
          toValue: direction === 'clockwise' ? 1 : -1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Show checkmark if this is the final step
        ...(showCheckmark ? [
          Animated.timing(checkmarkOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(400),
          Animated.timing(checkmarkOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ] : [Animated.delay(600)]),
        // Instantly snap back to start position
        Animated.timing(rotateValue, {
          toValue: 0,
          duration: 0, // Instant reset
          useNativeDriver: true,
        }),
        // Pause before repeating
        Animated.delay(400),
      ])
    );
    rotation.start();
    return () => rotation.stop();
  }, [direction, rotateValue, checkmarkOpacity, showCheckmark]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: [`${startDegrees}deg`, `${startDegrees + (direction === 'clockwise' ? degrees : -degrees)}deg`],
  });

  return (
    <TamaguiView alignItems="center" marginVertical={compact ? "$0.5" : "$2"}>
      {/* Curved arrow pointing clockwise */}
      {!compact && (
        <Text fontSize={32} marginBottom="$1">
          ↻
        </Text>
      )}
      <TamaguiView position="relative" alignItems="center" justifyContent="center">
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Smartphone size={48} color="#6366f1" strokeWidth={2} />
        </Animated.View>
        {/* Green checkmark that appears at rotated position */}
        {showCheckmark && (
          <Animated.View
            style={{
              position: 'absolute',
              opacity: checkmarkOpacity,
            }}
          >
            <Text fontSize={32} color="#22c55e">✓</Text>
          </Animated.View>
        )}
      </TamaguiView>
      {!compact && (
        <Text fontSize="$3" color="#6366f1" marginTop="$2" fontWeight="700">
          Rotate {degrees}° clockwise
        </Text>
      )}
    </TamaguiView>
  );
};

export function CalibrationWizard({ onComplete, onCancel, isVisible }: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [pose, setPose] = useState<0 | 1 | 2 | 3>(0);
  const [readings, setReadings] = useState<CalibrationReading[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalCalibration, setFinalCalibration] = useState<Calibration | null>(null);
  const [calibrationQuality, setCalibrationQuality] = useState<ReturnType<typeof assessCalibrationQuality> | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showMotionWarning, setShowMotionWarning] = useState(false);
  const [lastVariance, setLastVariance] = useState<{ pitch: number; roll: number } | null>(null);

  const { pitchDeg, rollDeg, isReliable, errorMessage } = useDeviceAttitude();
  const collectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const progress = ((currentStep + 1) / CALIBRATION_STEPS.length) * 100;
  const currentStepData = CALIBRATION_STEPS[currentStep];
  const IconComponent = currentStepData.icon;

  useEffect(() => {
    if (!isVisible) {
      // Reset state when wizard is hidden
      setCurrentStep(0);
      setReadings([]);
      setPose(0);
      setIsCollecting(false);
      setHasStarted(false);
      setIsComplete(false);
      setFinalCalibration(null);
      if (collectingTimeoutRef.current) {
        clearTimeout(collectingTimeoutRef.current);
      }
    }
  }, [isVisible]);

  // DEV MODE: Keyboard shortcuts for testing rotation in browser (Firefox)
  useEffect(() => {
    if (Platform.OS !== 'web' || !isVisible) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 0, 1, 2, 3 to jump to poses
      if (e.key === '0') setPose(0);
      if (e.key === '1') setPose(1);
      if (e.key === '2') setPose(2);
      if (e.key === '3') setPose(3);

      // Press 'r' to reset everything
      if (e.key === 'r') {
        setPose(0);
        setCurrentStep(0);
        setReadings([]);
        setHasStarted(false);
        setIsComplete(false);
        setIsCollecting(false);
      }

      // Press 's' to simulate a sensor reading with sampling
      if (e.key === 's' && hasStarted && !isCollecting) {
        console.log('DEV MODE: Simulating sensor reading with sampling');
        takeReading();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, hasStarted, isCollecting, readings]);

  const handleStartCalibration = () => {
    console.log('Starting calibration - sensor state:', { isReliable, pitchDeg, rollDeg });
    setHasStarted(true);
    setCurrentStep(1); // Move to first reading step
  };

  const takeReading = async () => {
    // On web (dev mode), allow readings even without sensors
    if (Platform.OS !== 'web' && !isReliable) {
      return;
    }

    setIsCollecting(true);
    setShowMotionWarning(false);

    try {
      // Sample sensor data over 1 second with filtering and variance check
      const sampledData = await sampleSensorData(
        () => {
          // Use fake data on web if sensors aren't available
          if (Platform.OS === 'web' && !isReliable) {
            return {
              pitch: Math.random() * 2 - 1,
              roll: Math.random() * 2 - 1
            };
          }
          return { pitch: pitchDeg, roll: rollDeg };
        },
        {
          durationMs: 1000,
          intervalMs: 50,
          useMedianFilter: true,
          outlierThreshold: 0.1,
          varianceThreshold: 0.05 // Maximum acceptable variance for stable reading
        }
      );

      console.log(`Sampled ${sampledData.sampleCount} readings over ${sampledData.durationMs}ms`);
      console.log(`Filtered result: pitch=${sampledData.pitch.toFixed(3)}°, roll=${sampledData.roll.toFixed(3)}°`);
      console.log(`Variance: pitch=${sampledData.pitchVariance.toFixed(4)}°², roll=${sampledData.rollVariance.toFixed(4)}°² | Stable: ${sampledData.isStable}`);

      setLastVariance({ pitch: sampledData.pitchVariance, roll: sampledData.rollVariance });

      // Check if device was moving during reading
      if (!sampledData.isStable) {
        setIsCollecting(false);
        setShowMotionWarning(true);

        if (retryCount < 2) {
          // Allow retry
          setRetryCount(prev => prev + 1);
          console.warn(`Reading unstable (retry ${retryCount + 1}/2). Please hold device steady.`);
          return;
        } else {
          // Max retries reached
          console.error('Max retries reached. Device too unstable for calibration.');
          return;
        }
      }

      // Reading is stable - reset retry count and proceed
      setRetryCount(0);
      setShowMotionWarning(false);

      const newReading = createCalibrationReading(sampledData.pitch, sampledData.roll);
      const updatedReadings = [...readings, newReading];

      setReadings(updatedReadings);
      setIsCollecting(false);

      // Advance pose for next reading
      if (updatedReadings.length === 1) {
        setPose(1); // After first reading, user rotates device 90° CW
      } else if (updatedReadings.length === 2) {
        setPose(2); // After second reading, user rotates device another 90° CW
      }
      // Optional: setPose(3) for 270° rotation if implementing 4th reading

      // Assess quality after each reading
      const quality = assessCalibrationQuality(updatedReadings);
      setCalibrationQuality(quality);

      if (updatedReadings.length >= 3) {
        // Calculate final calibration using enhanced averaging
        const calibration = calculateAverageCalibration(updatedReadings);

        // Debug logging
        console.log('=== CALIBRATION DEBUG ===');
        console.log('Raw readings taken:', updatedReadings);
        console.log('Calculated calibration offsets:', calibration);
        console.log('Will apply offsets:', {
          pitch: calibration.pitchOffsetDegrees,
          roll: calibration.rollOffsetDegrees
        });

        // Set completion state instead of immediately completing
        setFinalCalibration(calibration);
        setIsComplete(true);
      } else {
        // Move to next step
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sampling sensor data:', error);
      setIsCollecting(false);
    }
  };

  const getStatusColor = () => {
    if (!isReliable) return '#ef4444';
    if (isCollecting) return '#eab308';
    return '#22c55e';
  };

  const getStatusText = () => {
    if (!isReliable) return 'Waiting for sensor data...';
    if (isCollecting) return 'Collecting reading...';
    return `Reading ${readings.length + 1} of 3`;
  };

  // Debug sensor state
  console.log('Calibration Wizard - Sensor State:', {
    isReliable,
    isCollecting,
    pitchDeg,
    rollDeg,
    buttonDisabled: (!isReliable || isCollecting)
  });

  // Map pose to rotation angle for RotatingViewport
  const rotationAngle = (pose * 90) as 0 | 90 | 180 | 270;

  const handleContinue = () => {
    if (finalCalibration) {
      onComplete(finalCalibration);
      // This will close the calibration wizard and return to the calling screen
    }
  };

  if (!isVisible) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={1000}
      backgroundColor="$background"
    >
      {/* DEV MODE: Visual pose indicator (bottom-left, web only) - moved so it doesn't hide cancel */}
      {Platform.OS === 'web' && (
        <TamaguiView
          position="absolute"
          bottom={10}
          left={10}
          zIndex={2000}
          backgroundColor="rgba(99, 102, 241, 0.8)"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
        >
          <Text fontSize="$1" color="white" fontWeight="bold">
            P{pose} {rotationAngle}° | 0-3/S/R
          </Text>
        </TamaguiView>
      )}

      <RotatingViewport angleDeg={rotationAngle}>
        <YStack flex={1} padding={pose === 1 ? "$2" : "$3"} space={pose === 1 ? "$1.5" : "$3"}>
          <ScrollView flex={1} showsVerticalScrollIndicator={false} scrollEnabled={pose !== 1}>
            <YStack space={pose === 1 ? "$2" : "$3"} paddingBottom="$2">

          {/* Header with Cancel button - hide on completion */}
          <XStack justifyContent="space-between" alignItems="center">
            <H2 fontSize="$6" color="white">Calibration</H2>
            {!isComplete && (
              <Button
                size="$2"
                backgroundColor="rgba(239, 68, 68, 0.2)"
                color="#ef4444"
                borderWidth={1}
                borderColor="rgba(239, 68, 68, 0.4)"
                onPress={onCancel}
                pressStyle={{ scale: 0.95, backgroundColor: "rgba(239, 68, 68, 0.3)" }}
              >
                Cancel
              </Button>
            )}
          </XStack>

          {/* Completion Screen */}
          {isComplete ? (
            <YStack space="$4" alignItems="center" paddingVertical="$6">
              <YStack 
                backgroundColor="$green3" 
                borderRadius="$8" 
                padding="$4"
                borderWidth={1}
                borderColor="$green6"
                alignItems="center"
              >
                <Check size={48} color="$green9" />
              </YStack>
              
              <H2 color="$green9" textAlign="center">
                Calibration Complete!
              </H2>
              
              <Text fontSize="$4" color="$colorPress" textAlign="center" lineHeight="$5">
                Your device has been successfully calibrated for accurate leveling measurements.
              </Text>
              
              {calibrationQuality && (
                <Card 
                  padding="$3" 
                  backgroundColor={calibrationQuality.quality === 'excellent' || calibrationQuality.quality === 'good' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)'}
                  borderColor={calibrationQuality.quality === 'excellent' || calibrationQuality.quality === 'good' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}
                  borderWidth={1}
                  alignSelf="stretch"
                >
                  <XStack space="$2" alignItems="center" justifyContent="center">
                    <Star size={16} color={calibrationQuality.quality === 'excellent' || calibrationQuality.quality === 'good' ? '#22c55e' : '#eab308'} />
                    <Text 
                      fontSize="$3" 
                      fontWeight="600"
                      color={calibrationQuality.quality === 'excellent' || calibrationQuality.quality === 'good' ? '#22c55e' : '#eab308'}
                    >
                      Quality: {calibrationQuality.quality} ({Math.round(calibrationQuality.confidence * 100)}%)
                    </Text>
                  </XStack>
                </Card>
              )}

            </YStack>
          ) : (
            <>

      {/* Progress Bar */}
      <YStack space="$1.5" marginTop={pose === 1 ? "$1" : "$3"} marginBottom={pose === 1 ? "$2" : "$4"}>
        <Text fontSize="$3" color="rgba(255, 255, 255, 0.7)" fontWeight="600" textAlign="center">
          Step {currentStep + 1} of {CALIBRATION_STEPS.length}
        </Text>

        <Progress value={progress} backgroundColor="rgba(255, 255, 255, 0.1)" size="$1">
          <Progress.Indicator backgroundColor="$green9" />
        </Progress>
      </YStack>

      {/* Step Instructions - Two-column layout for landscape (pose 1) */}
      {pose === 1 ? (
        // LANDSCAPE LAYOUT: Main instructions left, rotation info right (equal heights)
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          width: '100%',
          gap: 8
        }}>
          {/* LEFT: Main step instructions */}
          <View style={{ flex: 1 }}>
            <Card flex={1} padding="$2.5" backgroundColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.3)" borderWidth={2} borderRadius="$4">
              <YStack flex={1} space="$1.5" justifyContent="center">
                <XStack space="$2" alignItems="center">
                  <YStack
                    backgroundColor="rgba(59, 130, 246, 0.2)"
                    borderRadius="$3"
                    padding="$2"
                    borderWidth={1}
                    borderColor="rgba(59, 130, 246, 0.4)"
                  >
                    <IconComponent size={20} color="#3b82f6" />
                  </YStack>
                  <H3 fontSize="$4" fontWeight="700" color="white" flex={1}>
                    {currentStepData.title}
                  </H3>
                </XStack>

                <Text fontSize="$2" color="rgba(255, 255, 255, 0.9)" lineHeight="$3">
                  {currentStepData.instruction}
                </Text>
              </YStack>
            </Card>
          </View>

          {/* RIGHT: Rotation animation and instructions */}
          <View style={{ flex: 1 }}>
            <Card flex={1} padding="$2.5" backgroundColor="rgba(99, 102, 241, 0.15)" borderColor="rgba(99, 102, 241, 0.4)" borderWidth={2} borderRadius="$4">
              <YStack flex={1} space="$1.5" alignItems="center" justifyContent="center">
                <RotationIndicator direction="clockwise" degrees={90} startDegrees={90} compact={false} />
                <Text fontSize="$2" color="#818cf8" fontWeight="700" textAlign="center">
                  After this reading:
                </Text>
                <Text fontSize="$2" color="rgba(255, 255, 255, 0.9)" fontWeight="600" textAlign="center">
                  Turn 90° clockwise
                </Text>
                <Text fontSize="$1" color="rgba(255, 255, 255, 0.7)" textAlign="center">
                  Landscape → Upside-down
                </Text>
              </YStack>
            </Card>
          </View>
        </View>
      ) : (
        // PORTRAIT LAYOUT: Standard vertical stacking
        <Card padding="$3" backgroundColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.3)" borderWidth={2} borderRadius="$4">
          <YStack space="$2" alignItems="center">
            <XStack space="$3" alignItems="center">
              <YStack
                backgroundColor="rgba(59, 130, 246, 0.2)"
                borderRadius="$4"
                padding="$3"
                borderWidth={1}
                borderColor="rgba(59, 130, 246, 0.4)"
              >
                <IconComponent size={24} color="#3b82f6" />
              </YStack>
              <H3 fontSize="$5" fontWeight="700" color="white" textAlign="center" flex={1}>
                {currentStepData.title}
              </H3>
            </XStack>

            <Text fontSize="$4" color="rgba(255, 255, 255, 0.9)" textAlign="center" lineHeight="$5">
              {currentStepData.instruction}
            </Text>

            {/* Phone setup for step 1 */}
            {currentStep === 0 && (
              <YStack space="$1.5" alignItems="center" padding="$2" backgroundColor="rgba(59, 130, 246, 0.05)" borderRadius="$3" borderWidth={1} borderColor="rgba(59, 130, 246, 0.2)">
                <XStack space="$1.5" alignItems="center">
                  <Smartphone size={16} color="#3b82f6" />
                  <Text fontSize="$3" color="#3b82f6" fontWeight="700">
                    Phone Setup
                  </Text>
                </XStack>
                <Text fontSize="$2" color="rgba(255, 255, 255, 0.8)" textAlign="center">
                  📱 Screen UP • Flat on surface • Top edge ↑ Vehicle front
                </Text>
              </YStack>
            )}

            {/* Rotation Instructions for Steps 2 and 3 */}
            {(currentStep === 1 || currentStep === 2) && currentStepData.showRotationWarning && (
              <Card padding="$2.5" backgroundColor="rgba(99, 102, 241, 0.15)" borderWidth={2} borderColor="rgba(99, 102, 241, 0.4)">
                <YStack space="$1.5" alignItems="center">
                  <Text fontSize="$4" color="#818cf8" fontWeight="700" textAlign="center">
                    After this reading:
                  </Text>
                  <Text fontSize="$4" color="rgba(255, 255, 255, 0.9)" textAlign="center" fontWeight="600">
                    Turn your phone 90° clockwise
                  </Text>
                  <RotationIndicator direction="clockwise" degrees={90} startDegrees={0} />
                  <Text fontSize="$3" color="rgba(255, 255, 255, 0.7)" textAlign="center" lineHeight="$4">
                    Keep it flat • Screen will rotate to stay readable
                  </Text>
                </YStack>
              </Card>
            )}

            {/* Show rotation indicator only if NOT already shown in purple box */}
            {currentStepData.rotationDirection && !currentStepData.showRotationWarning && (
              <RotationIndicator
                direction={currentStepData.rotationDirection}
                degrees={(currentStepData as any).rotationDegrees || 90}
                startDegrees={currentStep === 3 ? 180 : 0}
                showCheckmark={currentStep === 3}
              />
            )}
          </YStack>
        </Card>
      )}

      {/* Sensor Status Card - hide in landscape to save vertical space */}
      {hasStarted && !isComplete && pose === 0 && (
        <Card padding="$2" backgroundColor="rgba(255, 255, 255, 0.05)" borderColor={getStatusColor()} borderWidth={2} borderRadius="$3" marginTop="$3">
          <Text fontSize="$3" color={getStatusColor()} textAlign="center" fontWeight="600">
            {getStatusText()}
          </Text>

          {!isReliable && (
            <Text fontSize="$2" color="#eab308" textAlign="center" marginTop="$1">
              Waiting for sensors...
            </Text>
          )}
        </Card>
      )}

      {/* Motion Warning Card */}
      {showMotionWarning && !isComplete && (
        <Card
          padding="$3"
          backgroundColor="rgba(239, 68, 68, 0.1)"
          borderColor="rgba(239, 68, 68, 0.4)"
          borderWidth={2}
          borderRadius="$4"
          marginTop="$3"
        >
          <XStack space="$2" alignItems="center" marginBottom="$2">
            <AlertCircle size={20} color="#ef4444" />
            <Text fontSize="$4" color="#ef4444" fontWeight="700">
              Device Movement Detected
            </Text>
          </XStack>

          <Text fontSize="$3" color="rgba(255, 255, 255, 0.9)" lineHeight="$4" marginBottom="$2">
            {retryCount < 2
              ? `Please hold your device perfectly still during readings. Retry ${retryCount}/2.`
              : 'Max retries reached. Device is too unstable for accurate calibration.'}
          </Text>

          {lastVariance && (
            <Text fontSize="$2" color="rgba(255, 255, 255, 0.6)" marginBottom="$3">
              Variance: Pitch {lastVariance.pitch.toFixed(4)}°² | Roll {lastVariance.roll.toFixed(4)}°² (max: 0.05°²)
            </Text>
          )}

          {retryCount < 2 ? (
            <Button
              size="$3"
              backgroundColor="#f59e0b"
              color="white"
              onPress={takeReading}
              borderRadius="$3"
              fontWeight="600"
            >
              Retry Reading
            </Button>
          ) : (
            <Button
              size="$3"
              backgroundColor="#ef4444"
              color="white"
              onPress={() => {
                // Reset everything and restart calibration
                setRetryCount(0);
                setShowMotionWarning(false);
                setReadings([]);
                setCurrentStep(0);
                setPose(0);
                setHasStarted(false);
                setIsCollecting(false);
              }}
              borderRadius="$3"
              fontWeight="600"
            >
              Restart Calibration
            </Button>
          )}
        </Card>
      )}

      {/* Calibration Quality Indicator - hide in landscape to save vertical space */}
      {calibrationQuality && readings.length >= 2 && pose === 0 && (
        <Card 
          padding="$3" 
          marginTop="$4"
          backgroundColor={
            calibrationQuality.quality === 'excellent' ? 'rgba(34, 197, 94, 0.1)' :
            calibrationQuality.quality === 'good' ? 'rgba(34, 197, 94, 0.05)' :
            calibrationQuality.quality === 'fair' ? 'rgba(234, 179, 8, 0.1)' :
            'rgba(239, 68, 68, 0.1)'
          }
          borderColor={
            calibrationQuality.quality === 'excellent' ? 'rgba(34, 197, 94, 0.3)' :
            calibrationQuality.quality === 'good' ? 'rgba(34, 197, 94, 0.2)' :
            calibrationQuality.quality === 'fair' ? 'rgba(234, 179, 8, 0.3)' :
            'rgba(239, 68, 68, 0.3)'
          }
          borderWidth={1}
        >
          <XStack space="$2" alignItems="center" marginBottom="$2">
            <Star 
              size={16} 
              color={
                calibrationQuality.quality === 'excellent' ? '#22c55e' :
                calibrationQuality.quality === 'good' ? '#22c55e' :
                calibrationQuality.quality === 'fair' ? '#eab308' :
                '#ef4444'
              }
            />
            <Text 
              fontSize="$3" 
              fontWeight="600"
              color={
                calibrationQuality.quality === 'excellent' ? '#22c55e' :
                calibrationQuality.quality === 'good' ? '#22c55e' :
                calibrationQuality.quality === 'fair' ? '#eab308' :
                '#ef4444'
              }
            >
              Quality: {calibrationQuality.quality} ({Math.round(calibrationQuality.confidence * 100)}%)
            </Text>
          </XStack>
          
          <Text fontSize="$2" color="#94a3b8">
            {calibrationQuality.recommendation}
          </Text>
          
          {calibrationQuality.issues.length > 0 && (
            <YStack marginTop="$2" space="$1">
              {calibrationQuality.issues.map((issue, index) => (
                <Text key={index} fontSize="$2" color="#ef4444">
                  • {issue}
                </Text>
              ))}
            </YStack>
          )}
        </Card>
      )}
            </>
          )}
            </YStack>
          </ScrollView>

          {/* Button at bottom - stays within rotated content */}
          <YStack
            paddingVertical="$3"
            paddingHorizontal="$4"
            borderTopWidth={2}
            borderTopColor="rgba(255, 255, 255, 0.3)"
          >
          {isComplete ? (
            <Button
              size="$5"
              fontWeight="600"
              borderRadius="$4"
              width="100%"
              onPress={handleContinue}
              backgroundColor="$green9"
              color="#ffffff"
              borderWidth={0}
              pressStyle={{
                backgroundColor: "rgba(34, 197, 94, 0.8)",
                scale: 0.98
              }}
            >
              Continue
            </Button>
          ) : !hasStarted ? (
            <Button
              size="$5"
              fontWeight="700"
              borderRadius="$4"
              width="100%"
              onPress={handleStartCalibration}
              disabled={Platform.OS !== 'web' && !isReliable}
              backgroundColor={(Platform.OS !== 'web' && !isReliable) ? "rgba(156, 163, 175, 0.3)" : "#f59e0b"}
              color="white"
              pressStyle={{
                backgroundColor: (Platform.OS !== 'web' && !isReliable) ? "rgba(156, 163, 175, 0.4)" : "#d97706",
                scale: 0.97
              }}
              borderWidth={2}
              borderColor={(Platform.OS !== 'web' && !isReliable) ? "rgba(156, 163, 175, 0.5)" : "rgba(245, 158, 11, 0.6)"}
            >
              <Text color="white" fontSize="$4" fontWeight="bold">
                Next
              </Text>
            </Button>
          ) : (
            <Button
              size="$5"
              fontWeight="700"
              borderRadius="$4"
              width="100%"
              onPress={takeReading}
              disabled={(Platform.OS !== 'web' && !isReliable) || isCollecting}
              backgroundColor={((Platform.OS !== 'web' && !isReliable) || isCollecting) ? "rgba(156, 163, 175, 0.3)" : "#f59e0b"}
              color="white"
              pressStyle={{
                backgroundColor: ((Platform.OS !== 'web' && !isReliable) || isCollecting) ? "rgba(156, 163, 175, 0.4)" : "#d97706",
                scale: 0.97
              }}
              borderWidth={2}
              borderColor={((Platform.OS !== 'web' && !isReliable) || isCollecting) ? "rgba(156, 163, 175, 0.5)" : "rgba(245, 158, 11, 0.6)"}
            >
              <Text color="white" fontSize="$5" fontWeight="bold">
                {isCollecting ? '⏱️ Collecting...' : readings.length === 2 ? '📱 Take Final Reading' : `📱 Take Reading ${readings.length + 1}`}
              </Text>
            </Button>
          )}
          </YStack>
        </YStack>
      </RotatingViewport>
    </YStack>
  );
}