import React from 'react';
import { View, XStack, YStack, styled } from 'tamagui';
import { Dimensions } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Defs, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

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
    : Math.min(screenWidth * 0.6, 240);

  const Container = styled(View, {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  });

  // Convert degrees to bubble position (-1 to 1 range)
  const MAX_ANGLE = 5;
  const bubbleX = Math.max(-1, Math.min(1, -roll / MAX_ANGLE));
  const bubbleY = Math.max(-1, Math.min(1, -pitch / MAX_ANGLE));

  // Convert to actual pixel position
  const centerX = BUBBLE_SIZE / 2;
  const centerY = BUBBLE_SIZE / 2;
  const maxOffset = (BUBBLE_SIZE * 0.35);

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
        <Defs>
          {/* Gradient for outer glass ring */}
          <RadialGradient id="glassGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="rgba(100, 100, 120, 0.3)" stopOpacity="1" />
            <Stop offset="70%" stopColor="rgba(40, 40, 60, 0.4)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(20, 20, 30, 0.6)" stopOpacity="1" />
          </RadialGradient>

          {/* Gradient for bubble when level */}
          <RadialGradient id="bubbleGreenGradient" cx="30%" cy="30%">
            <Stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
            <Stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
            <Stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
          </RadialGradient>

          {/* Gradient for bubble when not level */}
          <RadialGradient id="bubbleRedGradient" cx="30%" cy="30%">
            <Stop offset="0%" stopColor="#f87171" stopOpacity="1" />
            <Stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
            <Stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
          </RadialGradient>

          {/* Glow effect for when level */}
          <RadialGradient id="levelGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Outer glow when level */}
        {isLevel && (
          <Circle
            cx={centerX}
            cy={centerY}
            r={BUBBLE_SIZE * 0.50}
            fill="url(#levelGlow)"
          />
        )}

        {/* Outermost glass ring with gradient */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.49}
          fill="url(#glassGradient)"
          stroke="rgba(100, 116, 139, 0.4)"
          strokeWidth={2}
        />

        {/* Main level area - darker for contrast */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.45}
          fill="rgba(15, 23, 42, 0.9)"
        />

        {/* Precision rings with gradient colors */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.38}
          fill="none"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth={1}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.30}
          fill="none"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth={1}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={BUBBLE_SIZE * 0.22}
          fill="none"
          stroke="rgba(34, 197, 94, 0.3)"
          strokeWidth={1}
        />

        {/* Level target zone with glow */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={targetRadius + 4}
          fill="none"
          stroke={isLevel ? "rgba(34, 197, 94, 0.3)" : "rgba(59, 130, 246, 0.2)"}
          strokeWidth={8}
          opacity={isLevel ? 1 : 0.5}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={targetRadius}
          fill={isLevel ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.08)"}
          stroke={isLevel ? "#22c55e" : "#3b82f6"}
          strokeWidth={2}
          strokeDasharray={isLevel ? undefined : '5,5'}
        />

        {/* Crosshair lines - more subtle */}
        <Line
          x1={centerX - BUBBLE_SIZE * 0.42}
          y1={centerY}
          x2={centerX + BUBBLE_SIZE * 0.42}
          y2={centerY}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <Line
          x1={centerX}
          y1={centerY - BUBBLE_SIZE * 0.42}
          x2={centerX}
          y2={centerY + BUBBLE_SIZE * 0.42}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Center dot - glowing */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill={isLevel ? "#22c55e" : "#3b82f6"}
          opacity={0.8}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={1.5}
          fill="#ffffff"
        />

        {/* Bubble shadow - more pronounced */}
        <Circle
          cx={bubblePosX + 3}
          cy={bubblePosY + 3}
          r={bubbleRadius}
          fill="rgba(0, 0, 0, 0.4)"
        />

        {/* Bubble with gradient */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius}
          fill={isLevel ? "url(#bubbleGreenGradient)" : "url(#bubbleRedGradient)"}
          opacity={0.95}
        />

        {/* Bubble highlight - centered for clarity */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius * 0.6}
          fill="rgba(255, 255, 255, 0.4)"
        />

        {/* Bubble core highlight - bright center spot */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius * 0.15}
          fill="rgba(255, 255, 255, 0.9)"
        />

        {/* Degree markers with better visibility */}
        <G>
          <SvgText
            x={centerX}
            y={size === 'compact' ? 15 : 20}
            fontSize={size === 'compact' ? "11" : "15"}
            fill={isLevel ? "#22c55e" : "#ffffff"}
            textAnchor="middle"
            fontWeight="700"
          >
            P: {pitch.toFixed(1)}°
          </SvgText>
          <SvgText
            x={centerX}
            y={BUBBLE_SIZE - (size === 'compact' ? 5 : 10)}
            fontSize={size === 'compact' ? "11" : "15"}
            fill={isLevel ? "#22c55e" : "#ffffff"}
            textAnchor="middle"
            fontWeight="700"
          >
            R: {roll.toFixed(1)}°
          </SvgText>
        </G>
      </Svg>
    </Container>
  );
}
