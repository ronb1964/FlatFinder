import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
// Note: Using global setInterval/clearInterval which are available in React Native runtime
import {
  AlertCircle,
  ArrowLeft,
  Check,
  AlertTriangle,
  Caravan,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { router } from 'expo-router';
// Note: removed unused reanimated imports - using useState for pulse animation instead
import { useDeviceAttitude } from '../hooks/useDeviceAttitude';
import { applyCalibration } from '../lib/calibration';
import { RVLevelingCalculator, LevelingPlan, WheelLiftRequirement } from '../lib/rvLevelingMath';
import {
  normalizeAttitude,
  attitudeToLevelingMeasurement,
  SENSOR_NORMALIZATION_PRESETS,
} from '../lib/coordinateSystem';
import { useAppStore } from '../state/appStore';
import { formatMeasurement } from '../lib/units';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface LevelingAssistantProps {
  onBack?: () => void;
}

// Wheel indicator component with animated glow
interface WheelIndicatorProps {
  x: number;
  y: number;
  status: 'ground' | 'solution' | 'warning';
  isAnimating?: boolean;
}

// Trailer wheel component - ellipse shape that IS the indicator (with pulsing halo for warning)
interface TrailerWheelProps {
  x: number;
  y: number;
  status: 'ground' | 'solution' | 'warning';
}

function TrailerWheel({ x, y, status }: TrailerWheelProps) {
  const [pulseOpacity, setPulseOpacity] = useState(0.3);
  const isWarning = status === 'warning';

  useEffect(() => {
    if (!isWarning) {
      setPulseOpacity(0.3);
      return;
    }

    // Pulse animation for warning status
    let increasing = true;
    const interval = global.setInterval(() => {
      setPulseOpacity((prev) => {
        if (increasing) {
          if (prev >= 0.6) {
            increasing = false;
            return prev - 0.02;
          }
          return prev + 0.02;
        } else {
          if (prev <= 0.2) {
            increasing = true;
            return prev + 0.02;
          }
          return prev - 0.02;
        }
      });
    }, 50);

    return () => global.clearInterval(interval);
  }, [isWarning]);

  const statusColors = {
    ground: {
      fill: 'rgba(34, 197, 94, 0.8)',
      stroke: 'rgba(34, 197, 94, 0.9)',
      highlight: 'rgba(120, 255, 150, 0.4)',
      glow: 'rgba(34, 197, 94, 0.6)',
    },
    solution: {
      fill: 'rgba(59, 130, 246, 0.8)',
      stroke: 'rgba(59, 130, 246, 0.9)',
      highlight: 'rgba(140, 180, 255, 0.4)',
      glow: 'rgba(59, 130, 246, 0.6)',
    },
    warning: {
      fill: 'rgba(234, 179, 8, 0.8)',
      stroke: 'rgba(234, 179, 8, 0.9)',
      highlight: 'rgba(255, 220, 100, 0.4)',
      glow: 'rgba(234, 179, 8, 0.6)',
    },
  };

  const colors = statusColors[status];

  // Rounded rectangle dimensions for tire shape
  const width = 36;
  const height = 14;
  const cornerRadius = 4;

  return (
    <G>
      {/* Pulsing halo - only visible for warning status */}
      {isWarning && (
        <Rect
          x={x - (width + 12) / 2}
          y={y - (height + 8) / 2}
          width={width + 12}
          height={height + 8}
          rx={cornerRadius + 2}
          fill={colors.glow}
          opacity={pulseOpacity}
        />
      )}
      {/* Main wheel - rounded rectangle */}
      <Rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={cornerRadius}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1.5}
      />
      {/* Glass highlight */}
      <Rect
        x={x - 12}
        y={y - height / 2 + 2}
        width={24}
        height={5}
        rx={2}
        fill={colors.highlight}
      />
    </G>
  );
}

function WheelIndicator({ x, y, status, isAnimating = false }: WheelIndicatorProps) {
  const [pulseOpacity, setPulseOpacity] = useState(0.2);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!isAnimating) {
      setPulseOpacity(0.2);
      setPulseScale(1);
      return;
    }

    // Smoother, more noticeable pulse animation
    let increasing = true;
    const interval = global.setInterval(() => {
      setPulseOpacity((prev) => {
        if (increasing) {
          if (prev >= 0.85) {
            increasing = false;
            return prev - 0.03;
          }
          return prev + 0.03;
        } else {
          if (prev <= 0.15) {
            increasing = true;
            return prev + 0.03;
          }
          return prev - 0.03;
        }
      });
      // Also pulse the scale slightly
      setPulseScale((prev) => {
        if (increasing) {
          return Math.min(1.15, prev + 0.01);
        } else {
          return Math.max(1, prev - 0.01);
        }
      });
    }, 40);

    return () => global.clearInterval(interval);
  }, [isAnimating]);

  // Status colors - consistent across themes
  const colors = {
    ground: {
      fill: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.5)',
      outerGlow: 'rgba(34, 197, 94, 0.25)',
    },
    solution: {
      fill: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.5)',
      outerGlow: 'rgba(59, 130, 246, 0.25)',
    },
    warning: {
      fill: '#eab308',
      glow: 'rgba(234, 179, 8, 0.5)',
      outerGlow: 'rgba(234, 179, 8, 0.2)',
    },
  };

  const color = colors[status];
  const glowRadius = isAnimating ? 22 * pulseScale : 16;
  const outerGlowRadius = isAnimating ? 32 * pulseScale : 20;

  return (
    <G>
      {/* Outer soft glow - larger, softer */}
      {isAnimating && (
        <Circle
          cx={x}
          cy={y}
          r={outerGlowRadius}
          fill={color.outerGlow}
          opacity={pulseOpacity * 0.6}
        />
      )}
      {/* Inner glow - pulses when animating */}
      <Circle cx={x} cy={y} r={glowRadius} fill={color.glow} opacity={pulseOpacity} />
      {/* Main circle */}
      <Circle cx={x} cy={y} r={12} fill={color.fill} opacity={0.95} />
      {/* Inner highlight */}
      <Circle cx={x} cy={y - 3} r={4} fill="rgba(255,255,255,0.35)" />
    </G>
  );
}

// Trailer SVG diagram
interface VehicleDiagramProps {
  type: 'trailer' | 'motorhome' | 'van';
  wheelLifts: WheelLiftRequirement[];
  blockStacks: Record<
    string,
    { totalHeight: number; blocks: { thickness: number; count: number }[] }
  >;
  vehicleWidth: number;
  vehicleHeight: number;
}

function VehicleDiagram({
  type,
  wheelLifts,
  blockStacks,
  vehicleWidth,
  vehicleHeight,
}: VehicleDiagramProps) {
  // Use passed dimensions for responsive sizing
  const VEHICLE_WIDTH = vehicleWidth;
  const VEHICLE_HEIGHT = vehicleHeight;
  // Determine wheel status based on lift requirements
  const getWheelStatus = (location: string): 'ground' | 'solution' | 'warning' => {
    const lift = wheelLifts.find((w) => w.location === location);
    if (!lift || lift.liftInches < 0.001) return 'ground';
    const stack = blockStacks[location];
    // Check if blocks fully cover the needed lift (within 0.1" tolerance)
    if (stack && stack.blocks.length > 0 && stack.totalHeight >= lift.liftInches - 0.1) {
      return 'solution';
    }
    // Has blocks but not enough, or no blocks at all
    if (stack && stack.blocks.length > 0) return 'warning';
    return 'warning';
  };

  const isTrailer = type === 'trailer';
  const isVan = type === 'van';
  // Note: motorhome is the default case (else), so no explicit check needed

  if (isTrailer) {
    // TRAILER: Glass-themed with tongue/hitch
    return (
      <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="-15 0 332 192">
        <Defs>
          <RadialGradient id="trailerBodyGradient" cx="40%" cy="20%" r="80%">
            <Stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
            <Stop offset="50%" stopColor="rgba(59, 130, 246, 0.08)" />
            <Stop offset="100%" stopColor="rgba(59, 130, 246, 0.02)" />
          </RadialGradient>
          <RadialGradient id="trailerWheelWell" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </RadialGradient>
        </Defs>

        {/* Outer glow */}
        <Path
          d="M 90 36 L 280 36 Q 304 36 304 60 L 304 140 Q 304 164 280 164 L 90 164 Q 66 164 66 140 L 66 60 Q 66 36 90 36 Z"
          fill="none"
          stroke="rgba(59, 130, 246, 0.12)"
          strokeWidth={8}
        />

        {/* Trailer body - shortened to make room for longer hitch */}
        <Path
          d="M 90 40 L 280 40 Q 300 40 300 60 L 300 140 Q 300 160 280 160 L 90 160 Q 70 160 70 140 L 70 60 Q 70 40 90 40 Z"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth={1.5}
        />

        {/* Tongue/A-frame - extended for longer hitch */}
        <Path
          d="M 70 88 L 22 100 L 70 112 Z"
          fill="rgba(59, 130, 246, 0.08)"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hitch coupler - moved further from body */}
        <Circle
          cx={12}
          cy={100}
          r={8}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth={2}
        />
        <Circle cx={12} cy={100} r={3} fill="rgba(59, 130, 246, 0.3)" />

        {/* Colored wheel indicators - wheel shape IS the status indicator */}
        <TrailerWheel x={190} y={40} status={getWheelStatus('right')} />
        <TrailerWheel x={190} y={160} status={getWheelStatus('left')} />

        {/* Interior detail lines */}
        <Path
          d="M 95 100 L 260 100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="6 4"
        />
        <WheelIndicator
          x={12}
          y={100}
          status={getWheelStatus('tongue')}
          isAnimating={getWheelStatus('tongue') === 'warning'}
        />

        {/* Labels */}
        <SvgText
          x="190"
          y="18"
          textAnchor="middle"
          fill="rgba(59, 130, 246, 0.7)"
          fontSize="11"
          fontWeight="500"
        >
          Right
        </SvgText>
        <SvgText
          x="190"
          y="186"
          textAnchor="middle"
          fill="rgba(59, 130, 246, 0.7)"
          fontSize="11"
          fontWeight="500"
        >
          Left
        </SvgText>
        <SvgText
          x="12"
          y="130"
          textAnchor="middle"
          fill="rgba(59, 130, 246, 0.7)"
          fontSize="11"
          fontWeight="500"
        >
          Hitch
        </SvgText>
      </Svg>
    );
  }

  if (isVan) {
    // VAN: Distinctive van shape - tapered hood, wider body
    return (
      <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="0 0 320 192">
        <Defs>
          <RadialGradient id="vanBodyGradient" cx="25%" cy="20%" r="85%">
            <Stop offset="0%" stopColor="rgba(34, 197, 94, 0.15)" />
            <Stop offset="50%" stopColor="rgba(34, 197, 94, 0.08)" />
            <Stop offset="100%" stopColor="rgba(34, 197, 94, 0.02)" />
          </RadialGradient>
          <RadialGradient id="vanHoodGradient" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="rgba(34, 197, 94, 0.18)" />
            <Stop offset="100%" stopColor="rgba(34, 197, 94, 0.05)" />
          </RadialGradient>
          <RadialGradient id="vanWheelWell" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </RadialGradient>
        </Defs>

        {/* Outer glow - van shape */}
        <Path
          d="M 25 60
             Q 25 45 45 40
             L 70 36
             Q 85 34 95 40
             L 95 40
             L 265 40
             Q 290 40 290 65
             L 290 127
             Q 290 152 265 152
             L 95 152
             Q 85 158 70 156
             L 45 152
             Q 25 147 25 132
             Z"
          fill="none"
          stroke="rgba(34, 197, 94, 0.1)"
          strokeWidth={8}
        />

        {/* Van body - rectangular box */}
        <Path
          d="M 95 44
             L 260 44
             Q 282 44 282 66
             L 282 126
             Q 282 148 260 148
             L 95 148
             L 95 44
             Z"
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.4)"
          strokeWidth={1.5}
        />

        {/* Hood/cab area - tapered front, no partition stroke */}
        <Path
          d="M 95 44
             L 70 44
             Q 50 44 40 54
             L 32 64
             Q 28 74 28 96
             Q 28 118 32 128
             L 40 138
             Q 50 148 70 148
             L 95 148
             Z"
          fill="rgba(34, 197, 94, 0.12)"
          stroke="rgba(34, 197, 94, 0.4)"
          strokeWidth={1.5}
        />

        {/* Windshield */}
        <Path
          d="M 45 70 Q 38 80 38 96 Q 38 112 45 122"
          fill="none"
          stroke="rgba(34, 197, 94, 0.35)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Hood line detail */}
        <Path
          d="M 60 55 L 85 50"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d="M 60 137 L 85 142"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeLinecap="round"
        />

        {/* Center line */}
        <Path
          d="M 50 96 L 260 96"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* Front/Rear labels - consistent spacing from edges */}
        <SvgText
          x="8"
          y="100"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="11"
          fontWeight="600"
        >
          F
        </SvgText>
        <SvgText
          x="308"
          y="100"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="11"
          fontWeight="600"
        >
          R
        </SvgText>

        {/* Left/Right labels - driver side (left) is at bottom when front faces left */}
        <SvgText
          x="160"
          y="16"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.5)"
          fontSize="10"
          fontWeight="500"
        >
          Passenger (Right)
        </SvgText>
        <SvgText
          x="160"
          y="186"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.5)"
          fontSize="10"
          fontWeight="500"
        >
          Driver (Left)
        </SvgText>

        {/* Wheel indicators - rounded rectangle style */}
        <TrailerWheel x={75} y={148} status={getWheelStatus('front_left')} />
        <TrailerWheel x={75} y={44} status={getWheelStatus('front_right')} />
        <TrailerWheel x={235} y={148} status={getWheelStatus('rear_left')} />
        <TrailerWheel x={235} y={44} status={getWheelStatus('rear_right')} />
      </Svg>
    );
  }

  // MOTORHOME: Simplified Class C - cab-over bulge, clean body, no interior clutter
  return (
    <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="0 0 320 192">
      <Defs>
        <RadialGradient id="mhBodyGradient" cx="30%" cy="20%" r="85%">
          <Stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
          <Stop offset="50%" stopColor="rgba(168, 85, 247, 0.08)" />
          <Stop offset="100%" stopColor="rgba(168, 85, 247, 0.02)" />
        </RadialGradient>
        <RadialGradient id="mhCabGradient" cx="40%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
          <Stop offset="100%" stopColor="rgba(168, 85, 247, 0.06)" />
        </RadialGradient>
        <RadialGradient id="mhWheelWell" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </RadialGradient>
      </Defs>

      {/* Outer glow - follows the extended body shape */}
      <Path
        d="M 75 34
           L 275 34
           Q 302 34 302 59
           L 302 133
           Q 302 158 275 158
           L 75 158
           L 50 158
           Q 34 158 30 148
           L 24 133
           Q 18 114 18 96
           Q 18 78 24 59
           L 30 44
           Q 34 34 50 34
           L 75 34
           Z"
        fill="none"
        stroke="rgba(168, 85, 247, 0.1)"
        strokeWidth={8}
      />

      {/* Main box body - extended for Class C look */}
      <Path
        d="M 75 38
           L 270 38
           Q 298 38 298 63
           L 298 129
           Q 298 154 270 154
           L 75 154
           Z"
        fill="rgba(168, 85, 247, 0.1)"
        stroke="rgba(168, 85, 247, 0.4)"
        strokeWidth={1.5}
      />

      {/* Cab/chassis section - wider to encompass front wheels, with cab-over bulge */}
      <Path
        d="M 75 38
           L 50 38
           Q 38 38 34 48
           L 28 63
           Q 22 78 22 96
           Q 22 114 28 129
           L 34 144
           Q 38 154 50 154
           L 75 154
           Z"
        fill="rgba(168, 85, 247, 0.14)"
        stroke="rgba(168, 85, 247, 0.45)"
        strokeWidth={1.5}
      />

      {/* Windshield curve */}
      <Path
        d="M 38 78 Q 30 88 30 96 Q 30 104 38 114"
        fill="none"
        stroke="rgba(168, 85, 247, 0.4)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Glass highlight on box body */}
      <Path
        d="M 80 40 L 265 40 Q 294 40 296 60"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Cab-over highlight */}
      <Path
        d="M 55 60 L 72 42"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Center line */}
      <Path
        d="M 50 96 L 280 96"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
        strokeDasharray="6 4"
      />

      {/* Front/Rear labels - consistent spacing from vehicle body */}
      <SvgText
        x="5"
        y="100"
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.6)"
        fontSize="11"
        fontWeight="600"
      >
        F
      </SvgText>
      <SvgText
        x="313"
        y="100"
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.6)"
        fontSize="11"
        fontWeight="600"
      >
        R
      </SvgText>

      {/* Left/Right labels */}
      <SvgText
        x="160"
        y="16"
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.5)"
        fontSize="10"
        fontWeight="500"
      >
        Passenger (Right)
      </SvgText>
      <SvgText
        x="160"
        y="186"
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.5)"
        fontSize="10"
        fontWeight="500"
      >
        Driver (Left)
      </SvgText>

      {/* Wheel indicators - rounded rectangle style */}
      <TrailerWheel x={72} y={38} status={getWheelStatus('front_right')} />
      <TrailerWheel x={72} y={154} status={getWheelStatus('front_left')} />
      <TrailerWheel x={252} y={38} status={getWheelStatus('rear_right')} />
      <TrailerWheel x={252} y={154} status={getWheelStatus('rear_left')} />
    </Svg>
  );
}

// Wheel info card component
interface WheelCardProps {
  lift: WheelLiftRequirement;
  blockStack: { totalHeight: number; blocks: { thickness: number; count: number }[] };
  units: 'imperial' | 'metric';
  isGround: boolean;
}

function WheelCard({ lift, blockStack, units, isGround }: WheelCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const hasBlocks = blockStack.blocks.length > 0;
  // Check if blocks fully cover the needed lift (within 0.1" tolerance)
  const isFullyCovered = hasBlocks && blockStack.totalHeight >= lift.liftInches - 0.1;
  const status = isGround ? 'ground' : isFullyCovered ? 'solution' : 'warning';

  // Theme-aware status colors
  const statusColors = {
    ground: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)',
      text: '#22c55e',
    },
    solution: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#3b82f6',
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.1)',
      border: 'rgba(234, 179, 8, 0.3)',
      text: '#eab308',
    },
  };

  const colors = statusColors[status];

  // Theme-aware text colors
  const textColors = {
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    blockItem: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  };

  return (
    <View style={[styles.wheelCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.wheelCardHeader}>
        <Text style={[styles.wheelCardTitle, { color: colors.text }]}>{lift.description}</Text>
        {isGround ? (
          <View style={styles.groundBadge}>
            <Check size={12} color="#22c55e" />
            <Text style={[styles.groundBadgeText, { color: '#22c55e' }]}>Ground</Text>
          </View>
        ) : (
          <View style={styles.liftNeeded}>
            <Text style={[styles.liftNeededLabel, { color: textColors.muted }]}>Lift needed</Text>
            <Text style={[styles.liftAmount, { color: colors.text }]}>
              {formatMeasurement(lift.liftInches, units)}
            </Text>
          </View>
        )}
      </View>

      {!isGround && (
        <View style={styles.wheelCardContent}>
          {hasBlocks ? (
            <>
              <View style={styles.blockList}>
                {blockStack.blocks
                  .filter((b) => b.count > 0)
                  .map((block, idx) => (
                    <View
                      key={idx}
                      style={[styles.blockItem, { backgroundColor: textColors.blockItem }]}
                    >
                      <Text style={[styles.blockItemText, { color: textColors.secondary }]}>
                        {block.count} × {formatMeasurement(block.thickness, units)}
                      </Text>
                    </View>
                  ))}
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: textColors.muted }]}>
                  Blocks provide:
                </Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {formatMeasurement(blockStack.totalHeight, units)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noBlocksWarning}>
              <AlertTriangle size={14} color="#eab308" />
              <Text style={[styles.noBlocksText, { color: '#eab308' }]}>No blocks available</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export function LevelingAssistant({ onBack }: LevelingAssistantProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const { activeProfile, settings, setShowLevelingAssistant } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();
  const { width: screenWidth } = useWindowDimensions();

  // Theme-aware colors
  const screenColors = {
    // Backgrounds - blue-gray for light mode
    gradientColors: isDark
      ? (['#0a0a0f', '#111118', '#0d0d12'] as const)
      : (['#dce4ed', '#d6dfe9', '#dae3ec'] as const),
    containerBg: theme.colors.background,
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.15)',
    footerBg: isDark ? 'rgba(10, 10, 15, 0.95)' : 'rgba(200, 212, 228, 0.98)',
    // Text colors
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    // Status colors (same in both modes for consistency)
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    primary: '#3b82f6',
    // Modal styles
    modalBg: isDark ? '#1a1a1f' : '#ffffff',
    modalBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
    modalOverlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    // Card backgrounds
    blockItemBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    newInstructionsBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    // Icon container
    iconContainerBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
    iconContainerBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
    // Step number
    stepBg: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    stepBorder: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.4)',
    // Close enough hint
    closeEnoughBg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
    closeEnoughBorder: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)',
  };

  // Responsive vehicle diagram sizing
  const VEHICLE_WIDTH = Math.min(screenWidth - 48, 320);
  const VEHICLE_HEIGHT = VEHICLE_WIDTH * 0.6;
  const [levelingPlan, setLevelingPlan] = useState<LevelingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // FROZEN readings - captured on mount, used for leveling plan
  const [frozenReadings, setFrozenReadings] = useState<{ pitch: number; roll: number } | null>(
    null
  );

  // Check Level mode - when user wants to verify results after placing blocks
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);
  const [isCheckingLevel, setIsCheckingLevel] = useState(false);
  const [checkLevelReadings, setCheckLevelReadings] = useState<{
    pitch: number;
    roll: number;
  } | null>(null);
  const [checkLevelPlan, setCheckLevelPlan] = useState<LevelingPlan | null>(null);

  // Capture and freeze readings on mount
  useEffect(() => {
    if (!frozenReadings && activeProfile?.calibration) {
      // Capture the initial readings when component mounts
      const calibrated = applyCalibration(
        { pitch: pitchDeg, roll: rollDeg },
        activeProfile.calibration
      );
      const normalized = normalizeAttitude(
        calibrated,
        SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
      );
      const physical = attitudeToLevelingMeasurement(normalized);
      setFrozenReadings({ pitch: physical.pitchDegrees, roll: physical.rollDegrees });
    } else if (!frozenReadings && !activeProfile?.calibration) {
      // No calibration - use raw values
      const normalized = normalizeAttitude(
        { pitch: pitchDeg, roll: rollDeg },
        SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
      );
      const physical = attitudeToLevelingMeasurement(normalized);
      setFrozenReadings({ pitch: physical.pitchDegrees, roll: physical.rollDegrees });
    }
    // Only run once on mount - intentionally not including pitchDeg/rollDeg in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile]);

  // Get current live readings (for Check Level mode)
  const getLiveReadings = () => {
    const calibrated = activeProfile?.calibration
      ? applyCalibration({ pitch: pitchDeg, roll: rollDeg }, activeProfile.calibration)
      : { pitch: pitchDeg, roll: rollDeg };
    const normalized = normalizeAttitude(
      calibrated,
      SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
    );
    const physical = attitudeToLevelingMeasurement(normalized);
    return { pitch: physical.pitchDegrees, roll: physical.rollDegrees };
  };

  // Use frozen readings for displaying the plan
  const displayReadings = frozenReadings || { pitch: 0, roll: 0 };

  // Calculate leveling plan from FROZEN readings (only when frozen readings are set)
  useEffect(() => {
    if (!activeProfile || !frozenReadings) return;

    const calculatePlan = () => {
      setIsCalculating(true);

      try {
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches,
        };
        const inventory = activeProfile.blockInventory || [];
        // Use frozen readings for calculation
        const measurement = {
          pitchDegrees: frozenReadings.pitch,
          rollDegrees: frozenReadings.roll,
        };
        const plan = RVLevelingCalculator.createLevelingPlan(geometry, measurement, inventory);
        setLevelingPlan(plan);
      } catch (error) {
        console.error('Error calculating leveling plan:', error);
        setLevelingPlan(null);
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = globalThis.setTimeout(calculatePlan, 100);
    return () => globalThis.clearTimeout(timeoutId);
  }, [frozenReadings, activeProfile]);

  // Handle Check Level button press - show orientation instructions first
  const handleCheckLevel = () => {
    // Close the results modal first if it's open
    setIsCheckingLevel(false);
    setCheckLevelReadings(null);
    // Then show the orientation prompt
    setShowOrientationPrompt(true);
  };

  // Actually take the reading after confirming orientation
  const handleConfirmCheckLevel = () => {
    const live = getLiveReadings();
    setCheckLevelReadings(live);

    // Calculate new leveling plan based on current readings
    if (activeProfile) {
      try {
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches,
        };
        const inventory = activeProfile.blockInventory || [];
        const measurement = { pitchDegrees: live.pitch, rollDegrees: live.roll };
        const newPlan = RVLevelingCalculator.createLevelingPlan(geometry, measurement, inventory);
        setCheckLevelPlan(newPlan);
      } catch (error) {
        console.error('Error calculating check level plan:', error);
        setCheckLevelPlan(null);
      }
    }

    setShowOrientationPrompt(false);
    setIsCheckingLevel(true);
  };

  // Go back to viewing the plan
  const handleBackToPlan = () => {
    setShowOrientationPrompt(false);
    setIsCheckingLevel(false);
    setCheckLevelReadings(null);
    setCheckLevelPlan(null);
  };

  // Check if near level (using check readings if in check mode, otherwise frozen)
  const readingsToCheck =
    isCheckingLevel && checkLevelReadings ? checkLevelReadings : displayReadings;

  // Calculate total deviation from level (pythagorean of pitch and roll)
  const totalDeviation = Math.sqrt(readingsToCheck.pitch ** 2 + readingsToCheck.roll ** 2);

  // Level status thresholds (based on RV industry standards):
  // - < 0.5° = Perfect level
  // - 0.5° - 2° = Close enough (acceptable for comfort and most appliances)
  // - > 2° = Needs adjustment (approaching fridge safety limit of 3°)
  const isLevel = totalDeviation < 0.5;
  const isCloseEnough = totalDeviation >= 0.5 && totalDeviation <= 2.0;
  const isNearLevel = isLevel; // Keep for backward compatibility with "Level!" banner

  // Calculate percentage (10° = 0%, 0° = 100%)
  // This gives more intuitive readings: 2° = 80%, 5° = 50%
  const levelPercentage = Math.max(0, Math.min(100, 100 - (totalDeviation / 10) * 100));

  // Memoize wheel lifts that need attention
  const activeLifts = useMemo(() => {
    if (!levelingPlan) return [];
    return levelingPlan.wheelLifts.filter((lift) => lift.liftInches > 0.001);
  }, [levelingPlan]);

  const groundWheels = useMemo(() => {
    if (!levelingPlan) return [];
    return levelingPlan.wheelLifts.filter((lift) => lift.liftInches <= 0.001);
  }, [levelingPlan]);

  if (!activeProfile) {
    const handleSetupProfile = () => {
      // Close the leveling assistant and navigate to profiles
      if (onBack) onBack();
      router.push('/profiles');
    };

    return (
      <LinearGradient colors={screenColors.gradientColors} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.noProfileContainer}>
            {/* Icon */}
            <View
              style={[
                styles.noProfileIconContainer,
                {
                  backgroundColor: screenColors.iconContainerBg,
                  borderColor: screenColors.iconContainerBorder,
                },
              ]}
            >
              <Caravan size={48} color={screenColors.primary} />
            </View>

            {/* Title and description */}
            <Text style={[styles.noProfileTitle, { color: screenColors.text }]}>
              No Vehicle Profile
            </Text>
            <Text style={[styles.noProfileDescription, { color: screenColors.textSecondary }]}>
              To calculate leveling requirements, you need to set up a vehicle profile first.
            </Text>
            <Text style={[styles.noProfileSubtext, { color: screenColors.textMuted }]}>
              {"Don't worry — the setup wizard will guide you through the process."}
            </Text>

            {/* Action button */}
            <View style={styles.noProfileButtonContainer}>
              <GlassButton
                onPress={handleSetupProfile}
                icon={<Plus size={20} color="#fff" />}
                variant="primary"
              >
                Add Vehicle
              </GlassButton>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const units = settings.measurementUnits || 'imperial';

  return (
    <View style={[styles.container, { backgroundColor: screenColors.containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: screenColors.headerBorder }]}>
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={screenColors.text} />
          </Pressable>
        )}
        <Text style={[styles.headerTitle, { color: screenColors.text }]}>Leveling Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Level Status Banner */}
        {isNearLevel ? (
          <GlassCard variant="success">
            <View style={styles.statusBanner}>
              <Check size={32} color={screenColors.success} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, { color: screenColors.success }]}>Level!</Text>
                <Text style={[styles.statusSubtitle, { color: screenColors.textSecondary }]}>
                  Your RV is properly leveled
                </Text>
              </View>
            </View>
            <View style={styles.levelDoneButtonContainer}>
              <GlassButton
                variant="success"
                size="lg"
                onPress={() => setShowLevelingAssistant(false)}
                icon={<Check size={20} color="#fff" />}
              >
                Done
              </GlassButton>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Vehicle Diagram */}
            <GlassCard>
              <View style={styles.diagramContainer}>
                <View style={styles.diagramHeader}>
                  <Text style={[styles.diagramTitle, { color: screenColors.text }]}>
                    Vehicle Overview
                  </Text>
                  <Text style={[styles.profileLabel, { color: screenColors.textSecondary }]}>
                    {activeProfile.name}
                  </Text>
                </View>
                <View style={styles.diagramWrapper}>
                  {levelingPlan && (
                    <VehicleDiagram
                      type={activeProfile.type}
                      wheelLifts={levelingPlan.wheelLifts}
                      blockStacks={levelingPlan.blockStacks}
                      vehicleWidth={VEHICLE_WIDTH}
                      vehicleHeight={VEHICLE_HEIGHT}
                    />
                  )}
                </View>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: screenColors.success }]} />
                    <Text style={[styles.legendText, { color: screenColors.textMuted }]}>
                      Ground
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: screenColors.primary }]} />
                    <Text style={[styles.legendText, { color: screenColors.textMuted }]}>
                      Blocks
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: screenColors.warning }]} />
                    <Text style={[styles.legendText, { color: screenColors.textMuted }]}>
                      Attention
                    </Text>
                  </View>
                </View>
                {/* Compact Pitch/Roll readings - FROZEN values */}
                <View
                  style={[
                    styles.compactReadings,
                    {
                      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text style={[styles.compactReadingText, { color: screenColors.textSecondary }]}>
                    Pitch: {Math.abs(displayReadings.pitch).toFixed(1)}°
                    {displayReadings.pitch > 0.1
                      ? ' nose up'
                      : displayReadings.pitch < -0.1
                        ? ' nose down'
                        : ''}
                  </Text>
                  <Text style={[styles.compactReadingDivider, { color: screenColors.textMuted }]}>
                    •
                  </Text>
                  <Text style={[styles.compactReadingText, { color: screenColors.textSecondary }]}>
                    Roll: {Math.abs(displayReadings.roll).toFixed(1)}°
                    {displayReadings.roll > 0.1
                      ? ' right up'
                      : displayReadings.roll < -0.1
                        ? ' left up'
                        : ''}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Warnings */}
            {levelingPlan && levelingPlan.warnings.length > 0 && (
              <View style={styles.warningBanner}>
                <AlertCircle size={20} color={screenColors.danger} />
                <Text style={[styles.warningText, { color: screenColors.danger }]}>
                  {levelingPlan.warnings.join(' ')}
                </Text>
              </View>
            )}

            {/* Block Instructions */}
            {levelingPlan && !isCalculating && (
              <View style={styles.instructionsSection}>
                <Text style={[styles.sectionTitle, { color: screenColors.text }]}>
                  Block Instructions
                </Text>

                {/* Wheels needing blocks */}
                {activeLifts.map((lift) => (
                  <WheelCard
                    key={lift.location}
                    lift={lift}
                    blockStack={levelingPlan.blockStacks[lift.location]}
                    units={units}
                    isGround={false}
                  />
                ))}

                {/* Ground wheels */}
                {groundWheels.map((lift) => (
                  <WheelCard
                    key={lift.location}
                    lift={lift}
                    blockStack={levelingPlan.blockStacks[lift.location]}
                    units={units}
                    isGround={true}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Loading state */}
        {!levelingPlan && isCalculating && (
          <GlassCard>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: screenColors.textSecondary }]}>
                Calculating leveling plan...
              </Text>
            </View>
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer - Check Level Button (part of normal layout flow, not absolute) */}
      {!isNearLevel && !showOrientationPrompt && !isCheckingLevel && levelingPlan && (
        <View
          style={[
            styles.checkLevelFooter,
            {
              backgroundColor: screenColors.footerBg,
              borderTopColor: screenColors.headerBorder,
            },
          ]}
        >
          <GlassButton
            variant="primary"
            size="lg"
            onPress={handleCheckLevel}
            icon={<RefreshCw size={20} color="#fff" />}
          >
            Check Level
          </GlassButton>
        </View>
      )}

      {/* Orientation Instructions Modal */}
      <Modal
        visible={showOrientationPrompt}
        transparent
        animationType="fade"
        onRequestClose={handleBackToPlan}
      >
        <View style={[styles.modalOverlay, { backgroundColor: screenColors.modalOverlay }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: screenColors.modalBg, borderColor: screenColors.modalBorder },
            ]}
          >
            <Text style={[styles.orientationTitle, { color: screenColors.text }]}>
              Position Your Phone
            </Text>
            <View style={styles.orientationInstructions}>
              <View style={styles.orientationStep}>
                <Text
                  style={[
                    styles.orientationNumber,
                    {
                      backgroundColor: screenColors.stepBg,
                      borderColor: screenColors.stepBorder,
                      color: screenColors.text,
                    },
                  ]}
                >
                  1
                </Text>
                <Text style={[styles.orientationText, { color: screenColors.textSecondary }]}>
                  Place phone flat on a surface inside your vehicle
                </Text>
              </View>
              <View style={styles.orientationStep}>
                <Text
                  style={[
                    styles.orientationNumber,
                    {
                      backgroundColor: screenColors.stepBg,
                      borderColor: screenColors.stepBorder,
                      color: screenColors.text,
                    },
                  ]}
                >
                  2
                </Text>
                <Text style={[styles.orientationText, { color: screenColors.textSecondary }]}>
                  Point the TOP of your phone toward the FRONT of the vehicle
                </Text>
              </View>
              <View style={styles.orientationStep}>
                <Text
                  style={[
                    styles.orientationNumber,
                    {
                      backgroundColor: screenColors.stepBg,
                      borderColor: screenColors.stepBorder,
                      color: screenColors.text,
                    },
                  ]}
                >
                  3
                </Text>
                <Text style={[styles.orientationText, { color: screenColors.textSecondary }]}>
                  Keep phone still while checking
                </Text>
              </View>
            </View>
            <View style={styles.modalButtonsStacked}>
              <GlassButton
                variant="success"
                size="md"
                onPress={handleConfirmCheckLevel}
                icon={<Check size={18} color="#fff" />}
              >
                Check Level Now
              </GlassButton>
              <GlassButton variant="default" size="md" onPress={handleBackToPlan}>
                Cancel
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Check Level Results Modal */}
      <Modal
        visible={isCheckingLevel && checkLevelReadings !== null}
        transparent
        animationType="fade"
        onRequestClose={handleBackToPlan}
      >
        <View style={[styles.modalOverlay, { backgroundColor: screenColors.modalOverlay }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: screenColors.modalBg, borderColor: screenColors.modalBorder },
              isLevel && { borderColor: 'rgba(34, 197, 94, 0.4)' },
              isCloseEnough && { borderColor: 'rgba(59, 130, 246, 0.4)' },
            ]}
          >
            {/* Perfect Level */}
            {isLevel && (
              <>
                <Text style={[styles.checkResultsTitle, { color: screenColors.success }]}>
                  ✓ Level Achieved!
                </Text>
                <Text style={[styles.levelAchievedText, { color: screenColors.textSecondary }]}>
                  Your RV is perfectly level. You&apos;re all set!
                </Text>
              </>
            )}

            {/* Close Enough */}
            {isCloseEnough && (
              <>
                <Text style={[styles.checkResultsTitle, { color: screenColors.primary }]}>
                  Close Enough!
                </Text>
                <View style={styles.percentageContainer}>
                  <Text style={[styles.percentageValue, { color: screenColors.success }]}>
                    {Math.round(levelPercentage)}%
                  </Text>
                  <Text style={[styles.percentageLabel, { color: screenColors.textMuted }]}>
                    Level
                  </Text>
                </View>
                <Text style={[styles.closeEnoughText, { color: screenColors.textSecondary }]}>
                  You&apos;re within {totalDeviation.toFixed(1)}° of perfectly level. This is
                  acceptable for comfort and safe for your fridge and appliances.
                </Text>
                <View
                  style={[
                    styles.closeEnoughHint,
                    {
                      backgroundColor: screenColors.closeEnoughBg,
                      borderColor: screenColors.closeEnoughBorder,
                    },
                  ]}
                >
                  <Check size={16} color={screenColors.success} />
                  <Text style={[styles.closeEnoughHintText, { color: screenColors.success }]}>
                    Good to go!
                  </Text>
                </View>
              </>
            )}

            {/* Needs More Adjustment */}
            {!isLevel && !isCloseEnough && (
              <>
                <Text style={[styles.checkResultsTitle, { color: screenColors.text }]}>
                  Adjustment Needed
                </Text>
                <View style={styles.percentageContainer}>
                  <Text style={[styles.percentageValue, { color: screenColors.warning }]}>
                    {Math.round(levelPercentage)}%
                  </Text>
                  <Text style={[styles.percentageLabel, { color: screenColors.textMuted }]}>
                    Level
                  </Text>
                </View>
                <Text style={[styles.adjustmentNeededText, { color: screenColors.textSecondary }]}>
                  {totalDeviation.toFixed(1)}° from level. Add more blocks to reach safe operating
                  range.
                </Text>

                {/* Show new block instructions */}
                {checkLevelPlan && (
                  <View
                    style={[
                      styles.newInstructionsContainer,
                      { backgroundColor: screenColors.newInstructionsBg },
                    ]}
                  >
                    <Text style={[styles.newInstructionsLabel, { color: screenColors.textMuted }]}>
                      Additional blocks needed:
                    </Text>
                    {checkLevelPlan.wheelLifts
                      .filter((lift) => lift.liftInches > 0.125)
                      .map((lift) => {
                        const stack = checkLevelPlan.blockStacks[lift.location];
                        const hasBlocks = stack && stack.blocks.length > 0;
                        return (
                          <View key={lift.location} style={styles.newInstructionRow}>
                            <Text
                              style={[styles.newInstructionWheel, { color: screenColors.text }]}
                            >
                              {lift.description}
                            </Text>
                            <Text
                              style={[styles.newInstructionAmount, { color: screenColors.primary }]}
                            >
                              {hasBlocks
                                ? stack.blocks
                                    .filter((b) => b.count > 0)
                                    .map((b) => `${b.count}×${b.thickness}"`)
                                    .join(' + ')
                                : `${lift.liftInches.toFixed(1)}" needed`}
                            </Text>
                          </View>
                        );
                      })}
                    {checkLevelPlan.wheelLifts.filter((lift) => lift.liftInches > 0.125).length ===
                      0 && (
                      <Text
                        style={[styles.newInstructionHint, { color: screenColors.textSecondary }]}
                      >
                        Minor adjustment - reposition existing blocks
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}

            <View style={styles.modalButtonsStacked}>
              {!isLevel && (
                <GlassButton
                  variant="primary"
                  size="md"
                  onPress={handleCheckLevel}
                  icon={<RefreshCw size={16} color="#fff" />}
                >
                  Check Again
                </GlassButton>
              )}
              <GlassButton variant="default" size="md" onPress={handleBackToPlan}>
                {isLevel || isCloseEnough ? 'Done' : 'View Original Plan'}
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  levelDoneButtonContainer: {
    marginTop: 16,
    width: '100%',
  },
  // Vehicle Diagram
  diagramContainer: {
    alignItems: 'center',
    gap: 12,
  },
  diagramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  diagramWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  // Compact readings inline with diagram
  compactReadings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  compactReadingText: {
    fontSize: 12,
  },
  compactReadingDivider: {
    fontSize: 12,
  },
  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Instructions Section
  instructionsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  // Wheel Card
  wheelCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  wheelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wheelCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  liftNeeded: {
    alignItems: 'flex-end',
  },
  liftNeededLabel: {
    fontSize: 10,
    marginBottom: 1,
  },
  liftAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  groundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groundBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wheelCardContent: {
    gap: 8,
  },
  blockList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  blockItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  blockItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  noBlocksWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noBlocksText: {
    fontSize: 13,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 15,
  },
  // No Profile State
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100, // Space for tab bar
  },
  noProfileIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  noProfileDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  noProfileSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  noProfileButtonContainer: {
    marginTop: 32,
    width: '100%',
  },
  bottomSpacer: {
    height: 16, // Small padding at end of scroll content
  },
  // Check Level styles
  checkResultsContainer: {
    gap: 16,
    alignItems: 'center',
  },
  checkResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkResultsReadings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 8,
  },
  checkResultItem: {
    alignItems: 'center',
    flex: 1,
  },
  checkResultLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  checkResultValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  checkResultValueGood: {},
  checkResultHint: {
    fontSize: 12,
    marginTop: 2,
  },
  checkResultDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkResultsAdvice: {
    fontSize: 14,
    textAlign: 'center',
  },
  checkResultsButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  // Orientation prompt styles
  orientationContainer: {
    gap: 16,
  },
  orientationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  orientationInstructions: {
    gap: 12,
  },
  orientationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  orientationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  orientationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  orientationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  // Footer for Check Level button (part of normal flex layout)
  checkLevelFooter: {
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100, // Account for tab bar + safe area
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1f',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 20,
  },
  modalContentSuccess: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonsStacked: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  checkResultsTitleSuccess: {},
  checkResultsTitleCloseEnough: {},
  modalContentCloseEnough: {},
  // Percentage display
  percentageContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  percentageValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  percentageValueWarning: {},
  percentageLabel: {
    fontSize: 14,
    marginTop: -4,
  },
  // Close enough messaging
  closeEnoughText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeEnoughHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  closeEnoughHintText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Adjustment needed messaging
  adjustmentNeededText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Level achieved text
  levelAchievedText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // New instructions in check level modal
  newInstructionsContainer: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    width: '100%',
  },
  newInstructionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  newInstructionRow: {
    flexDirection: 'column',
    paddingVertical: 6,
    gap: 2,
  },
  newInstructionWheel: {
    fontSize: 14,
    fontWeight: '500',
  },
  newInstructionAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  newInstructionHint: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default LevelingAssistant;
