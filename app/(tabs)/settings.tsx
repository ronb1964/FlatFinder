import React, { useEffect } from 'react';
import {
  YStack,
  XStack,
  Text,
  H2,
  Card,
  ScrollView,
  Switch,
  Slider,
  useTheme,
  Separator,
  RadioGroup,
  Button,
} from 'tamagui';
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
} from '@tamagui/lucide-icons';

import { useAppStore } from '../../src/state/appStore';
import { useColorScheme } from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { SettingsScreenGradient } from '../../src/components/GradientBackground';
import Svg, { Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';

// Mini FlatFinder icon component for Settings About section
const MiniAppIcon = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      {/* Glass ring gradient */}
      <RadialGradient id="miniGlassGradient" cx="50%" cy="30%">
        <Stop offset="0%" stopColor="rgba(100, 100, 120, 0.4)" />
        <Stop offset="50%" stopColor="rgba(40, 40, 60, 0.5)" />
        <Stop offset="100%" stopColor="rgba(20, 20, 30, 0.7)" />
      </RadialGradient>

      {/* Green bubble gradient */}
      <RadialGradient id="miniBubbleGradient" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#4ade80" />
        <Stop offset="50%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </RadialGradient>

      {/* Centered highlight */}
      <RadialGradient id="miniCenteredHighlight" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <Stop offset="40%" stopColor="#ffffff" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </RadialGradient>
    </Defs>

    {/* Outer glass ring */}
    <Circle cx="50" cy="50" r="45" fill="url(#miniGlassGradient)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />

    {/* Inner dark background */}
    <Circle cx="50" cy="50" r="38" fill="rgba(15, 23, 42, 0.9)" />

    {/* Precision ring */}
    <Circle cx="50" cy="50" r="28" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" />

    {/* Green bubble */}
    <Circle cx="50" cy="50" r="18" fill="url(#miniBubbleGradient)" />

    {/* Centered highlight glow */}
    <Circle cx="50" cy="50" r="12" fill="url(#miniCenteredHighlight)" />

    {/* Bright center spot */}
    <Circle cx="50" cy="50" r="4" fill="rgba(255, 255, 255, 0.9)" />
  </Svg>
);

export default function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { settings, updateSettings, loadSettings, resetOnboarding, activeProfile } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Enhanced switch component with colors
  const ColoredSwitch = ({ 
    checked, 
    onCheckedChange, 
    color = '$green9',
    size = '$4' 
  }: { 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void;
    color?: string;
    size?: '$3' | '$4' | '$5';
  }) => (
    <Switch
      size={size}
      checked={checked}
      onCheckedChange={onCheckedChange}
      backgroundColor={checked ? color : '$gray6'}
      borderColor={checked ? color : '$gray8'}
      borderWidth={2}
    >
      <Switch.Thumb 
        animation="quick" 
        backgroundColor={checked ? 'white' : '$gray10'}
        shadowColor={checked ? color : '$gray8'}
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.3}
        shadowRadius={4}
      />
    </Switch>
  );

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
    <GlassCard
      padding="$4"
      backgroundColor="rgba(255, 255, 255, 0.05)"
      borderColor="rgba(255, 255, 255, 0.1)"
      borderWidth={1}
      borderRadius="$5"
      blurIntensity={10}
    >
      <XStack justifyContent="space-between" alignItems="center" space="$3">
        <XStack space="$3" alignItems="center" flex={1}>
          {icon}
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="600" color="white">
              {title}
            </Text>
            {description && (
              <Text fontSize="$2" color="rgba(255, 255, 255, 0.6)">
                {description}
              </Text>
            )}
          </YStack>
        </XStack>
        {children}
      </XStack>
    </GlassCard>
  );

  return (
    <SettingsScreenGradient>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <YStack
            padding="$4"
            space="$4"
          >
            <H2 color="white">Settings</H2>

          {/* Active Profile Indicator */}
          {activeProfile ? (
            <GlassCard
              padding="$3"
              backgroundColor="rgba(16, 185, 129, 0.2)"
              borderColor="rgba(34, 197, 94, 0.5)"
              borderWidth={2}
              borderRadius="$5"
              blurIntensity={10}
            >
              <XStack justifyContent="center" alignItems="center" space="$2">
                <YStack width={10} height={10} borderRadius={5} backgroundColor="#22c55e" />
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="$3" fontWeight="600">
                  Active Vehicle:
                </Text>
                <Text fontWeight="bold" fontSize="$4" color="#22c55e">
                  {activeProfile.name}
                </Text>
              </XStack>
            </GlassCard>
          ) : (
            <GlassCard
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.2)"
              borderColor="rgba(239, 68, 68, 0.5)"
              borderWidth={2}
              borderRadius="$5"
              blurIntensity={10}
            >
              <XStack justifyContent="center" alignItems="center" space="$2">
                <YStack width={10} height={10} borderRadius={5} backgroundColor="#ef4444" />
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="$3" fontWeight="600">
                  No Vehicle Selected - Go to Profiles
                </Text>
              </XStack>
            </GlassCard>
          )}

          {/* Feedback Settings */}
          <YStack space="$3">
            <Text fontSize="$4" fontWeight="700" color="rgba(255, 255, 255, 0.5)" letterSpacing={1}>
              FEEDBACK
            </Text>

            <SettingRow
              icon={<Vibrate size={20} color={settings.hapticsEnabled ? '#10b981' : '#ffffff'} />}
              title="Haptic Feedback"
              description="Vibrate when level changes"
            >
              <ColoredSwitch
                checked={settings.hapticsEnabled}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ hapticsEnabled: checked })
                }
                color="$emerald9"
              />
            </SettingRow>

            <SettingRow
              icon={<Volume2 size={20} color={settings.audioEnabled ? '#3b82f6' : '#ffffff'} />}
              title="Audio Feedback"
              description="Play sounds when near level"
            >
              <ColoredSwitch
                checked={settings.audioEnabled}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ audioEnabled: checked })
                }
                color="$blue9"
              />
            </SettingRow>
          </YStack>

          <Separator />

          {/* Display Settings */}
          <YStack space="$3">
            <Text fontSize="$4" fontWeight="700" color="rgba(255, 255, 255, 0.5)" letterSpacing={1}>
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
              <ColoredSwitch
                checked={settings.nightMode}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ nightMode: checked })
                }
                color="$indigo9"
              />
            </SettingRow>

            <SettingRow
              icon={<Activity size={20} color={settings.keepAwake ? '#f97316' : theme.color?.val || '#fff'} />}
              title="Keep Screen Awake"
              description="Prevent screen from sleeping"
            >
              <ColoredSwitch
                checked={settings.keepAwake}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ keepAwake: checked })
                }
                color="$orange9"
              />
            </SettingRow>
          </YStack>

          <Separator />

          {/* Measurement Settings */}
          <YStack space="$3">
            <Text fontSize="$4" fontWeight="700" color="rgba(255, 255, 255, 0.5)" letterSpacing={1}>
              MEASUREMENTS
            </Text>

            <SettingRow
              icon={<Ruler size={20} color={theme.color?.val || '#fff'} />}
              title="Units"
              description="Imperial (inches/feet) or Metric (cm/meters)"
            >
              <RadioGroup
                value={settings.measurementUnits}
                onValueChange={(value: string) =>
                  updateSettings({ measurementUnits: value as 'imperial' | 'metric' })
                }
              >
                <XStack space="$3">
                  <XStack alignItems="center" space="$2">
                    <RadioGroup.Item value="imperial" id="imperial">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text fontSize="$3">Imperial</Text>
                  </XStack>
                  <XStack alignItems="center" space="$2">
                    <RadioGroup.Item value="metric" id="metric">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text fontSize="$3">Metric</Text>
                  </XStack>
                </XStack>
              </RadioGroup>
            </SettingRow>

            <GlassCard
              padding="$4"
              backgroundColor="rgba(255, 255, 255, 0.05)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              borderRadius="$5"
              blurIntensity={10}
            >
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack space="$3" alignItems="center">
                    <Gauge size={20} color="#ffffff" />
                    <Text fontSize="$4" fontWeight="600" color="white">
                      Level Threshold
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="bold" color="#22c55e">
                    {settings.levelThreshold.toFixed(1)}°
                  </Text>
                </XStack>
                <Text fontSize="$2" color="rgba(255, 255, 255, 0.6)">
                  Tolerance for considering the vehicle level
                </Text>
                <Slider
                  size="$4"
                  value={[settings.levelThreshold]}
                  max={2}
                  min={0.1}
                  step={0.1}
                  onValueChange={([value]) =>
                    updateSettings({ levelThreshold: value })
                  }
                >
                  <Slider.Track>
                    <Slider.TrackActive />
                  </Slider.Track>
                  <Slider.Thumb index={0} circular />
                </Slider>
              </YStack>
            </GlassCard>
          </YStack>

          <Separator />

          {/* Developer Section - Temporary */}
          <YStack space="$3">
            <Text fontSize="$4" fontWeight="700" color="rgba(255, 255, 255, 0.5)" letterSpacing={1}>
              DEVELOPER
            </Text>
            <GlassCard
              padding="$4"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderColor="rgba(239, 68, 68, 0.3)"
              borderWidth={2}
              borderRadius="$5"
              blurIntensity={10}
            >
              <YStack space="$3">
                <XStack space="$3" alignItems="center">
                  <RotateCcw size={20} color="#ef4444" />
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="600" color="white">
                      Reset Onboarding
                    </Text>
                    <Text fontSize="$2" color="rgba(255, 255, 255, 0.6)">
                      Show the onboarding tutorial again for testing
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  size="$3"
                  backgroundColor="$red9"
                  color="white"
                  pressStyle={{ backgroundColor: '$red10', scale: 0.95 }}
                  borderRadius="$4"
                  fontWeight="600"
                  icon={<RotateCcw size={16} color="white" />}
                  onPress={() => {
                    resetOnboarding();
                    // Force reload the app by reloading the page
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                >
                  Reset & Restart
                </Button>
              </YStack>
            </GlassCard>
          </YStack>

          <Separator />

          {/* About Section */}
          <YStack space="$3">
            <Text fontSize="$4" fontWeight="700" color="rgba(255, 255, 255, 0.5)" letterSpacing={1}>
              ABOUT
            </Text>
            <GlassCard
              padding="$6"
              backgroundColor="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 0.3)"
              borderWidth={2}
              borderRadius="$6"
              blurIntensity={12}
            >
              <YStack space="$3" alignItems="center">
                <YStack space="$2" alignItems="center">
                  <XStack space="$2" alignItems="center">
                    <MiniAppIcon size={24} />
                    <Text fontSize="$6" fontWeight="bold" color="#3b82f6">
                      FlatFinder
                    </Text>
                  </XStack>
                  <Text fontSize="$4" color="#60a5fa" fontWeight="600">
                    Version 1.0.0
                  </Text>
                </YStack>
                <Text fontSize="$3" color="rgba(255, 255, 255, 0.7)" textAlign="center" lineHeight="$4">
                  Professional RV and trailer leveling app with precision sensors and intelligent guidance
                </Text>
                <XStack space="$2" opacity={0.7}>
                  <Text fontSize="$2" color="rgba(255, 255, 255, 0.5)">
                    Made with ❤️ for RV enthusiasts
                  </Text>
                </XStack>
              </YStack>
            </GlassCard>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
    </SettingsScreenGradient>
  );
}