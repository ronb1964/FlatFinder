import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H2, H3, Separator, ScrollView, View } from 'tamagui';
import { AlertCircle, ArrowLeft } from '@tamagui/lucide-icons';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan } from '../lib/rvLevelingMath';
import { normalizeAttitude, attitudeToLevelingMeasurement, SENSOR_NORMALIZATION_PRESETS } from '../lib/coordinateSystem';
import { useAppStore } from '../state/appStore';
import { formatMeasurement } from '../lib/units';
import { BubbleLevel } from './BubbleLevel';


interface LevelingAssistantProps {
  onBack?: () => void;
}

export function LevelingAssistant({ onBack }: LevelingAssistantProps) {
  const { activeProfile, settings } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();
  const [levelingPlan, setLevelingPlan] = useState<LevelingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force initial calculation on mount
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  // Apply calibration to sensor readings
  const calibratedReadings = activeProfile?.calibration 
    ? applyCalibration({ pitch: pitchDeg, roll: rollDeg }, activeProfile.calibration)
    : { pitch: pitchDeg, roll: rollDeg };
  
  // Normalize attitude to LevelMate canonical coordinate system
  // The sensor readings are already in the correct convention for our math
  const normalizedAttitude = normalizeAttitude(
    { pitch: calibratedReadings.pitch, roll: calibratedReadings.roll },
    SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
  );
  
  // Convert to leveling measurement format
  const physicalReadings = attitudeToLevelingMeasurement(normalizedAttitude);

  // Real-time leveling plan calculation
  useEffect(() => {
    if (!activeProfile) return;

    const calculatePlan = async () => {
      setIsCalculating(true);
      
      try {
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches,
        };
        const inventory = activeProfile.blockInventory || [];
        const plan = RVLevelingCalculator.createLevelingPlan(geometry, physicalReadings, inventory);
        setLevelingPlan(plan);
      } catch (error) {
        console.error('Error calculating leveling plan:', error);
        setLevelingPlan(null);
      } finally {
        setIsCalculating(false);
      }
    };

    // Shorter debounce to make it more responsive
    const timeoutId = setTimeout(calculatePlan, 100);
    return () => clearTimeout(timeoutId);
  }, [
    Math.round(pitchDeg * 10) / 10, // Use raw sensor values for change detection
    Math.round(rollDeg * 10) / 10,  // Use raw sensor values for change detection
    activeProfile,
    forceUpdate // Force recalculation on mount
  ]);

  if (!activeProfile) {
    return (
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
        <Text color="$red10">No active vehicle profile. Please set up a profile first.</Text>
        {onBack && (
          <Button onPress={onBack} marginTop="$4">
            Go Back
          </Button>
        )}
      </YStack>
    );
  }

  // Check if we're near level (within 0.5 degrees)
  const isNearLevel = Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5;

  return (
    <YStack 
      flex={1}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)'
      }}
    >
      {/* Compact Header */}
      <XStack 
        justifyContent="space-between" 
        alignItems="center" 
        padding="$2" 
        paddingBottom="$1"
      >
        {onBack && (
          <Button
            size="$2"
            chromeless
            onPress={onBack}
            icon={ArrowLeft}
            color="white"
            flexShrink={0}
          />
        )}
        <H2 color="white" flex={1} textAlign="center" marginRight={onBack ? 40 : 0}>
          Block Instructions
        </H2>
        {!onBack && <View width={40} />}
      </XStack>

      {/* Compact Bubble Level */}
      {!isNearLevel && (
        <YStack alignItems="center" padding="$2" paddingBottom="$1">
          <BubbleLevel
            pitch={physicalReadings.pitchDegrees}
            roll={physicalReadings.rollDegrees}
            isLevel={isNearLevel}
            color="#ef4444"
            size="compact"
          />
        </YStack>
      )}

      {/* Scrollable Content */}
              <ScrollView 
          flex={1} 
          padding="$2" 
          paddingTop="$0" 
          showsVerticalScrollIndicator={true}
        >
        {/* Level Status */}
        <Card 
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderWidth={1}
          padding="$3"
          marginBottom="$3"
        >
          <YStack space="$2">
            <H3 color="white" textAlign="center">Current Reading</H3>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$3">Pitch:</Text>
              <Text color="white" fontSize="$4" fontWeight="600">
                {Math.abs(physicalReadings.pitchDegrees).toFixed(1)}°
                {physicalReadings.pitchDegrees > 0 ? ' (nose up)' : physicalReadings.pitchDegrees < 0 ? ' (nose down)' : ''}
              </Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$3">Roll:</Text>
              <Text color="white" fontSize="$4" fontWeight="600">
                {Math.abs(physicalReadings.rollDegrees).toFixed(1)}°
                {physicalReadings.rollDegrees > 0 ? ' (right up)' : physicalReadings.rollDegrees < 0 ? ' (left up)' : ''}
              </Text>
            </XStack>
          </YStack>
        </Card>

        {/* Level Status */}
        {isNearLevel ? (
          <Card 
            backgroundColor="rgba(34, 197, 94, 0.1)"
            borderColor="rgba(34, 197, 94, 0.3)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
          >
            <Text color="#22c55e" fontSize="$5" fontWeight="bold" textAlign="center">
              🎉 Level!
            </Text>
            <Text color="#22c55e" fontSize="$3" textAlign="center" marginTop="$1">
              Your RV is properly leveled
            </Text>
          </Card>
        ) : (
          <Card 
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderColor="rgba(239, 68, 68, 0.3)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
          >
            <Text color="#ef4444" fontSize="$4" fontWeight="bold" textAlign="center">
              ⚠️ Not Level
            </Text>
            <Text color="#ef4444" fontSize="$3" textAlign="center" marginTop="$1">
              Follow instructions below to level
            </Text>
          </Card>
        )}

        {/* Leveling Instructions - Only show if NOT level */}
        {!isNearLevel && levelingPlan && !isCalculating && (
          <YStack space="$2">
            {/* Warnings - Improved */}
            {levelingPlan.warnings.length > 0 && (
              <Card 
                backgroundColor="rgba(239, 68, 68, 0.1)"
                borderColor="rgba(239, 68, 68, 0.3)"
                borderWidth={1}
                padding="$3"
                marginBottom="$3"
              >
                <YStack space="$2">
                  <XStack alignItems="center" space="$2">
                    <AlertCircle size={16} color="#ef4444" />
                    <Text color="#ef4444" fontSize="$3" fontWeight="600">
                      Cannot Level with Current Blocks
                    </Text>
                  </XStack>
                  <Text color="#ef4444" fontSize="$3">
                    {levelingPlan.warnings.join(' ')}
                  </Text>
                </YStack>
              </Card>
            )}

            {/* Lift Instructions */}
            {levelingPlan.wheelLifts
              .filter(lift => lift.liftInches > 0.001) // Only show meaningful lifts
              .map((lift, index) => {
                const blockStack = levelingPlan.blockStacks[lift.location];
                return (
                  <Card
                    key={lift.location}
                    backgroundColor="rgba(255, 255, 255, 0.03)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    borderWidth={1}
                    padding="$3"
                    marginBottom="$2"
                  >
                    <YStack space="$2">
                      <H3 color="white" fontSize="$4">
                        {lift.location}
                      </H3>
                      <Text color="$gray11" fontSize="$3">
                        Lift needed: {formatMeasurement(lift.liftInches, settings.measurementUnits || 'imperial')}
                      </Text>
                      
                      {blockStack.blocks.length === 0 ? (
                        <Card
                          backgroundColor="rgba(239, 68, 68, 0.1)"
                          borderColor="rgba(239, 68, 68, 0.3)"
                          borderWidth={1}
                          padding="$2"
                        >
                          <Text color="#ef4444" fontSize="$3" textAlign="center">
                            No blocks available for this height
                          </Text>
                        </Card>
                      ) : blockStack.blocks.length > 0 ? (
                        <YStack space="$2">
                          <YStack space="$2">
                            {blockStack.blocks
                              .filter(block => block.thickness > 0.001 && block.count > 0) // Only show valid blocks
                              .map((block, blockIndex) => (
                              <Card
                                key={blockIndex}
                                backgroundColor="rgba(34, 197, 94, 0.1)"
                                borderColor="rgba(34, 197, 94, 0.3)"
                                borderWidth={1}
                                padding="$2"
                              >
                                <XStack justifyContent="space-between" alignItems="center">
                                  <Text color="#22c55e" fontSize="$3" fontWeight="600">
                                    {block.count} × {formatMeasurement(block.thickness, settings.measurementUnits || 'imperial')}
                                  </Text>
                                  <Text color="#22c55e" fontSize="$3">
                                    = {formatMeasurement(block.count * block.thickness, settings.measurementUnits || 'imperial')}
                                  </Text>
                                </XStack>
                              </Card>
                            ))}
                          </YStack>
                          <Card
                            backgroundColor="rgba(59, 130, 246, 0.1)"
                            borderColor="rgba(59, 130, 246, 0.3)"
                            borderWidth={1}
                            padding="$2"
                          >
                            <XStack justifyContent="space-between" alignItems="center">
                              <Text color="#3b82f6" fontSize="$3" fontWeight="600">
                                Total Height:
                              </Text>
                              <Text color="#3b82f6" fontSize="$4" fontWeight="bold">
                                {formatMeasurement(blockStack.totalHeight, settings.measurementUnits || 'imperial')}
                              </Text>
                            </XStack>
                          </Card>
                        </YStack>
                      ) : (
                        <Text color="$gray11" fontSize="$3">No blocks needed</Text>
                      )}
                    </YStack>
                  </Card>
                );
              })}
          </YStack>
        )}

        {/* No Plan State */}
        {!levelingPlan && !isCalculating && (
          <Card 
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
          >
            <Text color="white" fontSize="$4" textAlign="center" marginBottom="$1">
              🎯 Reading sensors...
            </Text>
            <Text color="$gray11" fontSize="$3" textAlign="center">
              Place device flat on RV floor
            </Text>
          </Card>
        )}

        {/* Bottom spacing */}
        <YStack height="$4" />
      </ScrollView>
    </YStack>
  );
}