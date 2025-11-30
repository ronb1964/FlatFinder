import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
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
  Car,
  Truck,
  Home,
  Ruler,
  Package,
} from 'lucide-react-native';
import { useAppStore } from '../src/state/appStore';
import { BlockInventory } from '../src/lib/rvLevelingMath';
import { createCalibration } from '../src/lib/levelingMath';
import { getTypicalMeasurements, getCommonBlockHeights, convertToInches } from '../src/lib/units';
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
};

// Simple icon container that matches the level screen's subtle style
const IconBox = ({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
}) => {
  const colors = ICON_COLORS[variant];
  return (
    <View style={[styles.iconBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {children}
    </View>
  );
};

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    Icon: Car,
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    description: 'Self-contained with engine, drives itself',
    Icon: Truck,
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    description: 'Converted van or small RV',
    Icon: Home,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateSettings, addProfile, setActiveProfile } = useAppStore();

  // Block inventory tracks quantity for each block height
  // Key is the block height in inches, value is quantity
  const [setupData, setSetupData] = useState({
    measurementUnits: 'imperial' as 'imperial' | 'metric',
    vehicleType: '' as 'trailer' | 'motorhome' | 'van' | '',
    vehicleName: '',
    useCustomMeasurements: false, // Toggle for custom vs default measurements
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
    hasLevelingBlocks: true,
    blockQuantities: { 2: 4, 4: 4 } as Record<number, number>, // height -> quantity
    customBlockHeight: '',
    customBlockQuantity: 4,
    showCustomBlockInput: false,
  });

  const typicalMeasurements = getTypicalMeasurements(setupData.measurementUnits);
  const selectedVehicleType = VEHICLE_TYPES.find((v) => v.id === setupData.vehicleType);

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
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

      // Add custom block if specified
      if (setupData.showCustomBlockInput && setupData.customBlockHeight.trim()) {
        const customHeight = convertToInches(
          parseFloat(setupData.customBlockHeight),
          setupData.measurementUnits
        );
        if (customHeight > 0 && setupData.customBlockQuantity > 0) {
          blockInventory.push({
            thickness: customHeight,
            quantity: setupData.customBlockQuantity,
          });
        }
      }

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

  const skipOnboarding = () => {
    updateSettings({
      hasCompletedOnboarding: true,
      onboardingStep: STEPS.length,
    });
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
        const hasStandardBlocks = Object.values(setupData.blockQuantities).some((qty) => qty > 0);
        const hasCustomBlock =
          setupData.showCustomBlockInput &&
          setupData.customBlockHeight.trim() !== '' &&
          !isNaN(parseFloat(setupData.customBlockHeight)) &&
          setupData.customBlockQuantity > 0;
        return hasStandardBlocks || hasCustomBlock;
      }
      default:
        return true;
    }
  };

  function renderWelcomeStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="primary">
          <Target size={48} color="#3b82f6" />
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
            <Text style={styles.bulletList}>
              {'\u2022'} Comfort - Sleep better on a level bed{'\n'}
              {'\u2022'} Safety - Prevent items from sliding or falling{'\n'}
              {'\u2022'} Appliance protection - Refrigerators need to be level{'\n'}
              {'\u2022'} Stability - Reduce rocking and swaying
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderHowItWorksStep() {
    return (
      <View style={styles.stepContent}>
        <IconBox variant="warning">
          <AlertTriangle size={48} color="#f97316" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>How Leveling Works</Text>
          <Text style={styles.stepSubtitle}>Understanding Pitch and Roll</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>Your RV can be unlevel in two directions:</Text>
            <Text style={styles.bulletList}>
              {'\u2022'} PITCH: Front-to-back (nose up/down){'\n'}
              {'\u2022'} ROLL: Side-to-side (left/right high)
            </Text>
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
          <AlertTriangle size={48} color="#ef4444" />
        </IconBox>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>Safety First</Text>
          <Text style={styles.stepSubtitle}>Important Guidelines</Text>
        </View>

        <GlassCard variant="default">
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>Before you start leveling:</Text>
            <Text style={styles.bulletList}>
              {'\u2022'} Choose the most level spot available{'\n'}
              {'\u2022'} Avoid slopes greater than 8° in any direction{'\n'}
              {'\u2022'} Ensure your RV is stable and chocks are in place{'\n'}
              {'\u2022'} Never level on soft or unstable ground
            </Text>
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
          <Ruler size={48} color="#a855f7" />
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
          <Zap size={48} color="#22c55e" />
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
                    <View style={styles.vehicleOptionRow}>
                      <View
                        style={[
                          styles.vehicleIconContainer,
                          isSelected && styles.vehicleIconContainerSelected,
                        ]}
                      >
                        <VehicleIcon size={32} color={isSelected ? '#fff' : '#a3a3a3'} />
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.stepContent}>
          <IconBox variant="purple">
            {selectedVehicleType && <selectedVehicleType.Icon size={48} color="#a855f7" />}
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
                  placeholder={`Enter a name (e.g., "Big Blue")`}
                  placeholderTextColor="#737373"
                  value={setupData.vehicleName}
                  onChangeText={(text) => setSetupData((prev) => ({ ...prev, vehicleName: text }))}
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
                  <Text style={styles.measurementsSummaryText}>
                    {'\u2022'} Wheelbase:{' '}
                    {setupData.measurementUnits === 'imperial'
                      ? `${convertToInches(typical.wheelbase, setupData.measurementUnits)}"`
                      : `${typical.wheelbase} cm`}
                    {'\n'}
                    {'\u2022'} Track Width:{' '}
                    {setupData.measurementUnits === 'imperial'
                      ? `${convertToInches(typical.track, setupData.measurementUnits)}"`
                      : `${typical.track} cm`}
                    {setupData.vehicleType === 'trailer' && typical.hitch
                      ? `\n\u2022 Hitch Offset: ${
                          setupData.measurementUnits === 'imperial'
                            ? `${convertToInches(typical.hitch, setupData.measurementUnits)}"`
                            : `${typical.hitch} cm`
                        }`
                      : ''}
                  </Text>
                </View>
              )}

              {/* Custom Measurements Input */}
              {setupData.useCustomMeasurements && (
                <View style={styles.customMeasurementsContainer}>
                  {/* Wheelbase */}
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
                      />
                      <Text style={styles.inputHint}>Distance between axles</Text>
                    </View>
                  </View>

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
                      />
                      <Text style={styles.inputHint}>Distance between wheels (side to side)</Text>
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
                        />
                        <Text style={styles.inputHint}>Distance from hitch to front axle</Text>
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

  // Track last tap time per button to prevent double-fires
  const lastTapTime = useRef<Record<string, number>>({});

  // Helper function to update block quantity with debounce to prevent double-fires
  const updateBlockQuantity = useCallback((height: number, delta: number) => {
    const key = `${height}_${delta}`;
    const now = Date.now();
    const lastTap = lastTapTime.current[key] || 0;

    // Ignore taps within 100ms of the last tap (prevents double-fire)
    if (now - lastTap < 100) {
      return;
    }
    lastTapTime.current[key] = now;

    // Direct state update - one tap = one increment
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

  function renderBlocksStep() {
    const blockHeights = getCommonBlockHeights(setupData.measurementUnits);

    // Calculate total blocks in inventory
    const totalBlocks =
      Object.values(setupData.blockQuantities).reduce((sum, qty) => sum + qty, 0) +
      (setupData.showCustomBlockInput ? setupData.customBlockQuantity : 0);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.stepContent}>
          <IconBox variant="success">
            <Package size={48} color="#22c55e" />
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
                    <Text style={styles.switchLabel}>I have leveling blocks</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {setupData.hasLevelingBlocks
                      ? 'Enter how many of each size block you have. This helps calculate the best leveling solution.'
                      : 'No problem! The app will show you exact measurements instead.'}
                  </Text>
                </View>
              </View>

              {setupData.hasLevelingBlocks && (
                <View style={styles.blocksSection}>
                  <Text style={styles.blocksSectionTitle}>How many blocks of each size?</Text>

                  <View style={styles.optionsContainer}>
                    {blockHeights.map((block) => {
                      const quantity = setupData.blockQuantities[block.value] || 0;
                      const hasBlocks = quantity > 0;

                      return (
                        <View
                          key={block.value}
                          style={[styles.blockOption, hasBlocks && styles.blockOptionSelected]}
                        >
                          <View style={styles.blockQuantityRow}>
                            <View style={styles.blockInfoSection}>
                              <Text style={styles.optionTitle}>{block.label}</Text>
                              <Text style={styles.optionDescription}>{block.description}</Text>
                            </View>
                            <View style={styles.quantityControls}>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.quantityButton,
                                  quantity === 0 && styles.quantityButtonDisabled,
                                  pressed && styles.quantityButtonPressed,
                                ]}
                                onPress={() => updateBlockQuantity(block.value, -1)}
                                disabled={quantity === 0}
                              >
                                <Text style={styles.quantityButtonText}>−</Text>
                              </Pressable>
                              <Text
                                style={[
                                  styles.quantityValue,
                                  hasBlocks && styles.quantityValueActive,
                                ]}
                              >
                                {quantity}
                              </Text>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.quantityButton,
                                  pressed && styles.quantityButtonPressed,
                                ]}
                                onPress={() => updateBlockQuantity(block.value, 1)}
                              >
                                <Text style={styles.quantityButtonText}>+</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {totalBlocks > 0 && (
                    <View style={styles.selectedBlocksCard}>
                      <Text style={styles.selectedBlocksText}>
                        ✓ Total inventory: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}

                  {/* Custom Block Option */}
                  <TouchableOpacity
                    style={[
                      styles.blockOption,
                      setupData.showCustomBlockInput && styles.blockOptionSelected,
                    ]}
                    onPress={() =>
                      setSetupData((prev) => ({
                        ...prev,
                        showCustomBlockInput: !prev.showCustomBlockInput,
                      }))
                    }
                  >
                    <View style={styles.blockOptionRow}>
                      <View
                        style={[
                          styles.checkbox,
                          setupData.showCustomBlockInput && styles.checkboxSelected,
                        ]}
                      >
                        {setupData.showCustomBlockInput && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>Custom Size</Text>
                        <Text style={styles.optionDescription}>
                          I have a different block height
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {setupData.showCustomBlockInput && (
                    <View style={styles.customBlockInput}>
                      <View style={styles.customBlockRow}>
                        <View style={styles.customBlockHeightInput}>
                          <Text style={styles.inputLabel}>
                            Height ({setupData.measurementUnits === 'imperial' ? 'in' : 'cm'})
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder={
                              setupData.measurementUnits === 'imperial' ? 'e.g., 3.5' : 'e.g., 8'
                            }
                            placeholderTextColor="#737373"
                            keyboardType="decimal-pad"
                            value={setupData.customBlockHeight}
                            onChangeText={(text) =>
                              setSetupData((prev) => ({ ...prev, customBlockHeight: text }))
                            }
                          />
                        </View>
                        <View style={styles.customBlockQuantityInput}>
                          <Text style={styles.inputLabel}>Quantity</Text>
                          <View style={styles.quantityControls}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.quantityButton,
                                setupData.customBlockQuantity === 0 &&
                                  styles.quantityButtonDisabled,
                                pressed && styles.quantityButtonPressed,
                              ]}
                              onPress={() =>
                                setSetupData((prev) => ({
                                  ...prev,
                                  customBlockQuantity: Math.max(0, prev.customBlockQuantity - 1),
                                }))
                              }
                              disabled={setupData.customBlockQuantity === 0}
                            >
                              <Text style={styles.quantityButtonText}>−</Text>
                            </Pressable>
                            <Text
                              style={[
                                styles.quantityValue,
                                setupData.customBlockQuantity > 0 && styles.quantityValueActive,
                              ]}
                            >
                              {setupData.customBlockQuantity}
                            </Text>
                            <Pressable
                              style={({ pressed }) => [
                                styles.quantityButton,
                                pressed && styles.quantityButtonPressed,
                              ]}
                              onPress={() =>
                                setSetupData((prev) => ({
                                  ...prev,
                                  customBlockQuantity: Math.min(20, prev.customBlockQuantity + 1),
                                }))
                              }
                            >
                              <Text style={styles.quantityButtonText}>+</Text>
                            </Pressable>
                          </View>
                        </View>
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
          <CheckCircle size={48} color="#22c55e" />
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
                  const totalBlocks =
                    Object.values(setupData.blockQuantities).reduce((sum, qty) => sum + qty, 0) +
                    (setupData.showCustomBlockInput ? setupData.customBlockQuantity : 0);
                  const sizes =
                    Object.entries(setupData.blockQuantities).filter(([_, qty]) => qty > 0).length +
                    (setupData.showCustomBlockInput && setupData.customBlockQuantity > 0 ? 1 : 0);
                  return `${totalBlocks} blocks (${sizes} size${sizes !== 1 ? 's' : ''})`;
                })()}
              </Text>
            </View>

            <View style={styles.successCard}>
              <Text style={styles.successText}>
                You&apos;re all set! Tap &quot;Get Started&quot; to begin leveling.
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Progress Indicator */}
        <View style={styles.progressRow}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, index <= currentStep && styles.progressDotActive]}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>{currentStepData.component()}</View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <View style={styles.navButtonsRow}>
            {currentStep > 0 && (
              <GlassButton variant="ghost" onPress={handleBack} style={styles.navButton}>
                <View style={styles.buttonContent}>
                  <ArrowLeft size={20} color="#a3a3a3" />
                  <Text style={styles.backButtonText}>Back</Text>
                </View>
              </GlassButton>
            )}

            <GlassButton
              onPress={handleNext}
              disabled={!canProceed()}
              variant={canProceed() ? 'primary' : 'ghost'}
              style={styles.navButton}
            >
              <View style={styles.buttonContent}>
                <Text
                  style={[styles.nextButtonText, !canProceed() && styles.nextButtonTextDisabled]}
                >
                  {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
                </Text>
                {currentStep < STEPS.length - 1 ? (
                  <ArrowRight size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
                ) : (
                  <CheckCircle size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
                )}
              </View>
            </GlassButton>
          </View>

          {/* Skip Option */}
          <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
            <Text style={styles.skipButtonText}>Skip Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* Step Counter */}
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {STEPS.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  mainContent: {
    flex: 1,
    padding: 12,
    gap: 16,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.secondary,
  },
  progressDotActive: {
    backgroundColor: THEME.colors.primary,
    // Glow effect for active dot
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 28,
  },
  stepContent: {
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 24,
    borderRadius: 16,
  },
  titleContainer: {
    gap: 8,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 18,
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
    fontSize: 16,
    color: THEME.colors.text,
    textAlign: 'left',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: THEME.colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: THEME.colors.secondary,
  },
  vehicleIconContainerSelected: {
    backgroundColor: THEME.colors.primary,
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
    backgroundColor: THEME.colors.secondary,
    borderRadius: 12,
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
    backgroundColor: THEME.colors.surface,
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
    gap: 8,
    alignItems: 'center',
  },
  switchLabel: {
    color: THEME.colors.text,
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
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
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
    backgroundColor: THEME.colors.secondary,
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
  navigation: {
    gap: 12,
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 12,
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
    color: THEME.colors.textSecondary,
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
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  stepCounter: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Simple icon box - matches level screen style
  iconBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Navigation button style
  navButton: {
    flex: 1,
  },

  // Button content row
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
