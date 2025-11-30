import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuickLevelPanelProps {
  pitch: number;
  roll: number;
}

export function QuickLevelPanel({ pitch, roll }: QuickLevelPanelProps) {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 shadow-lg">
      <View className="gap-4">
        {/* Pitch and Roll Readout */}
        <View className="bg-background border border-border rounded-2xl p-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-base text-muted-foreground">Pitch</Text>
            <Text className="text-lg font-semibold text-foreground">
              {pitch > 0 ? '+' : ''}
              {pitch.toFixed(1)}°
            </Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-base text-muted-foreground">Roll</Text>
            <Text className="text-lg font-semibold text-foreground">
              {roll > 0 ? '+' : ''}
              {roll.toFixed(1)}°
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-3 items-center"
            onPress={() => {
              console.log('Calibrate pressed');
            }}
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground text-lg font-semibold">Calibrate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-background border border-border rounded-2xl py-3 items-center"
            onPress={() => {
              console.log('Trailer Mode pressed');
            }}
            activeOpacity={0.8}
          >
            <Text className="text-foreground text-base font-medium">Trailer Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
