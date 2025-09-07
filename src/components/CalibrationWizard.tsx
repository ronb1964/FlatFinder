import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, H2, H3, Card, Progress, styled, ScrollView, View } from 'tamagui';
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
    instruction: 'Place your phone FLAT on a stable surface inside your RV. The TOP of your phone (where the camera is) must point toward the FRONT of your vehicle.',
    detailInstruction: '📱 Screen facing UP • Phone completely flat • Top edge pointing to vehicle front • Use a table or countertop',
    icon: Target,
  },
  {
    title: 'Step 2: Take First Reading',
    instruction: 'Without moving your phone, tap "Take Reading" below. Keep the phone perfectly still while we measure.',
    detailInstruction: '⚠️ Do not touch or move the phone • Wait for the reading to complete • This captures your baseline orientation',
    icon: RotateCw,
  },
  {
    title: 'Step 3: Rotate 90° Clockwise',
    instruction: 'Turn your phone 90 degrees to the RIGHT (clockwise). Keep it flat on the same surface. Then tap "Take Reading".',
    detailInstruction: '↻ Rotate like turning a steering wheel RIGHT • Keep phone flat • Same surface, just rotated • The right edge now points forward',
    rotationDirection: 'clockwise' as const,
    icon: RotateCw,
  },
  {
    title: 'Step 4: Final Rotation & Reading',
    instruction: 'Turn your phone another 90 degrees to the RIGHT (clockwise). Keep it flat. Tap "Take Reading" for the final measurement.',
    detailInstruction: '↻ One more 90° rotation RIGHT • Bottom edge now points forward • This completes 3 readings from different angles for best accuracy',
    rotationDirection: 'clockwise' as const,
    icon: Check,
  },
];

// Rotation Animation Component
const RotationIndicator = ({ direction }: { direction: 'clockwise' | 'counterclockwise' }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: direction === 'clockwise' ? 1 : -1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotation.start();
    return () => rotation.stop();
  }, [direction, rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', direction === 'clockwise' ? '90deg' : '-90deg'],
  });

  return (
    <View alignItems="center" marginVertical="$3">
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Smartphone size={40} color="$blue9" />
      </Animated.View>
      <Text fontSize="$3" color="$blue9" marginTop="$2" fontWeight="600">
        Turn phone 90° RIGHT →
      </Text>
      <Text fontSize="$2" color="$gray11" textAlign="center">
        Like turning a steering wheel right
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
    <Card 
      position="absolute" 
      top="$0" 
      left="$0" 
      right="$0" 
      bottom="$0"
      zIndex={1000}
      backgroundColor="$background" 
      borderColor="$borderColor" 
      borderWidth={2}
      borderRadius="$4"
      padding="$0"
      style={{
        transform: `rotate(${getRotationAngle()}deg)`,
        transition: 'transform 0.8s ease-in-out',
        overflow: 'hidden'
      }}
    >
      <YStack flex={1} space="$2">
      <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1, padding: 4, justifyContent: 'center'}}>
        <YStack space="$2" alignItems="center">
          
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
              {/* Header with minimal spacing */}
              <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$2" paddingVertical="$1">
                <H2 fontSize="$4">Device Calibration</H2>
                <Button size="$2" backgroundColor="$gray9" onPress={onCancel} fontSize="$2" height={24} marginLeft="$2">
                  Cancel
                </Button>
              </XStack>

      {/* Minimal Progress Bar */}
      <YStack space="$0.5" paddingHorizontal="$2" paddingVertical="$1">
        <XStack justifyContent="center" alignItems="center">
          <Text fontSize="$2" color="$colorPress" fontWeight="600">
            Step {currentStep + 1} of {CALIBRATION_STEPS.length}
          </Text>
        </XStack>
        
        <Progress value={progress} backgroundColor="$gray5" size="$0.5" height={2}>
          <Progress.Indicator backgroundColor="$green9" />
        </Progress>
      </YStack>

      {/* Minimal Step Instructions */}
      <Card padding="$2" backgroundColor="$blue2" borderColor="$blue6" borderWidth={1} borderRadius="$3" marginHorizontal="$2" marginVertical="$1">
        <YStack space="$1" alignItems="center">
          <XStack space="$1" alignItems="center">
            <YStack 
              backgroundColor="$blue3" 
              borderRadius="$3" 
              padding="$1"
              borderWidth={1}
              borderColor="$blue6"
            >
              <IconComponent size={14} color="$blue9" />
            </YStack>
            <H3 fontSize="$3" fontWeight="600" color="$color" textAlign="center">
              {currentStepData.title}
            </H3>
          </XStack>
          
          <Text fontSize="$2" color="$colorPress" textAlign="center" lineHeight="$2">
            {currentStepData.instruction}
          </Text>
          
          {/* Minimal Phone setup for step 1 */}
          {currentStep === 0 && (
            <YStack space="$0.5" alignItems="center" padding="$1" backgroundColor="$blue1" borderRadius="$2" borderWidth={1} borderColor="$blue5">
              <XStack space="$1" alignItems="center">
                <Smartphone size={10} color="$blue9" />
                <Text fontSize="$1" color="$blue9" fontWeight="600">
                  Setup
                </Text>
              </XStack>
              <Text fontSize="$1" color="$color" textAlign="center">
                📱 Flat • UP • Top → Front
              </Text>
            </YStack>
          )}
          
          {currentStepData.rotationDirection && (
            <RotationIndicator direction={currentStepData.rotationDirection} />
          )}
        </YStack>
      </Card>

      {/* Minimal Action Buttons */}
      <YStack space="$1" paddingHorizontal="$2" paddingVertical="$1" alignItems="center">
        {!hasStarted ? (
          // Start Calibration Button
          <Button
            size="$4"
            fontWeight="600"
            borderRadius="$3"
            onPress={handleStartCalibration}
            disabled={!isReliable}
            backgroundColor={!isReliable ? "$gray7" : "$green9"}
            color="white"
            pressStyle={{ 
              backgroundColor: !isReliable ? "$gray8" : "$green10",
              scale: 0.98
            }}
            height={40}
            minWidth={200}
          >
            🚀 Start Calibration
          </Button>
        ) : (
          // Sensor Status and Take Reading Button
          <>
            <Card padding="$1" backgroundColor="$gray2" borderColor={getStatusColor()} borderWidth={1} minWidth={180} marginBottom="$1">
              <Text fontSize="$2" color={getStatusColor()} textAlign="center" fontWeight="500">
                {getStatusText()}
              </Text>
              
              {!isReliable && (
                <Text fontSize="$1" color="#eab308" textAlign="center">
                  Waiting for sensors...
                </Text>
              )}
            </Card>
            
            {/* Take Reading Button */}
            <Button
              size="$4"
              fontWeight="600"
              borderRadius="$3"
              onPress={takeReading}
              disabled={!isReliable || isCollecting}
              backgroundColor={(!isReliable || isCollecting) ? "$gray7" : "$orange9"}
              color="white"
              pressStyle={{ 
                backgroundColor: (!isReliable || isCollecting) ? "$gray8" : "$orange10",
                scale: 0.98
              }}
              borderWidth={1}
              borderColor={(!isReliable || isCollecting) ? "$gray8" : "$orange10"}
              height={36}
              minWidth={180}
              marginTop={2}
            >
              <Text color="white" fontSize="$3" fontWeight="bold">
                {isCollecting ? '⏱️ Collecting...' : `📱 Take Reading ${readings.length + 1}`}
              </Text>
            </Button>
          </>
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
      </ScrollView>

      </YStack>
    </Card>
  );
}