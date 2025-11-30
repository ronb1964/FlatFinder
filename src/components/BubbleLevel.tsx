import React, { useEffect, useMemo, memo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, {
  Circle,
  Line,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Filter,
  FeDropShadow,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface BubbleLevelProps {
  pitch: number;
  roll: number;
  isLevel: boolean;
  heading?: number; // Compass heading in degrees (0-360)
  size?: 'compact' | 'full';
}

// Get cardinal direction from heading
function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Charcoal + Electric Blue - Enhanced with pronounced rings
const COLORS = {
  bg: {
    outer: '#0a0a0f', // Deep dark with slight blue
    middle: '#12141c', // Dark surface with blue tint
    inner: '#1a1d28', // Lighter with blue undertone
  },
  glass: {
    tint: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(96, 165, 250, 0.6)',
  },
  // More pronounced concentric rings with gradient colors
  rings: [
    { color: '#1e40af', opacity: 0.5, width: 1.5 }, // Dark blue - innermost
    { color: '#2563eb', opacity: 0.6, width: 2 }, // Blue
    { color: '#3b82f6', opacity: 0.7, width: 2.5 }, // Electric blue
    { color: '#60a5fa', opacity: 0.6, width: 2 }, // Light blue
    { color: '#93c5fd', opacity: 0.5, width: 1.5 }, // Pale blue - outermost
  ],
  bubble: {
    base: '#3b82f6',
    highlight: '#ffffff',
    edge: '#1d4ed8', // Darker edge for definition
  },
  crosshairs: 'rgba(96, 165, 250, 0.5)',
  center: '#60a5fa',
  success: '#22c55e',
};

export const BubbleLevel = memo(function BubbleLevel({
  pitch,
  roll,
  isLevel,
  heading = 0,
  size = 'full',
}: BubbleLevelProps) {
  // Memoize constants to prevent recalculation
  const dimensions = useMemo(() => {
    const BUBBLE_SIZE =
      size === 'compact' ? Math.min(screenWidth * 0.35, 120) : Math.min(screenWidth * 0.8, 320);
    const PADDING = BUBBLE_SIZE * 0.1;
    const VIEWBOX_SIZE = BUBBLE_SIZE + PADDING * 2;
    const center = VIEWBOX_SIZE / 2;
    const rimRadius = BUBBLE_SIZE / 2;
    const bubbleRadius = BUBBLE_SIZE * 0.09;
    const maxOffset = rimRadius - bubbleRadius - 4;

    return { BUBBLE_SIZE, PADDING, VIEWBOX_SIZE, center, rimRadius, bubbleRadius, maxOffset };
  }, [size]);

  const { PADDING, VIEWBOX_SIZE, center, rimRadius, bubbleRadius, maxOffset } = dimensions;
  // Sensitivity: bubble hits edge at this angle. Lower = more sensitive.
  // For RV leveling, 5-10 degrees is typical. 5° means bubble reaches edge at 5° tilt.
  const maxAngle = 5;
  const maxDist = maxOffset;

  // Animated values - store offset from center (not absolute position)
  const bubbleOffsetX = useSharedValue(0);
  const bubbleOffsetY = useSharedValue(0);
  const levelOpacity = useSharedValue(0);
  const successGlow = useSharedValue(0);

  useEffect(() => {
    // Calculate target offset from center
    const rawX = (-roll / maxAngle) * maxOffset;
    const rawY = (-pitch / maxAngle) * maxOffset;
    const distance = Math.sqrt(rawX * rawX + rawY * rawY);

    let finalX = rawX;
    let finalY = rawY;

    // Clamp to circle boundary
    if (distance > maxDist) {
      const ratio = maxDist / distance;
      finalX = rawX * ratio;
      finalY = rawY * ratio;
    }

    // Directly set values (no animation for debug responsiveness)
    bubbleOffsetX.value = finalX;
    bubbleOffsetY.value = finalY;

    levelOpacity.value = withTiming(isLevel ? 1 : 0, { duration: 300 });
    successGlow.value = withTiming(isLevel ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch, roll, isLevel]);

  // Dynamic pulse animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedProps(() => ({
    r: maxOffset * 0.12 * pulse.value,
    opacity: Math.max(0.2, 0.5 - (pulse.value - 1) * 0.6),
  }));

  // Bubble position from offset values
  const bubbleProps = useAnimatedProps(() => {
    // Simply add center to the offset - clamping already done in useEffect
    return {
      cx: center + bubbleOffsetX.value,
      cy: center + bubbleOffsetY.value,
    };
  });

  const glowProps = useAnimatedProps(() => ({
    opacity: levelOpacity.value * successGlow.value * 0.4,
  }));

  // Calculate compass display values
  const normalizedHeading = ((heading % 360) + 360) % 360;
  const cardinalDirection = getCardinalDirection(normalizedHeading);

  return (
    <View style={[styles.container, { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }]}>
      <Svg
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <Defs>
          {/* Rich dark background with subtle blue gradient */}
          <RadialGradient id="glassBg" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#1a1d28" stopOpacity="1" />
            <Stop offset="40%" stopColor="#12141c" stopOpacity="1" />
            <Stop offset="70%" stopColor="#0d0f14" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0a0a0f" stopOpacity="1" />
          </RadialGradient>

          {/* Glass dome highlight - creates glass reflection effect */}
          <RadialGradient id="glassDome" cx="35%" cy="25%" rx="60%" ry="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <Stop offset="40%" stopColor="#60a5fa" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>

          {/* Inner glass reflection arc */}
          <LinearGradient id="glassArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#93c5fd" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </LinearGradient>

          {/* Vibrant electric blue rim gradient */}
          <LinearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
            <Stop offset="25%" stopColor="#60a5fa" stopOpacity="1" />
            <Stop offset="50%" stopColor="#93c5fd" stopOpacity="1" />
            <Stop offset="75%" stopColor="#60a5fa" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </LinearGradient>

          {/* Outer glow for depth */}
          <RadialGradient id="outerGlow" cx="50%" cy="50%" rx="55%" ry="55%">
            <Stop offset="85%" stopColor="#3b82f6" stopOpacity="0" />
            <Stop offset="95%" stopColor="#3b82f6" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </RadialGradient>

          {/* Success glow - emerald green */}
          <RadialGradient id="successGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={COLORS.success} stopOpacity="0.4" />
            <Stop offset="50%" stopColor={COLORS.success} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={COLORS.success} stopOpacity="0" />
          </RadialGradient>

          {/* Sharp bubble - centered reflection for clear level indication */}
          <RadialGradient id="bubble3d" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="25%" stopColor={isLevel ? '#86efac' : '#93c5fd'} stopOpacity="0.85" />
            <Stop
              offset="55%"
              stopColor={isLevel ? COLORS.success : COLORS.bubble.base}
              stopOpacity="1"
            />
            <Stop offset="100%" stopColor={isLevel ? '#15803d' : '#1d4ed8'} stopOpacity="1" />
          </RadialGradient>

          {/* Subtle shadow only - no blur on bubble itself */}
          <Filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <FeDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </Filter>
        </Defs>

        {/* Outer glow effect */}
        <Circle cx={center} cy={center} r={rimRadius + 8} fill="url(#outerGlow)" />

        {/* Outer rim with vibrant gradient */}
        <Circle
          cx={center}
          cy={center}
          r={rimRadius - 2}
          fill="url(#glassBg)"
          stroke="url(#rimGradient)"
          strokeWidth={4}
        />

        {/* Pronounced concentric rings with gradient effect */}
        {COLORS.rings.map((ring, i) => {
          const ratio = 0.2 + i * 0.18; // 0.2, 0.38, 0.56, 0.74, 0.92
          return (
            <Circle
              key={`ring-${i}`}
              cx={center}
              cy={center}
              r={maxOffset * ratio}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.width}
              strokeOpacity={ring.opacity}
            />
          );
        })}

        {/* Additional tick marks for visual interest */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const innerR = maxOffset * 0.85;
          const outerR = maxOffset * 0.95;
          return (
            <Line
              key={`tick-${i}`}
              x1={center + Math.cos(rad) * innerR}
              y1={center + Math.sin(rad) * innerR}
              x2={center + Math.cos(rad) * outerR}
              y2={center + Math.sin(rad) * outerR}
              stroke="#60a5fa"
              strokeWidth={angle % 90 === 0 ? 2.5 : 1.5}
              strokeOpacity={angle % 90 === 0 ? 0.7 : 0.4}
            />
          );
        })}

        {/* Dynamic crosshairs */}
        <Line
          x1={center - maxOffset * 0.2}
          y1={center}
          x2={center + maxOffset * 0.2}
          y2={center}
          stroke={COLORS.crosshairs}
          strokeWidth={2}
          strokeOpacity={0.5}
        />
        <Line
          x1={center}
          y1={center - maxOffset * 0.2}
          x2={center}
          y2={center + maxOffset * 0.2}
          stroke={COLORS.crosshairs}
          strokeWidth={2}
          strokeOpacity={0.5}
        />

        {/* Success glow (emerald when level) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={center * 0.9}
          fill="url(#successGlow)"
          animatedProps={glowProps}
        />

        {/* Center indicator with dynamic pulse */}
        <AnimatedCircle
          cx={center}
          cy={center}
          fill="none"
          stroke={isLevel ? COLORS.success : COLORS.center}
          strokeWidth={2.5}
          animatedProps={pulseStyle}
        />
        <Circle
          cx={center}
          cy={center}
          r={maxOffset * 0.1}
          fill="none"
          stroke={isLevel ? COLORS.success : COLORS.center}
          strokeWidth={3}
          strokeOpacity={0.7}
        />
        <Circle
          cx={center}
          cy={center}
          r={maxOffset * 0.04}
          fill={isLevel ? COLORS.success : COLORS.center}
          opacity={0.6}
        />

        {/* The Bubble - clean and sharp with subtle shadow */}
        <AnimatedCircle
          r={bubbleRadius}
          fill="url(#bubble3d)"
          animatedProps={bubbleProps}
          filter="url(#bubbleShadow)"
          stroke={isLevel ? 'rgba(134, 239, 172, 0.8)' : 'rgba(147, 197, 253, 0.8)'}
          strokeWidth={2}
        />

        {/* Glass dome highlight overlay - creates that liquid glass look */}
        <Circle
          cx={center}
          cy={center}
          r={rimRadius - 4}
          fill="url(#glassDome)"
          pointerEvents="none"
        />

        {/* Subtle arc highlight for extra glass depth */}
        <Circle
          cx={center - rimRadius * 0.25}
          cy={center - rimRadius * 0.3}
          r={rimRadius * 0.4}
          fill="none"
          stroke="url(#glassArc)"
          strokeWidth={2}
          strokeOpacity={0.5}
          strokeLinecap="round"
          strokeDasharray={`${rimRadius * 0.8} ${rimRadius * 2}`}
        />

        {/* Compass Ring - rotates with heading, but letters counter-rotate to stay upright */}
        <G rotation={-heading} origin={`${center}, ${center}`}>
          {/* Cardinal direction markers - counter-rotate to stay readable */}
          {['N', 'E', 'S', 'W'].map((dir, i) => {
            const angle = i * 90;
            const rad = ((angle - 90) * Math.PI) / 180;
            const textRadius = rimRadius * 0.78;
            const x = center + Math.cos(rad) * textRadius;
            const y = center + Math.sin(rad) * textRadius;
            const isNorth = dir === 'N';
            // Counter-rotate by adding heading back to keep text upright
            const textRotation = heading;
            return (
              <SvgText
                key={dir}
                x={x}
                y={y}
                fill={isNorth ? '#ef4444' : '#fafafa'}
                fontSize={size === 'compact' ? 14 : 20}
                fontWeight={isNorth ? '800' : '700'}
                textAnchor="middle"
                alignmentBaseline="central"
                rotation={textRotation}
                origin={`${x}, ${y}`}
              >
                {dir}
              </SvgText>
            );
          })}

          {/* Intercardinal markers - also counter-rotate to stay readable */}
          {['NE', 'SE', 'SW', 'NW'].map((dir, i) => {
            const angle = 45 + i * 90;
            const rad = ((angle - 90) * Math.PI) / 180;
            const textRadius = rimRadius * 0.78;
            const x = center + Math.cos(rad) * textRadius;
            const y = center + Math.sin(rad) * textRadius;
            // Counter-rotate by adding heading back to keep text upright
            const textRotation = heading;
            return (
              <SvgText
                key={dir}
                x={x}
                y={y}
                fill="#a3a3a3"
                fontSize={size === 'compact' ? 10 : 14}
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="central"
                rotation={textRotation}
                origin={`${x}, ${y}`}
              >
                {dir}
              </SvgText>
            );
          })}
        </G>

        {/* Fixed heading indicator triangle at top */}
        <Line
          x1={center}
          y1={PADDING + 4}
          x2={center - 6}
          y2={PADDING + 14}
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Line
          x1={center}
          y1={PADDING + 4}
          x2={center + 6}
          y2={PADDING + 14}
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>

      {/* Compass Heading Readout */}
      <View style={styles.compassReadout}>
        <View style={styles.compassCard}>
          <Text style={styles.compassHeading}>{Math.round(normalizedHeading)}°</Text>
          <Text style={styles.compassDirection}>{cardinalDirection}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassReadout: {
    position: 'absolute',
    bottom: 25,
    alignItems: 'center',
  },
  compassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    gap: 6,
  },
  compassHeading: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  compassDirection: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
});
