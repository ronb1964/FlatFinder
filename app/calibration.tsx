import React, { useState } from 'react';
import { YStack, XStack, Text, Button, H1, Card, H3, ScrollView } from 'tamagui';
import { Target, Settings, CheckCircle, RotateCw, ArrowLeft } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalibrationWizard } from '../src/components/CalibrationWizard';
import { useAppStore } from '../src/state/appStore';
import { StandardBlockSets } from '../src/lib/rvLevelingMath';
import { Calibration } from '../src/lib/levelingMath';

export default function CalibrationScreen() {
  const [showWizard, setShowWizard] = useState(false);
  const [lastCalibration, setLastCalibration] = useState<Calibration | null>(null);
  
  const { activeProfile, calibrateActiveProfile } = useAppStore();

  const handleCalibrationComplete = (calibration: Calibration) => {
    console.log('=== CALIBRATION COMPLETION ===');
    console.log('Received calibration from wizard:', calibration);
    
    console.log('Storing calibration offsets:', calibration);
    
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
        calibration: calibration
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
      calibrateActiveProfile(calibration);
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

  const handleNavigateBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack 
        flex={1} 
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
        }}
      >
        {/* Header */}
        <XStack 
          padding="$4" 
          alignItems="center" 
          space="$3"
          borderBottomWidth={1} 
          borderBottomColor="rgba(255,255,255,0.1)"
        >
          <Button
            size="$3"
            chromeless
            onPress={handleNavigateBack}
            icon={ArrowLeft}
            color="#ffffff"
          />
          <H1 color="#ffffff" fontSize="$7" fontWeight="600">
            Calibration
          </H1>
        </XStack>

        <ScrollView flex={1}>
          <YStack padding="$6" space="$6">
            {/* Calibration Status */}
            <Card 
              padding="$6" 
              backgroundColor="rgba(255,255,255,0.05)"
              borderColor="rgba(255,255,255,0.1)"
              borderRadius="$4"
            >
              <YStack space="$4" alignItems="center">
                <YStack 
                  backgroundColor="rgba(59, 130, 246, 0.1)" 
                  borderRadius="$10" 
                  padding="$4"
                  borderWidth={1}
                  borderColor="rgba(59, 130, 246, 0.2)"
                >
                  <Target size={48} color="#3b82f6" />
                </YStack>
                
                <H3 color="#ffffff" textAlign="center" fontWeight="600">
                  Calibrate Your Level
                </H3>
                
                <Text 
                  color="#94a3b8" 
                  textAlign="center" 
                  fontSize="$4" 
                  lineHeight="$5"
                  maxWidth={300}
                >
                  Calibration ensures accurate level readings by accounting for your device's mounting position and any built-in sensor bias.
                </Text>
                
                {activeProfile?.calibration && (
                                    lastCalibration?.pitchOffsetDegrees !== 0 || lastCalibration?.rollOffsetDegrees !== 0 ||
                  activeProfile.calibration.pitchOffsetDegrees !== 0 || activeProfile.calibration.rollOffsetDegrees !== 0
                ) && (
                  <XStack 
                    alignItems="center" 
                    space="$2" 
                    backgroundColor="rgba(34, 197, 94, 0.1)"
                    borderRadius="$3"
                    padding="$3"
                    borderWidth={1}
                    borderColor="rgba(34, 197, 94, 0.2)"
                  >
                    <CheckCircle size={20} color="#22c55e" />
                    <Text color="#22c55e" fontSize="$3" fontWeight="500">
                      Calibrated
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>

            {/* Calibration Actions */}
            <YStack space="$4">
              <Button
                size="$6"
                onPress={handleStartCalibration}
                backgroundColor="#3b82f6"
                color="#ffffff"
                fontWeight="600"
                pressStyle={{
                  backgroundColor: "#2563eb",
                  transform: [{ scale: 0.98 }],
                }}
                icon={<RotateCw size={20} />}
              >
                Start Calibration Wizard
              </Button>
              
              <Text 
                color="#6b7280" 
                textAlign="center" 
                fontSize="$3"
                paddingHorizontal="$4"
              >
                The calibration wizard will guide you through 3 simple steps to ensure accurate readings.
              </Text>
            </YStack>

            {/* Calibration Details */}
            {activeProfile?.calibration && (
              <Card 
                padding="$4" 
                backgroundColor="rgba(255,255,255,0.02)"
                borderColor="rgba(255,255,255,0.05)"
                borderRadius="$3"
              >
                <YStack space="$3">
                  <H3 color="#ffffff" fontSize="$5" fontWeight="500">
                    Current Calibration
                  </H3>
                  <YStack space="$2">
                    <XStack justifyContent="space-between">
                      <Text color="#94a3b8" fontSize="$3">Pitch Offset:</Text>
                      <Text color="#ffffff" fontSize="$3" fontWeight="500">
                        {activeProfile.calibration.pitchOffsetDegrees.toFixed(2)}°
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="#94a3b8" fontSize="$3">Roll Offset:</Text>
                      <Text color="#ffffff" fontSize="$3" fontWeight="500">
                        {activeProfile.calibration.rollOffsetDegrees.toFixed(2)}°
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>
              </Card>
            )}
          </YStack>
        </ScrollView>

        {/* Calibration Wizard */}
        <CalibrationWizard
          isVisible={showWizard}
          onComplete={handleCalibrationComplete}
          onCancel={handleCancelCalibration}
        />
      </YStack>
    </SafeAreaView>
  );
}
