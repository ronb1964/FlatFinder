import React from 'react';
import { View, XStack, YStack, styled } from 'tamagui';
import { Dimensions } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface BubbleLevelProps {
  pitch: number; // degrees
  roll: number; // degrees
  isLevel: boolean;
  color: string;
  size?: 'compact' | 'full';
}

export function BubbleLevel({ pitch, roll, isLevel, color, size = 'full' }: BubbleLevelProps) {
    const BUBBLE_SIZE = size === 'compact' 
    ? Math.min(screenWidth * 0.35, 120)
    : Math.min(screenWidth * 0.6, 240); // Slightly smaller for better mobile fit

  const Container = styled(View, {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: size === 'compact' ? 0.2 : 0.4,
    shadowRadius: size === 'compact' ? 4 : 8,
  });
  // Convert degrees to bubble position (-1 to 1 range)
  // Bubble moves opposite to tilt (like a real bubble level - when you tilt right, bubble moves left)
  const MAX_ANGLE = 5; // Maximum displayable angle
  const bubbleX = Math.max(-1, Math.min(1, -roll / MAX_ANGLE)); // Inverted for realistic bubble behavior
  const bubbleY = Math.max(-1, Math.min(1, -pitch / MAX_ANGLE)); // Inverted for realistic bubble behavior

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
      <Svg 
        width={BUBBLE_SIZE} 
        height={BUBBLE_SIZE}
      >
        {/* Outermost border ring */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.49}
          fill="#1a1a1a"
          stroke="#333333"
          strokeWidth={3}
        />
        
        {/* Background fill */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.45}
          fill="#2a2a2a"
        />
        
        {/* Outer protective ring */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.47}
          fill="none"
          stroke="#666666"
          strokeWidth={3}
        />
        
        {/* Main level area */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.42}
          fill="#1e1e1e"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth={2}
        />
        
        {/* Precision rings with more color */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.35}
          fill="none"
          stroke="rgba(168, 85, 247, 0.6)"
          strokeWidth={1.5}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.28}
          fill="none"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth={1.5}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.21}
          fill="none"
          stroke="rgba(234, 179, 8, 0.6)"
          strokeWidth={1.5}
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
            y={size === 'compact' ? 15 : 20}
            fontSize={size === 'compact' ? "10" : "14"}
            fill="rgba(255, 255, 255, 0.8)"
            textAnchor="middle"
            fontWeight="600"
          >
            P: {pitch.toFixed(1)}°
          </SvgText>
          <SvgText
            x={centerX}
            y={BUBBLE_SIZE - (size === 'compact' ? 5 : 10)}
            fontSize={size === 'compact' ? "10" : "14"}
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