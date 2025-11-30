import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
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
    <View className="p-4 bg-card rounded-xl">
      <View className="flex-row justify-between items-center gap-3">
        <View className="flex-row gap-3 items-center flex-1">
          {icon}
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{title}</Text>
            {description && (
              <Text className="text-xs text-muted-foreground">{description}</Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold text-foreground">Settings</Text>

          {/* Feedback Settings */}
          <View className="gap-3">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wide">
              FEEDBACK
            </Text>

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
                trackColor={{ false: '#333', true: '#10b981' }}
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
                trackColor={{ false: '#333', true: '#3b82f6' }}
                thumbColor="#fff"
              />
            </SettingRow>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-border" />

          {/* Display Settings */}
          <View className="gap-3">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wide">
              DISPLAY
            </Text>

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
                trackColor={{ false: '#333', true: '#6366f1' }}
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
                trackColor={{ false: '#333', true: '#f97316' }}
                thumbColor="#fff"
              />
            </SettingRow>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-border" />

          {/* Measurement Settings */}
          <View className="gap-3">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wide">
              MEASUREMENTS
            </Text>

            <SettingRow
              icon={<Ruler size={20} color="#a3a3a3" />}
              title="Units"
              description="Imperial (inches/feet) or Metric (cm/meters)"
            >
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                    settings.measurementUnits === 'imperial'
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                  onPress={() => updateSettings({ measurementUnits: 'imperial' })}
                >
                  <View
                    className={`w-3 h-3 rounded-full border-2 ${
                      settings.measurementUnits === 'imperial'
                        ? 'border-white bg-white'
                        : 'border-muted-foreground'
                    }`}
                  />
                  <Text
                    className={`text-sm ${
                      settings.measurementUnits === 'imperial'
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Imperial
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                    settings.measurementUnits === 'metric' ? 'bg-primary' : 'bg-muted'
                  }`}
                  onPress={() => updateSettings({ measurementUnits: 'metric' })}
                >
                  <View
                    className={`w-3 h-3 rounded-full border-2 ${
                      settings.measurementUnits === 'metric'
                        ? 'border-white bg-white'
                        : 'border-muted-foreground'
                    }`}
                  />
                  <Text
                    className={`text-sm ${
                      settings.measurementUnits === 'metric'
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Metric
                  </Text>
                </TouchableOpacity>
              </View>
            </SettingRow>

            <View className="p-4 bg-card rounded-xl gap-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-3 items-center">
                  <Gauge size={20} color="#a3a3a3" />
                  <Text className="text-base font-semibold text-foreground">
                    Level Threshold
                  </Text>
                </View>
                <Text className="text-base font-bold text-green-500">
                  {settings.levelThreshold.toFixed(1)}°
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
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
          <View className="h-[1px] bg-border" />

          {/* Developer Section */}
          <View className="gap-3">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wide">
              DEVELOPER
            </Text>
            <View className="p-4 bg-card rounded-xl border border-red-500/30 gap-3">
              <View className="flex-row gap-3 items-center">
                <RotateCcw size={20} color="#ef4444" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    Reset Onboarding
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Show the onboarding tutorial again for testing
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 bg-red-500 py-3 rounded-lg"
                onPress={() => {
                  resetOnboarding();
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              >
                <RotateCcw size={16} color="#fff" />
                <Text className="text-white font-semibold">Reset & Restart</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-border" />

          {/* About Section */}
          <View className="gap-3">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wide">
              ABOUT
            </Text>
            <View className="p-6 bg-card rounded-2xl border border-primary/30">
              <View className="gap-3 items-center">
                <View className="gap-2 items-center">
                  <Text className="text-2xl font-bold text-primary">FlatFinder</Text>
                  <Text className="text-base text-primary/80 font-semibold">
                    Version 1.0.0
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground text-center leading-5">
                  Professional RV and trailer leveling app with precision sensors and
                  intelligent guidance
                </Text>
                <Text className="text-xs text-muted-foreground/70">
                  Made with love for RV enthusiasts
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
