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
    ? Math.min(screenWidth * 0.50, 180) // Increased from 0.35 to 0.50
    : Math.min(screenWidth * 0.7, 280); // Increased from 0.6 to 0.7

  const Container = styled(View, {
    width: BUBBLE_SIZE * 1.2, // Wider to accommodate horizontal glow
    height: BUBBLE_SIZE * 1.2, // Taller to accommodate text at top and bottom
    alignSelf: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible', // Allow glow effects to extend beyond bounds
  });

  // Make SVG wider and taller with extra space for glow and text
  const SVG_WIDTH = BUBBLE_SIZE * 1.2;
  const SVG_HEIGHT = BUBBLE_SIZE * 1.2;
  const svgCenterX = SVG_WIDTH / 2;
  const svgCenterY = SVG_HEIGHT / 2; // Center in square SVG

  // Convert degrees to bubble position (-1 to 1 range)
  const MAX_ANGLE = 5;
  const bubbleX = Math.max(-1, Math.min(1, -roll / MAX_ANGLE));
  const bubbleY = Math.max(-1, Math.min(1, -pitch / MAX_ANGLE));

  // Convert to actual pixel position (use svgCenterX/Y since SVG is larger)
  const maxOffset = (BUBBLE_SIZE * 0.35);

  const bubblePosX = svgCenterX + bubbleX * maxOffset;
  const bubblePosY = svgCenterY + bubbleY * maxOffset;

  const bubbleRadius = BUBBLE_SIZE * 0.08;
  const targetRadius = BUBBLE_SIZE * 0.15;

  return (
    <Container>
      <Svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
      >
        <Defs>
          {/* Frosted glass background gradient */}
          <RadialGradient id="frostyGlass" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="rgba(148, 163, 184, 0.15)" stopOpacity="1" />
            <Stop offset="60%" stopColor="rgba(100, 116, 139, 0.25)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(71, 85, 105, 0.35)" stopOpacity="1" />
          </RadialGradient>

          {/* Gradient for outer glass ring - more depth */}
          <RadialGradient id="glassGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="rgba(120, 120, 150, 0.4)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(60, 60, 90, 0.5)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(30, 30, 50, 0.7)" stopOpacity="1" />
          </RadialGradient>

          {/* Enhanced bubble gradient when level - brighter, more vibrant */}
          <RadialGradient id="bubbleGreenGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#6ee7b7" stopOpacity="1" />
            <Stop offset="40%" stopColor="#34d399" stopOpacity="1" />
            <Stop offset="70%" stopColor="#10b981" stopOpacity="1" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </RadialGradient>

          {/* Enhanced bubble gradient when not level - warmer red */}
          <RadialGradient id="bubbleRedGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#fca5a5" stopOpacity="1" />
            <Stop offset="40%" stopColor="#f87171" stopOpacity="1" />
            <Stop offset="70%" stopColor="#ef4444" stopOpacity="1" />
            <Stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
          </RadialGradient>

          {/* Enhanced glow effect for when level - bigger and softer */}
          <RadialGradient id="levelGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#22c55e" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </RadialGradient>

          {/* Bubble shimmer effect - centered reflection */}
          <RadialGradient id="bubbleShimmer" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Frosted glass background - largest layer */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.52}
          fill="url(#frostyGlass)"
          opacity={0.8}
        />

        {/* Outer glow when level - contained within bounds */}
        {isLevel && (
          <>
            <Circle
              cx={svgCenterX}
              cy={svgCenterY}
              r={BUBBLE_SIZE * 0.52}
              fill="url(#levelGlow)"
            />
            <Circle
              cx={svgCenterX}
              cy={svgCenterY}
              r={BUBBLE_SIZE * 0.50}
              fill="url(#levelGlow)"
            />
          </>
        )}

        {/* Outermost glass ring with gradient - enhanced */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.49}
          fill="url(#glassGradient)"
          stroke="rgba(148, 163, 184, 0.6)"
          strokeWidth={3}
        />

        {/* Main level area - darker for contrast */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.45}
          fill="rgba(15, 23, 42, 0.9)"
        />

        {/* Precision rings with gradient colors - more prominent when not level */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.38}
          fill="none"
          stroke={isLevel ? "rgba(139, 92, 246, 0.5)" : "rgba(239, 68, 68, 0.7)"}
          strokeWidth={isLevel ? 2 : 3}
          opacity={isLevel ? 0.8 : 0.9}
        />
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.30}
          fill="none"
          stroke={isLevel ? "rgba(59, 130, 246, 0.6)" : "rgba(251, 146, 60, 0.8)"}
          strokeWidth={isLevel ? 2 : 3}
          opacity={isLevel ? 0.9 : 0.95}
        />
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={BUBBLE_SIZE * 0.22}
          fill="none"
          stroke={isLevel ? "rgba(34, 197, 94, 0.8)" : "rgba(250, 204, 21, 0.9)"}
          strokeWidth={isLevel ? 3 : 3}
          opacity={1}
        />

        {/* Level target zone with enhanced glow */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={targetRadius + 6}
          fill="none"
          stroke={isLevel ? "rgba(34, 197, 94, 0.4)" : "rgba(59, 130, 246, 0.3)"}
          strokeWidth={10}
          opacity={isLevel ? 1 : 0.4}
        />
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={targetRadius}
          fill={isLevel ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.1)"}
          stroke={isLevel ? "#22c55e" : "#3b82f6"}
          strokeWidth={3}
          strokeDasharray={isLevel ? undefined : '5,5'}
          opacity={isLevel ? 1 : 0.6}
        />

        {/* Crosshair lines - more subtle */}
        <Line
          x1={svgCenterX - BUBBLE_SIZE * 0.42}
          y1={svgCenterY}
          x2={svgCenterX + BUBBLE_SIZE * 0.42}
          y2={svgCenterY}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <Line
          x1={svgCenterX}
          y1={svgCenterY - BUBBLE_SIZE * 0.42}
          x2={svgCenterX}
          y2={svgCenterY + BUBBLE_SIZE * 0.42}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Center dot - glowing */}
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={3}
          fill={isLevel ? "#22c55e" : "#3b82f6"}
          opacity={0.8}
        />
        <Circle
          cx={svgCenterX}
          cy={svgCenterY}
          r={1.5}
          fill="#ffffff"
        />

        {/* Bubble glow/halo - soft aura around bubble */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius * 1.5}
          fill={isLevel ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}
          opacity={0.6}
        />

        {/* Bubble shadow - more pronounced and softer */}
        <Circle
          cx={bubblePosX + 4}
          cy={bubblePosY + 4}
          r={bubbleRadius}
          fill="rgba(0, 0, 0, 0.5)"
          opacity={0.8}
        />

        {/* Bubble with gradient - main body */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius}
          fill={isLevel ? "url(#bubbleGreenGradient)" : "url(#bubbleRedGradient)"}
          opacity={0.98}
        />

        {/* Bubble shimmer - centered reflection using gradient */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius * 0.65}
          fill="url(#bubbleShimmer)"
        />

        {/* Bubble core highlight - bright center spot (kept centered) */}
        <Circle
          cx={bubblePosX}
          cy={bubblePosY}
          r={bubbleRadius * 0.18}
          fill="rgba(255, 255, 255, 1)"
        />

        {/* Degree markers with enhanced visibility and glow */}
        <G>
          {/* Pitch text shadow at top */}
          <SvgText
            x={svgCenterX}
            y={size === 'compact' ? 18 : 22}
            fontSize={size === 'compact' ? "13" : "16"}
            fill="rgba(0, 0, 0, 0.5)"
            textAnchor="middle"
            fontWeight="700"
          >
            P: {pitch.toFixed(1)}°
          </SvgText>
          <SvgText
            x={svgCenterX}
            y={size === 'compact' ? 16 : 20}
            fontSize={size === 'compact' ? "13" : "16"}
            fill={isLevel ? "#22c55e" : "#ffffff"}
            textAnchor="middle"
            fontWeight="700"
          >
            P: {pitch.toFixed(1)}°
          </SvgText>

          {/* Roll text with shadow - positioned at bottom, moved DOWN away from halo */}
          <SvgText
            x={svgCenterX}
            y={SVG_HEIGHT - (size === 'compact' ? 5 : 8)}
            fontSize={size === 'compact' ? "13" : "16"}
            fill="rgba(0, 0, 0, 0.5)"
            textAnchor="middle"
            fontWeight="700"
          >
            R: {roll.toFixed(1)}°
          </SvgText>
          <SvgText
            x={svgCenterX}
            y={SVG_HEIGHT - (size === 'compact' ? 7 : 10)}
            fontSize={size === 'compact' ? "13" : "16"}
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
