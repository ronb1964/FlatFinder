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

const Container = styled(YStack, {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
});

const InstructionCard = styled(Card, {
  padding: '$5',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderRadius: '$4',
});

const CALIBRATION_STEPS = [
  {
    title: 'Position Your Device',
    instruction: 'Place your phone flat on a stable surface inside your RV. IMPORTANT: The TOP of your phone should be pointing toward the FRONT of your RV.',
    detailInstruction: 'Screen up, phone flat, top edge facing forward. This orientation is critical for accurate measurements.',
    icon: Target,
  },
  {
    title: 'First Reading',
    instruction: 'Keep your phone perfectly still in this position and press "Take Reading" to capture the first measurement.',
    detailInstruction: 'Don\'t move or touch the phone while the reading is being taken.',
    icon: RotateCw,
  },
  {
    title: 'Rotate & Read',
    instruction: 'Rotate your phone 90 degrees clockwise (like turning a steering wheel right) while keeping it flat on the surface.',
    detailInstruction: 'The phone should still be flat, just facing a different direction. Then take the second reading.',
    rotationDirection: 'clockwise' as const,
    icon: RotateCw,
  },
  {
    title: 'Final Reading',
    instruction: 'Rotate your phone another 90 degrees clockwise and take the third reading. The app will average all readings for the best baseline.',
    detailInstruction: 'This gives us measurements from 3 different orientations for maximum accuracy.',
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
        <Smartphone size={40} color="#3b82f6" />
      </Animated.View>
      <Text fontSize="$3" color="#3b82f6" marginTop="$2" fontWeight="600">
        Rotate {direction === 'clockwise' ? 'clockwise →' : '← counterclockwise'}
      </Text>
    </View>
  );
};

export function CalibrationWizard({ onComplete, onCancel, isVisible }: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readings, setReadings] = useState<CalibrationReading[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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
        
        onComplete(calibration);
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

  if (!isVisible) return null;

  return (
    <Container>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" space="$4" paddingBottom="$8">
          {/* Header */}
          <YStack space="$3" alignItems="center">
            <YStack 
              backgroundColor="rgba(34, 197, 94, 0.1)" 
              borderRadius="$10" 
              padding="$3"
              borderWidth={1}
              borderColor="rgba(34, 197, 94, 0.2)"
            >
              <Target size={32} color="#22c55e" />
            </YStack>
            
            <H2 fontSize="$8" fontWeight="700" color="#ffffff" textAlign="center">
              Device Calibration
            </H2>
            
            <Text fontSize="$4" color="#94a3b8" textAlign="center" maxWidth={280}>
              Calibrate your device for accurate leveling readings
            </Text>
          </YStack>

      {/* Progress Bar */}
      <YStack space="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="#94a3b8">
            Step {currentStep + 1} of {CALIBRATION_STEPS.length}
          </Text>
          <Text fontSize="$3" color="#94a3b8">
            {Math.round(progress)}%
          </Text>
        </XStack>
        
        <Progress value={progress} backgroundColor="rgba(255, 255, 255, 0.1)">
          <Progress.Indicator backgroundColor="#22c55e" />
        </Progress>
      </YStack>

      {/* Current Step Instructions */}
      <InstructionCard>
        <YStack space="$4" alignItems="center">
          <YStack 
            backgroundColor="rgba(59, 130, 246, 0.1)" 
            borderRadius="$8" 
            padding="$3"
            borderWidth={1}
            borderColor="rgba(59, 130, 246, 0.2)"
          >
            <IconComponent size={24} color="#3b82f6" />
          </YStack>
          
          <H3 fontSize="$6" fontWeight="600" color="#ffffff" textAlign="center">
            {currentStepData.title}
          </H3>
          
          <Text fontSize="$4" color="#94a3b8" textAlign="center" lineHeight="$5">
            {currentStepData.instruction}
          </Text>
          
          {currentStepData.detailInstruction && (
            <Text fontSize="$3" color="#64748b" textAlign="center" lineHeight="$4" fontStyle="italic">
              {currentStepData.detailInstruction}
            </Text>
          )}
          
          {/* Phone orientation visual for step 1 */}
          {currentStep === 0 && (
            <YStack space="$3" alignItems="center" padding="$3" backgroundColor="rgba(59, 130, 246, 0.05)" borderRadius="$3">
              <XStack space="$3" alignItems="center">
                <Smartphone size={24} color="#3b82f6" />
                <Text fontSize="$3" color="#3b82f6" fontWeight="600">
                  Phone TOP → RV FRONT
                </Text>
              </XStack>
              <Text fontSize="$2" color="#64748b" textAlign="center">
                The top edge of your phone should point toward the front/nose of your RV
              </Text>
            </YStack>
          )}
          
          {currentStepData.rotationDirection && (
            <RotationIndicator direction={currentStepData.rotationDirection} />
          )}
        </YStack>
      </InstructionCard>

      {/* Live Preview (only show after starting) */}
      {hasStarted && (
        <YStack space="$3" alignItems="center">
          <Text fontSize="$4" color="#94a3b8" textAlign="center">
            Live Preview
          </Text>
          
          <BubbleLevel
            pitch={pitchDeg}
            roll={rollDeg}
            isLevel={Math.abs(pitchDeg) < 0.5 && Math.abs(rollDeg) < 0.5}
            color={getStatusColor()}
          />
          
          <Text fontSize="$3" color={getStatusColor()} textAlign="center" fontWeight="500">
            {getStatusText()}
          </Text>
          
          {errorMessage && (
            <XStack space="$2" alignItems="center">
              <AlertCircle size={16} color="#ef4444" />
              <Text fontSize="$3" color="#ef4444">
                {errorMessage}
              </Text>
            </XStack>
          )}
          
          {!isReliable && hasStarted && (
            <XStack space="$2" alignItems="center" justifyContent="center">
              <AlertCircle size={16} color="#eab308" />
              <Text fontSize="$3" color="#eab308" textAlign="center">
                Waiting for device sensors to stabilize...
              </Text>
            </XStack>
          )}
        </YStack>
      )}

      {/* Reading History */}
      {readings.length > 0 && (
        <Card padding="$3" backgroundColor="rgba(255, 255, 255, 0.02)">
          <Text fontSize="$3" color="#94a3b8" marginBottom="$2">
            Collected Readings:
          </Text>
          {readings.map((reading, index) => (
            <Text key={reading.timestamp} fontSize="$2" color="#64748b">
              Reading {index + 1}: P: {reading.pitch.toFixed(2)}°, R: {reading.roll.toFixed(2)}°
            </Text>
          ))}
        </Card>
      )}

      {/* Calibration Quality Indicator */}
      {calibrationQuality && readings.length >= 2 && (
        <Card 
          padding="$3" 
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
        </YStack>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <YStack 
        padding="$4" 
        space="$3" 
        backgroundColor="rgba(0, 0, 0, 0.95)"
        borderTopWidth={1}
        borderTopColor="rgba(255, 255, 255, 0.1)"
      >
        {!hasStarted ? (
          <Button
            size="$5"
            fontWeight="600"
            borderRadius="$4"
            onPress={handleStartCalibration}
            disabled={!isReliable}
            backgroundColor={!isReliable ? "#6b7280" : "#22c55e"}
            color="#ffffff"
            borderWidth={0}
            pressStyle={{ 
              backgroundColor: !isReliable ? "#6b7280" : "rgba(34, 197, 94, 0.8)",
              scale: 0.98,
              borderWidth: 0
            }}
            style={{
              backgroundColor: !isReliable ? "#6b7280" : "#22c55e",
              color: "#ffffff",
              border: "none",
              WebkitAppearance: 'none' as any,
              WebkitTapHighlightColor: 'transparent',
              WebkitTextFillColor: "#ffffff",
              fontWeight: "600"
            }}
          >
            Start Calibration
          </Button>
        ) : (
          <Button
            size="$5"
            fontWeight="600"
            borderRadius="$4"
            onPress={takeReading}
            disabled={!isReliable || isCollecting}
            backgroundColor={(!isReliable || isCollecting) ? "#6b7280" : "#3b82f6"}
            color="#ffffff"
            borderWidth={0}
            pressStyle={{ 
              backgroundColor: (!isReliable || isCollecting) ? "#6b7280" : "rgba(59, 130, 246, 0.8)",
              scale: 0.98,
              borderWidth: 0
            }}
            style={{
              backgroundColor: (!isReliable || isCollecting) ? "#6b7280" : "#3b82f6",
              color: "#ffffff",
              border: "none",
              WebkitAppearance: 'none' as any,
              WebkitTapHighlightColor: 'transparent',
              WebkitTextFillColor: "#ffffff",
              fontWeight: "600"
            }}
          >
            {isCollecting ? 'Collecting...' : `Take Reading ${readings.length + 1}`}
          </Button>
        )}
        
        <Button
          size="$4"
          backgroundColor="transparent"
          color="#94a3b8"
          borderColor="rgba(255, 255, 255, 0.2)"
          borderWidth={1}
          onPress={onCancel}
          pressStyle={{ 
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            scale: 0.98 
          }}
        >
          Cancel
        </Button>
      </YStack>
    </Container>
  );
}