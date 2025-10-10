import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H2, H3, Separator, ScrollView, View } from 'tamagui';
import { AlertCircle, ArrowLeft } from '@tamagui/lucide-icons';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan } from '../lib/rvLevelingMath';
import { normalizeAttitude, attitudeToLevelingMeasurement, SENSOR_NORMALIZATION_PRESETS } from '../lib/coordinateSystem';
import { useAppStore } from '../state/appStore';
import { formatMeasurement, formatLiftMeasurement } from '../lib/units';
import { BubbleLevel } from './BubbleLevel';
import { GlassCard } from './GlassCard';
import { LevelingAssistantGradient } from './GradientBackground';

// Helper function to render a wheel/hitch card with instructions
function renderWheelCard(
  lift: any,
  blockStack: any,
  activeProfile: any,
  settings: any,
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
) {
  const getCardSize = () => {
    if (position === 'center') return { width: 120, height: 120 };
    return { width: 140, height: 100 };
  };
  
  const { width, height } = getCardSize();
  
  const isLevelPosition = lift.liftInches <= 0.125;
  const noBlocksFit = blockStack.blocks.length === 0 && activeProfile.blockInventory && activeProfile.blockInventory.length > 0;
  const shouldShowGreen = isLevelPosition || noBlocksFit;
  
  return (
    <GlassCard
      key={lift.location}
      backgroundColor="rgba(255, 255, 255, 0.05)"
      borderColor={shouldShowGreen ? "rgba(34, 197, 94, 0.6)" : "rgba(255, 255, 255, 0.2)"}
      borderWidth={2}
      padding="$2"
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
      blurIntensity={10}
    >
      <YStack space="$1" alignItems="center">
        <Text color="white" fontSize="$2" fontWeight="600" textAlign="center" numberOfLines={1}>
          {lift.description.replace(' Wheel', '').replace(' ', '\n')}
        </Text>
        
        {lift.liftInches <= 0.125 ? (
          <View
            backgroundColor="rgba(34, 197, 94, 0.2)"
            borderRadius="$2"
            paddingHorizontal="$1"
            paddingVertical="$0.5"
          >
            <Text color="#22c55e" fontSize="$1" fontWeight="600" textAlign="center">
              ✓ Good
            </Text>
          </View>
        ) : (
          <YStack space="$1" alignItems="center">
            <Text color="$gray11" fontSize="$1" textAlign="center">
              Raise: {formatLiftMeasurement(lift.liftInches, settings.measurementUnits)}
            </Text>
            
            {!activeProfile.blockInventory || activeProfile.blockInventory.length === 0 ? (
              <View
                backgroundColor="rgba(59, 130, 246, 0.2)"
                borderRadius="$2"
                paddingHorizontal="$1"
                paddingVertical="$0.5"
              >
                <Text color="#3b82f6" fontSize="$1" textAlign="center" numberOfLines={2}>
                  Setup blocks in profile
                </Text>
              </View>
            ) : blockStack.blocks.length === 0 ? (
              <View
                backgroundColor="rgba(239, 68, 68, 0.2)"
                borderRadius="$2"
                paddingHorizontal="$1"
                paddingVertical="$0.5"
              >
                <Text color="#ef4444" fontSize="$1" textAlign="center" numberOfLines={2}>
                  No blocks fit
                </Text>
              </View>
            ) : (
              <YStack alignItems="center" space="$0.5">
                {blockStack.blocks
                  .filter((block: any) => {
                    // NUCLEAR OPTION: Only allow exact standard sizes - reject anything close to 0.8
                    const validSizes = [0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
                    const isValidSize = validSizes.some(size => Math.abs(block.thickness - size) < 0.01);
                    
                    // Specifically block any 0.8-ish values
                    const isInvalidEight = Math.abs(block.thickness - 0.8) < 0.1;
                    
                    const blockExists = activeProfile.blockInventory?.some((inventoryBlock: any) => 
                      Math.abs(inventoryBlock.thickness - block.thickness) < 0.001
                    );
                    return block.thickness > 0.001 && block.count > 0 && blockExists && isValidSize && !isInvalidEight;
                  })
                  .map((block: any, blockIndex: number) => (
                    <View
                      key={blockIndex}
                      backgroundColor="rgba(34, 197, 94, 0.2)"
                      borderRadius="$1"
                      paddingHorizontal="$1"
                      paddingVertical="$0.5"
                    >
                      <Text color="#22c55e" fontSize="$1" textAlign="center" fontWeight="600" numberOfLines={1}>
                        {block.count}×{formatMeasurement(block.thickness, settings.measurementUnits)} blocks
                      </Text>
                    </View>
                  ))}
              </YStack>
            )}
          </YStack>
        )}
      </YStack>
    </GlassCard>
  );
}

// Helper function to render spatial leveling layout
function renderSpatialLevelingLayout(levelingPlan: any, activeProfile: any, settings: any, physicalReadings: any) {
  const isTrailer = activeProfile.hitchOffsetInches !== undefined;
  
  if (isTrailer) {
    // Trailer layout: Hitch at top, wheels at bottom
    const hitchLift = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'hitch');
    const leftLift = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'left_wheel');
    const rightLift = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'right_wheel');
    
    return (
      <YStack alignItems="center" space="$4" paddingVertical="$4">
        {/* Hitch at top */}
        {hitchLift && renderWheelCard(
          hitchLift,
          levelingPlan.blockStacks[hitchLift.location],
          activeProfile,
          settings,
          'top'
        )}
        
        {/* Bubble level in center */}
        <BubbleLevel
          pitch={physicalReadings.pitchDegrees}
          roll={physicalReadings.rollDegrees}
          isLevel={Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5}
          color="#ef4444"
          size="compact"
        />
        
        {/* Wheels at bottom */}
        <XStack space="$6" justifyContent="center">
          {leftLift && renderWheelCard(
            leftLift,
            levelingPlan.blockStacks[leftLift.location],
            activeProfile,
            settings,
            'left'
          )}
          {rightLift && renderWheelCard(
            rightLift,
            levelingPlan.blockStacks[rightLift.location],
            activeProfile,
            settings,
            'right'
          )}
        </XStack>
      </YStack>
    );
  } else {
    // RV layout: 2x2 grid with bubble level in center
    const frontLeft = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'front_left');
    const frontRight = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'front_right');
    const rearLeft = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'rear_left');
    const rearRight = levelingPlan.wheelLifts.find((lift: any) => lift.location === 'rear_right');
    
    return (
      <YStack alignItems="center" space="$4" paddingVertical="$4">
        {/* Front wheels */}
        <XStack space="$6" justifyContent="center">
          {frontLeft && renderWheelCard(
            frontLeft,
            levelingPlan.blockStacks[frontLeft.location],
            activeProfile,
            settings,
            'left'
          )}
          {frontRight && renderWheelCard(
            frontRight,
            levelingPlan.blockStacks[frontRight.location],
            activeProfile,
            settings,
            'right'
          )}
        </XStack>
        
        {/* Bubble level in center */}
        <BubbleLevel
          pitch={physicalReadings.pitchDegrees}
          roll={physicalReadings.rollDegrees}
          isLevel={Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5}
          color="#ef4444"
          size="compact"
        />
        
        {/* Rear wheels */}
        <XStack space="$6" justifyContent="center">
          {rearLeft && renderWheelCard(
            rearLeft,
            levelingPlan.blockStacks[rearLeft.location],
            activeProfile,
            settings,
            'left'
          )}
          {rearRight && renderWheelCard(
            rearRight,
            levelingPlan.blockStacks[rearRight.location],
            activeProfile,
            settings,
            'right'
          )}
        </XStack>
      </YStack>
    );
  }
}

// Helper function to render detailed block instructions
function renderDetailedBlockInstructions(levelingPlan: any, activeProfile: any, settings: any) {
  // Only show positions that need blocks
  const positionsNeedingBlocks = levelingPlan.wheelLifts.filter((lift: any) => 
    lift.liftInches > 0.001 && 
    (activeProfile.blockInventory && activeProfile.blockInventory.length > 0)
  );
  
  if (positionsNeedingBlocks.length === 0) return null;
  
  return (
    <YStack space="$3" marginTop="$4">
      <H3 color="white" textAlign="center" fontSize="$4">Block Details</H3>
      
      {positionsNeedingBlocks
        .sort((a: any, b: any) => {
          // Same sort order as spatial layout
          const order = { 
            'front_left': 1, 'front_right': 2, 'rear_left': 3, 'rear_right': 4,
            'hitch': 1, 'right_wheel': 2, 'left_wheel': 3
          };
          return (order[a.location] || 99) - (order[b.location] || 99);
        })
        .map((lift: any) => {
          const blockStack = levelingPlan.blockStacks[lift.location];
          
          return (
            <GlassCard
              key={lift.location}
              backgroundColor="rgba(255, 255, 255, 0.03)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              padding="$3"
              marginBottom="$2"
              blurIntensity={8}
            >
              <YStack space="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <H3 color="white" fontSize="$4">
                    {lift.description}
                  </H3>
                  <Text color="$gray11" fontSize="$3">
                    Target: {formatLiftMeasurement(lift.liftInches, settings.measurementUnits)}
                  </Text>
                </XStack>
                
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
                ) : (
                  <YStack space="$2">
                    <Text color="white" fontSize="$3" fontWeight="600">
                      Stack these blocks:
                    </Text>
                    
                    {blockStack.blocks
                      .filter((block: any) => {
                        // NUCLEAR OPTION: Only allow exact standard sizes - reject anything close to 0.8
                        const validSizes = [0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
                        const isValidSize = validSizes.some(size => Math.abs(block.thickness - size) < 0.01);
                        
                        // Specifically block any 0.8-ish values
                        const isInvalidEight = Math.abs(block.thickness - 0.8) < 0.1;
                        
                        const blockExists = activeProfile.blockInventory?.some((inventoryBlock: any) => 
                          Math.abs(inventoryBlock.thickness - block.thickness) < 0.001
                        );
                        return block.thickness > 0.001 && block.count > 0 && blockExists && isValidSize && !isInvalidEight;
                      })
                      .map((block: any, blockIndex: number) => (
                      <Card
                        key={blockIndex}
                        backgroundColor="rgba(34, 197, 94, 0.1)"
                        borderColor="rgba(34, 197, 94, 0.3)"
                        borderWidth={1}
                        padding="$3"
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text color="#22c55e" fontSize="$4" fontWeight="600">
                            {block.count} × {formatMeasurement(block.thickness, settings.measurementUnits)} blocks
                          </Text>
                          <Text color="#22c55e" fontSize="$3">
                            = {formatMeasurement(block.count * block.thickness, settings.measurementUnits)}
                          </Text>
                        </XStack>
                      </Card>
                    ))}
                    
                    <Card
                      backgroundColor="rgba(59, 130, 246, 0.1)"
                      borderColor="rgba(59, 130, 246, 0.3)"
                      borderWidth={1}
                      padding="$3"
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text color="#3b82f6" fontSize="$4" fontWeight="bold">
                          Total Stack Height:
                        </Text>
                        <Text color="#3b82f6" fontSize="$5" fontWeight="bold">
                          {formatMeasurement(blockStack.totalHeight, settings.measurementUnits)}
                        </Text>
                      </XStack>
                    </Card>
                  </YStack>
                )}
              </YStack>
            </GlassCard>
          );
        })}
    </YStack>
  );
}

interface LevelingAssistantProps {
  onBack?: () => void;
}

export function LevelingAssistant({ onBack }: LevelingAssistantProps) {
  const { activeProfile, settings } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();
  const [levelingPlan, setLevelingPlan] = useState<LevelingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [calculationError, setCalculationError] = useState<string | null>(null);

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
      setCalculationError(null);
      
      try {
        // Create unlimited inventory of available block sizes - only valid sizes
        const validSizes = [0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
        const unlimitedInventory = (activeProfile.blockInventory || [])
          .filter(block => validSizes.some(size => Math.abs(block.thickness - size) < 0.001))
          .map(block => ({
            thickness: block.thickness,
            quantity: 50 // Effectively unlimited
          }));
        
        const plan = RVLevelingCalculator.createLevelingPlan(
          activeProfile, // RVGeometry 
          physicalReadings, // LevelingMeasurement
          unlimitedInventory // Unlimited BlockInventory[]
        );
        setLevelingPlan(plan);
        setCalculationError(null);
      } catch (error) {
        console.error('Error calculating leveling plan:', error);
        setLevelingPlan(null);
        setCalculationError(error instanceof Error ? error.message : 'Unknown error calculating leveling plan');
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
    <LevelingAssistantGradient>
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


      {/* Scrollable Content */}
              <ScrollView 
          flex={1} 
          padding="$2" 
          paddingTop="$0" 
          showsVerticalScrollIndicator={true}
        >
        {/* Level Status */}
        <GlassCard
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderWidth={1}
          padding="$3"
          marginBottom="$3"
          blurIntensity={10}
        >
          <YStack space="$2">
            <H3 color="white" textAlign="center">Current Reading</H3>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$3">Pitch:</Text>
              <Text color="white" fontSize="$4" fontWeight="600">
                {formatMeasurement(Math.abs(physicalReadings.pitchDegrees), 'degrees', settings.measurementUnits)}
                {physicalReadings.pitchDegrees > 0 ? ' (nose up)' : physicalReadings.pitchDegrees < 0 ? ' (nose down)' : ''}
              </Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$3">Roll:</Text>
              <Text color="white" fontSize="$4" fontWeight="600">
                {formatMeasurement(Math.abs(physicalReadings.rollDegrees), 'degrees', settings.measurementUnits)}
                {physicalReadings.rollDegrees > 0 ? ' (right up)' : physicalReadings.rollDegrees < 0 ? ' (left up)' : ''}
              </Text>
            </XStack>
          </YStack>
        </GlassCard>

        {/* Level Status */}
        {isNearLevel ? (
          <GlassCard
            backgroundColor="rgba(34, 197, 94, 0.1)"
            borderColor="rgba(34, 197, 94, 0.3)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
            blurIntensity={12}
          >
            <Text color="#22c55e" fontSize="$5" fontWeight="bold" textAlign="center">
              🎉 Level!
            </Text>
            <Text color="#22c55e" fontSize="$3" textAlign="center" marginTop="$1">
              Your RV is properly leveled
            </Text>
          </GlassCard>
        ) : (
          <GlassCard
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderColor="rgba(239, 68, 68, 0.3)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
            blurIntensity={12}
          >
            <Text color="#ef4444" fontSize="$4" fontWeight="bold" textAlign="center">
              ⚠️ Not Level
            </Text>
            <Text color="#ef4444" fontSize="$3" textAlign="center" marginTop="$1">
              Follow instructions below to level
            </Text>
          </GlassCard>
        )}

        {/* Always show spatial layout when we have a plan */}
        {levelingPlan && !isCalculating && (
          <YStack space="$3">
            {/* Warnings - Only show if not level */}
            {!isNearLevel && levelingPlan.warnings.length > 0 && (
              <GlassCard
                backgroundColor="rgba(239, 68, 68, 0.1)"
                borderColor="rgba(239, 68, 68, 0.3)"
                borderWidth={1}
                padding="$3"
                marginBottom="$3"
                blurIntensity={10}
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
              </GlassCard>
            )}

            {/* Spatial Leveling Layout - Always show */}
            {renderSpatialLevelingLayout(levelingPlan, activeProfile, settings, physicalReadings)}
            
            {/* Detailed Block Instructions - Only show if not level */}
            {!isNearLevel && renderDetailedBlockInstructions(levelingPlan, activeProfile, settings)}
          </YStack>
        )}

        {/* Error State */}
        {calculationError && (
          <GlassCard
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderColor="rgba(239, 68, 68, 0.3)"
            borderWidth={1}
            padding="$4"
            marginBottom="$3"
            blurIntensity={10}
          >
            <YStack space="$2">
              <XStack alignItems="center" space="$2">
                <AlertCircle size={16} color="#ef4444" />
                <Text color="#ef4444" fontSize="$4" fontWeight="bold">
                  Calculation Error
                </Text>
              </XStack>
              <Text color="#ef4444" fontSize="$3">
                {calculationError}
              </Text>
            </YStack>
          </GlassCard>
        )}

        {/* No Plan State */}
        {!levelingPlan && !isCalculating && !calculationError && (
          <GlassCard
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
            blurIntensity={10}
          >
            <Text color="white" fontSize="$4" textAlign="center" marginBottom="$1">
              🎯 Reading sensors...
            </Text>
            <Text color="$gray11" fontSize="$3" textAlign="center">
              Place device flat on RV floor
            </Text>
          </GlassCard>
        )}

        {/* Bottom spacing */}
        <YStack height="$4" />
      </ScrollView>
    </LevelingAssistantGradient>
  );
}