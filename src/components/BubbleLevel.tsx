import React from 'react';
import { View, XStack, YStack, styled } from 'tamagui';
import { Dimensions } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const BUBBLE_SIZE = Math.min(screenWidth * 0.8, 300);

interface BubbleLevelProps {
  pitch: number; // degrees
  roll: number; // degrees
  isLevel: boolean;
  color: string;
}

const Container = styled(View, {
  width: BUBBLE_SIZE,
  height: BUBBLE_SIZE,
  alignSelf: 'center',
  backgroundColor: '#1a1a1a',
  borderRadius: BUBBLE_SIZE / 2,
  borderWidth: 3,
  borderColor: '#333333',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
});

export function BubbleLevel({ pitch, roll, isLevel, color }: BubbleLevelProps) {
  // Convert degrees to bubble position (-1 to 1 range)
  // Note: bubble moves opposite to tilt direction (like a real bubble level)
  const MAX_ANGLE = 5; // Maximum displayable angle
  const bubbleX = Math.max(-1, Math.min(1, -roll / MAX_ANGLE)); // Inverted for realistic behavior
  const bubbleY = Math.max(-1, Math.min(1, -pitch / MAX_ANGLE));

  // Convert to actual pixel position
  const centerX = BUBBLE_SIZE / 2;
  const centerY = BUBBLE_SIZE / 2;
  const maxOffset = (BUBBLE_SIZE * 0.35); // Bubble can move within 35% of radius
  
  const bubblePosX = centerX + bubbleX * maxOffset;
  const bubblePosY = centerY + bubbleY * maxOffset;

  const bubbleRadius = BUBBLE_SIZE * 0.08;
  const targetRadius = BUBBLE_SIZE * 0.15;

  return (
    <Container>
      <Svg width={BUBBLE_SIZE} height={BUBBLE_SIZE}>
        {/* Background gradient fill */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.47}
          fill="#2a2a2a"
        />
        
        {/* Outer protective ring */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.47}
          fill="none"
          stroke="#555555"
          strokeWidth={4}
        />
        
        {/* Main level area */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.42}
          fill="#1e1e1e"
          stroke="#444444"
          strokeWidth={2}
        />
        
        {/* Precision rings */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.35}
          fill="none"
          stroke="#666666"
          strokeWidth={1}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.28}
          fill="none"
          stroke="#555555"
          strokeWidth={1}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.21}
          fill="none"
          stroke="#777777"
          strokeWidth={1}
        />
        
        {/* Level target zone */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.15}
          fill="rgba(34, 197, 94, 0.1)"
          stroke="#22c55e"
          strokeWidth={2}
        />
        
        {/* Crosshair lines */}
        <Line
          x1={centerX - BUBBLE_SIZE * 0.4}
          y1={centerY}
          x2={centerX + BUBBLE_SIZE * 0.4}
          y2={centerY}
          stroke="#888888"
          strokeWidth={1.5}
        />
        <Line
          x1={centerX}
          y1={centerY - BUBBLE_SIZE * 0.4}
          x2={centerX}
          y2={centerY + BUBBLE_SIZE * 0.4}
          stroke="#888888"
          strokeWidth={1.5}
        />
        
        {/* Center dot */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={2}
          fill="#22c55e"
        />

        {/* Target circle (level zone) */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={targetRadius}
          fill={isLevel ? `${color}20` : 'none'}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={isLevel ? undefined : '5,5'}
        />

        {/* Bubble shadow */}
        <Circle
          cx={bubblePosX + 2}
          cy={bubblePosY + 2}
          r={bubbleRadius}
          fill="rgba(0, 0, 0, 0.2)"
        />
        
        {/* Bubble */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius}
          fill={isLevel ? "#22c55e" : color}
          opacity={0.95}
        />
        
        {/* Bubble highlight */}
        <Circle
          cx={bubblePosX - bubbleRadius * 0.25}
          cy={bubblePosY - bubbleRadius * 0.25}
          r={bubbleRadius * 0.4}
          fill="rgba(255, 255, 255, 0.6)"
        />
        
        {/* Bubble core highlight */}
        <Circle
          cx={bubblePosX - bubbleRadius * 0.4}
          cy={bubblePosY - bubbleRadius * 0.4}
          r={bubbleRadius * 0.15}
          fill="rgba(255, 255, 255, 0.9)"
        />

        {/* Degree markers */}
        <G>
          <SvgText
            x={centerX}
            y={20}
            fontSize="14"
            fill="rgba(255, 255, 255, 0.8)"
            textAnchor="middle"
            fontWeight="600"
          >
            P: {pitch.toFixed(1)}°
          </SvgText>
          <SvgText
            x={centerX}
            y={BUBBLE_SIZE - 10}
            fontSize="14"
            fill="rgba(255, 255, 255, 0.8)"
            textAnchor="middle"
            fontWeight="600"
          >
            R: {roll.toFixed(1)}°
          </SvgText>
        </G>
      </Svg>
    </Container>
  );
}