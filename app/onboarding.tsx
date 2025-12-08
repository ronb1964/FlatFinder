import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRight,
  ArrowLeft,
  Target,
  AlertTriangle,
  Zap,
  CheckCircle,
  Ruler,
  Package,
  Trash2,
  Plus,
  Compass,
  Check,
  Caravan,
} from 'lucide-react-native';
import { MotorhomeIcon, VanIcon } from '../src/components/icons/VehicleIcons';
import { useAppStore } from '../src/state/appStore';
import { BlockInventory } from '../src/lib/rvLevelingMath';
import { createCalibration } from '../src/lib/levelingMath';
import { getTypicalMeasurements, convertToInches } from '../src/lib/units';
import { THEME } from '../src/theme';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassButton } from '../src/components/ui/GlassButton';

// Icon container colors - subtle, matching the level screen style
const ICON_COLORS = {
  primary: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)' },
  success: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)' },
  warning: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.4)' },
  danger: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)' },
  purple: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)' },
  yellow: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 0.4)' },
};

// Glass-styled icon container
const IconBox = ({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'yellow';
}) => {
  const colors = ICON_COLORS[variant];
  return (
    <View style={[styles.iconBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* Top highlight for glass effect */}
      <View style={styles.iconBoxHighlight} />
      {children}
    </View>
  );
};

// Wrapper for Caravan to match custom icon interface
const TrailerIconWrapper = ({
  size = 24,
  color = '#a3a3a3',
}: {
  size?: number;
  color?: string;
}) => <Caravan size={size} color={color} />;

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    Icon: TrailerIconWrapper,
    iconSize: 32,
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    description: 'Self-contained with engine, drives itself',
    Icon: MotorhomeIcon,
    iconSize: 32,
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    description: 'Converted van or small RV',
    Icon: VanIcon,
    iconSize: 32,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [addInputKey, setAddInputKey] = useState(0); // Forces clean remount of input
  const { updateSettings, addProfile, setActiveProfile } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const blockInputRef = useRef<TextInput>(null);
  const newBlockHeightRef = useRef('');

  // Block inventory tracks quantity for each block height
  // Key is the block height in inches, value is quantity
  // Default blocks are 1", 2", 3", 4" (most common stackable sizes)
  const [setupData, setSetupData] = useState({
    measurementUnits: 'imperial' as 'imperial' | 'metric',
    vehicleType: '' as 'trailer' | 'motorhome' | 'van' | '',
    vehicleName: '',
    useCustomMeasurements: false, // Toggle for custom vs default measurements
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
    hasLevelingBlocks: true,
    blockQuantities: { 1: 4, 2: 4, 3: 2, 4: 2 } as Record<number, number>, // height -> quantity
    showAddBlockInput: false,
    newBlockHeight: '',
  });

  const typicalMeasurements = getTypicalMeasurements(setupData.measurementUnits);
  const selectedVehicleType = VEHICLE_TYPES.find((v) => v.id === setupData.vehicleType);

  // Track keyboard visibility to hide navigation when keyboard is shown
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      // When keyboard hides on blocks step with add input showing, scroll to bottom
      // so the Add button stays visible
      if (currentStep === 6 && setupData.showAddBlockInput) {
        globalThis.setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [currentStep, setupData.showAddBlockInput]);

  const STEPS = [
    { title: 'Welcome', component: renderWelcomeStep },
    { title: 'How It Works', component: renderHowItWorksStep },
    { title: 'Safety First', component: renderSafetyStep },
    { title: 'Choose Units', component: renderUnitsStep },
    { title: 'Your Vehicle', component: renderVehicleStep },
    { title: 'Vehicle Details', component: renderVehicleDetailsStep },
    { title: 'Leveling Blocks', component: renderBlocksStep },
    { title: 'Ready to Level', component: renderCompletionStep },
  ];

  const currentStepData = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep === 4 && setupData.vehicleType) {
      const typical =
        typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
      if (typical) {
        setSetupData((prev) => ({
          ...prev,
          wheelbaseInches: convertToInches(typical.wheelbase, setupData.measurementUnits),
          trackWidthInches: convertToInches(typical.track, setupData.measurementUnits),
          hitchOffsetInches: convertToInches(typical.hitch || 0, setupData.measurementUnits),
        }));
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Reset scroll position when moving to next screen
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Reset scroll position when going back
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const completeOnboarding = () => {
    let blockInventory: BlockInventory[] = [];

    if (setupData.hasLevelingBlocks) {
      // Convert blockQuantities object to BlockInventory array
      // Filter out blocks with 0 quantity
      Object.entries(setupData.blockQuantities).forEach(([height, quantity]) => {
        if (quantity > 0) {
          blockInventory.push({
            thickness: parseFloat(height),
            quantity: quantity,
          });
        }
      });

      // Sort by thickness descending (largest first) for the algorithm
      blockInventory.sort((a, b) => b.thickness - a.thickness);
    }

    addProfile({
      name: setupData.vehicleName || `My ${selectedVehicleType?.name || 'Vehicle'}`,
      type: setupData.vehicleType as 'trailer' | 'motorhome' | 'van',
      wheelbaseInches: setupData.wheelbaseInches,
      trackWidthInches: setupData.trackWidthInches,
      hitchOffsetInches:
        setupData.vehicleType === 'trailer' ? setupData.hitchOffsetInches : undefined,
      blockInventory,
      calibration: createCalibration(),
    });

    updateSettings({
      hasCompletedOnboarding: true,
      onboardingStep: STEPS.length,
      measurementUnits: setupData.measurementUnits,
    });

    globalThis.setTimeout(() => {
      const state = useAppStore.getState();
      if (state.profiles.length > 0) {
        setActiveProfile(state.profiles[state.profiles.length - 1].id);
      }
    }, 100);

    router.replace('/(tabs)');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 3:
        return !!setupData.measurementUnits;
      case 4:
        return !!setupData.vehicleType;
      case 5:
        return !!setupData.vehicleName.trim();
      case 6: {
        if (!setupData.hasLevelingBlocks) return true;
        // Check if at least one block type has quantity > 0
        return Object.values(setupData.blockQuantities).some((qty) => qty > 0);
      }
      default:
        return true;
    }
  };

  function renderWelcomeStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="primary">
          <Target size={36} color="#3b82f6" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Welcome to FlatFinder!</Text>
          <Text style={styles.stepSubtitle}>Your Professional RV Leveling Assistant</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>
              FlatFinder transforms your phone into a precision leveling tool for RVs, trailers, and
              motorhomes.
            </Text>
            <Text style={styles.cardText}>
              Whether you&apos;re a weekend warrior or full-time RVer, proper leveling is essential
              for:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>Comfort - Sleep better on a level bed</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>
                  Safety - Prevent items from sliding or falling
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>
                  Appliance protection - Refrigerators need to be level
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>Stability - Reduce rocking and swaying</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderHowItWorksStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="yellow">
          <Compass size={36} color="#eab308" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>How Leveling Works</Text>
          <Text style={styles.stepSubtitle}>Understanding Pitch and Roll</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>Your RV can be unlevel in two directions:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>PITCH: Front-to-back (nose up/down)</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>ROLL: Side-to-side (left/right high)</Text>
              </View>
            </View>
            <Text style={styles.cardText}>
              FlatFinder measures both angles using your phone&apos;s built-in motion sensors.
            </Text>
            <Text style={styles.cardText}>
              The goal is to get both pitch and roll as close to 0° as possible. Most RV appliances
              work fine within ±1° of level.
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderSafetyStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="danger">
          <AlertTriangle size={36} color="#ef4444" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Safety First</Text>
          <Text style={styles.stepSubtitle}>Important Guidelines</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>Before you start leveling:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>Choose the most level spot available</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>Avoid slopes greater than 8° in any direction</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>
                  Ensure your RV is stable and chocks are in place
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>Never level on soft or unstable ground</Text>
              </View>
            </View>
            <Text style={styles.cardText}>
              FlatFinder will warn you if angles become unsafe during leveling.
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderUnitsStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="purple">
          <Ruler size={36} color="#a855f7" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Choose Your Units</Text>
          <Text style={styles.stepSubtitle}>Imperial or Metric Measurements</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>
              Choose your preferred measurement system. You can change this later in Settings.
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  setupData.measurementUnits === 'imperial' && styles.optionCardSelected,
                ]}
                onPress={() => setSetupData((prev) => ({ ...prev, measurementUnits: 'imperial' }))}
              >
                {/* Glass highlight */}
                <View style={styles.optionCardHighlight} />
                <View style={styles.optionRow}>
                  <View
                    style={[
                      styles.radio,
                      setupData.measurementUnits === 'imperial' && styles.radioSelected,
                    ]}
                  >
                    {setupData.measurementUnits === 'imperial' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Imperial</Text>
                    <Text style={styles.optionDescription}>Inches, feet (US standard)</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  setupData.measurementUnits === 'metric' && styles.optionCardSelected,
                ]}
                onPress={() => setSetupData((prev) => ({ ...prev, measurementUnits: 'metric' }))}
              >
                {/* Glass highlight */}
                <View style={styles.optionCardHighlight} />
                <View style={styles.optionRow}>
                  <View
                    style={[
                      styles.radio,
                      setupData.measurementUnits === 'metric' && styles.radioSelected,
                    ]}
                  >
                    {setupData.measurementUnits === 'metric' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Metric</Text>
                    <Text style={styles.optionDescription}>
                      Centimeters, meters (International)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderVehicleStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="success">
          <Zap size={36} color="#22c55e" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Your Vehicle</Text>
          <Text style={styles.stepSubtitle}>What type of RV do you have?</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>
              This helps us provide accurate measurements and setup defaults for your vehicle type.
            </Text>

            <View style={styles.optionsContainer}>
              {VEHICLE_TYPES.map((vehicleType) => {
                const isSelected = setupData.vehicleType === vehicleType.id;
                const VehicleIcon = vehicleType.Icon;

                return (
                  <TouchableOpacity
                    key={vehicleType.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() =>
                      setSetupData((prev) => ({
                        ...prev,
                        vehicleType: vehicleType.id as 'trailer' | 'motorhome' | 'van',
                      }))
                    }
                  >
                    {/* Glass highlight */}
                    <View style={styles.optionCardHighlight} />
                    <View style={styles.vehicleOptionRow}>
                      <View
                        style={[
                          styles.vehicleIconContainer,
                          isSelected && styles.vehicleIconContainerSelected,
                        ]}
                      >
                        <VehicleIcon
                          size={vehicleType.iconSize}
                          color={isSelected ? '#fff' : '#a3a3a3'}
                        />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{vehicleType.name}</Text>
                        <Text style={styles.optionDescription}>{vehicleType.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderVehicleDetailsStep() {
    const typical = typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
    const unitLabel = setupData.measurementUnits === 'imperial' ? 'inches' : 'cm';

    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.stepContent}>
          <IconBox variant="purple">
            {selectedVehicleType && <selectedVehicleType.Icon size={36} color="#a855f7" />}
          </IconBox>

          <View style={styles.titleContainer}>
            <Text style={styles.stepTitle}>Vehicle Details</Text>
            <Text style={styles.stepSubtitle}>Tell us about your {selectedVehicleType?.name}</Text>
          </View>

          <GlassCard variant="default">
            <View style={styles.cardContent}>
              {/* Vehicle Name Input */}
              <View style={styles.vehicleNameContainer}>
                <View style={styles.vehicleNameHeader}>
                  <Text style={styles.vehicleNameLabel}>Vehicle Name</Text>
                  <Text style={styles.requiredBadge}>*</Text>
                </View>
                <TextInput
                  style={styles.vehicleNameInput}
                  placeholder={`e.g., "Big Blue"`}
                  placeholderTextColor="#737373"
                  value={setupData.vehicleName}
                  onChangeText={(text) => setSetupData((prev) => ({ ...prev, vehicleName: text }))}
                  selectTextOnFocus={true}
                  autoFocus={true}
                />
              </View>

              {/* Measurements Section */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardContent}>
                  <View style={styles.blockHeaderRow}>
                    <Ruler size={20} color="#a855f7" />
                    <Text style={styles.infoCardTitle}>Vehicle Measurements</Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Switch
                      value={setupData.useCustomMeasurements}
                      onValueChange={(checked) =>
                        setSetupData((prev) => ({ ...prev, useCustomMeasurements: checked }))
                      }
                      trackColor={{ false: '#555', true: '#a855f7' }}
                      thumbColor="#fff"
                    />
                    <Text style={styles.switchLabel}>I know my exact measurements</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {setupData.useCustomMeasurements
                      ? 'Enter your vehicle measurements below for more accurate leveling calculations.'
                      : `We'll use typical measurements for a ${selectedVehicleType?.name}. You can adjust these later in Profiles.`}
                  </Text>
                </View>
              </View>

              {/* Default Measurements Display */}
              {!setupData.useCustomMeasurements && typical && (
                <View style={styles.measurementsSummary}>
                  <Text style={styles.measurementsSummaryTitle}>Default measurements:</Text>
                  <View style={styles.measurementsList}>
                    {/* Wheelbase - only for motorhomes/vans (vehicles with 2 axles) */}
                    {setupData.vehicleType !== 'trailer' && (
                      <View style={styles.measurementItem}>
                        <Text style={styles.measurementLabel}>
                          {'\u2022'} Wheelbase:{' '}
                          {setupData.measurementUnits === 'imperial'
                            ? `${convertToInches(typical.wheelbase, setupData.measurementUnits)}"`
                            : `${typical.wheelbase} cm`}
                        </Text>
                        <Text style={styles.measurementHint}>
                          Distance between front and rear axles
                        </Text>
                      </View>
                    )}
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>
                        {'\u2022'} Track Width:{' '}
                        {setupData.measurementUnits === 'imperial'
                          ? `${convertToInches(typical.track, setupData.measurementUnits)}"`
                          : `${typical.track} cm`}
                      </Text>
                      <Text style={styles.measurementHint}>
                        Distance between left and right wheels
                      </Text>
                    </View>
                    {/* Hitch Offset - only for trailers (single axle + tongue jack) */}
                    {setupData.vehicleType === 'trailer' && typical.hitch && (
                      <View style={styles.measurementItem}>
                        <Text style={styles.measurementLabel}>
                          {'\u2022'} Hitch Offset:{' '}
                          {setupData.measurementUnits === 'imperial'
                            ? `${convertToInches(typical.hitch, setupData.measurementUnits)}"`
                            : `${typical.hitch} cm`}
                        </Text>
                        <Text style={styles.measurementHint}>
                          Distance from rear axle center to hitch ball
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Custom Measurements Input */}
              {setupData.useCustomMeasurements && (
                <View style={styles.customMeasurementsContainer}>
                  {/* Wheelbase - only for motorhomes/vans (vehicles with 2 axles) */}
                  {setupData.vehicleType !== 'trailer' && (
                    <View style={styles.measurementInputRow}>
                      <View style={styles.measurementInputContainer}>
                        <Text style={styles.inputLabel}>Wheelbase ({unitLabel})</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={typical ? String(typical.wheelbase) : '240'}
                          placeholderTextColor="#737373"
                          keyboardType="decimal-pad"
                          value={String(
                            setupData.measurementUnits === 'imperial'
                              ? setupData.wheelbaseInches
                              : Math.round(setupData.wheelbaseInches * 2.54)
                          )}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            const inches =
                              setupData.measurementUnits === 'imperial' ? value : value / 2.54;
                            setSetupData((prev) => ({ ...prev, wheelbaseInches: inches }));
                          }}
                          onFocus={() => {
                            globalThis.setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 300);
                          }}
                          selectTextOnFocus={true}
                        />
                        <Text style={styles.inputHint}>Distance between front and rear axles</Text>
                      </View>
                    </View>
                  )}

                  {/* Track Width */}
                  <View style={styles.measurementInputRow}>
                    <View style={styles.measurementInputContainer}>
                      <Text style={styles.inputLabel}>Track Width ({unitLabel})</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={typical ? String(typical.track) : '96'}
                        placeholderTextColor="#737373"
                        keyboardType="decimal-pad"
                        value={String(
                          setupData.measurementUnits === 'imperial'
                            ? setupData.trackWidthInches
                            : Math.round(setupData.trackWidthInches * 2.54)
                        )}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          const inches =
                            setupData.measurementUnits === 'imperial' ? value : value / 2.54;
                          setSetupData((prev) => ({ ...prev, trackWidthInches: inches }));
                        }}
                        onFocus={() => {
                          globalThis.setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 300);
                        }}
                        selectTextOnFocus={true}
                      />
                      <Text style={styles.inputHint}>Distance between left and right wheels</Text>
                    </View>
                  </View>

                  {/* Hitch Offset (only for trailers) */}
                  {setupData.vehicleType === 'trailer' && (
                    <View style={styles.measurementInputRow}>
                      <View style={styles.measurementInputContainer}>
                        <Text style={styles.inputLabel}>Hitch Offset ({unitLabel})</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={typical?.hitch ? String(typical.hitch) : '120'}
                          placeholderTextColor="#737373"
                          keyboardType="decimal-pad"
                          value={String(
                            setupData.measurementUnits === 'imperial'
                              ? setupData.hitchOffsetInches
                              : Math.round(setupData.hitchOffsetInches * 2.54)
                          )}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            const inches =
                              setupData.measurementUnits === 'imperial' ? value : value / 2.54;
                            setSetupData((prev) => ({ ...prev, hitchOffsetInches: inches }));
                          }}
                          onFocus={() => {
                            globalThis.setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 300);
                          }}
                          selectTextOnFocus={true}
                        />
                        <Text style={styles.inputHint}>
                          Distance from rear axle center to hitch ball
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    );
  }

  // Helper function to update block quantity
  const updateBlockQuantity = useCallback((height: number, delta: number) => {
    setSetupData((prev) => {
      const currentQty = prev.blockQuantities[height] || 0;
      const newQty = Math.max(0, Math.min(20, currentQty + delta));
      return {
        ...prev,
        blockQuantities: {
          ...prev.blockQuantities,
          [height]: newQty,
        },
      };
    });
  }, []);

  // Delete a block size from inventory
  const deleteBlockSize = useCallback((height: number) => {
    setSetupData((prev) => {
      const newQuantities = { ...prev.blockQuantities };
      delete newQuantities[height];
      return {
        ...prev,
        blockQuantities: newQuantities,
      };
    });
  }, []);

  // Add a new block size to inventory
  const addBlockSize = () => {
    const heightStr = newBlockHeightRef.current.trim();

    if (!heightStr) return;

    let heightInches = parseFloat(heightStr);

    if (isNaN(heightInches) || heightInches <= 0) return;

    setSetupData((prev) => {
      // Convert to inches if metric
      let finalHeight = heightInches;
      if (prev.measurementUnits === 'metric') {
        finalHeight = heightInches / 2.54; // cm to inches
      }

      // Round to 1 decimal place for cleaner values
      finalHeight = Math.round(finalHeight * 10) / 10;

      // Don't add if already exists
      if (prev.blockQuantities[finalHeight] !== undefined) {
        return { ...prev, showAddBlockInput: false, newBlockHeight: '' };
      }

      // Clear the ref
      newBlockHeightRef.current = '';

      return {
        ...prev,
        blockQuantities: {
          ...prev.blockQuantities,
          [finalHeight]: 4, // Default quantity of 4
        },
        showAddBlockInput: false,
        newBlockHeight: '',
      };
    });
  };

  function renderBlocksStep() {
    // Get sorted block heights from current inventory
    const sortedHeights = Object.keys(setupData.blockQuantities)
      .map((h) => parseFloat(h))
      .sort((a, b) => a - b);

    // Calculate total blocks in inventory
    const totalBlocks = Object.values(setupData.blockQuantities).reduce((sum, qty) => sum + qty, 0);

    // Format height for display
    const formatHeight = (inches: number) => {
      if (setupData.measurementUnits === 'metric') {
        const cm = Math.round(inches * 2.54);
        return `${cm} cm`;
      }
      // Show as fraction if it's a common fraction, otherwise decimal
      if (inches === 0.5) return '½"';
      if (inches === 1.5) return '1½"';
      if (inches === 2.5) return '2½"';
      if (inches === 3.5) return '3½"';
      if (Number.isInteger(inches)) return `${inches}"`;
      return `${inches}"`;
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.stepContent}>
          <IconBox variant="success">
            <Package size={36} color="#22c55e" />
          </IconBox>

          <View style={styles.titleContainer}>
            <Text style={styles.stepTitle}>Leveling Blocks</Text>
            <Text style={styles.stepSubtitle}>Build your block inventory</Text>
          </View>

          <GlassCard variant="default">
            <View style={styles.cardContent}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardContent}>
                  <View style={styles.blockHeaderRow}>
                    <Package size={20} color="#3b82f6" />
                    <Text style={styles.infoCardTitle}>Block Inventory</Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Switch
                      value={setupData.hasLevelingBlocks}
                      onValueChange={(checked) =>
                        setSetupData((prev) => ({ ...prev, hasLevelingBlocks: checked }))
                      }
                      trackColor={{ false: '#555', true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                    <Text style={styles.switchLabel}>
                      {setupData.hasLevelingBlocks
                        ? 'I have leveling blocks'
                        : "I don't have leveling blocks"}
                    </Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {setupData.hasLevelingBlocks
                      ? "Tap the trash icon to remove sizes you don't have. Add custom sizes with the button below."
                      : 'No problem! The app will show you exact measurements instead.'}
                  </Text>
                </View>
              </View>

              {setupData.hasLevelingBlocks && (
                <View style={styles.blocksSection}>
                  <Text style={styles.blocksSectionTitle}>Your block sizes:</Text>

                  <View style={styles.optionsContainer}>
                    {sortedHeights.map((height) => {
                      const quantity = setupData.blockQuantities[height] || 0;
                      const hasBlocks = quantity > 0;

                      return (
                        <View
                          key={height}
                          style={[styles.blockOption, hasBlocks && styles.blockOptionSelected]}
                        >
                          <View style={styles.blockQuantityRow}>
                            <TouchableOpacity
                              style={styles.deleteBlockButton}
                              onPress={() => deleteBlockSize(height)}
                              activeOpacity={0.6}
                            >
                              <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                            <View style={styles.blockInfoSection}>
                              <Text style={styles.optionTitle}>{formatHeight(height)}</Text>
                            </View>
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={[
                                  styles.quantityButton,
                                  quantity === 0 && styles.quantityButtonDisabled,
                                ]}
                                onPress={() => updateBlockQuantity(height, -1)}
                                disabled={quantity === 0}
                                activeOpacity={0.6}
                                delayPressIn={0}
                              >
                                <Text style={styles.quantityButtonText}>−</Text>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.quantityValue,
                                  hasBlocks && styles.quantityValueActive,
                                ]}
                              >
                                {quantity}
                              </Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateBlockQuantity(height, 1)}
                                activeOpacity={0.6}
                                delayPressIn={0}
                              >
                                <Text style={styles.quantityButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {totalBlocks > 0 && (
                    <View style={styles.selectedBlocksCard}>
                      <Text style={styles.selectedBlocksText}>
                        ✓ Total inventory: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} (
                        {sortedHeights.length} size{sortedHeights.length !== 1 ? 's' : ''})
                      </Text>
                    </View>
                  )}

                  {/* Add Block Size Button/Input */}
                  {!setupData.showAddBlockInput ? (
                    <TouchableOpacity
                      style={styles.addBlockButton}
                      onPress={() => {
                        // Reset ref and increment key for clean state
                        newBlockHeightRef.current = '';
                        setAddInputKey((k) => k + 1);
                        setSetupData((prev) => ({ ...prev, showAddBlockInput: true }));
                      }}
                    >
                      <Plus size={20} color="#3b82f6" />
                      <Text style={styles.addBlockButtonText}>Add Block Size</Text>
                    </TouchableOpacity>
                  ) : (
                    <View key={addInputKey} style={styles.addBlockInputContainer}>
                      <Text style={styles.addBlockInputLabel}>
                        Enter height ({setupData.measurementUnits === 'imperial' ? 'inches' : 'cm'}
                        ):
                      </Text>
                      <TextInput
                        ref={blockInputRef}
                        style={styles.addBlockTextInput}
                        placeholder={
                          setupData.measurementUnits === 'imperial' ? 'e.g., 5' : 'e.g., 12'
                        }
                        placeholderTextColor="#737373"
                        keyboardType="decimal-pad"
                        defaultValue=""
                        onChangeText={(text) => {
                          newBlockHeightRef.current = text;
                        }}
                        onFocus={() => {
                          globalThis.setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 300);
                        }}
                        autoFocus
                        selectTextOnFocus={true}
                      />
                      <View style={styles.addBlockButtonRow}>
                        <GlassButton
                          variant="primary"
                          size="md"
                          style={{ flex: 1 }}
                          onPress={() => {
                            Keyboard.dismiss();
                            addBlockSize();
                          }}
                        >
                          Add
                        </GlassButton>
                        <GlassButton
                          variant="default"
                          size="md"
                          style={{ flex: 1 }}
                          onPress={() => {
                            Keyboard.dismiss();
                            newBlockHeightRef.current = '';
                            setSetupData((prev) => ({
                              ...prev,
                              showAddBlockInput: false,
                              newBlockHeight: '',
                            }));
                          }}
                        >
                          Cancel
                        </GlassButton>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    );
  }

  function renderCompletionStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="success">
          <CheckCircle size={36} color="#22c55e" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Ready to Level!</Text>
          <Text style={styles.stepSubtitle}>Your setup is complete</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>
              Perfect! We&apos;ve set up FlatFinder with your preferences:
            </Text>

            <View style={styles.summaryList}>
              <Text style={styles.summaryItem}>
                📱 <Text style={styles.summaryBold}>Units:</Text>{' '}
                {setupData.measurementUnits === 'imperial'
                  ? 'Imperial (inches/feet)'
                  : 'Metric (cm/meters)'}
              </Text>
              <Text style={styles.summaryItem}>
                🚐 <Text style={styles.summaryBold}>Vehicle:</Text>{' '}
                {setupData.vehicleName || `My ${selectedVehicleType?.name}`}
              </Text>
              <Text style={styles.summaryItem}>
                📦 <Text style={styles.summaryBold}>Blocks:</Text>{' '}
                {(() => {
                  if (!setupData.hasLevelingBlocks) return 'Measurement mode';
                  const totalBlocks = Object.values(setupData.blockQuantities).reduce(
                    (sum, qty) => sum + qty,
                    0
                  );
                  const sizes = Object.entries(setupData.blockQuantities).filter(
                    ([, qty]) => qty > 0
                  ).length;
                  return `${totalBlocks} blocks (${sizes} size${sizes !== 1 ? 's' : ''})`;
                })()}
              </Text>
            </View>

            <View style={styles.successCard}>
              <Text style={styles.successText}>
                You&apos;re all set! Tap &quot;Get Started&quot; to begin leveling.
              </Text>
            </View>

            <Text style={styles.settingsHint}>
              You can update these preferences anytime in Settings.
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.centeredContainer}>
          {/* Glass Card Container */}
          <View style={styles.glassCard}>
            {/* Top highlight for glass effect */}
            <View style={styles.glassCardHighlight} />

            {/* Progress Indicator */}
            {!keyboardVisible && (
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  {STEPS.map((_, index) => {
                    const isActive = index === currentStep;
                    const isComplete = index < currentStep;
                    const showLine = index < STEPS.length - 1;

                    return (
                      <View key={index} style={styles.progressDotWrapper}>
                        <View
                          style={[
                            styles.progressDot,
                            isComplete && styles.progressDotComplete,
                            isActive && styles.progressDotActive,
                          ]}
                        >
                          {isComplete && <Check size={10} color="#000" />}
                        </View>
                        {isActive && <View style={styles.progressDotGlow} />}
                        {showLine && (
                          <View
                            style={[styles.progressLine, isComplete && styles.progressLineComplete]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
                {/* Step indicator text */}
                <Text style={styles.stepIndicator}>
                  Step {currentStep + 1} of {STEPS.length}: {currentStepData.title}
                </Text>
              </View>
            )}

            {/* Content - scrollable area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
              <View style={styles.scrollContent}>{currentStepData.component()}</View>
            </ScrollView>

            {/* Navigation buttons - inside the card */}
            {!keyboardVisible && (
              <View style={styles.navigation}>
                <View style={styles.navButtonsColumn}>
                  <GlassButton
                    onPress={handleNext}
                    disabled={!canProceed()}
                    variant={canProceed() ? 'primary' : 'ghost'}
                    rightIcon={
                      currentStep < STEPS.length - 1 ? (
                        <ArrowRight size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
                      ) : (
                        <CheckCircle size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
                      )
                    }
                  >
                    {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
                  </GlassButton>

                  {currentStep > 0 && (
                    <GlassButton
                      variant="warning"
                      onPress={handleBack}
                      icon={<ArrowLeft size={20} color="#fff" />}
                    >
                      Back
                    </GlassButton>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  glassCard: {
    width: '100%',
    maxWidth: 420,
    flex: 1,
    maxHeight: '95%',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  glassCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSection: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  progressDotComplete: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  progressDotGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    opacity: 0.3,
    left: -5,
    top: -5,
  },
  progressLine: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 2,
  },
  progressLineComplete: {
    backgroundColor: THEME.colors.success,
  },
  stepIndicator: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  scrollContent: {
    gap: 12,
  },
  stepContent: {
    gap: 12,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 24,
    borderRadius: 16,
  },
  titleContainer: {
    gap: 4,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    padding: 24,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    width: '100%',
  },
  cardContent: {
    gap: 12,
  },
  cardText: {
    fontSize: 16,
    color: THEME.colors.text,
    textAlign: 'center',
  },
  bulletList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: THEME.colors.text,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 16,
    color: THEME.colors.text,
    flex: 1,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  optionCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: 'rgba(96, 165, 250, 0.6)',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
      },
    }),
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  vehicleOptionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconContainerSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  vehicleIconImage: {
    width: 28,
    height: 28,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontWeight: '600',
    color: THEME.colors.text,
  },
  textInput: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  // Vehicle Name Input
  vehicleNameContainer: {
    gap: 6,
  },
  vehicleNameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleNameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  requiredBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  vehicleNameInput: {
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  infoCard: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 12,
  },
  infoCardContent: {
    gap: 8,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  infoCardText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  measurementsSummary: {
    padding: 12,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  measurementsSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  measurementsSummaryText: {
    fontSize: 14,
    color: THEME.colors.text,
    lineHeight: 22,
  },
  measurementsList: {
    gap: 8,
  },
  measurementItem: {
    gap: 2,
  },
  measurementLabel: {
    fontSize: 14,
    color: THEME.colors.text,
  },
  measurementHint: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 14,
  },
  customMeasurementsContainer: {
    gap: 12,
  },
  measurementInputRow: {
    gap: 8,
  },
  measurementInputContainer: {
    gap: 8,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  switchLabel: {
    color: THEME.colors.text,
    flex: 1,
    flexWrap: 'wrap',
    fontSize: 14,
  },
  blocksSection: {
    gap: 16,
  },
  blocksSectionTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: THEME.colors.text,
  },
  blockOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blockOptionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: THEME.colors.success,
  },
  blockOptionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: THEME.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: THEME.colors.success,
    backgroundColor: THEME.colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedBlocksCard: {
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.success,
    borderRadius: 12,
  },
  selectedBlocksText: {
    color: THEME.colors.success,
    fontSize: 14,
    textAlign: 'center',
  },
  customBlockInput: {
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 12,
  },
  customBlockRow: {
    flexDirection: 'row',
    gap: 16,
  },
  customBlockHeightInput: {
    flex: 1,
    gap: 8,
  },
  customBlockQuantityInput: {
    gap: 8,
    alignItems: 'center',
  },
  blockQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockInfoSection: {
    flex: 1,
    gap: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quantityButtonText: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textSecondary,
    minWidth: 32,
    textAlign: 'center',
  },
  quantityValueActive: {
    color: THEME.colors.success,
  },
  // Delete block button
  deleteBlockButton: {
    padding: 8,
    marginRight: 8,
  },
  // Add block button and input
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  addBlockButtonText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  addBlockInputContainer: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    gap: 12,
  },
  addBlockInputLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  addBlockTextInput: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  addBlockButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addBlockConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    alignItems: 'center',
  },
  addBlockConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  addBlockCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  addBlockCancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  summaryList: {
    gap: 8,
  },
  summaryItem: {
    fontSize: 16,
    color: THEME.colors.text,
  },
  summaryBold: {
    fontWeight: 'bold',
  },
  successCard: {
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.success,
    borderRadius: 12,
  },
  successText: {
    color: THEME.colors.success,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  settingsHint: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  navigation: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonsColumn: {
    flexDirection: 'column',
    gap: 10,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: THEME.colors.secondary,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: THEME.colors.textSecondary,
  },

  // Glass-styled icon box
  iconBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconBoxHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Button content row
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
