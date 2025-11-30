import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useDebugStore } from '../state/debugStore';
import { X } from 'lucide-react-native';

// Declare global __DEV__ for TypeScript if needed
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
      <TouchableOpacity
        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-destructive items-center justify-center z-50"
        style={{ elevation: 5 }}
        onPress={() => setDebugMode(true)}
      >
        <Text className="text-[10px] text-white font-bold">DBG</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      className="absolute bottom-4 right-4 w-[300px] bg-card border border-border rounded-lg p-3 z-50"
      style={{ elevation: 10 }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-bold text-foreground">Virtual Device</Text>
        <TouchableOpacity onPress={() => setDebugMode(false)} className="p-1">
          <X size={20} color="#a3a3a3" />
        </TouchableOpacity>
      </View>

      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-foreground">Simulate Sensors</Text>
          <Switch
            value={isDebugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#333', true: '#3b82f6' }}
            thumbColor="#fff"
          />
        </View>

        {/* Pitch Slider */}
        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-foreground">Pitch: {localPitch.toFixed(1)}°</Text>
            <Text className="text-sm text-muted-foreground">Nose Up/Down</Text>
          </View>
          <Slider
            value={localPitch}
            onValueChange={(val) => {
              setLocalPitch(val);
              setMockPitch(val);
            }}
            minimumValue={-90}
            maximumValue={90}
            step={0.5}
            minimumTrackTintColor="#ef4444"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />
        </View>

        {/* Roll Slider */}
        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-foreground">Roll: {localRoll.toFixed(1)}°</Text>
            <Text className="text-sm text-muted-foreground">Left/Right</Text>
          </View>
          <Slider
            value={localRoll}
            onValueChange={(val) => {
              setLocalRoll(val);
              setMockRoll(val);
            }}
            minimumValue={-90}
            maximumValue={90}
            step={0.5}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />
        </View>

        {/* Heading Slider */}
        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-foreground">Heading: {localHeading.toFixed(0)}°</Text>
            <Text className="text-sm text-muted-foreground">Compass</Text>
          </View>
          <Slider
            value={localHeading}
            onValueChange={(val) => {
              setLocalHeading(val);
              setMockHeading(val);
            }}
            minimumValue={0}
            maximumValue={359}
            step={1}
            minimumTrackTintColor="#22c55e"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />
        </View>

        <TouchableOpacity
          className="bg-primary py-2 px-4 rounded-lg items-center"
          onPress={resetMockValues}
        >
          <Text className="text-primary-foreground font-semibold">Reset to Level (0°)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
