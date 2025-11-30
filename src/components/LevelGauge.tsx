import React from 'react';
import { View, Text } from 'react-native';

interface LevelGaugeProps {
  pitch: number;
  roll: number;
}

export function LevelGauge({ pitch, roll }: LevelGaugeProps) {
  return (
    <View className="items-center gap-4">
      {/* Bubble Level Visualization */}
      <View className="w-[200px] h-[200px] bg-secondary rounded-lg border-2 border-border relative overflow-hidden">
        {/* Center crosshair */}
        <View
          className="absolute w-[2px] h-[2px] bg-foreground"
          style={{
            left: '50%',
            top: '50%',
            transform: [{ translateX: -1 }, { translateY: -1 }],
          }}
        />

        {/* Horizontal line */}
        <View
          className="absolute left-0 w-full h-[1px] bg-border opacity-30"
          style={{ top: '50%' }}
        />

        {/* Vertical line */}
        <View
          className="absolute top-0 h-full w-[1px] bg-border opacity-30"
          style={{ left: '50%' }}
        />

        {/* Bubble indicator */}
        <View
          className="absolute w-5 h-5 bg-primary rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: [{ translateX: -10 + roll * 5 }, { translateY: -10 + pitch * 5 }],
          }}
        />
      </View>

      {/* Numeric readouts */}
      <View className="flex-row gap-6">
        <View className="items-center">
          <Text className="text-sm text-muted-foreground opacity-80">Pitch</Text>
          <Text className="text-xl font-semibold text-foreground">
            {pitch > 0 ? '+' : ''}
            {pitch.toFixed(1)}°
          </Text>
        </View>

        <View className="items-center">
          <Text className="text-sm text-muted-foreground opacity-80">Roll</Text>
          <Text className="text-xl font-semibold text-foreground">
            {roll > 0 ? '+' : ''}
            {roll.toFixed(1)}°
          </Text>
        </View>
      </View>
    </View>
  );
}
