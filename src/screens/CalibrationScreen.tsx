import React, { useState } from 'react';
import { YStack, XStack, Text, Button, H1, Card, H3, ScrollView } from 'tamagui';
import { Target, Settings, CheckCircle, RotateCw } from '@tamagui/lucide-icons';
import { CalibrationWizard } from '../components/CalibrationWizard';
import { useAppStore } from '../state/appStore';
import { createCalibration } from '../lib/calibration';
import { StandardBlockSets } from '../lib/rvLevelingMath';

interface CalibrationScreenProps {
  onNavigateBack: () => void;
}

export function CalibrationScreen({ onNavigateBack }: CalibrationScreenProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [lastCalibration, setLastCalibration] = useState<{ pitch: number; roll: number } | null>(null);
  
  const { activeProfile, calibrateActiveProfile } = useAppStore();

  const handleCalibrationComplete = (calibration: { pitch: number; roll: number }) => {
    console.log('=== CALIBRATION COMPLETION ===');
    console.log('Received calibration from wizard:', calibration);
    
    // Convert to the expected format for storage
    const calibrationOffsets = { 
      pitch: calibration.pitch, 
      roll: calibration.roll 
    };
    
    console.log('Storing calibration offsets:', calibrationOffsets);
    
    // If no active profile, create a default one first
    if (!activeProfile) {
      const { addProfile, setActiveProfile } = useAppStore.getState();
      addProfile({
        name: 'Default Trailer',
        type: 'trailer',
        wheelbaseInches: 144,
        trackWidthInches: 72,
        hitchOffsetInches: 0,
        blockInventory: StandardBlockSets.professional(),
        calibration: calibrationOffsets
      });
      
      // Set the newly created profile as active
      setTimeout(() => {
        const newState = useAppStore.getState();
        if (newState.profiles.length > 0) {
          setActiveProfile(newState.profiles[newState.profiles.length - 1].id);
        }
      }, 100);
    } else {
      // Apply the calculated offsets to the active profile
      calibrateActiveProfile(calibrationOffsets);
    }
    
    setLastCalibration(calibration);
    setShowWizard(false);
  };

  const handleStartCalibration = () => {
    setShowWizard(true);
  };

  const handleCancelCalibration = () => {
    setShowWizard(false);
  };

  return (
    <YStack 
      flex={1} 
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
      }}
    >
      {showWizard ? (
        <CalibrationWizard
          onComplete={handleCalibrationComplete}
          onCancel={handleCancelCalibration}
          isVisible={showWizard}
        />
      ) : (
        <YStack flex={1}>
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack padding="$6" space="$6" paddingBottom="$8">
              {/* Header */}
              <YStack space="$4" alignItems="center">
                <YStack 
                  backgroundColor="rgba(34, 197, 94, 0.1)" 
                  borderRadius="$10" 
                  padding="$4"
                  borderWidth={1}
                  borderColor="rgba(34, 197, 94, 0.2)"
                >
                  <Settings size={48} color="#22c55e" />
                </YStack>
                
                <H1 
                  fontSize="$11" 
                  fontWeight="800" 
                  textAlign="center" 
                  color="#ffffff"
                  letterSpacing={-0.5}
                >
                  Device Calibration
                </H1>
                
                <Text 
                  fontSize="$5" 
                  textAlign="center" 
                  color="#94a3b8" 
                  fontWeight="400"
                  maxWidth={320}
                  lineHeight="$6"
                >
                  Calibrate your device to ensure accurate leveling readings at any campsite
                </Text>
              </YStack>

          {/* Current Profile Info */}
          {activeProfile && (
            <Card
              padding="$4"
              backgroundColor="rgba(255, 255, 255, 0.03)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              borderRadius="$4"
            >
              <XStack space="$3" alignItems="center">
                <Target size={20} color="#3b82f6" />
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" color="#ffffff">
                    Active Profile: {activeProfile.name}
                  </Text>
                  <Text fontSize="$3" color="#94a3b8">
                    {activeProfile.type} • Last calibrated: {
                      activeProfile.calibration.pitch !== 0 || activeProfile.calibration.roll !== 0
                        ? 'Previously calibrated'
                        : 'Never calibrated'
                    }
                  </Text>
                </YStack>
              </XStack>
            </Card>
          )}

          {/* How It Works */}
          <YStack space="$4">
            <H3 fontSize="$6" fontWeight="600" color="#ffffff">
              How It Works
            </H3>
            
            <YStack space="$3">
              <Card
                padding="$4"
                backgroundColor="rgba(255, 255, 255, 0.02)"
                borderColor="rgba(255, 255, 255, 0.05)"
                borderWidth={1}
                borderRadius="$3"
              >
                <XStack space="$3" alignItems="flex-start">
                  <YStack 
                    backgroundColor="rgba(59, 130, 246, 0.1)" 
                    borderRadius="$2" 
                    padding="$2"
                    borderWidth={1}
                    borderColor="rgba(59, 130, 246, 0.2)"
                    minWidth={32}
                    alignItems="center"
                  >
                    <Text fontSize="$3" fontWeight="700" color="#3b82f6">1</Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="500" color="#ffffff">
                      Quick Setup
                    </Text>
                    <Text fontSize="$3" color="#94a3b8" lineHeight="$4">
                      Place your phone on a stable surface and take 3 readings from different angles
                    </Text>
                  </YStack>
                </XStack>
              </Card>

              <Card
                padding="$4"
                backgroundColor="rgba(255, 255, 255, 0.02)"
                borderColor="rgba(255, 255, 255, 0.05)"
                borderWidth={1}
                borderRadius="$3"
              >
                <XStack space="$3" alignItems="flex-start">
                  <YStack 
                    backgroundColor="rgba(168, 85, 247, 0.1)" 
                    borderRadius="$2" 
                    padding="$2"
                    borderWidth={1}
                    borderColor="rgba(168, 85, 247, 0.2)"
                    minWidth={32}
                    alignItems="center"
                  >
                    <Text fontSize="$3" fontWeight="700" color="#a855f7">2</Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="500" color="#ffffff">
                      Smart Averaging
                    </Text>
                    <Text fontSize="$3" color="#94a3b8" lineHeight="$4">
                      The app averages multiple readings to establish a reliable baseline
                    </Text>
                  </YStack>
                </XStack>
              </Card>

              <Card
                padding="$4"
                backgroundColor="rgba(255, 255, 255, 0.02)"
                borderColor="rgba(255, 255, 255, 0.05)"
                borderWidth={1}
                borderRadius="$3"
              >
                <XStack space="$3" alignItems="flex-start">
                  <YStack 
                    backgroundColor="rgba(34, 197, 94, 0.1)" 
                    borderRadius="$2" 
                    padding="$2"
                    borderWidth={1}
                    borderColor="rgba(34, 197, 94, 0.2)"
                    minWidth={32}
                    alignItems="center"
                  >
                    <Text fontSize="$3" fontWeight="700" color="#22c55e">3</Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="500" color="#ffffff">
                      Automatic Adjustment
                    </Text>
                    <Text fontSize="$3" color="#94a3b8" lineHeight="$4">
                      All future measurements are automatically offset using your calibration
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            </YStack>
          </YStack>

          {/* Last Calibration Results */}
          {lastCalibration && (
            <Card
              padding="$4"
              backgroundColor="rgba(34, 197, 94, 0.05)"
              borderColor="rgba(34, 197, 94, 0.2)"
              borderWidth={1}
              borderRadius="$4"
            >
              <XStack space="$3" alignItems="center">
                <CheckCircle size={24} color="#22c55e" />
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" color="#22c55e">
                    Calibration Complete!
                  </Text>
                  <Text fontSize="$3" color="#94a3b8">
                    Baseline: P: {lastCalibration.pitch.toFixed(2)}°, R: {lastCalibration.roll.toFixed(2)}°
                  </Text>
                </YStack>
              </XStack>
            </Card>
          )}

            </YStack>
          </ScrollView>

          {/* Action Buttons - Fixed at bottom */}
          <YStack 
            padding="$6" 
            space="$3" 
            backgroundColor="rgba(26, 26, 46, 0.98)"
            borderTopWidth={1}
            borderTopColor="rgba(255, 255, 255, 0.1)"
          >
            <Button
              size="$5"
              backgroundColor="#22c55e"
              color="#ffffff"
              fontWeight="600"
              borderRadius="$4"
              onPress={handleStartCalibration}
              icon={RotateCw}
            >
              {activeProfile && (activeProfile.calibration.pitch !== 0 || activeProfile.calibration.roll !== 0)
                ? 'Recalibrate Device'
                : 'Start Calibration'
              }
            </Button>
            
            {!activeProfile && (
              <Text fontSize="$3" color="#eab308" textAlign="center">
                Will create a default profile during calibration
              </Text>
            )}
            
            <Button
              size="$4"
              backgroundColor="transparent"
              color="#94a3b8"
              borderColor="rgba(255, 255, 255, 0.2)"
              borderWidth={1}
              onPress={onNavigateBack}
            >
              Back
            </Button>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}