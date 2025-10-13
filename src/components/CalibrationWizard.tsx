import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, H2, H3, Card, Progress, styled, ScrollView, View, useTheme } from 'tamagui';
import { Target, RotateCw, Check, AlertCircle, Star, Smartphone } from '@tamagui/lucide-icons';
import { Animated } from 'react-native';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { BubbleLevel } from './BubbleLevel';
import { 
  CalibrationReading, 
  createCalibrationReading, 
  calculateAverageCalibration,
  assessCalibrationQuality 
} from '../lib/calibration';

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
const RotationIndicator = ({ direction, degrees = 90, showCheckmark = false }: { direction: 'clockwise' | 'counterclockwise'; degrees?: number; showCheckmark?: boolean }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.sequence([
        // Rotate clockwise
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
        // Instantly snap back to portrait
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
    outputRange: ['0deg', direction === 'clockwise' ? `${degrees}deg` : `-${degrees}deg`],
  });

  return (
    <View alignItems="center" marginVertical="$2">
      {/* Curved arrow pointing clockwise */}
      <Text fontSize={32} marginBottom="$1">
        ↻
      </Text>
      <View position="relative" alignItems="center" justifyContent="center">
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
      </View>
      <Text fontSize="$3" color="#6366f1" marginTop="$2" fontWeight="700">
        Rotate {degrees}° clockwise
      </Text>
    </View>
  );
};

export function CalibrationWizard({ onComplete, onCancel, isVisible }: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readings, setReadings] = useState<CalibrationReading[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalCalibration, setFinalCalibration] = useState<Calibration | null>(null);
  const [calibrationQuality, setCalibrationQuality] = useState<ReturnType<typeof assessCalibrationQuality> | null>(null);
  
  const { pitchDeg, rollDeg, isReliable, errorMessage } = useDeviceAttitude();
  const theme = useTheme();
  const collectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const progress = ((currentStep + 1) / CALIBRATION_STEPS.length) * 100;
  const currentStepData = CALIBRATION_STEPS[currentStep];
  const IconComponent = currentStepData.icon;

  useEffect(() => {
    if (!isVisible) {
      // Reset state when wizard is hidden
      setCurrentStep(0);
      setReadings([]);
      setIsCollecting(false);
      setHasStarted(false);
      setIsComplete(false);
      setFinalCalibration(null);
      if (collectingTimeoutRef.current) {
        clearTimeout(collectingTimeoutRef.current);
      }
    }
  }, [isVisible]);

  const handleStartCalibration = () => {
    console.log('Starting calibration - sensor state:', { isReliable, pitchDeg, rollDeg });
    setHasStarted(true);
    setCurrentStep(1); // Move to first reading step
  };

  const takeReading = () => {
    if (!isReliable) {
      return;
    }

    setIsCollecting(true);
    
    // Collect reading after a short delay to ensure device is stable
    collectingTimeoutRef.current = setTimeout(() => {
      const newReading = createCalibrationReading(pitchDeg, rollDeg);
      const updatedReadings = [...readings, newReading];
      
      setReadings(updatedReadings);
      setIsCollecting(false);
      
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
    }, 1000);
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

  // Get rotation angle based on current step - continue counterclockwise rotation
  const getRotationAngle = () => {
    if (isComplete) return -180; // Completion: Keep upside down until continue pressed
    if (!hasStarted) return 0; // Normal orientation for intro
    if (currentStep === 1) return 0; // Step 1: Normal orientation
    if (currentStep === 2) return -90; // Step 2: Rotate UI counter-clockwise
    if (currentStep === 3) return -180; // Step 3: Continue counter-clockwise (270° total = -180°)
    return 0;
  };

  const handleContinue = () => {
    if (finalCalibration) {
      onComplete(finalCalibration);
      // This will close the calibration wizard and return to the calling screen
    }
  };

  if (!isVisible) return null;

  return (
    <View
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={1000}
      backgroundColor={theme.background?.val || '#000'}
      style={{
        overflow: 'hidden'
      }}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: theme.background?.val || '#000',
          transform: `rotate(${getRotationAngle()}deg)`,
          transition: 'transform 0.8s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <YStack flex={1} space="$2" backgroundColor={theme.background?.val || '#000'} padding="$2" justifyContent="space-between">
            <YStack space="$2" flex={1} justifyContent="center">
          
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
              
              <YStack space="$3" alignSelf="stretch" paddingHorizontal="$4">
                <Button
                  size="$5"
                  fontWeight="600"
                  borderRadius="$4"
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
                
                <Button
                  size="$3"
                  backgroundColor="transparent"
                  color="$gray11"
                  onPress={onCancel}
                >
                  Back to Profiles
                </Button>
              </YStack>
            </YStack>
          ) : (
            <>
              {/* Header */}
              <XStack justifyContent="space-between" alignItems="center" paddingBottom="$1">
                <H2 fontSize="$6" color="white">Device Calibration</H2>
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
              </XStack>

      {/* Progress Bar */}
      <YStack space="$1">
        <Text fontSize="$3" color="rgba(255, 255, 255, 0.7)" fontWeight="600" textAlign="center">
          Step {currentStep + 1} of {CALIBRATION_STEPS.length}
        </Text>

        <Progress value={progress} backgroundColor="rgba(255, 255, 255, 0.1)" size="$0.5">
          <Progress.Indicator backgroundColor="$green9" />
        </Progress>
      </YStack>

      {/* Step Instructions */}
      <Card padding="$2.5" backgroundColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.3)" borderWidth={2} borderRadius="$4">
        <YStack space="$2" alignItems="center">
          <XStack space="$3" alignItems="center">
            <YStack
              backgroundColor="rgba(59, 130, 246, 0.2)"
              borderRadius="$4"
              padding={getRotationAngle() !== 0 ? "$2" : "$3"}
              borderWidth={1}
              borderColor="rgba(59, 130, 246, 0.4)"
            >
              <IconComponent size={getRotationAngle() !== 0 ? 20 : 24} color="#3b82f6" />
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
            <YStack space="$1.5" alignItems="center" padding="$2.5" backgroundColor="rgba(99, 102, 241, 0.15)" borderRadius="$4" borderWidth={2} borderColor="rgba(99, 102, 241, 0.4)">
              <Text fontSize="$4" color="#818cf8" fontWeight="700" textAlign="center">
                After this reading:
              </Text>
              <Text fontSize="$4" color="rgba(255, 255, 255, 0.9)" textAlign="center" fontWeight="600">
                Turn your phone 90° clockwise
              </Text>
              {/* Animated rotation indicator */}
              <RotationIndicator direction="clockwise" />
              <Text fontSize="$3" color="rgba(255, 255, 255, 0.7)" textAlign="center" lineHeight="$4">
                Keep it flat • Screen will rotate to stay readable
              </Text>
            </YStack>
          )}

          {/* Show rotation indicator only if NOT already shown in purple box */}
          {currentStepData.rotationDirection && !currentStepData.showRotationWarning && (
            <RotationIndicator
              direction={currentStepData.rotationDirection}
              degrees={(currentStepData as any).rotationDegrees || 90}
              showCheckmark={currentStep === 3}
            />
          )}
        </YStack>
      </Card>

      {/* Action Buttons */}
      <YStack space="$2" paddingTop="$1">
        {!hasStarted ? (
          // Next Button (Step 1)
          <Button
            size="$5"
            fontWeight="700"
            borderRadius="$4"
            onPress={handleStartCalibration}
            disabled={!isReliable}
            backgroundColor={!isReliable ? "rgba(156, 163, 175, 0.3)" : "#f59e0b"}
            color="white"
            pressStyle={{
              backgroundColor: !isReliable ? "rgba(156, 163, 175, 0.4)" : "#d97706",
              scale: 0.97
            }}
            borderWidth={2}
            borderColor={!isReliable ? "rgba(156, 163, 175, 0.5)" : "rgba(245, 158, 11, 0.6)"}
          >
            <Text color="white" fontSize="$4" fontWeight="bold">
              Next
            </Text>
          </Button>
        ) : (
          // Sensor Status and Take Reading Button
          <YStack space="$2">
            <Card padding="$2" backgroundColor="rgba(255, 255, 255, 0.05)" borderColor={getStatusColor()} borderWidth={2} borderRadius="$3">
              <Text fontSize="$3" color={getStatusColor()} textAlign="center" fontWeight="600">
                {getStatusText()}
              </Text>

              {!isReliable && (
                <Text fontSize="$2" color="#eab308" textAlign="center" marginTop="$1">
                  Waiting for sensors...
                </Text>
              )}
            </Card>

            {/* Take Reading Button */}
            <Button
              size="$5"
              fontWeight="700"
              borderRadius="$4"
              onPress={takeReading}
              disabled={!isReliable || isCollecting}
              backgroundColor={(!isReliable || isCollecting) ? "rgba(156, 163, 175, 0.3)" : "#f59e0b"}
              color="white"
              pressStyle={{
                backgroundColor: (!isReliable || isCollecting) ? "rgba(156, 163, 175, 0.4)" : "#d97706",
                scale: 0.97
              }}
              borderWidth={2}
              borderColor={(!isReliable || isCollecting) ? "rgba(156, 163, 175, 0.5)" : "rgba(245, 158, 11, 0.6)"}
            >
              <Text color="white" fontSize="$5" fontWeight="bold">
                {isCollecting ? '⏱️ Collecting...' : readings.length === 2 ? '📱 Take Final Reading' : `📱 Take Reading ${readings.length + 1}`}
              </Text>
            </Button>
          </YStack>
        )}
      </YStack>


      {/* Calibration Quality Indicator with proper spacing */}
      {calibrationQuality && readings.length >= 2 && (
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
        </YStack>
      </View>
    </View>
  );
}