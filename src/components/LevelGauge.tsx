import React from 'react'
import { YStack, XStack, Text, View } from 'tamagui'

interface LevelGaugeProps {
  pitch: number
  roll: number
}

export function LevelGauge({ pitch, roll }: LevelGaugeProps) {
  return (
    <YStack space="$4" alignItems="center">
      {/* Bubble Level Visualization */}
      <View
        width={200}
        height={200}
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={2}
        borderRadius="$4"
        position="relative"
        overflow="hidden"
      >
        {/* Center crosshair */}
        <View
          position="absolute"
          left="50%"
          top="50%"
          width={2}
          height={2}
          backgroundColor="$color"
          transform={[{ translateX: -1 }, { translateY: -1 }]}
        />
        
        {/* Horizontal line */}
        <View
          position="absolute"
          left={0}
          top="50%"
          width="100%"
          height={1}
          backgroundColor="$borderColor"
          opacity={0.3}
        />
        
        {/* Vertical line */}
        <View
          position="absolute"
          left="50%"
          top={0}
          width={1}
          height="100%"
          backgroundColor="$borderColor"
          opacity={0.3}
        />
        
        {/* Bubble indicator */}
        <View
          position="absolute"
          left="50%"
          top="50%"
          width={20}
          height={20}
          backgroundColor="$blue10"
          borderRadius="$10"
          transform={[
            { translateX: -10 + (roll * 5) },
            { translateY: -10 + (pitch * 5) }
          ]}
        />
      </View>

      {/* Numeric readouts */}
      <XStack space="$6">
        <YStack alignItems="center">
          <Text fontSize="$3" color="$colorSecondary" opacity={0.8}>
            Pitch
          </Text>
          <Text fontSize="$6" fontWeight="600" color="$color">
            {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}°
          </Text>
        </YStack>
        
        <YStack alignItems="center">
          <Text fontSize="$3" color="$colorSecondary" opacity={0.8}>
            Roll
          </Text>
          <Text fontSize="$6" fontWeight="600" color="$color">
            {roll > 0 ? '+' : ''}{roll.toFixed(1)}°
          </Text>
        </YStack>
      </XStack>
    </YStack>
  )
}

