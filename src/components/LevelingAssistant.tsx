import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, Card, H2, H3, Separator, ScrollView, View, AnimatePresence } from 'tamagui';
import { AlertCircle, ArrowLeft, ArrowUp, ArrowDown, ChevronDown } from '@tamagui/lucide-icons';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan } from '../lib/rvLevelingMath';
import { normalizeAttitude, attitudeToLevelingMeasurement, SENSOR_NORMALIZATION_PRESETS } from '../lib/coordinateSystem';
import { useAppStore } from '../state/appStore';
import { formatMeasurement, formatLiftMeasurement } from '../lib/units';
import { BubbleLevel } from './BubbleLevel';
import { GlassCard } from './GlassCard';
import { LevelingAssistantGradient } from './GradientBackground';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Animated, Easing } from 'react-native';

// Scroll Indicator Component - Fixed on right edge with fade+glow
function ScrollIndicator({ visible }: { visible: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade animation - pulsates opacity
      const fade = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Glow animation - synchronized with fade
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // shadowRadius can't use native driver
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );

      fade.start();
      glow.start();

      return () => {
        fade.stop();
        glow.stop();
      };
    }
  }, [visible, fadeAnim, glowAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        marginTop: -30,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeAnim,
        shadowColor: 'rgba(255, 255, 255, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 12],
        }),
      }}
    >
      <YStack alignItems="center" space={-8}>
        <ChevronDown size={24} color="rgba(255, 255, 255, 0.9)" strokeWidth={2.5} />
        <ChevronDown size={24} color="rgba(255, 255, 255, 0.9)" strokeWidth={2.5} />
      </YStack>
    </Animated.View>
  );
}

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
    return { width: 140, height: 110 }; // Slightly taller for larger text
  };

  const { width, height } = getCardSize();

  // Check if position is within tolerance (both positive and negative)
  const isLevelPosition = Math.abs(lift.liftInches) <= 0.125;
  const noBlocksFit = blockStack.blocks.length === 0 && activeProfile.blockInventory && activeProfile.blockInventory.length > 0;

  // Calculate total block count for simplified display
  const filteredBlocks = blockStack.blocks.filter((block: any) => {
    // NUCLEAR OPTION: Only allow exact standard sizes - reject anything close to 0.8
    const validSizes = [0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
    const isValidSize = validSizes.some(size => Math.abs(block.thickness - size) < 0.01);

    // Specifically block any 0.8-ish values
    const isInvalidEight = Math.abs(block.thickness - 0.8) < 0.1;

    const blockExists = activeProfile.blockInventory?.some((inventoryBlock: any) =>
      Math.abs(inventoryBlock.thickness - block.thickness) < 0.001
    );
    return block.thickness > 0.001 && block.count > 0 && blockExists && isValidSize && !isInvalidEight;
  });
  const totalBlockCount = filteredBlocks.reduce((sum: number, block: any) => sum + block.count, 0);

  // Calculate how close blocks can get to target
  const blockStackHeight = blockStack.totalHeight || 0;
  const targetHeight = lift.liftInches;
  const heightDifference = Math.abs(blockStackHeight - targetHeight);

  // Determine state: perfect, close, or too far
  const isPerfect = isLevelPosition; // Within 1/8"
  const isClose = !isPerfect && heightDifference <= 0.5 && totalBlockCount > 0; // Within 1/2"
  const isTooFar = !isPerfect && !isClose; // More than 1/2" off or no blocks

  // Determine border color based on graduated state
  let borderColor = "rgba(255, 255, 255, 0.2)"; // Default neutral
  if (isPerfect) {
    borderColor = "rgba(34, 197, 94, 0.6)"; // Green for perfect/level
  } else if (isClose) {
    borderColor = "rgba(249, 115, 22, 0.6)"; // Orange for close
  } else {
    borderColor = "rgba(239, 68, 68, 0.6)"; // Red for too far
  }

  return (
    <GlassCard
      key={lift.location}
      backgroundColor="rgba(255, 255, 255, 0.05)"
      borderColor={borderColor}
      borderWidth={2}
      padding="$2"
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
      blurIntensity={10}
    >
      <YStack space="$1.5" alignItems="center">
        {/* Position label - larger, high contrast */}
        <Text color="white" fontSize="$3" fontWeight="700" textAlign="center" numberOfLines={2}>
          {lift.description.replace(' Wheel', '').replace(' ', '\n')}
        </Text>

        {isPerfect ? (
          // Perfect/Level indicator - green
          <View
            backgroundColor="rgba(34, 197, 94, 0.25)"
            borderRadius="$3"
            paddingHorizontal="$2"
            paddingVertical="$1.5"
          >
            <Text color="#22c55e" fontSize="$4" fontWeight="700" textAlign="center">
              ✓ Good
            </Text>
          </View>
        ) : (
          <YStack space="$1" alignItems="center">
            {/* Target height - smaller, secondary info */}
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="$2" textAlign="center">
              Raise: {formatLiftMeasurement(lift.liftInches, settings.measurementUnits)}
            </Text>

            {!activeProfile.blockInventory || activeProfile.blockInventory.length === 0 ? (
              // Setup blocks message - larger and more visible
              <View
                backgroundColor="rgba(59, 130, 246, 0.25)"
                borderRadius="$3"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                <Text color="#3b82f6" fontSize="$3" fontWeight="700" textAlign="center" numberOfLines={2}>
                  Setup blocks in profile
                </Text>
              </View>
            ) : blockStack.blocks.length === 0 || totalBlockCount === 0 ? (
              // No blocks fit warning - larger and more visible
              <View
                backgroundColor="rgba(239, 68, 68, 0.25)"
                borderRadius="$3"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                <Text color="#ef4444" fontSize="$3" fontWeight="700" textAlign="center" numberOfLines={2}>
                  No blocks fit
                </Text>
              </View>
            ) : isClose ? (
              // Close - Orange (achievable within tolerance)
              <View
                backgroundColor="rgba(249, 115, 22, 0.25)"
                borderRadius="$3"
                paddingHorizontal="$2.5"
                paddingVertical="$1.5"
              >
                <Text color="#f97316" fontSize="$5" fontWeight="700" textAlign="center">
                  +{totalBlockCount} blocks
                </Text>
                <Text color="#f97316" fontSize="$1" textAlign="center">
                  ~ Close
                </Text>
              </View>
            ) : (
              // Too far - Red (blocks don't get close enough)
              <View
                backgroundColor="rgba(239, 68, 68, 0.25)"
                borderRadius="$3"
                paddingHorizontal="$2.5"
                paddingVertical="$1.5"
              >
                <Text color="#ef4444" fontSize="$4" fontWeight="700" textAlign="center">
                  {totalBlockCount > 0 ? `+${totalBlockCount} blocks` : 'Too far'}
                </Text>
                <Text color="#ef4444" fontSize="$1" textAlign="center">
                  ⚠ Not close enough
                </Text>
              </View>
            )}
          </YStack>
        )}
      </YStack>
    </GlassCard>
  );
}

// Helper function to render trailer hitch card with raise/lower instructions
function renderHitchCard(
  lift: any,
  settings: any
) {
  const isLevel = Math.abs(lift.liftInches) <= 0.125;
  const needsRaise = lift.liftInches > 0.125;
  const needsLower = lift.liftInches < -0.125;

  // Border color: green when level, red when adjustment needed
  const borderColor = isLevel ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";

  return (
    <GlassCard
      key={lift.location}
      backgroundColor="rgba(255, 255, 255, 0.05)"
      borderColor={borderColor}
      borderWidth={2}
      padding="$2"
      width={140}
      height={110}
      justifyContent="center"
      alignItems="center"
      blurIntensity={10}
    >
      <YStack space="$1.5" alignItems="center">
        {/* Hitch label - larger, high contrast */}
        <Text color="white" fontSize="$3" fontWeight="700" textAlign="center">
          Hitch
        </Text>

        {isLevel ? (
          // Level indicator - larger and more prominent
          <View
            backgroundColor="rgba(34, 197, 94, 0.25)"
            borderRadius="$3"
            paddingHorizontal="$2"
            paddingVertical="$1.5"
          >
            <Text color="#22c55e" fontSize="$4" fontWeight="700" textAlign="center">
              ✓ Good
            </Text>
          </View>
        ) : (
          <YStack space="$2" alignItems="center">
            {/* Arrow and action with measurement */}
            <XStack alignItems="center" space="$1">
              {needsRaise && <ArrowUp size={24} color="#3b82f6" />}
              {needsLower && <ArrowDown size={24} color="#3b82f6" />}
              <YStack alignItems="center">
                <Text color="#3b82f6" fontSize="$3" fontWeight="700" textAlign="center">
                  {needsRaise ? 'Raise' : 'Lower'}
                </Text>
                <Text color="#3b82f6" fontSize="$4" fontWeight="700" textAlign="center">
                  {formatLiftMeasurement(Math.abs(lift.liftInches), settings.measurementUnits)}
                </Text>
              </YStack>
            </XStack>
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
      <YStack alignItems="center" space="$4" paddingVertical="$4" overflow="visible">
        {/* Hitch at top - uses dedicated hitch card with raise/lower arrow */}
        {hitchLift && renderHitchCard(
          hitchLift,
          settings
        )}

        {/* Bubble level in center - needs extra vertical space */}
        <View marginVertical="$3" overflow="visible">
          <BubbleLevel
            pitch={physicalReadings.pitchDegrees}
            roll={physicalReadings.rollDegrees}
            isLevel={Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5}
            color="#ef4444"
            size="compact"
          />
        </View>
        
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
      <YStack alignItems="center" space="$4" paddingVertical="$4" overflow="visible">
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

        {/* Bubble level in center - needs extra vertical space */}
        <View marginVertical="$3" overflow="visible">
          <BubbleLevel
            pitch={physicalReadings.pitchDegrees}
            roll={physicalReadings.rollDegrees}
            isLevel={Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5}
            color="#ef4444"
            size="compact"
          />
        </View>
        
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
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Handle scroll events to show/hide scroll indicator
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    // Hide indicator when within 100px of bottom
    setShowScrollIndicator(distanceFromBottom > 100);
  };

  // Force initial calculation on mount
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  // Apply calibration to sensor readings
  const calibratedReadings = activeProfile?.calibration 
    ? applyCalibration({ pitch: pitchDeg, roll: rollDeg }, activeProfile.calibration)
    : { pitch: pitchDeg, roll: rollDeg };
  
  // Normalize attitude to FlatFinder canonical coordinate system
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
      {/* Header with prominent back button */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$3"
        paddingBottom="$2"
      >
        {onBack && (
          <Button
            size="$4"
            onPress={onBack}
            icon={ArrowLeft}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            borderColor="rgba(255, 255, 255, 0.3)"
            borderWidth={1}
            color="white"
            hoverStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            }}
            pressStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            Back
          </Button>
        )}
        <H2 color="white" flex={1} textAlign="center" marginRight={onBack ? "$4" : 0}>
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
        {/* Current Reading - Compact */}
        <GlassCard
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderWidth={1}
          padding="$2"
          marginBottom="$2"
          blurIntensity={10}
        >
          <YStack space="$1">
            <Text color="white" textAlign="center" fontSize="$3" fontWeight="600">Current Reading</Text>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$2">Pitch:</Text>
              <Text color="white" fontSize="$3" fontWeight="600">
                {formatMeasurement(Math.abs(physicalReadings.pitchDegrees), 'degrees', settings.measurementUnits)}
                {physicalReadings.pitchDegrees > 0 ? ' (nose up)' : physicalReadings.pitchDegrees < 0 ? ' (nose down)' : ''}
              </Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$gray11" fontSize="$2">Roll:</Text>
              <Text color="white" fontSize="$3" fontWeight="600">
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
                <YStack space="$3">
                  <XStack alignItems="center" space="$2">
                    <AlertCircle size={18} color="#ef4444" />
                    <Text color="#ef4444" fontSize="$4" fontWeight="700">
                      Cannot Level with Current Setup
                    </Text>
                  </XStack>

                  {/* Display warnings */}
                  <YStack space="$2">
                    {levelingPlan.warnings.map((warning: string, index: number) => (
                      <Text key={index} color="#ef4444" fontSize="$3">
                        • {warning}
                      </Text>
                    ))}
                  </YStack>

                  {/* Helpful alternatives */}
                  <YStack space="$2" marginTop="$2">
                    <Text color="#ef4444" fontSize="$3" fontWeight="600">
                      Try these alternatives:
                    </Text>
                    <YStack space="$1.5" paddingLeft="$2">
                      <Text color="rgba(239, 68, 68, 0.9)" fontSize="$3">
                        • Move to a different, flatter spot
                      </Text>
                      <Text color="rgba(239, 68, 68, 0.9)" fontSize="$3">
                        • Add larger block sizes to your profile
                      </Text>
                      <Text color="rgba(239, 68, 68, 0.9)" fontSize="$3">
                        • Use a combination of multiple stacks
                      </Text>
                      <Text color="rgba(239, 68, 68, 0.9)" fontSize="$3">
                        • Re-measure after adjusting position
                      </Text>
                    </YStack>
                  </YStack>
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