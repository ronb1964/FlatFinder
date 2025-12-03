import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { AlertCircle, ArrowLeft, Check, AlertTriangle } from 'lucide-react-native';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
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
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    if (isAnimating) {
      pulseValue.value = withRepeat(
        withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })),
        -1,
        false
      );
    } else {
      pulseValue.value = 0;
    }
  }, [isAnimating, pulseValue]);

  const colors = {
    ground: { fill: THEME.colors.success, glow: 'rgba(34, 197, 94, 0.6)' },
    solution: { fill: THEME.colors.primary, glow: 'rgba(59, 130, 246, 0.6)' },
    warning: { fill: THEME.colors.warning, glow: 'rgba(234, 179, 8, 0.6)' },
  };

  const color = colors[status];

  return (
    <G>
      {/* Outer glow */}
      <Circle cx={x} cy={y} r={18} fill={color.glow} opacity={0.3} />
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
    if (stack && stack.blocks.length > 0) return 'solution';
    return 'warning';
  };

  const isTrailer = type === 'trailer';

  if (isTrailer) {
    // Trailer diagram with tongue/hitch
    return (
      <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="0 0 320 192">
        <Defs>
          <RadialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </RadialGradient>
        </Defs>

        {/* Trailer body - stylized shape */}
        <Path
          d="M 60 40
             L 280 40
             Q 300 40 300 60
             L 300 140
             Q 300 160 280 160
             L 60 160
             Q 40 160 40 140
             L 40 60
             Q 40 40 60 40 Z"
          fill="url(#bodyGradient)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.5}
        />

        {/* Tongue/A-frame */}
        <Path
          d="M 40 90 L 10 96 L 40 102"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hitch ball connection */}
        <Circle
          cx={10}
          cy={96}
          r={6}
          fill="rgba(255,255,255,0.2)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
        />

        {/* Wheel wells */}
        <Ellipse cx={260} cy={160} rx={20} ry={8} fill="rgba(0,0,0,0.3)" />
        <Ellipse cx={260} cy={32} rx={20} ry={8} fill="rgba(0,0,0,0.3)" />

        {/* Window detail */}
        <Path
          d="M 100 55 L 180 55 Q 185 55 185 60 L 185 85 Q 185 90 180 90 L 100 90 Q 95 90 95 85 L 95 60 Q 95 55 100 55"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth={1}
        />

        {/* Wheel indicators */}
        <WheelIndicator
          x={260}
          y={45}
          status={getWheelStatus('front_left')}
          isAnimating={getWheelStatus('front_left') === 'warning'}
        />
        <WheelIndicator
          x={260}
          y={147}
          status={getWheelStatus('front_right')}
          isAnimating={getWheelStatus('front_right') === 'warning'}
        />
        <WheelIndicator
          x={10}
          y={96}
          status={getWheelStatus('hitch')}
          isAnimating={getWheelStatus('hitch') === 'warning'}
        />
      </Svg>
    );
  }

  // Motorhome/Van diagram - 4 wheels
  return (
    <Svg width={VEHICLE_WIDTH} height={VEHICLE_HEIGHT} viewBox="0 0 320 192">
      <Defs>
        <RadialGradient id="rvBodyGradient" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </RadialGradient>
      </Defs>

      {/* RV body */}
      <Path
        d="M 50 50
           L 280 50
           Q 300 50 300 70
           L 300 140
           Q 300 160 280 160
           L 50 160
           Q 30 160 30 140
           L 30 70
           Q 30 50 50 50 Z"
        fill="url(#rvBodyGradient)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />

      {/* Cab section */}
      <Path
        d="M 30 70
           L 15 85
           Q 10 90 10 100
           L 10 140
           Q 10 150 20 150
           L 30 150"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Front windshield */}
      <Path
        d="M 18 90 L 28 75 L 28 100 L 18 100 Z"
        fill="rgba(59, 130, 246, 0.15)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth={1}
      />

      {/* Side windows */}
      <Path
        d="M 80 60 L 140 60 Q 145 60 145 65 L 145 85 Q 145 90 140 90 L 80 90 Q 75 90 75 85 L 75 65 Q 75 60 80 60"
        fill="rgba(59, 130, 246, 0.1)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth={1}
      />
      <Path
        d="M 160 60 L 220 60 Q 225 60 225 65 L 225 85 Q 225 90 220 90 L 160 90 Q 155 90 155 85 L 155 65 Q 155 60 160 60"
        fill="rgba(59, 130, 246, 0.1)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth={1}
      />

      {/* Wheel wells */}
      <Ellipse cx={70} cy={160} rx={18} ry={7} fill="rgba(0,0,0,0.3)" />
      <Ellipse cx={70} cy={32} rx={18} ry={7} fill="rgba(0,0,0,0.3)" />
      <Ellipse cx={260} cy={160} rx={18} ry={7} fill="rgba(0,0,0,0.3)" />
      <Ellipse cx={260} cy={32} rx={18} ry={7} fill="rgba(0,0,0,0.3)" />

      {/* Wheel indicators - 4 corners */}
      <WheelIndicator
        x={70}
        y={45}
        status={getWheelStatus('front_left')}
        isAnimating={getWheelStatus('front_left') === 'warning'}
      />
      <WheelIndicator
        x={70}
        y={147}
        status={getWheelStatus('front_right')}
        isAnimating={getWheelStatus('front_right') === 'warning'}
      />
      <WheelIndicator
        x={260}
        y={45}
        status={getWheelStatus('rear_left')}
        isAnimating={getWheelStatus('rear_left') === 'warning'}
      />
      <WheelIndicator
        x={260}
        y={147}
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
  const status = isGround ? 'ground' : hasBlocks ? 'solution' : 'warning';

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
          <Text style={[styles.liftAmount, { color: colors.text }]}>
            +{formatMeasurement(lift.liftInches, units)}
          </Text>
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
                <Text style={styles.totalLabel}>Total:</Text>
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
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={THEME.colors.danger} />
        <Text style={styles.errorTitle}>No Vehicle Profile</Text>
        <Text style={styles.errorText}>Please set up a vehicle profile first.</Text>
        {onBack && (
          <Pressable style={styles.errorButton} onPress={onBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        )}
      </View>
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
              </View>
            </GlassCard>

            {/* Current Readings */}
            <GlassCard compact>
              <View style={styles.readingsContainer}>
                <View style={styles.readingItem}>
                  <Text style={styles.readingLabel}>Pitch</Text>
                  <Text style={styles.readingValue}>
                    {Math.abs(physicalReadings.pitchDegrees).toFixed(1)}°
                    <Text style={styles.readingDirection}>
                      {physicalReadings.pitchDegrees > 0.1
                        ? ' nose up'
                        : physicalReadings.pitchDegrees < -0.1
                          ? ' nose down'
                          : ''}
                    </Text>
                  </Text>
                </View>
                <View style={styles.readingDivider} />
                <View style={styles.readingItem}>
                  <Text style={styles.readingLabel}>Roll</Text>
                  <Text style={styles.readingValue}>
                    {Math.abs(physicalReadings.rollDegrees).toFixed(1)}°
                    <Text style={styles.readingDirection}>
                      {physicalReadings.rollDegrees > 0.1
                        ? ' right up'
                        : physicalReadings.rollDegrees < -0.1
                          ? ' left up'
                          : ''}
                    </Text>
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
    padding: 16,
    gap: 16,
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
  // Readings
  readingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingItem: {
    flex: 1,
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  readingDirection: {
    fontSize: 12,
    fontWeight: '400',
    color: THEME.colors.textSecondary,
  },
  readingDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    gap: 12,
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
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: THEME.colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 24,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: 24,
  },
});

export default LevelingAssistant;
