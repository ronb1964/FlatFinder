import React, { useState, useEffect } from 'react';
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
    mockHeading,
    setDebugMode,
    setMockPitch,
    setMockRoll,
    setMockHeading,
    resetMockValues,
  } = useDebugStore();

  // Local state for smooth slider interaction
  const [localPitch, setLocalPitch] = useState(mockPitch);
  const [localRoll, setLocalRoll] = useState(mockRoll);
  const [localHeading, setLocalHeading] = useState(mockHeading);

  // Sync local state when store values change externally (e.g., reset button)
  useEffect(() => {
    setLocalPitch(mockPitch);
  }, [mockPitch]);

  useEffect(() => {
    setLocalRoll(mockRoll);
  }, [mockRoll]);

  useEffect(() => {
    setLocalHeading(mockHeading);
  }, [mockHeading]);

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
              Pitch: {localPitch.toFixed(1)}°
            </Text>
            <Text fontSize="$2" color="$gray10">
              Nose Up/Down
            </Text>
          </XStack>
          <Slider
            value={[localPitch]}
            onValueChange={(val) => {
              setLocalPitch(val[0]);
              setMockPitch(val[0]);
            }}
            min={-90}
            max={90}
            step={0.5}
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
              Roll: {localRoll.toFixed(1)}°
            </Text>
            <Text fontSize="$2" color="$gray10">
              Left/Right
            </Text>
          </XStack>
          <Slider
            value={[localRoll]}
            onValueChange={(val) => {
              setLocalRoll(val[0]);
              setMockRoll(val[0]);
            }}
            min={-90}
            max={90}
            step={0.5}
            size="$2"
          >
            <Slider.Track>
              <Slider.TrackActive backgroundColor="$blue10" />
            </Slider.Track>
            <Slider.Thumb index={0} circular size="$2" />
          </Slider>
        </YStack>

        <YStack space="$1">
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$color">
              Heading: {localHeading.toFixed(0)}°
            </Text>
            <Text fontSize="$2" color="$gray10">
              Compass
            </Text>
          </XStack>
          <Slider
            value={[localHeading]}
            onValueChange={(val) => {
              setLocalHeading(val[0]);
              setMockHeading(val[0]);
            }}
            min={0}
            max={359}
            step={1}
            size="$2"
          >
            <Slider.Track>
              <Slider.TrackActive backgroundColor="$green10" />
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
