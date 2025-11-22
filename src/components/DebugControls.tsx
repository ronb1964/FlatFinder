import React from 'react';
import { Text, Switch, XStack, YStack, Card, Button, Slider } from 'tamagui';
import { useDebugStore } from '../state/debugStore';
import { X } from '@tamagui/lucide-icons';
import { Platform } from 'react-native';

// Declare global __DEV__ for TypeScript if needed, though usually it's available in RN projects
declare const __DEV__: boolean;

export function DebugControls() {
  const {
    isDebugMode,
    mockPitch,
    mockRoll,
    setDebugMode,
    setMockPitch,
    setMockRoll,
    resetMockValues,
  } = useDebugStore();

  // Only show in development or on web
  if (!__DEV__ && Platform.OS !== 'web') return null;

  if (!isDebugMode) {
    return (
      <Button
        position="absolute"
        bottom="$4"
        right="$4"
        size="$3"
        circular
        backgroundColor="$red10"
        onPress={() => setDebugMode(true)}
        elevation={5}
        zIndex={9999}
      >
        <Text fontSize={10} color="white">
          DBG
        </Text>
      </Button>
    );
  }

  return (
    <Card
      position="absolute"
      bottom="$4"
      right="$4"
      width={300}
      backgroundColor="$gray2"
      borderColor="$gray6"
      borderWidth={1}
      elevation={10}
      zIndex={9999}
      padding="$3"
    >
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
        <Text fontWeight="bold" color="$color">
          Virtual Device
        </Text>
        <Button size="$2" circular chromeless icon={X} onPress={() => setDebugMode(false)} />
      </XStack>

      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$2" color="$color">
            Simulate Sensors
          </Text>
          <Switch checked={isDebugMode} onCheckedChange={setDebugMode} size="$2">
            <Switch.Thumb animation="quick" />
          </Switch>
        </XStack>

        <YStack space="$1">
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$color">
              Pitch: {mockPitch.toFixed(1)}°
            </Text>
            <Text fontSize="$2" color="$gray10">
              Nose Up/Down
            </Text>
          </XStack>
          <Slider
            defaultValue={[0]}
            value={[mockPitch]}
            onValueChange={(val) => setMockPitch(val[0])}
            min={-10}
            max={10}
            step={0.1}
            size="$2"
          >
            <Slider.Track>
              <Slider.TrackActive backgroundColor="$red10" />
            </Slider.Track>
            <Slider.Thumb index={0} circular size="$2" />
          </Slider>
        </YStack>

        <YStack space="$1">
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$color">
              Roll: {mockRoll.toFixed(1)}°
            </Text>
            <Text fontSize="$2" color="$gray10">
              Left/Right
            </Text>
          </XStack>
          <Slider
            defaultValue={[0]}
            value={[mockRoll]}
            onValueChange={(val) => setMockRoll(val[0])}
            min={-10}
            max={10}
            step={0.1}
            size="$2"
          >
            <Slider.Track>
              <Slider.TrackActive backgroundColor="$blue10" />
            </Slider.Track>
            <Slider.Thumb index={0} circular size="$2" />
          </Slider>
        </YStack>

        <Button size="$2" theme="active" onPress={resetMockValues}>
          Reset to Level (0°)
        </Button>
      </YStack>
    </Card>
  );
}
