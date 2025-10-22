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

export default function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { settings, updateSettings, loadSettings, resetOnboarding } = useAppStore();

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
    <Card padding="$4" backgroundColor="$background">
      <XStack justifyContent="space-between" alignItems="center" space="$3">
        <XStack space="$3" alignItems="center" flex={1}>
          {icon}
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="600">
              {title}
            </Text>
            {description && (
              <Text fontSize="$2" color="$gray10">
                {description}
              </Text>
            )}
          </YStack>
        </XStack>
        {children}
      </XStack>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val || '#000' }}>
      <ScrollView>
        <YStack 
          padding="$4" 
          space="$4"
        >
          <H2>Settings</H2>

          {/* Feedback Settings */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              FEEDBACK
            </Text>

            <SettingRow
              icon={<Vibrate size={20} color={settings.hapticsEnabled ? '#10b981' : theme.color?.val || '#fff'} />}
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
              icon={<Volume2 size={20} color={settings.audioEnabled ? '#3b82f6' : theme.color?.val || '#fff'} />}
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
            <Text fontSize="$3" fontWeight="600" color="$gray10">
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
            <Text fontSize="$3" fontWeight="600" color="$gray10">
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

            <Card padding="$4" backgroundColor="$background">
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack space="$3" alignItems="center">
                    <Gauge size={20} color={theme.color?.val || '#fff'} />
                    <Text fontSize="$4" fontWeight="600">
                      Level Threshold
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="bold" color="$green9">
                    {settings.levelThreshold.toFixed(1)}°
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$gray10">
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
            </Card>
          </YStack>

          <Separator />

          {/* Developer Section - Temporary */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              DEVELOPER
            </Text>
            <Card padding="$4" backgroundColor="$background" borderColor="$red5" borderWidth={1}>
              <YStack space="$3">
                <XStack space="$3" alignItems="center">
                  <RotateCcw size={20} color="#ef4444" />
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="600">
                      Reset Onboarding
                    </Text>
                    <Text fontSize="$2" color="$gray10">
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
            </Card>
          </YStack>

          <Separator />

          {/* About Section */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              ABOUT
            </Text>
            <Card 
              padding="$6" 
              backgroundColor="$background"
              borderColor="$blue5"
              borderWidth={1}
              borderRadius="$6"
            >
              <YStack space="$3" alignItems="center">
                <YStack space="$2" alignItems="center">
                  <Text fontSize="$6" fontWeight="bold" color="$blue9">
                    🎯 LevelMate
                  </Text>
                  <Text fontSize="$4" color="$blue8" fontWeight="600">
                    Version 1.0.0
                  </Text>
                </YStack>
                <Text fontSize="$3" color="$gray10" textAlign="center" lineHeight="$4">
                  Professional RV and trailer leveling app with precision sensors and intelligent guidance
                </Text>
                <XStack space="$2" opacity={0.7}>
                  <Text fontSize="$2" color="$gray9">
                    Made with ❤️ for RV enthusiasts
                  </Text>
                </XStack>
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}