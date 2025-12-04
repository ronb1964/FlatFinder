import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
// Note: Using global setInterval/clearInterval which are available in React Native runtime
import { AlertCircle, ArrowLeft, Check, AlertTriangle, Caravan, Plus } from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
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
import { THEME } from '../theme';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VEHICLE_WIDTH = Math.min(SCREEN_WIDTH - 48, 320);
const VEHICLE_HEIGHT = VEHICLE_WIDTH * 0.6;

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

function WheelIndicator({ x, y, status, isAnimating = false }: WheelIndicatorProps) {
  const [pulseOpacity, setPulseOpacity] = useState(0.3);

  useEffect(() => {
    if (!isAnimating) {
      setPulseOpacity(0.3);
      return;
    }

    // Simple pulse animation using setInterval
    let increasing = true;
    const interval = global.setInterval(() => {
      setPulseOpacity((prev) => {
        if (increasing) {
          if (prev >= 0.7) {
            increasing = false;
            return prev - 0.02;
          }
          return prev + 0.02;
        } else {
          if (prev <= 0.3) {
            increasing = true;
            return prev + 0.02;
          }
          return prev - 0.02;
        }
      });
    }, 50);

    return () => global.clearInterval(interval);
  }, [isAnimating]);

  const colors = {
    ground: { fill: THEME.colors.success, glow: 'rgba(34, 197, 94, 0.6)' },
    solution: { fill: THEME.colors.primary, glow: 'rgba(59, 130, 246, 0.6)' },
    warning: { fill: THEME.colors.warning, glow: 'rgba(234, 179, 8, 0.6)' },
  };

  const color = colors[status];

  return (
    <G>
      {/* Outer glow - pulses when animating */}
      <Circle cx={x} cy={y} r={isAnimating ? 20 : 18} fill={color.glow} opacity={pulseOpacity} />
      {/* Main circle */}
      <Circle cx={x} cy={y} r={12} fill={color.fill} opacity={0.9} />
      {/* Inner highlight */}
      <Circle cx={x} cy={y - 3} r={4} fill="rgba(255,255,255,0.4)" />
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
}

function VehicleDiagram({ type, wheelLifts, blockStacks }: VehicleDiagramProps) {
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
          d="M 60 36 L 280 36 Q 304 36 304 60 L 304 140 Q 304 164 280 164 L 60 164 Q 36 164 36 140 L 36 60 Q 36 36 60 36 Z"
          fill="none"
          stroke="rgba(59, 130, 246, 0.12)"
          strokeWidth={8}
        />

        {/* Trailer body */}
        <Path
          d="M 60 40 L 280 40 Q 300 40 300 60 L 300 140 Q 300 160 280 160 L 60 160 Q 40 160 40 140 L 40 60 Q 40 40 60 40 Z"
          fill="url(#trailerBodyGradient)"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth={1.5}
        />

        {/* Glass highlight */}
        <Path
          d="M 65 42 L 275 42 Q 295 42 297 58"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1}
          strokeLinecap="round"
        />

        {/* Tongue/A-frame */}
        <Path
          d="M 40 88 L 18 100 L 40 112"
          fill="rgba(59, 130, 246, 0.05)"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hitch coupler */}
        <Circle
          cx={12}
          cy={100}
          r={8}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth={2}
        />
        <Circle cx={12} cy={100} r={3} fill="rgba(59, 130, 246, 0.3)" />

        {/* Wheel wells */}
        <Ellipse cx={260} cy={150} rx={22} ry={7} fill="url(#trailerWheelWell)" />
        <Ellipse cx={260} cy={50} rx={22} ry={7} fill="url(#trailerWheelWell)" />

        {/* Interior detail lines */}
        <Path
          d="M 80 100 L 240 100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* Wheel indicators */}
        <WheelIndicator
          x={260}
          y={50}
          status={getWheelStatus('right')}
          isAnimating={getWheelStatus('right') === 'warning'}
        />
        <WheelIndicator
          x={260}
          y={150}
          status={getWheelStatus('left')}
          isAnimating={getWheelStatus('left') === 'warning'}
        />
        <WheelIndicator
          x={12}
          y={100}
          status={getWheelStatus('tongue')}
          isAnimating={getWheelStatus('tongue') === 'warning'}
        />

        {/* Labels */}
        <SvgText
          x="260"
          y="26"
          textAnchor="middle"
          fill="rgba(59, 130, 246, 0.7)"
          fontSize="11"
          fontWeight="500"
        >
          Right
        </SvgText>
        <SvgText
          x="260"
          y="180"
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

        {/* Main van body */}
        <Path
          d="M 95 44
             L 260 44
             Q 282 44 282 66
             L 282 126
             Q 282 148 260 148
             L 95 148
             Z"
          fill="url(#vanBodyGradient)"
          stroke="rgba(34, 197, 94, 0.4)"
          strokeWidth={1.5}
        />

        {/* Hood/cab area - tapered front */}
        <Path
          d="M 95 44
             L 95 148
             L 70 152
             Q 50 150 40 140
             L 32 130
             Q 28 120 28 96
             Q 28 72 32 62
             L 40 52
             Q 50 42 70 40
             L 95 44
             Z"
          fill="url(#vanHoodGradient)"
          stroke="rgba(34, 197, 94, 0.45)"
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

        {/* Glass highlight on body */}
        <Path
          d="M 100 46 L 255 46 Q 278 46 280 64"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
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

        {/* Wheel wells */}
        <Ellipse cx={75} cy={44} rx={18} ry={5} fill="url(#vanWheelWell)" />
        <Ellipse cx={75} cy={148} rx={18} ry={5} fill="url(#vanWheelWell)" />
        <Ellipse cx={235} cy={44} rx={18} ry={5} fill="url(#vanWheelWell)" />
        <Ellipse cx={235} cy={148} rx={18} ry={5} fill="url(#vanWheelWell)" />

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

        {/* Wheel indicators - left wheels at bottom (y=148), right wheels at top (y=44) */}
        <WheelIndicator
          x={75}
          y={148}
          status={getWheelStatus('front_left')}
          isAnimating={getWheelStatus('front_left') === 'warning'}
        />
        <WheelIndicator
          x={75}
          y={44}
          status={getWheelStatus('front_right')}
          isAnimating={getWheelStatus('front_right') === 'warning'}
        />
        <WheelIndicator
          x={235}
          y={148}
          status={getWheelStatus('rear_left')}
          isAnimating={getWheelStatus('rear_left') === 'warning'}
        />
        <WheelIndicator
          x={235}
          y={44}
          status={getWheelStatus('rear_right')}
          isAnimating={getWheelStatus('rear_right') === 'warning'}
        />
      </Svg>
    );
  }

  // MOTORHOME: Class C style with truck cab and box body
  return (
    <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="0 0 320 192">
      <Defs>
        <RadialGradient id="mhBodyGradient" cx="30%" cy="20%" r="80%">
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

      {/* Outer glow */}
      <Path
        d="M 20 55 Q 15 70 15 96 Q 15 122 20 137 L 30 147 Q 45 158 65 158 L 270 158 Q 295 158 295 133 L 295 59 Q 295 34 270 34 L 65 34 Q 45 34 30 45 Z"
        fill="none"
        stroke="rgba(168, 85, 247, 0.1)"
        strokeWidth={8}
      />

      {/* Main box body */}
      <Path
        d="M 85 38
           L 265 38
           Q 288 38 288 61
           L 288 131
           Q 288 154 265 154
           L 85 154
           Z"
        fill="url(#mhBodyGradient)"
        stroke="rgba(168, 85, 247, 0.4)"
        strokeWidth={1.5}
      />

      {/* Cab-over section (extends above cab) */}
      <Path
        d="M 85 38 L 85 55 L 35 55 Q 28 55 28 62 L 28 130 Q 28 137 35 137 L 85 137 L 85 154"
        fill="url(#mhCabGradient)"
        stroke="rgba(168, 85, 247, 0.45)"
        strokeWidth={1.5}
      />

      {/* Truck cab hood - narrower, extends forward */}
      <Path
        d="M 35 62
           L 35 130
           Q 28 125 23 115
           L 20 105
           Q 18 96 20 87
           L 23 77
           Q 28 67 35 62
           Z"
        fill="url(#mhCabGradient)"
        stroke="rgba(168, 85, 247, 0.5)"
        strokeWidth={1.5}
      />

      {/* Windshield */}
      <Path
        d="M 28 75 Q 22 85 22 96 Q 22 107 28 117"
        fill="none"
        stroke="rgba(168, 85, 247, 0.4)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Hood detail lines */}
      <Path
        d="M 32 72 L 50 60"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M 32 120 L 50 132"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Glass highlight on box */}
      <Path
        d="M 90 40 L 260 40 Q 284 40 286 58"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Cab-over bed area outline */}
      <Path
        d="M 40 60 L 80 60 L 80 132 L 40 132"
        fill="none"
        stroke="rgba(168, 85, 247, 0.15)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Roof AC unit */}
      <Path
        d="M 160 55 L 210 55 Q 215 55 215 60 L 215 78 Q 215 83 210 83 L 160 83 Q 155 83 155 78 L 155 60 Q 155 55 160 55"
        fill="rgba(168, 85, 247, 0.08)"
        stroke="rgba(168, 85, 247, 0.2)"
        strokeWidth={1}
      />

      {/* Center line */}
      <Path
        d="M 45 96 L 270 96"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
        strokeDasharray="6 4"
      />

      {/* Entry door */}
      <Path
        d="M 110 154 L 110 125 Q 110 120 115 120 L 145 120 Q 150 120 150 125 L 150 154"
        fill="none"
        stroke="rgba(168, 85, 247, 0.2)"
        strokeWidth={1}
      />

      {/* Wheel wells */}
      <Ellipse cx={65} cy={38} rx={18} ry={5} fill="url(#mhWheelWell)" />
      <Ellipse cx={65} cy={154} rx={18} ry={5} fill="url(#mhWheelWell)" />
      <Ellipse cx={250} cy={38} rx={18} ry={5} fill="url(#mhWheelWell)" />
      <Ellipse cx={250} cy={154} rx={18} ry={5} fill="url(#mhWheelWell)" />

      {/* Front/Rear labels */}
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

      {/* Wheel indicators */}
      <WheelIndicator
        x={65}
        y={38}
        status={getWheelStatus('front_left')}
        isAnimating={getWheelStatus('front_left') === 'warning'}
      />
      <WheelIndicator
        x={65}
        y={154}
        status={getWheelStatus('front_right')}
        isAnimating={getWheelStatus('front_right') === 'warning'}
      />
      <WheelIndicator
        x={250}
        y={38}
        status={getWheelStatus('rear_left')}
        isAnimating={getWheelStatus('rear_left') === 'warning'}
      />
      <WheelIndicator
        x={250}
        y={154}
        status={getWheelStatus('rear_right')}
        isAnimating={getWheelStatus('rear_right') === 'warning'}
      />
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
  const hasBlocks = blockStack.blocks.length > 0;
  // Check if blocks fully cover the needed lift (within 0.1" tolerance)
  const isFullyCovered = hasBlocks && blockStack.totalHeight >= lift.liftInches - 0.1;
  const status = isGround ? 'ground' : isFullyCovered ? 'solution' : 'warning';

  const statusColors = {
    ground: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)',
      text: THEME.colors.success,
    },
    solution: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: THEME.colors.primary,
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.1)',
      border: 'rgba(234, 179, 8, 0.3)',
      text: THEME.colors.warning,
    },
  };

  const colors = statusColors[status];

  return (
    <View style={[styles.wheelCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.wheelCardHeader}>
        <Text style={[styles.wheelCardTitle, { color: colors.text }]}>{lift.description}</Text>
        {isGround ? (
          <View style={styles.groundBadge}>
            <Check size={12} color={THEME.colors.success} />
            <Text style={styles.groundBadgeText}>Ground</Text>
          </View>
        ) : (
          <View style={styles.liftNeeded}>
            <Text style={styles.liftNeededLabel}>Lift needed</Text>
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
                    <View key={idx} style={styles.blockItem}>
                      <Text style={styles.blockItemText}>
                        {block.count} × {formatMeasurement(block.thickness, units)}
                      </Text>
                    </View>
                  ))}
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Blocks provide:</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {formatMeasurement(blockStack.totalHeight, units)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noBlocksWarning}>
              <AlertTriangle size={14} color={THEME.colors.warning} />
              <Text style={styles.noBlocksText}>No blocks available</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export function LevelingAssistant({ onBack }: LevelingAssistantProps) {
  const { activeProfile, settings } = useAppStore();
  const { pitchDeg, rollDeg } = useDeviceAttitude();
  const [levelingPlan, setLevelingPlan] = useState<LevelingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force initial calculation on mount
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  // Apply calibration to sensor readings
  const calibratedReadings = activeProfile?.calibration
    ? applyCalibration({ pitch: pitchDeg, roll: rollDeg }, activeProfile.calibration)
    : { pitch: pitchDeg, roll: rollDeg };

  // Normalize attitude to canonical coordinate system
  const normalizedAttitude = normalizeAttitude(
    { pitch: calibratedReadings.pitch, roll: calibratedReadings.roll },
    SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
  );

  // Convert to leveling measurement format
  const physicalReadings = attitudeToLevelingMeasurement(normalizedAttitude);

  // Rounded values for dependency tracking (prevent excessive recalculations)
  const roundedPitch = Math.round(pitchDeg * 10) / 10;
  const roundedRoll = Math.round(rollDeg * 10) / 10;

  // Real-time leveling plan calculation
  useEffect(() => {
    if (!activeProfile) return;

    const calculatePlan = () => {
      setIsCalculating(true);

      try {
        const geometry = {
          wheelbaseInches: activeProfile.wheelbaseInches,
          trackWidthInches: activeProfile.trackWidthInches,
          hitchOffsetInches: activeProfile.hitchOffsetInches,
        };
        const inventory = activeProfile.blockInventory || [];
        const plan = RVLevelingCalculator.createLevelingPlan(geometry, physicalReadings, inventory);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundedPitch, roundedRoll, activeProfile, forceUpdate]);

  // Check if near level
  const isNearLevel =
    Math.abs(physicalReadings.pitchDegrees) < 0.5 && Math.abs(physicalReadings.rollDegrees) < 0.5;

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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0d0d12']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.noProfileContainer}>
            {/* Icon */}
            <View style={styles.noProfileIconContainer}>
              <Caravan size={48} color={THEME.colors.primary} />
            </View>

            {/* Title and description */}
            <Text style={styles.noProfileTitle}>No Vehicle Profile</Text>
            <Text style={styles.noProfileDescription}>
              To calculate leveling requirements, you need to set up a vehicle profile first.
            </Text>
            <Text style={styles.noProfileSubtext}>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Leveling Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Level Status Banner */}
        {isNearLevel ? (
          <GlassCard variant="success">
            <View style={styles.statusBanner}>
              <Check size={32} color={THEME.colors.success} />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Level!</Text>
                <Text style={styles.statusSubtitle}>Your RV is properly leveled</Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Vehicle Diagram */}
            <GlassCard>
              <View style={styles.diagramContainer}>
                <Text style={styles.diagramTitle}>Vehicle Overview</Text>
                <View style={styles.diagramWrapper}>
                  {levelingPlan && (
                    <VehicleDiagram
                      type={activeProfile.type}
                      wheelLifts={levelingPlan.wheelLifts}
                      blockStacks={levelingPlan.blockStacks}
                    />
                  )}
                </View>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: THEME.colors.success }]} />
                    <Text style={styles.legendText}>Ground</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: THEME.colors.primary }]} />
                    <Text style={styles.legendText}>Blocks</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: THEME.colors.warning }]} />
                    <Text style={styles.legendText}>Attention</Text>
                  </View>
                </View>
                {/* Compact Pitch/Roll readings */}
                <View style={styles.compactReadings}>
                  <Text style={styles.compactReadingText}>
                    Pitch: {Math.abs(physicalReadings.pitchDegrees).toFixed(1)}°
                    {physicalReadings.pitchDegrees > 0.1
                      ? ' nose up'
                      : physicalReadings.pitchDegrees < -0.1
                        ? ' nose down'
                        : ''}
                  </Text>
                  <Text style={styles.compactReadingDivider}>•</Text>
                  <Text style={styles.compactReadingText}>
                    Roll: {Math.abs(physicalReadings.rollDegrees).toFixed(1)}°
                    {physicalReadings.rollDegrees > 0.1
                      ? ' right up'
                      : physicalReadings.rollDegrees < -0.1
                        ? ' left up'
                        : ''}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Warnings */}
            {levelingPlan && levelingPlan.warnings.length > 0 && (
              <View style={styles.warningBanner}>
                <AlertCircle size={20} color={THEME.colors.danger} />
                <Text style={styles.warningText}>{levelingPlan.warnings.join(' ')}</Text>
              </View>
            )}

            {/* Block Instructions */}
            {levelingPlan && !isCalculating && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Block Instructions</Text>

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
              <Text style={styles.loadingText}>Calculating leveling plan...</Text>
            </View>
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
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
    color: THEME.colors.success,
  },
  statusSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  // Vehicle Diagram
  diagramContainer: {
    alignItems: 'center',
    gap: 12,
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    alignSelf: 'flex-start',
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
    color: THEME.colors.textMuted,
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
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  compactReadingText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  compactReadingDivider: {
    fontSize: 12,
    color: THEME.colors.textMuted,
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
    color: THEME.colors.danger,
    lineHeight: 20,
  },
  // Instructions Section
  instructionsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    color: THEME.colors.textMuted,
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
    color: THEME.colors.success,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  blockItemText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
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
    color: THEME.colors.textMuted,
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
    color: THEME.colors.warning,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
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
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  noProfileDescription: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  noProfileSubtext: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  noProfileButtonContainer: {
    marginTop: 32,
    width: '100%',
  },
  bottomSpacer: {
    height: 100, // Extra space for bottom tab bar
  },
});

export default LevelingAssistant;
