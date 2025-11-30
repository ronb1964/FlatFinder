import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
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
      <View style={styles.settingRowContent}>
        <View style={styles.settingRowLeft}>
          {icon}
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {description && (
              <Text style={styles.settingDescription}>{description}</Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Settings</Text>

          {/* Feedback Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEEDBACK</Text>

            <SettingRow
              icon={
                <Vibrate
                  size={20}
                  color={settings.hapticsEnabled ? '#10b981' : '#a3a3a3'}
                />
              }
              title="Haptic Feedback"
              description="Vibrate when level changes"
            >
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(checked) => updateSettings({ hapticsEnabled: checked })}
                trackColor={{ false: '#555', true: '#10b981' }}
                thumbColor="#fff"
              />
            </SettingRow>

            <SettingRow
              icon={
                <Volume2
                  size={20}
                  color={settings.audioEnabled ? '#3b82f6' : '#a3a3a3'}
                />
              }
              title="Audio Feedback"
              description="Play sounds when near level"
            >
              <Switch
                value={settings.audioEnabled}
                onValueChange={(checked) => updateSettings({ audioEnabled: checked })}
                trackColor={{ false: '#555', true: '#3b82f6' }}
                thumbColor="#fff"
              />
            </SettingRow>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DISPLAY</Text>

            <SettingRow
              icon={
                settings.nightMode ? (
                  <Moon size={20} color="#6366f1" />
                ) : (
                  <Sun size={20} color="#f59e0b" />
                )
              }
              title="Night Mode"
              description="Dark theme for night use"
            >
              <Switch
                value={settings.nightMode}
                onValueChange={(checked) => updateSettings({ nightMode: checked })}
                trackColor={{ false: '#555', true: '#6366f1' }}
                thumbColor="#fff"
              />
            </SettingRow>

            <SettingRow
              icon={
                <Activity
                  size={20}
                  color={settings.keepAwake ? '#f97316' : '#a3a3a3'}
                />
              }
              title="Keep Screen Awake"
              description="Prevent screen from sleeping"
            >
              <Switch
                value={settings.keepAwake}
                onValueChange={(checked) => updateSettings({ keepAwake: checked })}
                trackColor={{ false: '#555', true: '#f97316' }}
                thumbColor="#fff"
              />
            </SettingRow>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Measurement Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEASUREMENTS</Text>

            <SettingRow
              icon={<Ruler size={20} color="#a3a3a3" />}
              title="Units"
              description="Imperial (inches/feet) or Metric (cm/meters)"
            >
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
                  />
                  <Text
                    style={[
                      styles.unitText,
                      settings.measurementUnits === 'imperial' && styles.unitTextActive,
                    ]}
                  >
                    Imperial
                  </Text>
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
                  />
                  <Text
                    style={[
                      styles.unitText,
                      settings.measurementUnits === 'metric' && styles.unitTextActive,
                    ]}
                  >
                    Metric
                  </Text>
                </TouchableOpacity>
              </View>
            </SettingRow>

            <View style={styles.sliderCard}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderHeaderLeft}>
                  <Gauge size={20} color="#a3a3a3" />
                  <Text style={styles.settingTitle}>Level Threshold</Text>
                </View>
                <Text style={styles.thresholdValue}>
                  {settings.levelThreshold.toFixed(1)}°
                </Text>
              </View>
              <Text style={styles.sliderDescription}>
                Tolerance for considering the vehicle level
              </Text>
              <Slider
                value={settings.levelThreshold}
                onValueChange={(value) => updateSettings({ levelThreshold: value })}
                minimumValue={0.1}
                maximumValue={2}
                step={0.1}
                minimumTrackTintColor="#22c55e"
                maximumTrackTintColor="#333"
                thumbTintColor="#fff"
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Developer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVELOPER</Text>
            <View style={styles.resetCard}>
              <View style={styles.resetHeader}>
                <RotateCcw size={20} color="#ef4444" />
                <View style={styles.resetTextContainer}>
                  <Text style={styles.settingTitle}>Reset Onboarding</Text>
                  <Text style={styles.settingDescription}>
                    Show the onboarding tutorial again for testing
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  resetOnboarding();
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              >
                <RotateCcw size={16} color="#fff" />
                <Text style={styles.resetButtonText}>Reset & Restart</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <View style={styles.aboutCard}>
              <View style={styles.aboutContent}>
                <View style={styles.aboutHeader}>
                  <Text style={styles.aboutTitle}>FlatFinder</Text>
                  <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                </View>
                <Text style={styles.aboutDescription}>
                  Professional RV and trailer leveling app with precision sensors and
                  intelligent guidance
                </Text>
                <Text style={styles.aboutFooter}>Made with love for RV enthusiasts</Text>
              </View>
            </View>
          </View>
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
    gap: 16,
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
  },
  settingRow: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
  },
  settingRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingRowLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
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
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.secondary,
  },
  unitButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  unitRadio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.colors.textSecondary,
  },
  unitRadioActive: {
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  unitText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  unitTextActive: {
    color: '#fff',
  },
  sliderCard: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    gap: 12,
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
  sliderDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.success,
  },
  resetCard: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 12,
  },
  resetHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  resetTextContainer: {
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.danger,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  aboutCard: {
    padding: 24,
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  aboutContent: {
    gap: 12,
    alignItems: 'center',
  },
  aboutHeader: {
    gap: 8,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
  aboutVersion: {
    fontSize: 16,
    color: 'rgba(59, 130, 246, 0.8)',
    fontWeight: '600',
  },
  aboutDescription: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutFooter: {
    fontSize: 12,
    color: 'rgba(115, 115, 115, 0.7)',
  },
});
