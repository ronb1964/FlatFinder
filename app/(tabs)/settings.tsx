import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { GlassSlider } from '../../src/components/ui/GlassSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Vibrate,
  Volume2,
  Moon,
  Sun,
  Smartphone,
  Activity,
  Gauge,
  RotateCcw,
  Ruler,
  Zap,
} from 'lucide-react-native';

import { ThemePreference } from '../../src/state/appStore';

import { useAppStore } from '../../src/state/appStore';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';
import { GlassToggle } from '../../src/components/ui/GlassToggle';
import { useTheme } from '../../src/hooks/useTheme';

export default function SettingsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const { settings, updateSettings, loadSettings, resetOnboarding } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Theme-aware colors for inline styles
  const colors = {
    iconWrapperBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    unitButtonBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    unitButtonBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    unitButtonActiveBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
    unitButtonActiveBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
    unitRadioBorder: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
  };

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
        <View style={[styles.iconWrapper, { backgroundColor: colors.iconWrapperBg }]}>{icon}</View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Settings</Text>

          {/* Feedback Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              FEEDBACK
            </Text>
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

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

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
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              DISPLAY
            </Text>
            <GlassCard>
              <View style={styles.cardContent}>
                {/* Theme Selection */}
                <View style={styles.themeSection}>
                  <View style={styles.themeSectionHeader}>
                    {settings.themePreference === 'dark' ? (
                      <Moon size={20} color="#818cf8" />
                    ) : settings.themePreference === 'light' ? (
                      <Sun size={20} color="#fbbf24" />
                    ) : (
                      <Smartphone size={20} color="#3b82f6" />
                    )}
                    <View style={styles.settingTextContainer}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Theme</Text>
                      <Text
                        style={[styles.settingDescription, { color: theme.colors.textSecondary }]}
                      >
                        {settings.themePreference === 'system'
                          ? 'Follows your device setting'
                          : settings.themePreference === 'light'
                            ? 'Always use light theme'
                            : 'Always use dark theme'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.themeRow}>
                    {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => {
                      const isActive = settings.themePreference === option;
                      const Icon =
                        option === 'system' ? Smartphone : option === 'light' ? Sun : Moon;
                      const activeColor =
                        option === 'system'
                          ? '#3b82f6'
                          : option === 'light'
                            ? '#fbbf24'
                            : '#818cf8';

                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.themeButton,
                            {
                              backgroundColor: isActive ? `${activeColor}15` : colors.unitButtonBg,
                              borderColor: isActive ? `${activeColor}40` : colors.unitButtonBorder,
                            },
                          ]}
                          onPress={() => updateSettings({ themePreference: option })}
                        >
                          <Icon size={18} color={isActive ? activeColor : theme.colors.textMuted} />
                          <Text
                            style={[
                              styles.themeButtonText,
                              {
                                color: isActive ? theme.colors.text : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

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

          {/* Tips & Features Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              TIPS & FEATURES
            </Text>
            <GlassCard variant="primary">
              <View style={styles.cardContent}>
                {/* Sun Button Feature */}
                <View style={styles.featureRow}>
                  <View
                    style={[styles.featureIconContainer, { backgroundColor: colors.iconWrapperBg }]}
                  >
                    <Sun size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      Outdoor Mode
                    </Text>
                    <Text
                      style={[styles.featureDescription, { color: theme.colors.textSecondary }]}
                    >
                      Tap the sun icon on the Leveling Plan screen to switch to light mode for
                      better visibility in bright sunlight.
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

                {/* Audio Feedback Feature */}
                <View style={styles.featureRow}>
                  <View
                    style={[styles.featureIconContainer, { backgroundColor: colors.iconWrapperBg }]}
                  >
                    <Volume2 size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      Audio Feedback
                    </Text>
                    <Text
                      style={[styles.featureDescription, { color: theme.colors.textSecondary }]}
                    >
                      When enabled, you&apos;ll hear beeps that speed up as you get closer to
                      level—no need to watch the screen!
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

                {/* Haptic Feedback Feature */}
                <View style={styles.featureRow}>
                  <View
                    style={[styles.featureIconContainer, { backgroundColor: colors.iconWrapperBg }]}
                  >
                    <Smartphone size={20} color="#22c55e" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      Haptic Feedback
                    </Text>
                    <Text
                      style={[styles.featureDescription, { color: theme.colors.textSecondary }]}
                    >
                      Feel a vibration when you reach level. Great for noisy environments.
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

                {/* Keep Screen Awake Feature */}
                <View style={styles.featureRow}>
                  <View
                    style={[styles.featureIconContainer, { backgroundColor: colors.iconWrapperBg }]}
                  >
                    <Zap size={20} color="#a855f7" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      Keep Screen Awake
                    </Text>
                    <Text
                      style={[styles.featureDescription, { color: theme.colors.textSecondary }]}
                    >
                      Prevents your phone from sleeping while leveling. Toggle it above in Display
                      settings.
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Measurement Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              MEASUREMENTS
            </Text>
            <GlassCard>
              <View style={styles.cardContent}>
                {/* Units Selection */}
                <View style={styles.unitsSection}>
                  <View style={styles.unitsSectionHeader}>
                    <Ruler size={20} color="#3b82f6" />
                    <View style={styles.settingTextContainer}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Units</Text>
                      <Text
                        style={[styles.settingDescription, { color: theme.colors.textSecondary }]}
                      >
                        Choose your preferred measurement system
                      </Text>
                    </View>
                  </View>
                  <View style={styles.unitsRow}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        {
                          backgroundColor:
                            settings.measurementUnits === 'imperial'
                              ? colors.unitButtonActiveBg
                              : colors.unitButtonBg,
                          borderColor:
                            settings.measurementUnits === 'imperial'
                              ? colors.unitButtonActiveBorder
                              : colors.unitButtonBorder,
                        },
                      ]}
                      onPress={() => updateSettings({ measurementUnits: 'imperial' })}
                    >
                      <View
                        style={[
                          styles.unitRadio,
                          {
                            borderColor:
                              settings.measurementUnits === 'imperial'
                                ? '#3b82f6'
                                : colors.unitRadioBorder,
                          },
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
                            {
                              color:
                                settings.measurementUnits === 'imperial'
                                  ? theme.colors.text
                                  : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          Imperial
                        </Text>
                        <Text style={[styles.unitAbbrev, { color: theme.colors.textMuted }]}>
                          in / ft
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        {
                          backgroundColor:
                            settings.measurementUnits === 'metric'
                              ? colors.unitButtonActiveBg
                              : colors.unitButtonBg,
                          borderColor:
                            settings.measurementUnits === 'metric'
                              ? colors.unitButtonActiveBorder
                              : colors.unitButtonBorder,
                        },
                      ]}
                      onPress={() => updateSettings({ measurementUnits: 'metric' })}
                    >
                      <View
                        style={[
                          styles.unitRadio,
                          {
                            borderColor:
                              settings.measurementUnits === 'metric'
                                ? '#3b82f6'
                                : colors.unitRadioBorder,
                          },
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
                            {
                              color:
                                settings.measurementUnits === 'metric'
                                  ? theme.colors.text
                                  : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          Metric
                        </Text>
                        <Text style={[styles.unitAbbrev, { color: theme.colors.textMuted }]}>
                          cm / m
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

                {/* Level Threshold Slider */}
                <View style={styles.sliderSection}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderHeaderLeft}>
                      <Gauge size={20} color="#22c55e" />
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                        Level Threshold
                      </Text>
                    </View>
                    <View style={styles.thresholdBadge}>
                      <Text style={styles.thresholdValue}>
                        {settings.levelThreshold.toFixed(1)}°
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.sliderDescription, { color: theme.colors.textSecondary }]}>
                    Tolerance for considering the vehicle level (Default: 1.0°)
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
                      <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                        Precise
                      </Text>
                      <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                        Relaxed
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Developer Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              DEVELOPER
            </Text>
            <GlassCard borderColor="rgba(239, 68, 68, 0.3)">
              <View style={styles.cardContent}>
                <View style={styles.resetSection}>
                  <View style={styles.resetHeader}>
                    <RotateCcw size={20} color="#ef4444" />
                    <View style={styles.settingTextContainer}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                        Reset Onboarding
                      </Text>
                      <Text
                        style={[styles.settingDescription, { color: theme.colors.textSecondary }]}
                      >
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
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ABOUT</Text>
            <GlassCard variant="primary">
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>FlatFinder</Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
                <Text style={[styles.aboutDescription, { color: theme.colors.textSecondary }]}>
                  Professional RV and trailer leveling app with precision sensors and intelligent
                  guidance
                </Text>
                <View style={styles.aboutDivider} />
                <Text style={[styles.aboutFooter, { color: theme.colors.textMuted }]}>
                  Made with love for RV enthusiasts
                </Text>
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
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardContent: {
    gap: 0,
  },
  cardDivider: {
    height: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  // Theme section
  themeSection: {
    gap: 12,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '500',
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
    borderWidth: 1,
  },
  unitRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  unitAbbrev: {
    fontSize: 11,
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
    letterSpacing: 0.5,
  },
  // Feature row styles (Tips & Features section)
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
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
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 24,
  },
});
