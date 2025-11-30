import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan } from '../lib/rvLevelingMath';
import {
  normalizeAttitude,
  attitudeToLevelingMeasurement,
  SENSOR_NORMALIZATION_PRESETS,
} from '../lib/coordinateSystem';
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
    setForceUpdate((prev) => prev + 1);
  }, []);

  // Apply calibration to sensor readings
  const calibratedReadings = activeProfile?.calibration
    ? applyCalibration({ pitch: pitchDeg, roll: rollDeg }, activeProfile.calibration)
    : { pitch: pitchDeg, roll: rollDeg };

  // Normalize attitude to LevelMate canonical coordinate system
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

    const timeoutId = setTimeout(calculatePlan, 100);
    return () => clearTimeout(timeoutId);
  }, [
    Math.round(pitchDeg * 10) / 10,
    Math.round(rollDeg * 10) / 10,
    activeProfile,
    forceUpdate,
  ]);

  if (!activeProfile) {
    return (
      <View className="flex-1 p-4 justify-center items-center">
        <Text className="text-red-500">No active vehicle profile. Please set up a profile first.</Text>
        {onBack && (
          <TouchableOpacity className="mt-4 px-6 py-3 bg-primary rounded-lg" onPress={onBack}>
            <Text className="text-primary-foreground font-semibold">Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Check if we're near level (within 0.5 degrees)
  const isNearLevel =
    Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5;

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: '#1a1a2e',
      }}
    >
      {/* Compact Header */}
      <View className="flex-row justify-between items-center p-2 pb-1">
        {onBack && (
          <TouchableOpacity className="p-2" onPress={onBack}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text
          className="flex-1 text-center text-white text-xl font-bold"
          style={{ marginRight: onBack ? 40 : 0 }}
        >
          Block Instructions
        </Text>
        {!onBack && <View className="w-10" />}
      </View>

      {/* Compact Bubble Level */}
      {!isNearLevel && (
        <View className="items-center p-2 pb-1">
          <BubbleLevel
            pitch={physicalReadings.pitchDegrees}
            roll={physicalReadings.rollDegrees}
            isLevel={isNearLevel}
            color="#ef4444"
            size="compact"
          />
        </View>
      )}

      {/* Scrollable Content */}
      <ScrollView className="flex-1 p-2 pt-0" showsVerticalScrollIndicator={true}>
        {/* Level Status */}
        <View
          className="rounded-xl p-3 mb-3 border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <View className="gap-2">
            <Text className="text-white text-center text-lg font-bold">Current Reading</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-sm">Pitch:</Text>
              <Text className="text-white text-base font-semibold">
                {Math.abs(physicalReadings.pitchDegrees).toFixed(1)}°
                {physicalReadings.pitchDegrees > 0
                  ? ' (nose up)'
                  : physicalReadings.pitchDegrees < 0
                    ? ' (nose down)'
                    : ''}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-sm">Roll:</Text>
              <Text className="text-white text-base font-semibold">
                {Math.abs(physicalReadings.rollDegrees).toFixed(1)}°
                {physicalReadings.rollDegrees > 0
                  ? ' (right up)'
                  : physicalReadings.rollDegrees < 0
                    ? ' (left up)'
                    : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Level Status */}
        {isNearLevel ? (
          <View
            className="rounded-xl p-4 justify-center items-center mb-3 border"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            }}
          >
            <Text className="text-green-500 text-xl font-bold text-center">🎉 Level!</Text>
            <Text className="text-green-500 text-sm text-center mt-1">
              Your RV is properly leveled
            </Text>
          </View>
        ) : (
          <View
            className="rounded-xl p-4 justify-center items-center mb-3 border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <Text className="text-red-500 text-base font-bold text-center">⚠️ Not Level</Text>
            <Text className="text-red-500 text-sm text-center mt-1">
              Follow instructions below to level
            </Text>
          </View>
        )}

        {/* Leveling Instructions - Only show if NOT level */}
        {!isNearLevel && levelingPlan && !isCalculating && (
          <View className="gap-2">
            {/* Warnings */}
            {levelingPlan.warnings.length > 0 && (
              <View
                className="rounded-xl p-3 mb-3 border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={16} color="#ef4444" />
                    <Text className="text-red-500 text-sm font-semibold">
                      Cannot Level with Current Blocks
                    </Text>
                  </View>
                  <Text className="text-red-500 text-sm">{levelingPlan.warnings.join(' ')}</Text>
                </View>
              </View>
            )}

            {/* Lift Instructions */}
            {levelingPlan.wheelLifts
              .filter((lift) => lift.liftInches > 0.001)
              .map((lift, index) => {
                const blockStack = levelingPlan.blockStacks[lift.location];
                return (
                  <View
                    key={lift.location}
                    className="rounded-xl p-3 mb-2 border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <View className="gap-2">
                      <Text className="text-white text-base font-bold">{lift.location}</Text>
                      <Text className="text-gray-400 text-sm">
                        Lift needed:{' '}
                        {formatMeasurement(lift.liftInches, settings.measurementUnits || 'imperial')}
                      </Text>

                      {blockStack.blocks.length === 0 ? (
                        <View
                          className="rounded-lg p-2 border"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          <Text className="text-red-500 text-sm text-center">
                            No blocks available for this height
                          </Text>
                        </View>
                      ) : blockStack.blocks.length > 0 ? (
                        <View className="gap-2">
                          <View className="gap-2">
                            {blockStack.blocks
                              .filter((block) => block.thickness > 0.001 && block.count > 0)
                              .map((block, blockIndex) => (
                                <View
                                  key={blockIndex}
                                  className="rounded-lg p-2 border"
                                  style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    borderColor: 'rgba(34, 197, 94, 0.3)',
                                  }}
                                >
                                  <View className="flex-row justify-between items-center">
                                    <Text className="text-green-500 text-sm font-semibold">
                                      {block.count} ×{' '}
                                      {formatMeasurement(
                                        block.thickness,
                                        settings.measurementUnits || 'imperial'
                                      )}
                                    </Text>
                                    <Text className="text-green-500 text-sm">
                                      ={' '}
                                      {formatMeasurement(
                                        block.count * block.thickness,
                                        settings.measurementUnits || 'imperial'
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                          </View>
                          <View
                            className="rounded-lg p-2 border"
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                            }}
                          >
                            <View className="flex-row justify-between items-center">
                              <Text className="text-blue-500 text-sm font-semibold">
                                Total Height:
                              </Text>
                              <Text className="text-blue-500 text-base font-bold">
                                {formatMeasurement(
                                  blockStack.totalHeight,
                                  settings.measurementUnits || 'imperial'
                                )}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <Text className="text-gray-400 text-sm">No blocks needed</Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* No Plan State */}
        {!levelingPlan && !isCalculating && (
          <View
            className="rounded-xl p-4 justify-center items-center mb-3 border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Text className="text-white text-base text-center mb-1">🎯 Reading sensors...</Text>
            <Text className="text-gray-400 text-sm text-center">Place device flat on RV floor</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
