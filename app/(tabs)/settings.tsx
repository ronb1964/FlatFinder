import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { GlassSlider } from '../../src/components/ui/GlassSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Vibrate,
  Volume2,
  Moon,
  Sun,
  Activity,
  Gauge,
  RotateCcw,
  Ruler,
} from 'lucide-react-native';

import { useAppStore } from '../../src/state/appStore';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';
import { GlassToggle } from '../../src/components/ui/GlassToggle';
import { THEME } from '../../src/theme';

export default function SettingsScreen() {
  const { settings, updateSettings, loadSettings, resetOnboarding } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const SettingRow = ({
    icon,
    title,
    description,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingRowLeft}>
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Settings</Text>

          {/* Feedback Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEEDBACK</Text>
            <GlassCard>
              <View style={styles.cardContent}>
                <SettingRow
                  icon={
                    <Vibrate size={20} color={settings.hapticsEnabled ? '#22c55e' : '#737373'} />
                  }
                  title="Haptic Feedback"
                  description="Vibrate when level changes"
                >
                  <GlassToggle
                    value={settings.hapticsEnabled}
                    onValueChange={(checked) => updateSettings({ hapticsEnabled: checked })}
                  />
                </SettingRow>

                <View style={styles.cardDivider} />

                <SettingRow
                  icon={<Volume2 size={20} color={settings.audioEnabled ? '#3b82f6' : '#737373'} />}
                  title="Audio Feedback"
                  description="Play sounds when near level"
                >
                  <GlassToggle
                    value={settings.audioEnabled}
                    onValueChange={(checked) => updateSettings({ audioEnabled: checked })}
                  />
                </SettingRow>
              </View>
            </GlassCard>
          </View>

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DISPLAY</Text>
            <GlassCard>
              <View style={styles.cardContent}>
                <SettingRow
                  icon={
                    settings.nightMode ? (
                      <Moon size={20} color="#818cf8" />
                    ) : (
                      <Sun size={20} color="#fbbf24" />
                    )
                  }
                  title="Night Mode"
                  description="Dark theme for night use"
                >
                  <GlassToggle
                    value={settings.nightMode}
                    onValueChange={(checked) => updateSettings({ nightMode: checked })}
                  />
                </SettingRow>

                <View style={styles.cardDivider} />

                <SettingRow
                  icon={<Activity size={20} color={settings.keepAwake ? '#f97316' : '#737373'} />}
                  title="Keep Screen Awake"
                  description="Prevent screen from sleeping"
                >
                  <GlassToggle
                    value={settings.keepAwake}
                    onValueChange={(checked) => updateSettings({ keepAwake: checked })}
                  />
                </SettingRow>
              </View>
            </GlassCard>
          </View>

          {/* Measurement Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEASUREMENTS</Text>
            <GlassCard>
              <View style={styles.cardContent}>
                {/* Units Selection */}
                <View style={styles.unitsSection}>
                  <View style={styles.unitsSectionHeader}>
                    <Ruler size={20} color="#3b82f6" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Units</Text>
                      <Text style={styles.settingDescription}>
                        Choose your preferred measurement system
                      </Text>
                    </View>
                  </View>
                  <View style={styles.unitsRow}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        settings.measurementUnits === 'imperial' && styles.unitButtonActive,
                      ]}
                      onPress={() => updateSettings({ measurementUnits: 'imperial' })}
                    >
                      <View
                        style={[
                          styles.unitRadio,
                          settings.measurementUnits === 'imperial' && styles.unitRadioActive,
                        ]}
                      >
                        {settings.measurementUnits === 'imperial' && (
                          <View style={styles.unitRadioInner} />
                        )}
                      </View>
                      <View style={styles.unitTextContainer}>
                        <Text
                          style={[
                            styles.unitText,
                            settings.measurementUnits === 'imperial' && styles.unitTextActive,
                          ]}
                        >
                          Imperial
                        </Text>
                        <Text style={styles.unitAbbrev}>in / ft</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        settings.measurementUnits === 'metric' && styles.unitButtonActive,
                      ]}
                      onPress={() => updateSettings({ measurementUnits: 'metric' })}
                    >
                      <View
                        style={[
                          styles.unitRadio,
                          settings.measurementUnits === 'metric' && styles.unitRadioActive,
                        ]}
                      >
                        {settings.measurementUnits === 'metric' && (
                          <View style={styles.unitRadioInner} />
                        )}
                      </View>
                      <View style={styles.unitTextContainer}>
                        <Text
                          style={[
                            styles.unitText,
                            settings.measurementUnits === 'metric' && styles.unitTextActive,
                          ]}
                        >
                          Metric
                        </Text>
                        <Text style={styles.unitAbbrev}>cm / m</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Level Threshold Slider */}
                <View style={styles.sliderSection}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderHeaderLeft}>
                      <Gauge size={20} color="#22c55e" />
                      <Text style={styles.settingTitle}>Level Threshold</Text>
                    </View>
                    <View style={styles.thresholdBadge}>
                      <Text style={styles.thresholdValue}>
                        {settings.levelThreshold.toFixed(1)}°
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sliderDescription}>
                    Tolerance for considering the vehicle level
                  </Text>
                  <View style={styles.sliderContainer}>
                    <GlassSlider
                      value={settings.levelThreshold}
                      onValueChange={(value) => updateSettings({ levelThreshold: value })}
                      minimumValue={0.1}
                      maximumValue={2}
                      step={0.1}
                      trackColor="#22c55e"
                    />
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>Precise</Text>
                      <Text style={styles.sliderLabel}>Relaxed</Text>
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Developer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVELOPER</Text>
            <GlassCard borderColor="rgba(239, 68, 68, 0.3)">
              <View style={styles.cardContent}>
                <View style={styles.resetSection}>
                  <View style={styles.resetHeader}>
                    <RotateCcw size={20} color="#ef4444" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Reset Onboarding</Text>
                      <Text style={styles.settingDescription}>
                        Show the onboarding tutorial again for testing
                      </Text>
                    </View>
                  </View>
                  <GlassButton
                    variant="danger"
                    size="md"
                    icon={<RotateCcw size={16} color="#fff" />}
                    onPress={() => {
                      resetOnboarding();
                      if (Platform.OS === 'web' && typeof globalThis.window !== 'undefined') {
                        globalThis.window.location.reload();
                      }
                    }}
                  >
                    Reset &amp; Restart
                  </GlassButton>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <GlassCard variant="primary">
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>FlatFinder</Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
                <Text style={styles.aboutDescription}>
                  Professional RV and trailer leveling app with precision sensors and intelligent
                  guidance
                </Text>
                <View style={styles.aboutDivider} />
                <Text style={styles.aboutFooter}>Made with love for RV enthusiasts</Text>
              </View>
            </GlassCard>
          </View>

          {/* Bottom padding for scroll */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardContent: {
    gap: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRowLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  settingDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  // Units section
  unitsSection: {
    gap: 12,
  },
  unitsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unitButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  unitRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitRadioActive: {
    borderColor: '#3b82f6',
  },
  unitRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  unitTextContainer: {
    flex: 1,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  unitTextActive: {
    color: THEME.colors.text,
  },
  unitAbbrev: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  // Slider section
  sliderSection: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thresholdBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  sliderDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 32,
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
  // Reset section
  resetSection: {
    gap: 16,
  },
  resetHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  // About section
  aboutContent: {
    alignItems: 'center',
    gap: 12,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  versionBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
  },
  aboutDescription: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  aboutDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginVertical: 4,
  },
  aboutFooter: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 24,
  },
});
