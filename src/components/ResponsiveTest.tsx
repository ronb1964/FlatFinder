import React from 'react';
import { YStack, XStack, Text, H1, H2, Button } from 'tamagui';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ScalableText,
  ScalableH1,
  ScalableH2,
  ScrollContainer,
  StickyActionButtons,
  AdaptiveCard,
} from './responsive';
import { GradientButton } from './GradientButton';

/**
 * ResponsiveTest - Test component to verify responsive utilities
 *
 * This component demonstrates all responsive features:
 * - Breakpoint-based layouts
 * - Responsive typography
 * - Adaptive grids
 * - Scroll containers
 * - Sticky buttons
 */
export function ResponsiveTest() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollContainer showFadeIndicator={true}>
        <ResponsiveContainer maxWidth="lg">
          <YStack space="$4" paddingVertical="$4">
            {/* Responsive Typography */}
            <YStack space="$3">
              <ScalableH1 base="$8" md="$10" lg="$12" color="white">
                Responsive Typography
              </ScalableH1>
              <ScalableText base="$4" md="$5" lg="$6" color="$colorPress">
                This text scales up on larger screens. Resize your browser to see it in action.
              </ScalableText>
            </YStack>

            {/* Breakpoint Indicators */}
            <AdaptiveCard>
              <YStack space="$3">
                <ScalableH2 base="$6" md="$7" color="white">
                  Current Breakpoint
                </ScalableH2>
                <XStack space="$2" flexWrap="wrap">
                  <YStack
                    backgroundColor="$red9"
                    padding="$3"
                    borderRadius="$3"
                    display="flex"
                    $gtXs={{ display: 'none' }}
                  >
                    <Text color="white" fontWeight="bold">XS (≤660px)</Text>
                  </YStack>

                  <YStack
                    backgroundColor="$orange9"
                    padding="$3"
                    borderRadius="$3"
                    display="none"
                    $gtXs={{ display: 'flex' }}
                    $gtSm={{ display: 'none' }}
                  >
                    <Text color="white" fontWeight="bold">SM (661-800px)</Text>
                  </YStack>

                  <YStack
                    backgroundColor="$blue9"
                    padding="$3"
                    borderRadius="$3"
                    display="none"
                    $md={{ display: 'flex' }}
                    $lg={{ display: 'none' }}
                  >
                    <Text color="white" fontWeight="bold">MD (801-1023px)</Text>
                  </YStack>

                  <YStack
                    backgroundColor="$green9"
                    padding="$3"
                    borderRadius="$3"
                    display="none"
                    $lg={{ display: 'flex' }}
                    $xl={{ display: 'none' }}
                  >
                    <Text color="white" fontWeight="bold">LG (1024-1279px)</Text>
                  </YStack>

                  <YStack
                    backgroundColor="$purple9"
                    padding="$3"
                    borderRadius="$3"
                    display="none"
                    $xl={{ display: 'flex' }}
                  >
                    <Text color="white" fontWeight="bold">XL (≥1280px)</Text>
                  </YStack>
                </XStack>
              </YStack>
            </AdaptiveCard>

            {/* Responsive Grid */}
            <YStack space="$3">
              <ScalableH2 base="$6" md="$7" color="white">
                Responsive Grid
              </ScalableH2>
              <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="$3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <AdaptiveCard key={num} backgroundColor="$blue3" borderColor="$blue9">
                    <Text color="white" textAlign="center" fontWeight="bold">
                      Card {num}
                    </Text>
                  </AdaptiveCard>
                ))}
              </ResponsiveGrid>
            </YStack>

            {/* Adaptive Spacing */}
            <AdaptiveCard
              responsivePadding={{
                xs: '$2',
                sm: '$4',
                md: '$6',
                lg: '$8',
              }}
              backgroundColor="$green3"
              borderColor="$green9"
            >
              <YStack space="$2">
                <ScalableH2 base="$5" md="$6" color="$green11">
                  Adaptive Spacing
                </ScalableH2>
                <Text color="$green11">
                  This card has responsive padding: compact on mobile ($2), comfortable on tablet ($6), spacious on desktop ($8).
                </Text>
              </YStack>
            </AdaptiveCard>

            {/* Add more cards to test scrolling */}
            {[1, 2, 3].map((num) => (
              <AdaptiveCard key={`extra-${num}`} backgroundColor="$purple3" borderColor="$purple9">
                <Text color="$purple11">
                  Extra card #{num} to test scrolling behavior and fade indicators
                </Text>
              </AdaptiveCard>
            ))}
          </YStack>
        </ResponsiveContainer>
      </ScrollContainer>

      {/* Sticky Action Buttons */}
      <StickyActionButtons>
        <GradientButton gradientType="primary" flex={1}>
          Primary Action
        </GradientButton>
        <GradientButton gradientType="success" flex={1}>
          Secondary Action
        </GradientButton>
      </StickyActionButtons>
    </YStack>
  );
}
