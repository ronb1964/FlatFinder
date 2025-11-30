import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Target, CheckCircle, RotateCw, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

    if (!activeProfile) {
      const { addProfile, setActiveProfile } = useAppStore.getState();
      addProfile({
        name: 'Default Trailer',
        type: 'trailer',
        wheelbaseInches: 144,
        trackWidthInches: 72,
        hitchOffsetInches: 0,
        blockInventory: StandardBlockSets.professional(),
        calibration: calibration,
      });

      setTimeout(() => {
        const newState = useAppStore.getState();
        if (newState.profiles.length > 0) {
          setActiveProfile(newState.profiles[newState.profiles.length - 1].id);
        }
      }, 100);
    } else {
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

  const hasCalibration =
    (activeProfile?.calibration &&
      (activeProfile.calibration.pitchOffsetDegrees !== 0 ||
        activeProfile.calibration.rollOffsetDegrees !== 0)) ||
    (lastCalibration &&
      (lastCalibration.pitchOffsetDegrees !== 0 || lastCalibration.rollOffsetDegrees !== 0));

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f172a']}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View className="flex-row p-4 items-center gap-3 border-b border-white/10">
          <TouchableOpacity className="p-2" onPress={handleNavigateBack}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">Calibration</Text>
        </View>

        <ScrollView className="flex-1">
          <View className="p-6 gap-6">
            {/* Calibration Status Card */}
            <View
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <View className="gap-4 items-center">
                <View
                  className="rounded-full p-4 border"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <Target size={48} color="#3b82f6" />
                </View>

                <Text className="text-white text-center font-semibold text-xl">
                  Calibrate Your Level
                </Text>

                <Text
                  className="text-center text-base max-w-[300px]"
                  style={{ color: '#94a3b8' }}
                >
                  Calibration ensures accurate level readings by accounting for your device's
                  mounting position and any built-in sensor bias.
                </Text>

                {hasCalibration && (
                  <View
                    className="flex-row items-center gap-2 rounded-lg p-3 border"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <CheckCircle size={20} color="#22c55e" />
                    <Text className="font-medium" style={{ color: '#22c55e' }}>
                      Calibrated
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Calibration Actions */}
            <View className="gap-4">
              <TouchableOpacity
                className="py-4 rounded-xl items-center flex-row justify-center gap-2"
                style={{ backgroundColor: '#3b82f6' }}
                onPress={handleStartCalibration}
                activeOpacity={0.8}
              >
                <RotateCw size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg">
                  Start Calibration Wizard
                </Text>
              </TouchableOpacity>

              <Text className="text-center text-sm px-4" style={{ color: '#6b7280' }}>
                The calibration wizard will guide you through 3 simple steps to ensure accurate
                readings.
              </Text>
            </View>

            {/* Current Calibration Details */}
            {activeProfile?.calibration && (
              <View
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <View className="gap-3">
                  <Text className="text-white font-medium text-lg">Current Calibration</Text>
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text style={{ color: '#94a3b8' }}>Pitch Offset:</Text>
                      <Text className="text-white font-medium">
                        {activeProfile.calibration.pitchOffsetDegrees.toFixed(2)}°
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text style={{ color: '#94a3b8' }}>Roll Offset:</Text>
                      <Text className="text-white font-medium">
                        {activeProfile.calibration.rollOffsetDegrees.toFixed(2)}°
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Calibration Wizard Modal */}
        {showWizard && (
          <View className="absolute inset-0">
            <CalibrationWizard
              isVisible={showWizard}
              onComplete={handleCalibrationComplete}
              onCancel={handleCancelCalibration}
            />
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
