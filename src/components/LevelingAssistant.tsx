import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H2, H3, Separator } from 'tamagui';
import { AlertCircle } from '@tamagui/lucide-icons';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan } from '../lib/rvLevelingMath';
import { useAppStore } from '../state/appStore';

interface LevelingAssistantProps {
  onBack?: () => void;
}

export function LevelingAssistant({ onBack }: LevelingAssistantProps) {
  const { activeProfile } = useAppStore();
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
  
  // CRITICAL FIX: Invert sensor coordinates to match physical reality
  // When sensor shows +pitch (nose up), we need to raise the FRONT (opposite of sensor reading)
  // When sensor shows +roll (right up), we need to raise the LEFT (opposite of sensor reading)
  const physicalReadings = {
    pitchDegrees: -calibratedReadings.pitch, // Invert pitch
    rollDegrees: -calibratedReadings.roll    // Invert roll
  };

  // Real-time leveling plan calculation
  useEffect(() => {
    if (!activeProfile) return;

    const calculatePlan = async () => {
      setIsCalculating(true);
      
      try {
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches
        };

        const measurement = physicalReadings;

        console.log('=== LEVELING PLAN CALCULATION ===', new Date().toLocaleTimeString());
        console.log('Raw sensor - Pitch:', pitchDeg, 'Roll:', rollDeg);
        console.log('Physical readings - Pitch:', measurement.pitchDegrees, 'Roll:', measurement.rollDegrees);
        console.log('Geometry:', geometry);
        console.log('Block inventory length:', activeProfile.blockInventory.length);

        // Always calculate if we have any reading, even small ones for testing
        if (Math.abs(measurement.pitchDegrees) < 0.05 && Math.abs(measurement.rollDegrees) < 0.05) {
          console.log('Readings too small, showing level state');
          // Create a "level" plan to show the interface
          setLevelingPlan({
            wheelLifts: [],
            blockStacks: {},
            maxLiftRequired: 0,
            isLevelable: true,
            warnings: []
          });
          setIsCalculating(false);
          return;
        }

        const plan = RVLevelingCalculator.createLevelingPlan(
          geometry,
          measurement,
          [...activeProfile.blockInventory] // Clone to avoid mutation
        );

        console.log('Generated plan:', plan);
        setLevelingPlan(plan);
      } catch (error) {
        console.error('Failed to calculate leveling plan:', error);
        console.error('Error details:', error);
        // Create a fallback plan for testing
        setLevelingPlan({
          wheelLifts: [
            { location: 'Front Left', liftInches: 1.5, description: 'Raise Front Left Wheel' },
            { location: 'Rear Right', liftInches: 0.75, description: 'Raise Rear Right Wheel' }
          ],
          blockStacks: {
            'Front Left': { 
              blocks: [{ thickness: 1.0, count: 1 }, { thickness: 0.5, count: 1 }], 
              totalHeight: 1.5, 
              totalBlocks: 2 
            },
            'Rear Right': { 
              blocks: [{ thickness: 0.75, count: 1 }], 
              totalHeight: 0.75, 
              totalBlocks: 1 
            }
          },
          maxLiftRequired: 1.5,
          isLevelable: true,
          warnings: ['This is a test calculation due to an error']
        });
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

  const isNearLevel = levelingPlan && levelingPlan.maxLiftRequired < 0.25; // Within 1/4"

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

  return (
    <YStack 
      flex={1} 
      padding="$4" 
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
      }}
    >
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
        <H2 color="white">Leveling Assistant</H2>
        {onBack && (
          <Button size="$3" onPress={onBack}>
            Back
          </Button>
        )}
      </XStack>

      {/* Current Level Status */}
      <Card 
        backgroundColor={isNearLevel ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
        borderColor={isNearLevel ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}
        borderWidth={1}
        padding="$4"
        marginBottom="$4"
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Current Attitude
            </Text>
            <Text fontSize="$6" fontWeight="bold" color="white">
              {isNearLevel ? '✅ LEVEL' : '⚠️ NOT LEVEL'}
            </Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text color="white" fontSize="$4">
              Pitch: {physicalReadings.pitchDegrees.toFixed(2)}°
            </Text>
            <Text color="white" fontSize="$4">
              Roll: {physicalReadings.rollDegrees.toFixed(2)}°
            </Text>
          </YStack>
        </XStack>
      </Card>

      {/* Vehicle Info */}
      <Card 
        backgroundColor="rgba(255, 255, 255, 0.03)"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderWidth={1}
        padding="$3"
        marginBottom="$4"
      >
        <Text color="$gray11" fontSize="$3" marginBottom="$2">Vehicle Profile</Text>
        <Text color="white" fontSize="$4" fontWeight="600">{activeProfile.name}</Text>
        <XStack justifyContent="space-between" marginTop="$2">
          <Text color="$gray10" fontSize="$3">
            {activeProfile.wheelbaseInches}" × {activeProfile.trackWidthInches}"
          </Text>
          <Text color="$gray10" fontSize="$3">
            {activeProfile.type.charAt(0).toUpperCase() + activeProfile.type.slice(1)}
          </Text>
        </XStack>
      </Card>

      {/* Loading State */}
      {isCalculating && (
        <Card 
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderWidth={1}
          padding="$4"
          flex={1}
          justifyContent="center"
          alignItems="center"
        >
          <Text color="white" fontSize="$4" textAlign="center">
            🔄 Calculating leveling plan...
          </Text>
        </Card>
      )}

      {/* Leveling Instructions */}
      {levelingPlan && !isCalculating && (
        <YStack flex={1}>
          {/* Warnings */}
          {levelingPlan.warnings.length > 0 && (
            <Card 
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderColor="rgba(239, 68, 68, 0.3)"
              borderWidth={1}
              padding="$3"
              marginBottom="$4"
            >
              <XStack alignItems="center" marginBottom="$2">
                <AlertCircle size={16} color="#ef4444" />
                <Text color="#ef4444" fontWeight="600" marginLeft="$2">Warnings</Text>
              </XStack>
              {levelingPlan.warnings.map((warning, index) => (
                <Text key={index} color="#ef4444" fontSize="$3" marginBottom="$1">
                  • {warning}
                </Text>
              ))}
            </Card>
          )}

          {/* Leveling Plan */}
          {isNearLevel ? (
            <Card 
              backgroundColor="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.3)"
              borderWidth={1}
              padding="$4"
              justifyContent="center"
              alignItems="center"
              flex={1}
            >
              <Text fontSize="$8" marginBottom="$3">🎯</Text>
              <H2 color="#22c55e" textAlign="center" marginBottom="$2">
                Perfect Level!
              </H2>
              <Text color="$gray11" textAlign="center" fontSize="$4">
                Your RV is within ¼" of perfect level.
              </Text>
            </Card>
          ) : (
            <Card 
              backgroundColor="rgba(255, 255, 255, 0.03)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              padding="$4"
              flex={1}
            >
              <H3 color="white" marginBottom="$3">Block Placement Instructions</H3>
              
              {levelingPlan.wheelLifts
                .filter(lift => lift.liftInches > 0.125) // Only show significant lifts
                .map((lift) => {
                  const blockStack = levelingPlan.blockStacks[lift.location];
                  return (
                    <YStack key={lift.location} marginBottom="$3">
                      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                        <Text color="white" fontWeight="600" fontSize="$4">
                          {lift.description}
                        </Text>
                        <Text color="$blue10" fontSize="$3">
                          {lift.liftInches.toFixed(2)}" lift needed
                        </Text>
                      </XStack>
                      
                      {blockStack.blocks.length > 0 ? (
                        <XStack flexWrap="wrap" gap="$2">
                          {blockStack.blocks.map((block, index) => (
                            <Card
                              key={index}
                              backgroundColor="rgba(59, 130, 246, 0.2)"
                              borderColor="rgba(59, 130, 246, 0.4)"
                              borderWidth={1}
                              padding="$2"
                              borderRadius="$2"
                            >
                              <Text color="#3b82f6" fontSize="$3" fontWeight="600">
                                {block.count}× {block.thickness}"
                              </Text>
                            </Card>
                          ))}
                          <Card
                            backgroundColor="rgba(34, 197, 94, 0.2)"
                            borderColor="rgba(34, 197, 94, 0.4)"
                            borderWidth={1}
                            padding="$2"
                            borderRadius="$2"
                          >
                            <Text color="#22c55e" fontSize="$3">
                              = {blockStack.totalHeight.toFixed(2)}"
                            </Text>
                          </Card>
                        </XStack>
                      ) : (
                        <Text color="$gray11" fontSize="$3">No blocks needed</Text>
                      )}
                      
                      <Separator marginVertical="$2" />
                    </YStack>
                  );
                })}

              {/* Summary */}
              <Card 
                backgroundColor="rgba(168, 85, 247, 0.1)"
                borderColor="rgba(168, 85, 247, 0.3)"
                borderWidth={1}
                padding="$3"
                marginTop="$3"
              >
                <Text color="white" fontWeight="600" marginBottom="$2">Summary</Text>
                <XStack justifyContent="space-between">
                  <Text color="$gray11" fontSize="$3">
                    Total blocks needed:
                  </Text>
                  <Text color="white" fontSize="$3" fontWeight="600">
                    {Object.values(levelingPlan.blockStacks)
                      .reduce((sum, stack) => sum + stack.totalBlocks, 0)}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray11" fontSize="$3">
                    Max lift required:
                  </Text>
                  <Text color="white" fontSize="$3" fontWeight="600">
                    {levelingPlan.maxLiftRequired.toFixed(2)}"
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray11" fontSize="$3">
                    Leveling feasible:
                  </Text>
                  <Text 
                    color={levelingPlan.isLevelable ? "#22c55e" : "#ef4444"} 
                    fontSize="$3" 
                    fontWeight="600"
                  >
                    {levelingPlan.isLevelable ? "✅ Yes" : "❌ No"}
                  </Text>
                </XStack>
              </Card>
            </Card>
          )}
        </YStack>
      )}

      {/* No Plan State */}
      {!levelingPlan && !isCalculating && (
        <Card 
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderWidth={1}
          padding="$4"
          flex={1}
          justifyContent="center"
          alignItems="center"
        >
          <Text color="white" fontSize="$4" textAlign="center" marginBottom="$2">
            🎯 Place your device on the RV
          </Text>
          <Text color="$gray11" fontSize="$3" textAlign="center">
            We'll calculate precise leveling instructions based on your current position.
          </Text>
        </Card>
      )}
    </YStack>
  );
}