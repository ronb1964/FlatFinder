import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Check, Trash2, Plus, Caravan } from 'lucide-react-native';
import { MotorhomeIcon, VanIcon } from './icons/VehicleIcons';
import { GlassButton } from './ui/GlassButton';
import { GlassToggle } from './ui/GlassToggle';
import { StandardBlockSets, BlockInventory } from '../lib/rvLevelingMath';
import { useAppStore } from '../state/appStore';
import { getTypicalMeasurements, convertToInches, convertForDisplay } from '../lib/units';
import { THEME } from '../theme';

interface VehicleSetupWizardProps {
  onComplete: (profile: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => void;
  onCancel?: () => void;
  isVisible: boolean;
  editingProfile?: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  } | null;
  /** When true, hides cancel button and shows friendlier onboarding messages */
  isOnboarding?: boolean;
}

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

export function VehicleSetupWizard({
  onComplete,
  onCancel,
  isVisible,
  editingProfile,
  isOnboarding = false,
}: VehicleSetupWizardProps) {
  const { settings } = useAppStore();
  const [step, setStep] = useState(0);

  const typicalMeasurements = getTypicalMeasurements(settings.measurementUnits);

  const [profile, setProfile] = useState({
    name: editingProfile?.name || '',
    type: (editingProfile?.type || 'trailer') as 'trailer' | 'motorhome' | 'van',
    wheelbaseInches: editingProfile?.wheelbaseInches || 240,
    trackWidthInches: editingProfile?.trackWidthInches || 96,
    hitchOffsetInches: editingProfile?.hitchOffsetInches || 120,
    blockInventory: editingProfile?.blockInventory || StandardBlockSets.basic(),
  });
  const [useTypicalMeasurements, setUseTypicalMeasurements] = useState(true);
  const [hasLevelingBlocks, setHasLevelingBlocks] = useState(
    editingProfile?.blockInventory?.length ? editingProfile.blockInventory.length > 0 : true
  );

  // Convert block inventory array to quantities object (like ProfileEditor)
  const getInitialBlockQuantities = () => {
    const quantities: Record<number, number> = {};
    if (editingProfile?.blockInventory) {
      editingProfile.blockInventory.forEach((block) => {
        quantities[block.thickness] = block.quantity;
      });
    } else {
      // Default blocks for new profiles
      quantities[2] = 4;
      quantities[4] = 4;
    }
    return quantities;
  };
  const [blockQuantities, setBlockQuantities] =
    useState<Record<number, number>>(getInitialBlockQuantities);
  const [showAddBlockInput, setShowAddBlockInput] = useState(false);
  const [newBlockHeight, setNewBlockHeight] = useState('');

  useEffect(() => {
    if (isVisible) {
      setStep(0);
      setProfile({
        name: editingProfile?.name || '',
        type: (editingProfile?.type || 'trailer') as 'trailer' | 'motorhome' | 'van',
        wheelbaseInches: editingProfile?.wheelbaseInches || 240,
        trackWidthInches: editingProfile?.trackWidthInches || 96,
        hitchOffsetInches: editingProfile?.hitchOffsetInches || 120,
        blockInventory: editingProfile?.blockInventory || StandardBlockSets.basic(),
      });
      setHasLevelingBlocks(
        editingProfile?.blockInventory?.length ? editingProfile.blockInventory.length > 0 : true
      );
      // Reset block quantities from editing profile or defaults
      const quantities: Record<number, number> = {};
      if (editingProfile?.blockInventory) {
        editingProfile.blockInventory.forEach((block) => {
          quantities[block.thickness] = block.quantity;
        });
      } else {
        quantities[2] = 4;
        quantities[4] = 4;
      }
      setBlockQuantities(quantities);
      setShowAddBlockInput(false);
      setNewBlockHeight('');
    }
  }, [editingProfile, isVisible]);

  const selectedVehicleType = VEHICLE_TYPES.find((v) => v.id === profile.type);

  // Block management functions (matching ProfileEditor)
  const updateBlockQuantity = useCallback((height: number, delta: number) => {
    setBlockQuantities((prev) => {
      const currentQty = prev[height] || 0;
      const newQty = Math.max(0, Math.min(20, currentQty + delta));
      return { ...prev, [height]: newQty };
    });
  }, []);

  const deleteBlockSize = useCallback((height: number) => {
    setBlockQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[height];
      return newQuantities;
    });
  }, []);

  const addBlockSize = useCallback(() => {
    const heightStr = newBlockHeight.trim();
    if (!heightStr) return;

    let heightInches = parseFloat(heightStr);
    if (isNaN(heightInches) || heightInches <= 0) return;

    if (settings.measurementUnits === 'metric') {
      heightInches = heightInches / 2.54;
    }

    heightInches = Math.round(heightInches * 10) / 10;

    if (blockQuantities[heightInches] !== undefined) return;

    setBlockQuantities((prev) => ({
      ...prev,
      [heightInches]: 4,
    }));
    setShowAddBlockInput(false);
    setNewBlockHeight('');
  }, [newBlockHeight, settings.measurementUnits, blockQuantities]);

  const formatHeight = (inches: number) => {
    if (settings.measurementUnits === 'metric') {
      const cm = Math.round(inches * 2.54);
      return `${cm} cm`;
    }
    if (inches === 0.5) return '½"';
    if (inches === 0.25) return '0.25"';
    if (inches === 1.5) return '1½"';
    if (inches === 2.5) return '2½"';
    if (inches === 3.5) return '3½"';
    if (Number.isInteger(inches)) return `${inches}"`;
    return `${inches}"`;
  };

  const handleNext = () => {
    if (step === 0 && selectedVehicleType && !editingProfile) {
      const typical = typicalMeasurements[profile.type];
      if (typical) {
        setProfile((prev) => ({
          ...prev,
          wheelbaseInches: convertToInches(typical.wheelbase, settings.measurementUnits),
          trackWidthInches: convertToInches(typical.track, settings.measurementUnits),
          hitchOffsetInches: convertToInches(typical.hitch || 0, settings.measurementUnits),
        }));
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = () => {
    try {
      // Convert blockQuantities back to BlockInventory array (matching ProfileEditor)
      const blockInventory: BlockInventory[] = hasLevelingBlocks
        ? Object.entries(blockQuantities)
            .filter(([, qty]) => qty > 0)
            .map(([height, quantity]) => ({
              thickness: parseFloat(height),
              quantity,
            }))
            .sort((a, b) => a.thickness - b.thickness)
        : [];

      const profileData = {
        ...profile,
        hitchOffsetInches: profile.type === 'trailer' ? profile.hitchOffsetInches : undefined,
        blockInventory,
      };

      onComplete(profileData);
    } catch (error) {
      console.error('VehicleSetupWizard - Error during completion:', error);
    }
  };

  const renderVehicleTypeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {isOnboarding ? 'What type of RV do you have?' : 'What type of vehicle do you have?'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isOnboarding
            ? "We'll customize everything to fit your setup perfectly."
            : 'This helps us set up realistic measurements for your vehicle.'}
        </Text>
      </View>

      <View style={styles.optionsList}>
        {VEHICLE_TYPES.map((vehicleType) => {
          const isSelected = profile.type === vehicleType.id;
          const VehicleIcon = vehicleType.Icon;

          return (
            <TouchableOpacity
              key={vehicleType.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => {
                setProfile((prev) => {
                  const newType = vehicleType.id as 'trailer' | 'motorhome' | 'van';
                  const newProfile = { ...prev, type: newType };

                  if (useTypicalMeasurements) {
                    const typical = typicalMeasurements[newType];
                    if (typical) {
                      return {
                        ...newProfile,
                        wheelbaseInches: convertToInches(
                          typical.wheelbase,
                          settings.measurementUnits
                        ),
                        trackWidthInches: convertToInches(typical.track, settings.measurementUnits),
                        hitchOffsetInches: convertToInches(
                          typical.hitch || 0,
                          settings.measurementUnits
                        ),
                      };
                    }
                  }

                  return newProfile;
                });
              }}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <VehicleIcon
                  size={vehicleType.iconSize}
                  color={isSelected ? THEME.colors.primary : '#a3a3a3'}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{vehicleType.name}</Text>
                <Text style={styles.optionDescription}>{vehicleType.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {isOnboarding ? 'What do you call it?' : `Give your ${selectedVehicleType?.name} a name`}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isOnboarding
            ? 'Give your RV a nickname - something fun and memorable!'
            : 'This helps you identify it if you have multiple vehicles.'}
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Vehicle Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder={`My ${selectedVehicleType?.name}`}
          placeholderTextColor="#737373"
          value={profile.name}
          onChangeText={(text) => setProfile((prev) => ({ ...prev, name: text }))}
          selectTextOnFocus={true}
          autoFocus={true}
        />
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>{isOnboarding ? 'Ideas:' : 'Naming Tips:'}</Text>
          <Text style={styles.tipText}>
            {'\u2022'} Use something memorable and descriptive{'\n'}
            {'\u2022'} Consider color, size, or brand (e.g., &quot;Big Blue&quot;, &quot;Little
            Winnebago&quot;){'\n'}
            {'\u2022'} Helpful if you have multiple RVs or share the app
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMeasurementsStep = () => {
    const typical = typicalMeasurements[profile.type];

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>
              {isOnboarding ? 'Quick Measurements' : 'Vehicle Measurements'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isOnboarding
                ? "Don't worry - typical values work great! You can fine-tune later."
                : 'We need a few measurements to calculate leveling accurately.'}
            </Text>
          </View>

          {/* Measurement Type Selection */}
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[styles.radioOption, useTypicalMeasurements && styles.radioOptionSelected]}
              onPress={() => {
                setUseTypicalMeasurements(true);
                if (typical) {
                  setProfile((prev) => ({
                    ...prev,
                    wheelbaseInches: convertToInches(typical.wheelbase, settings.measurementUnits),
                    trackWidthInches: convertToInches(typical.track, settings.measurementUnits),
                    hitchOffsetInches: convertToInches(
                      typical.hitch || 0,
                      settings.measurementUnits
                    ),
                  }));
                }
              }}
            >
              <View
                style={[styles.radioCircle, useTypicalMeasurements && styles.radioCircleSelected]}
              >
                {useTypicalMeasurements && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Use Typical Values</Text>
                <Text style={styles.radioSubtitle}>Quick setup with standard measurements</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioOption, !useTypicalMeasurements && styles.radioOptionSelected]}
              onPress={() => setUseTypicalMeasurements(false)}
            >
              <View
                style={[styles.radioCircle, !useTypicalMeasurements && styles.radioCircleSelected]}
              >
                {!useTypicalMeasurements && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Enter Custom Values</Text>
                <Text style={styles.radioSubtitle}>Most accurate for your specific vehicle</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Wheelbase - only for motorhomes and vans (not trailers) */}
          {profile.type !== 'trailer' && (
            <View style={styles.measurementSection}>
              <Text style={[styles.measurementLabel, { color: THEME.colors.primary }]}>
                Wheelbase Length ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>
              {useTypicalMeasurements ? (
                <View style={styles.measurementDisplay}>
                  <Text style={styles.measurementValue}>
                    {settings.measurementUnits === 'metric'
                      ? `${Math.round(profile.wheelbaseInches * 2.54)} cm`
                      : `${profile.wheelbaseInches}"`}
                  </Text>
                  <Text style={styles.measurementHint}>
                    Standard for {selectedVehicleType?.name}
                  </Text>
                </View>
              ) : (
                <View>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`e.g., ${convertForDisplay(240, settings.measurementUnits)}`}
                    placeholderTextColor="#737373"
                    value={convertForDisplay(
                      profile.wheelbaseInches,
                      settings.measurementUnits
                    ).toString()}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      setProfile((prev) => ({
                        ...prev,
                        wheelbaseInches: convertToInches(num, settings.measurementUnits),
                      }));
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus={true}
                  />
                  <Text style={styles.inputHint}>
                    Measure center-to-center between front and rear axles
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Track Width */}
          <View style={styles.measurementSection}>
            <Text style={[styles.measurementLabel, { color: '#22c55e' }]}>
              Track Width ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
            </Text>
            {useTypicalMeasurements ? (
              <View style={styles.measurementDisplay}>
                <Text style={styles.measurementValue}>
                  {settings.measurementUnits === 'metric'
                    ? `${Math.round(profile.trackWidthInches * 2.54)} cm`
                    : `${profile.trackWidthInches}"`}
                </Text>
                <Text style={styles.measurementHint}>Standard for {selectedVehicleType?.name}</Text>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholder={`e.g., ${convertForDisplay(96, settings.measurementUnits)}`}
                  placeholderTextColor="#737373"
                  value={convertForDisplay(
                    profile.trackWidthInches,
                    settings.measurementUnits
                  ).toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setProfile((prev) => ({
                      ...prev,
                      trackWidthInches: convertToInches(num, settings.measurementUnits),
                    }));
                  }}
                  keyboardType="decimal-pad"
                  selectTextOnFocus={true}
                />
                <Text style={styles.inputHint}>
                  Measure center-to-center between left and right wheels
                </Text>
              </View>
            )}
          </View>

          {/* Hitch Offset (only for trailers) */}
          {profile.type === 'trailer' && (
            <View style={styles.measurementSection}>
              <Text style={[styles.measurementLabel, { color: '#f97316' }]}>
                Hitch Offset ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>
              {useTypicalMeasurements ? (
                <View style={styles.measurementDisplay}>
                  <Text style={styles.measurementValue}>
                    {settings.measurementUnits === 'metric'
                      ? `${Math.round(profile.hitchOffsetInches * 2.54)} cm`
                      : `${profile.hitchOffsetInches}"`}
                  </Text>
                  <Text style={styles.measurementHint}>Standard for travel trailers</Text>
                </View>
              ) : (
                <View>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`e.g., ${convertForDisplay(120, settings.measurementUnits)}`}
                    placeholderTextColor="#737373"
                    value={convertForDisplay(
                      profile.hitchOffsetInches,
                      settings.measurementUnits
                    ).toString()}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      setProfile((prev) => ({
                        ...prev,
                        hitchOffsetInches: convertToInches(num, settings.measurementUnits),
                      }));
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus={true}
                  />
                  <Text style={styles.inputHint}>Measure from rear axle center to hitch ball</Text>
                </View>
              )}
            </View>
          )}

          {/* Help section */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              {useTypicalMeasurements ? 'Using Standard Values' : 'Measurement Tips'}
            </Text>
            <Text style={styles.infoText}>
              {useTypicalMeasurements
                ? 'These are typical values for your vehicle type. You can always adjust them later in your profile settings if needed.'
                : "Don't have a tape measure? Check your owner's manual or RV specifications. You can also update these later."}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderBlocksStep = () => {
    // Get sorted heights from blockQuantities
    const sortedHeights = Object.keys(blockQuantities)
      .map((h) => parseFloat(h))
      .sort((a, b) => a - b);

    const totalBlocks = Object.values(blockQuantities).reduce((sum, qty) => sum + qty, 0);

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>
              {isOnboarding ? 'Almost Done!' : 'Leveling Blocks'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isOnboarding
                ? 'Do you have leveling blocks? They help get your RV perfectly level.'
                : `Do you have leveling blocks to help level your ${selectedVehicleType?.name}?`}
            </Text>
          </View>

          {/* Toggle for having blocks */}
          <View style={styles.switchSection}>
            <View style={styles.switchRow}>
              <GlassToggle value={hasLevelingBlocks} onValueChange={setHasLevelingBlocks} />
              <Text style={styles.switchText}>
                {hasLevelingBlocks ? 'I have leveling blocks' : "I don't have leveling blocks"}
              </Text>
            </View>
          </View>

          {/* Block inventory section if they have blocks */}
          {hasLevelingBlocks && (
            <View style={styles.blocksSection}>
              {sortedHeights.length > 0 ? (
                <View style={styles.blocksList}>
                  {sortedHeights.map((height) => {
                    const quantity = blockQuantities[height] || 0;
                    const hasBlocks = quantity > 0;

                    return (
                      <View
                        key={height}
                        style={[styles.blockItem, hasBlocks && styles.blockItemActive]}
                      >
                        <TouchableOpacity
                          style={styles.deleteBlockButton}
                          onPress={() => deleteBlockSize(height)}
                          activeOpacity={0.6}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={styles.blockHeight}>{formatHeight(height)}</Text>
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
                            style={[styles.quantityValue, hasBlocks && styles.quantityValueActive]}
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
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noBlocksText}>
                  No block sizes added. Tap below to add some.
                </Text>
              )}

              {totalBlocks > 0 && (
                <View style={styles.totalBlocksCard}>
                  <Text style={styles.totalBlocksText}>
                    Total: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} ({sortedHeights.length}{' '}
                    size{sortedHeights.length !== 1 ? 's' : ''})
                  </Text>
                </View>
              )}

              {/* Add Block Size */}
              {!showAddBlockInput ? (
                <TouchableOpacity
                  style={styles.addBlockButton}
                  onPress={() => setShowAddBlockInput(true)}
                >
                  <Plus size={18} color={THEME.colors.primary} />
                  <Text style={styles.addBlockButtonText}>Add Block Size</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addBlockInputContainer}>
                  <View style={styles.addBlockInputGroup}>
                    <Text style={styles.addBlockLabel}>
                      Height ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'}):
                    </Text>
                    <View style={styles.addBlockInputRow}>
                      <TextInput
                        style={styles.addBlockInput}
                        placeholder="e.g., 2"
                        placeholderTextColor="#737373"
                        keyboardType="decimal-pad"
                        value={newBlockHeight}
                        onChangeText={setNewBlockHeight}
                        autoFocus
                        selectTextOnFocus={true}
                      />
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onPress={addBlockSize}
                        style={styles.addBlockActionButton}
                      >
                        Add
                      </GlassButton>
                      <GlassButton
                        variant="danger"
                        size="sm"
                        onPress={() => {
                          setShowAddBlockInput(false);
                          setNewBlockHeight('');
                        }}
                        style={styles.addBlockActionButton}
                      >
                        Cancel
                      </GlassButton>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Don&apos;t worry if you&apos;re not sure about your block heights. You can always
              update this later in your vehicle profile settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const STEPS = [
    { title: 'Vehicle Type', component: renderVehicleTypeStep },
    { title: 'Vehicle Name', component: renderNameStep },
    { title: 'Measurements', component: renderMeasurementsStep },
    { title: 'Leveling Blocks', component: renderBlocksStep },
  ];

  const currentStepData = STEPS[step];
  // Check if user has at least one block size with quantity > 0
  const hasAtLeastOneBlock = Object.values(blockQuantities).some((qty) => qty > 0);
  const canProceed =
    step === 0
      ? !!profile.type
      : step === 1
        ? !!profile.name.trim()
        : step === 2
          ? true
          : step === 3
            ? !hasLevelingBlocks || hasAtLeastOneBlock
            : true;

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Fixed header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>
                {isOnboarding
                  ? "Welcome! Let's Get Started"
                  : editingProfile
                    ? 'Edit Vehicle'
                    : 'Vehicle Setup'}
              </Text>
            </View>

            {/* Progress */}
            <View style={styles.progressRow}>
              {STEPS.map((_, index) => {
                const isActive = index === step;
                const isComplete = index < step;
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
                      {isComplete && <Check size={12} color="#000" />}
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

            {/* Step Title */}
            <Text style={styles.stepIndicator}>
              Step {step + 1} of {STEPS.length}: {currentStepData.title}
            </Text>
          </View>

          {/* Scrollable content */}
          <View style={styles.content}>{currentStepData.component()}</View>

          {/* Fixed navigation buttons */}
          <View style={styles.footer}>
            {/* Back and Next/Complete buttons row */}
            <View style={styles.navButtonRow}>
              {step > 0 && (
                <GlassButton
                  variant="warning"
                  size="lg"
                  onPress={handleBack}
                  style={styles.navButton}
                >
                  Back
                </GlassButton>
              )}

              <GlassButton
                variant={canProceed ? 'primary' : 'ghost'}
                size="lg"
                disabled={!canProceed}
                onPress={step < STEPS.length - 1 ? handleNext : handleComplete}
                style={styles.navButton}
              >
                {step < STEPS.length - 1
                  ? 'Next'
                  : isOnboarding
                    ? "Let's Go!"
                    : editingProfile
                      ? 'Update Profile'
                      : 'Create Profile'}
              </GlassButton>
            </View>

            {/* Cancel button - hidden during onboarding */}
            {!isOnboarding && onCancel && (
              <GlassButton
                variant="danger"
                size="md"
                onPress={onCancel}
                style={styles.fullWidthButton}
              >
                Cancel
              </GlassButton>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: THEME.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    opacity: 0.3,
    left: -6,
    top: -6,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  progressLineComplete: {
    backgroundColor: THEME.colors.success,
  },
  stepIndicator: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flex: 1,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  navButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  fullWidthButton: {
    width: '100%',
  },
  stepContainer: {
    gap: 16,
  },
  stepHeader: {
    gap: 8,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 12,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  optionTextContainer: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  optionDescription: {
    color: THEME.colors.textSecondary,
  },
  inputSection: {
    gap: 12,
  },
  inputLabel: {
    color: THEME.colors.text,
    fontWeight: '600',
  },
  textInput: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    color: THEME.colors.text,
    fontSize: 16,
  },
  tipBox: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  tipTitle: {
    color: THEME.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  radioOption: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 12,
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  radioSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  measurementSection: {
    gap: 8,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  measurementDisplay: {
    padding: 12,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.colors.text,
  },
  measurementHint: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  inputHint: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  infoBox: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  infoTitle: {
    color: THEME.colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  switchSection: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 12,
    gap: 12,
  },
  switchLabel: {
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  switchText: {
    color: THEME.colors.text,
  },
  switchHint: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  blockSelectionTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: THEME.colors.text,
  },
  tipsBox: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
  },
  tipsTitle: {
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    color: 'rgba(59, 130, 246, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  blockList: {
    gap: 12,
  },
  blockOption: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 12,
    alignItems: 'center',
  },
  blockOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  blockTextContainer: {
    flex: 1,
  },
  blockLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  blockDescription: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  customBlockSection: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    gap: 12,
  },
  customBlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  customBlockRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  customBlockInput: {
    flex: 1,
    padding: 12,
    backgroundColor: THEME.colors.background,
    borderRadius: 8,
    color: THEME.colors.text,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButtonText: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: THEME.colors.textMuted,
  },
  inchesLabel: {
    color: THEME.colors.textSecondary,
  },
  customBlockHint: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  warningBox: {
    padding: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: '#eab308',
    borderRadius: 12,
  },
  warningText: {
    color: '#eab308',
    fontSize: 14,
  },
  successBox: {
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 12,
  },
  successText: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
  },
  // New styles matching ProfileEditor's block inventory UI
  blocksSection: {
    gap: 12,
  },
  blocksList: {
    gap: 8,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blockItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  deleteBlockButton: {
    padding: 6,
    marginRight: 8,
  },
  blockHeight: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityButtonText: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textSecondary,
    minWidth: 28,
    textAlign: 'center',
  },
  quantityValueActive: {
    color: THEME.colors.success,
  },
  noBlocksText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  totalBlocksCard: {
    padding: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  totalBlocksText: {
    color: THEME.colors.success,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  addBlockButtonText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addBlockInputContainer: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlockInputGroup: {
    gap: 10,
  },
  addBlockLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  addBlockInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addBlockInput: {
    flex: 1,
    maxWidth: 120,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  addBlockActionButton: {
    minWidth: 80,
  },
});
