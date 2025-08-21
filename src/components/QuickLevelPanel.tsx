import React from 'react'
import { YStack, XStack, Text, Button, Card } from 'tamagui'

interface QuickLevelPanelProps {
  pitch: number
  roll: number
}

export function QuickLevelPanel({ pitch, roll }: QuickLevelPanelProps) {
  return (
    <Card
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2xl"
      padding="$4"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={4}
    >
      <YStack space="$4">
        {/* Pitch and Roll Readout */}
        <Card
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$2xl"
          padding="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" color="$colorSecondary" opacity={0.8}>
              Pitch
            </Text>
            <Text fontSize="$5" fontWeight="600" color="$color">
              {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}°
            </Text>
          </XStack>
          <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
            <Text fontSize="$4" color="$colorSecondary" opacity={0.8}>
              Roll
            </Text>
            <Text fontSize="$5" fontWeight="600" color="$color">
              {roll > 0 ? '+' : ''}{roll.toFixed(1)}°
            </Text>
          </XStack>
        </Card>

        {/* Action Buttons */}
        <YStack space="$3">
          <Button
            backgroundColor="$blue10"
            color="$blue1"
            fontSize="$5"
            fontWeight="600"
            borderRadius="$2xl"
            paddingVertical="$3"
            pressStyle={{ scale: 0.98 }}
            onPress={() => {
              // TODO: Implement calibration
              console.log('Calibrate pressed')
            }}
          >
            Calibrate
          </Button>
          
          <Button
            backgroundColor="$background"
            color="$color"
            fontSize="$4"
            fontWeight="500"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$2xl"
            paddingVertical="$3"
            pressStyle={{ scale: 0.98 }}
            onPress={() => {
              // TODO: Navigate to trailer mode details
              console.log('Trailer Mode pressed')
            }}
          >
            Trailer Mode
          </Button>
        </YStack>
      </YStack>
    </Card>
  )
}

