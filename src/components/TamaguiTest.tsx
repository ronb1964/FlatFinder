import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, H2, Button, Card, ScrollView, Text } from 'tamagui';
import { useAppStore } from '../state/appStore';
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';

interface TamaguiTestProps {
  onBack?: () => void;
}

export function TamaguiTest({ onBack }: TamaguiTestProps) {
  console.log('TamaguiTest rendering...');
  
  const { activeProfile } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$2">
        
        {/* Header */}
        <XStack 
          justifyContent="space-between" 
          alignItems="center" 
          padding="$3" 
          marginBottom="$3"
        >
          {onBack && (
            <Button 
              size="$2"
              chromeless
              onPress={onBack}
              color="$blue10"
            >
              ← Back
            </Button>
          )}
          <H2 color="$color" flex={1} textAlign="center">
            Tamagui Test
          </H2>
        </XStack>

        {/* Content in ScrollView */}
        <ScrollView flex={1} showsVerticalScrollIndicator={true}>
          <YStack space="$3" padding="$2">
            
            {/* Test Card */}
            <Card padding="$3" backgroundColor="$gray2">
              <Text color="$color" fontSize="$5" fontWeight="600">
                🎨 Tamagui Components Test
              </Text>
              <Text color="$colorPress" fontSize="$3" marginTop="$2">
                If you see this, Tamagui components work fine
              </Text>
            </Card>

            {/* Data Card */}
            <Card padding="$3" backgroundColor="$blue2" borderColor="$blue6" borderWidth={1}>
              <Text color="$blue11" fontSize="$4" fontWeight="600" marginBottom="$2">
                Sensor Data:
              </Text>
              <Text color="$blue10" fontSize="$3">
                Profile: {activeProfile?.name || 'None'}
              </Text>
              <Text color="$blue10" fontSize="$3">
                Pitch: {(pitchDeg || 0).toFixed(1)}°
              </Text>
              <Text color="$blue10" fontSize="$3">
                Roll: {(rollDeg || 0).toFixed(1)}°
              </Text>
            </Card>

            {/* Status Card */}
            <Card padding="$4" backgroundColor="$green2" borderColor="$green6" borderWidth={2}>
              <YStack space="$2" alignItems="center">
                <Text color="$green11" fontSize="$6" fontWeight="bold">
                  ✅ SUCCESS
                </Text>
                <Text color="$green10" fontSize="$4" textAlign="center">
                  All Tamagui theme components render properly
                </Text>
              </YStack>
            </Card>

            {/* Test different theme tokens */}
            <YStack space="$2">
              <Text color="$color" fontSize="$4">Theme Tests:</Text>
              <Text color="$colorPress" fontSize="$3">$colorPress</Text>
              <Text color="$gray11" fontSize="$3">$gray11</Text>
              <Text color="$red10" fontSize="$3">$red10</Text>
              <Text color="$blue9" fontSize="$3">$blue9</Text>
            </YStack>

          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}