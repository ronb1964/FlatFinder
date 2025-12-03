import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Target, CheckCircle, RotateCw, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CalibrationWizard } from '../src/components/CalibrationWizard';
import { useAppStore } from '../src/state/appStore';
import { StandardBlockSets } from '../src/lib/rvLevelingMath';
import { Calibration } from '../src/lib/levelingMath';
import { THEME } from '../src/theme';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassButton } from '../src/components/ui/GlassButton';

export default function CalibrationScreen() {
  const [showWizard, setShowWizard] = useState(true);

  const { activeProfile, calibrateActiveProfile, addProfile, setActiveProfile } = useAppStore();

  const handleCalibrationComplete = (
    calibration: Calibration,
    _vehicleTilt: { pitch: number; roll: number }
  ) => {
    // Vehicle tilt is available for future use (e.g., leveling assistant)
    // Currently we only store the device bias calibration

    if (!activeProfile) {
      // Create a default profile if none exists
      addProfile({
        name: 'My RV',
        type: 'trailer',
        wheelbaseInches: 144,
        trackWidthInches: 72,
        hitchOffsetInches: 60,
        blockInventory: StandardBlockSets.professional(),
        calibration: calibration,
      });

      globalThis.setTimeout(() => {
        const newState = useAppStore.getState();
        if (newState.profiles.length > 0) {
          setActiveProfile(newState.profiles[newState.profiles.length - 1].id);
        }
      }, 100);
    } else {
      calibrateActiveProfile(calibration);
    }

    setShowWizard(false);

    // Navigate to main screen after a brief moment
    globalThis.setTimeout(() => {
      router.back();
    }, 500);
  };

  const handleStartWizard = () => {
    setShowWizard(true);
  };

  const handleCancelWizard = () => {
    setShowWizard(false);
    // Navigate back to home screen after canceling
    router.replace('/');
  };

  const handleNavigateBack = () => {
    router.replace('/');
  };

  const hasCalibration =
    activeProfile?.calibration &&
    (activeProfile.calibration.pitchOffsetDegrees !== 0 ||
      activeProfile.calibration.rollOffsetDegrees !== 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0a0a0f', '#111118', '#0d0d12']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleNavigateBack}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Calibration</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Main Calibration Card */}
          <GlassCard variant="primary">
            <View style={styles.mainCard}>
              <View style={styles.iconContainer}>
                <Target size={48} color={THEME.colors.primary} />
              </View>

              <Text style={styles.cardTitle}>Calibrate Your Level</Text>
              <Text style={styles.cardDescription}>
                The 3-step calibration process accounts for your phone&apos;s camera bump and
                measures your vehicle&apos;s current tilt.
              </Text>

              {hasCalibration && (
                <View style={styles.calibratedBadge}>
                  <CheckCircle size={16} color={THEME.colors.success} />
                  <Text style={styles.calibratedText}>Currently Calibrated</Text>
                </View>
              )}

              <GlassButton
                variant="primary"
                size="lg"
                onPress={handleStartWizard}
                icon={<RotateCw size={20} color="#fff" />}
              >
                Start Calibration
              </GlassButton>

              <Text style={styles.helperText}>
                Takes about 30 seconds. Rotate your phone through 3 positions.
              </Text>
            </View>
          </GlassCard>

          {/* Current Calibration Details */}
          {activeProfile?.calibration && (
            <GlassCard>
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Current Calibration</Text>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Pitch Offset</Text>
                    <Text style={styles.detailValue}>
                      {activeProfile.calibration.pitchOffsetDegrees.toFixed(2)}°
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Roll Offset</Text>
                    <Text style={styles.detailValue}>
                      {activeProfile.calibration.rollOffsetDegrees.toFixed(2)}°
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          )}
        </ScrollView>

        {/* Calibration Wizard Modal */}
        {showWizard && (
          <CalibrationWizard
            isVisible={showWizard}
            onComplete={handleCalibrationComplete}
            onCancel={handleCancelWizard}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  mainCard: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  calibratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  calibratedText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.success,
  },
  helperText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  detailsCard: {
    gap: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
