import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, H2, Button, Card, ScrollView as TamaguiScrollView } from 'tamagui';
import { useAppStore } from '../state/appStore';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { normalizeAttitude, attitudeToLevelingMeasurement, SENSOR_NORMALIZATION_PRESETS } from '../lib/coordinateSystem';
import { RVLevelingCalculator } from '../lib/rvLevelingMath';

interface LevelingAssistantTestProps {
  onBack?: () => void;
}

export function LevelingAssistantTest({ onBack }: LevelingAssistantTestProps) {
  console.log('LevelingAssistantTest rendering...');
  
  const { activeProfile } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();

  // Test coordinate transformations with error handling
  let transformedData = {
    calibrated: { pitch: 0, roll: 0 },
    normalized: { pitch: 0, roll: 0 },
    physical: { pitchDegrees: 0, rollDegrees: 0 },
    error: null
  };

  // Test leveling calculator
  let levelingData = {
    plan: null,
    error: null,
    calculationTime: 0
  };

  try {
    // Apply calibration
    const calibratedReadings = activeProfile?.calibration 
      ? applyCalibration({ pitch: pitchDeg || 0, roll: rollDeg || 0 }, activeProfile.calibration)
      : { pitch: pitchDeg || 0, roll: rollDeg || 0 };
    
    transformedData.calibrated = calibratedReadings;

    // Normalize attitude
    const normalizedAttitude = normalizeAttitude(
      { pitch: calibratedReadings.pitch, roll: calibratedReadings.roll },
      SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
    );
    
    transformedData.normalized = normalizedAttitude;

    // Convert to physical readings
    const physicalReadings = attitudeToLevelingMeasurement(normalizedAttitude);
    
    transformedData.physical = physicalReadings;

    // Test RV Leveling Calculator - THE SUSPECTED CULPRIT
    if (activeProfile) {
      try {
        const startTime = Date.now();
        
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches
        };
        
        const plan = RVLevelingCalculator.createLevelingPlan(
          geometry,
          physicalReadings,
          activeProfile.blockInventory || [],
          6.0
        );
        
        levelingData.plan = plan;
        levelingData.calculationTime = Date.now() - startTime;
        
      } catch (calcError) {
        levelingData.error = calcError.message || 'Leveling calculation failed';
        console.error('Leveling calculator error:', calcError);
      }
    }
    
  } catch (error) {
    transformedData.error = error.message || 'Unknown error';
    console.error('Coordinate transformation error:', error);
  }
  
  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
      }}>
        {onBack && (
          <Text 
            style={{ 
              fontSize: 18, 
              color: '#0066cc',
              textDecorationLine: 'underline'
            }}
            onPress={onBack}
          >
            ← Back
          </Text>
        )}
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold',
          color: '#000000',
          flex: 1,
          textAlign: 'center'
        }}>
          Block Instructions
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ 
          fontSize: 18, 
          color: '#000000',
          marginBottom: 10,
          fontWeight: '600'
        }}>
          ✅ Basic rendering works!
        </Text>
        
        <Text style={{ 
          fontSize: 16, 
          color: '#333333',
          marginBottom: 10
        }}>
          Profile: {activeProfile?.name || 'No profile'}
        </Text>
        
        <Text style={{ 
          fontSize: 16, 
          color: '#333333',
          marginBottom: 10
        }}>
          Raw Pitch: {(pitchDeg || 0).toFixed(1)}°
        </Text>
        
        <Text style={{ 
          fontSize: 16, 
          color: '#333333',
          marginBottom: 10
        }}>
          Raw Roll: {(rollDeg || 0).toFixed(1)}°
        </Text>

        {transformedData.error ? (
          <Text style={{ 
            fontSize: 16, 
            color: '#ff0000',
            marginBottom: 20,
            fontWeight: 'bold'
          }}>
            ❌ Transform Error: {transformedData.error}
          </Text>
        ) : (
          <>
            <Text style={{ 
              fontSize: 16, 
              color: '#006600',
              marginBottom: 10
            }}>
              ✅ Calibrated: {transformedData.calibrated.pitch.toFixed(1)}°, {transformedData.calibrated.roll.toFixed(1)}°
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: '#006600',
              marginBottom: 10
            }}>
              ✅ Normalized: {transformedData.normalized.pitch.toFixed(1)}°, {transformedData.normalized.roll.toFixed(1)}°
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: '#006600',
              marginBottom: 20
            }}>
              ✅ Physical: {transformedData.physical.pitchDegrees.toFixed(1)}°, {transformedData.physical.rollDegrees.toFixed(1)}°
            </Text>
          </>
        )}

        {/* Leveling Calculator Test Results */}
        <Text style={{ 
          fontSize: 17, 
          color: '#000000',
          marginBottom: 10,
          fontWeight: '600'
        }}>
          🧮 Leveling Calculator Test:
        </Text>

        {levelingData.error ? (
          <Text style={{ 
            fontSize: 16, 
            color: '#ff0000',
            marginBottom: 20,
            fontWeight: 'bold'
          }}>
            ❌ Calculator Error: {levelingData.error}
          </Text>
        ) : levelingData.plan ? (
          <>
            <Text style={{ 
              fontSize: 16, 
              color: '#006600',
              marginBottom: 10
            }}>
              ✅ Leveling Plan Generated ({levelingData.calculationTime}ms)
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#333333',
              marginBottom: 10
            }}>
              Wheel lifts needed: {levelingData.plan.wheelLifts.length}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#333333',
              marginBottom: 20
            }}>
              Warnings: {levelingData.plan.warnings.length}
            </Text>
          </>
        ) : (
          <Text style={{ 
            fontSize: 16, 
            color: '#888888',
            marginBottom: 20
          }}>
            ⏳ Calculator not run (no profile)
          </Text>
        )}

        <View style={{
          backgroundColor: '#f8f9fa',
          padding: 16,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: '#333333',
            marginBottom: 10,
            fontWeight: '600'
          }}>
            Next Steps:
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#666666',
            lineHeight: 20
          }}>
            Since this simplified version works, I can now gradually add back the leveling calculation functionality until I find the exact component causing the crash.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}