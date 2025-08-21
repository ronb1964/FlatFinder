import React from 'react'
import { YStack, XStack, Text, Card, H1, H2 } from 'tamagui'
import { RectangleHorizontal, Car, Target } from '@tamagui/lucide-icons'

interface HomeScreenProps {
  onNavigate: (screen: 'trailer' | 'van') => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <YStack 
      flex={1} 
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
      }}
    >
      
      {/* Main Content */}
      <YStack flex={1} justifyContent="center" padding="$6" space="$8">
        {/* Header Section */}
        <YStack space="$4" alignItems="center">
          <YStack 
            backgroundColor="rgba(34, 197, 94, 0.1)" 
            borderRadius="$10" 
            padding="$4"
            borderWidth={1}
            borderColor="rgba(34, 197, 94, 0.2)"
          >
            <Target size={48} color="#22c55e" />
          </YStack>
          
          <H1 
            fontSize="$12" 
            fontWeight="900" 
            textAlign="center" 
            color="#ffffff"
            letterSpacing={-1}
          >
            LevelMate
          </H1>
          
          <Text 
            fontSize="$5" 
            textAlign="center" 
            color="#94a3b8" 
            fontWeight="400"
            maxWidth={300}
            lineHeight="$6"
          >
            Professional RV & Trailer Leveling Solution
          </Text>
        </YStack>
        
        {/* Mode Selection Cards */}
        <YStack space="$5" paddingHorizontal="$2">
          {/* Trailer Mode Card */}
          <Card
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            borderRadius="$6"
            padding="$6"
            pressStyle={{ 
              scale: 0.98, 
              backgroundColor: "rgba(255, 255, 255, 0.05)" 
            }}
            onPress={() => onNavigate('trailer')}
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.3}
            shadowRadius={16}
          >
            <XStack space="$4" alignItems="center">
              <YStack 
                backgroundColor="rgba(59, 130, 246, 0.15)" 
                borderRadius="$5" 
                padding="$3"
                borderWidth={1}
                borderColor="rgba(59, 130, 246, 0.3)"
              >
                <RectangleHorizontal size={32} color="#3b82f6" />
              </YStack>
              
              <YStack flex={1} space="$2">
                <H2 fontSize="$7" fontWeight="700" color="#ffffff">
                  Trailer Mode
                </H2>
                <Text fontSize="$4" color="#94a3b8" lineHeight="$5">
                  Precision leveling for trailers and RVs with step-by-step guidance
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Van Mode Card */}
          <Card
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            borderRadius="$6"
            padding="$6"
            pressStyle={{ 
              scale: 0.98, 
              backgroundColor: "rgba(255, 255, 255, 0.05)" 
            }}
            onPress={() => onNavigate('van')}
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.3}
            shadowRadius={16}
          >
            <XStack space="$4" alignItems="center">
              <YStack 
                backgroundColor="rgba(168, 85, 247, 0.15)" 
                borderRadius="$5" 
                padding="$3"
                borderWidth={1}
                borderColor="rgba(168, 85, 247, 0.3)"
              >
                <Car size={32} color="#a855f7" />
              </YStack>
              
              <YStack flex={1} space="$2">
                <H2 fontSize="$7" fontWeight="700" color="#ffffff">
                  Van Mode
                </H2>
                <Text fontSize="$4" color="#94a3b8" lineHeight="$5">
                  Perfect leveling for camper vans and motorhomes
                </Text>
              </YStack>
            </XStack>
          </Card>
        </YStack>

        {/* Footer */}
        <Text 
          fontSize="$3" 
          textAlign="center" 
          color="#64748b" 
          opacity={0.7}
          marginTop="$6"
        >
          Precision leveling powered by advanced sensors
        </Text>
      </YStack>
    </YStack>
  )
}
