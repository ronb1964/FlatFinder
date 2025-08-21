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
} from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Vibrate,
  Volume2,
  Moon,
  Sun,
  Activity,
  Gauge,
} from '@tamagui/lucide-icons';
import { useAppStore } from '../../src/state/appStore';
import { useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { settings, updateSettings, loadSettings } = useAppStore();

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
        <YStack padding="$4" space="$4">
          <H2>Settings</H2>

          {/* Feedback Settings */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              FEEDBACK
            </Text>

            <SettingRow
              icon={<Vibrate size={20} color={theme.color?.val || '#fff'} />}
              title="Haptic Feedback"
              description="Vibrate when level changes"
            >
              <Switch
                size="$4"
                checked={settings.hapticsEnabled}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ hapticsEnabled: checked })
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </SettingRow>

            <SettingRow
              icon={<Volume2 size={20} color={theme.color?.val || '#fff'} />}
              title="Audio Feedback"
              description="Play sounds when near level"
            >
              <Switch
                size="$4"
                checked={settings.audioEnabled}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ audioEnabled: checked })
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
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
                  <Moon size={20} color={theme.color?.val || '#fff'} />
                ) : (
                  <Sun size={20} color={theme.color?.val || '#fff'} />
                )
              }
              title="Night Mode"
              description="Dark theme for night use"
            >
              <Switch
                size="$4"
                checked={settings.nightMode}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ nightMode: checked })
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </SettingRow>

            <SettingRow
              icon={<Activity size={20} color={theme.color?.val || '#fff'} />}
              title="Keep Screen Awake"
              description="Prevent screen from sleeping"
            >
              <Switch
                size="$4"
                checked={settings.keepAwake}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ keepAwake: checked })
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </SettingRow>
          </YStack>

          <Separator />

          {/* Measurement Settings */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              MEASUREMENTS
            </Text>

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

          {/* About Section */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="600" color="$gray10">
              ABOUT
            </Text>
            <Card padding="$4" backgroundColor="$background">
              <YStack space="$2">
                <Text fontSize="$4" fontWeight="600">
                  LevelMate
                </Text>
                <Text fontSize="$3" color="$gray10">
                  Version 1.0.0
                </Text>
                <Text fontSize="$2" color="$gray10">
                  Professional RV and trailer leveling app
                </Text>
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}