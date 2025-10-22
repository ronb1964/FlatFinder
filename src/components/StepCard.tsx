import React from 'react'
import { YStack, XStack, Text, Card, H2 } from 'tamagui'

export interface StepCardProps {
  stepNumber: number
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  children: React.ReactNode
}

/**
 * StepCard component for displaying numbered steps in the leveling process
 * Ported from original Flutter implementation with modern React Native styling
 */
export function StepCard({ 
  stepNumber, 
  title, 
  subtitle, 
  icon, 
  color, 
  children 
}: StepCardProps) {
  return (
    <Card
      backgroundColor="rgba(255, 255, 255, 0.03)"
      borderColor="rgba(255, 255, 255, 0.1)"
      borderWidth={1}
      borderRadius="$6"
      padding="$5"
      shadowColor="rgba(0, 0, 0, 0.5)"
      shadowOffset={{ width: 0, height: 8 }}
      shadowOpacity={0.3}
      shadowRadius={16}
      style={{
        borderLeftColor: color,
        borderLeftWidth: 4,
      }}
    >
      <YStack space="$4">
        {/* Step Header */}
        <XStack space="$4" alignItems="center">
          <YStack 
            backgroundColor={color}
            borderRadius="$6"
            width={40}
            height={40}
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color="#ffffff"
              fontWeight="800"
              fontSize="$5"
            >
              {stepNumber}
            </Text>
          </YStack>
          
          <YStack flex={1} space="$1">
            <H2 
              fontSize="$6" 
              fontWeight="700" 
              color={color}
            >
              {title}
            </H2>
            <Text 
              fontSize="$4" 
              color="#94a3b8"
            >
              {subtitle}
            </Text>
          </YStack>
          
          <YStack 
            backgroundColor={`${color}20`}
            borderRadius="$4"
            padding="$2"
          >
            {icon}
          </YStack>
        </XStack>
        
        {/* Step Content */}
        {children}
      </YStack>
    </Card>
  )
}