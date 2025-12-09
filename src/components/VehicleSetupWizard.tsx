import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Check, Trash2, Plus } from 'lucide-react-native';
import { TrailerIcon, MotorhomeIcon, VanIcon } from './icons/VehicleIcons';
import { GlassButton } from './ui/GlassButton';
import { GlassToggle } from './ui/GlassToggle';
import { StandardBlockSets, BlockInventory } from '../lib/rvLevelingMath';
import { useAppStore } from '../state/appStore';
import { getTypicalMeasurements, convertToInches, convertForDisplay } from '../lib/units';
import { THEME } from '../theme';
import { useTheme } from '../hooks/useTheme';

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

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    Icon: TrailerIcon,
    iconSize: 32,
  },
  {
    id: 'motorhome',
    name: 'Motor Home',
    description: 'Self-contained with engine, drives itself',
    Icon: MotorhomeIcon,
    iconSize: 42, // Larger to match visual size of other icons
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
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  // Theme-aware colors
  const screenColors = {
    // Overlay and modal
    overlayBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    modalBg: theme.colors.background,
    modalBorder: theme.colors.border,
    // Text colors
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    danger: '#ef4444',
    warning: '#f97316',
    // Surface/card backgrounds
    surface: theme.colors.surface,
    cardBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(200, 215, 235, 0.5)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.3)',
    cardSelectedBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
    cardSelectedBorder: theme.colors.primary,
    // Icon box
    iconBoxBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(200, 215, 235, 0.5)',
    iconBoxBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.3)',
    iconBoxSelectedBg: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)',
    iconBoxSelectedBorder: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)',
    // Progress dots
    dotBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.2)',
    dotBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 130, 170, 0.3)',
    dotActiveBg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)',
    lineBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.3)',
    // Tip box
    tipBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 215, 235, 0.4)',
    tipBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 170, 0.3)',
    // Input - glassy but visible in light mode
    inputBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(100, 130, 180, 0.12)',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 180, 0.35)',
    placeholder: isDark ? '#737373' : '#9ca3af',
    // Block item
    blockItemBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(200, 215, 235, 0.5)',
    blockItemBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(100, 130, 170, 0.3)',
    // Icon colors
    iconDefault: isDark ? '#a3a3a3' : '#64748b',
  };

  const { settings, isProfileNameTaken } = useAppStore();
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
  const scrollViewRef = useRef<ScrollView>(null);

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
        <Text style={[styles.stepTitle, { color: screenColors.text }]}>
          {isOnboarding ? 'What type of RV do you have?' : 'What type of vehicle do you have?'}
        </Text>
        <Text style={[styles.stepSubtitle, { color: screenColors.textSecondary }]}>
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
              style={[
                styles.optionCard,
                { backgroundColor: screenColors.surface, borderColor: screenColors.cardBorder },
                isSelected && {
                  backgroundColor: screenColors.cardSelectedBg,
                  borderColor: screenColors.cardSelectedBorder,
                },
              ]}
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
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: screenColors.iconBoxBg,
                    borderColor: screenColors.iconBoxBorder,
                  },
                  isSelected && {
                    backgroundColor: screenColors.iconBoxSelectedBg,
                    borderColor: screenColors.iconBoxSelectedBorder,
                  },
                ]}
              >
                <VehicleIcon
                  size={vehicleType.iconSize}
                  color={isSelected ? screenColors.primary : screenColors.iconDefault}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: screenColors.text }]}>
                  {vehicleType.name}
                </Text>
                <Text style={[styles.optionDescription, { color: screenColors.textSecondary }]}>
                  {vehicleType.description}
                </Text>
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
        <Text style={[styles.stepTitle, { color: screenColors.text }]}>
          {isOnboarding ? 'What do you call it?' : `Give your ${selectedVehicleType?.name} a name`}
        </Text>
        <Text style={[styles.stepSubtitle, { color: screenColors.textSecondary }]}>
          {isOnboarding
            ? 'Give your RV a nickname - something fun and memorable!'
            : 'This helps you identify it if you have multiple vehicles.'}
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: screenColors.text }]}>Vehicle Name</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: screenColors.inputBg,
              borderColor: screenColors.inputBorder,
              borderWidth: 1,
              color: screenColors.text,
            },
            vehicleNameTaken && { borderColor: '#ef4444' },
          ]}
          placeholder={`My ${selectedVehicleType?.name}`}
          placeholderTextColor={screenColors.placeholder}
          value={profile.name}
          onChangeText={(text) => setProfile((prev) => ({ ...prev, name: text }))}
          selectTextOnFocus={true}
          autoFocus={true}
        />
        {vehicleNameTaken && (
          <Text style={styles.errorText}>A vehicle with this name already exists</Text>
        )}
        <View
          style={[
            styles.tipBox,
            { backgroundColor: screenColors.tipBg, borderColor: screenColors.tipBorder },
          ]}
        >
          <Text style={[styles.tipTitle, { color: screenColors.text }]}>
            {isOnboarding ? 'Ideas:' : 'Naming Tips:'}
          </Text>
          <Text style={[styles.tipText, { color: screenColors.textSecondary }]}>
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
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: screenColors.text }]}>
            {isOnboarding ? 'Quick Measurements' : 'Vehicle Measurements'}
          </Text>
          <Text style={[styles.stepSubtitle, { color: screenColors.textSecondary }]}>
            {isOnboarding
              ? "Don't worry - typical values work great! You can fine-tune later."
              : 'We need a few measurements to calculate leveling accurately.'}
          </Text>
        </View>

        {/* Measurement Type Selection */}
        <View style={styles.optionsList}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              { backgroundColor: screenColors.surface, borderColor: screenColors.cardBorder },
              useTypicalMeasurements && {
                backgroundColor: screenColors.cardSelectedBg,
                borderColor: screenColors.cardSelectedBorder,
              },
            ]}
            onPress={() => {
              setUseTypicalMeasurements(true);
              if (typical) {
                setProfile((prev) => ({
                  ...prev,
                  wheelbaseInches: convertToInches(typical.wheelbase, settings.measurementUnits),
                  trackWidthInches: convertToInches(typical.track, settings.measurementUnits),
                  hitchOffsetInches: convertToInches(typical.hitch || 0, settings.measurementUnits),
                }));
              }
            }}
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: screenColors.textMuted },
                useTypicalMeasurements && {
                  borderColor: screenColors.primary,
                  backgroundColor: screenColors.primary,
                },
              ]}
            >
              {useTypicalMeasurements && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: screenColors.text }]}>
                Use Typical Values
              </Text>
              <Text style={[styles.radioSubtitle, { color: screenColors.textSecondary }]}>
                Quick setup with standard measurements
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              { backgroundColor: screenColors.surface, borderColor: screenColors.cardBorder },
              !useTypicalMeasurements && {
                backgroundColor: screenColors.cardSelectedBg,
                borderColor: screenColors.cardSelectedBorder,
              },
            ]}
            onPress={() => setUseTypicalMeasurements(false)}
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: screenColors.textMuted },
                !useTypicalMeasurements && {
                  borderColor: screenColors.primary,
                  backgroundColor: screenColors.primary,
                },
              ]}
            >
              {!useTypicalMeasurements && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: screenColors.text }]}>
                Enter Custom Values
              </Text>
              <Text style={[styles.radioSubtitle, { color: screenColors.textSecondary }]}>
                Most accurate for your specific vehicle
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Wheelbase - only for motorhomes and vans (not trailers) */}
        {profile.type !== 'trailer' && (
          <View style={styles.measurementSection}>
            <Text style={[styles.measurementLabel, { color: screenColors.primary }]}>
              Wheelbase Length ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
            </Text>
            {useTypicalMeasurements ? (
              <View style={[styles.measurementDisplay, { backgroundColor: screenColors.surface }]}>
                <Text style={[styles.measurementValue, { color: screenColors.text }]}>
                  {settings.measurementUnits === 'metric'
                    ? `${Math.round(profile.wheelbaseInches * 2.54)} cm`
                    : `${profile.wheelbaseInches}"`}
                </Text>
                <Text style={[styles.measurementHint, { color: screenColors.textSecondary }]}>
                  Standard for {selectedVehicleType?.name}
                </Text>
              </View>
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: screenColors.inputBg,
                      borderColor: screenColors.inputBorder,
                      borderWidth: 1,
                      color: screenColors.text,
                    },
                  ]}
                  placeholder={`e.g., ${convertForDisplay(240, settings.measurementUnits)}`}
                  placeholderTextColor={screenColors.placeholder}
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
                <Text style={[styles.inputHint, { color: screenColors.textSecondary }]}>
                  Measure center-to-center between front and rear axles
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Track Width */}
        <View style={styles.measurementSection}>
          <Text style={[styles.measurementLabel, { color: screenColors.success }]}>
            Track Width ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
          </Text>
          {useTypicalMeasurements ? (
            <View style={[styles.measurementDisplay, { backgroundColor: screenColors.surface }]}>
              <Text style={[styles.measurementValue, { color: screenColors.text }]}>
                {settings.measurementUnits === 'metric'
                  ? `${Math.round(profile.trackWidthInches * 2.54)} cm`
                  : `${profile.trackWidthInches}"`}
              </Text>
              <Text style={[styles.measurementHint, { color: screenColors.textSecondary }]}>
                Standard for {selectedVehicleType?.name}
              </Text>
            </View>
          ) : (
            <View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: screenColors.inputBg,
                    borderColor: screenColors.inputBorder,
                    borderWidth: 1,
                    color: screenColors.text,
                  },
                ]}
                placeholder={`e.g., ${convertForDisplay(96, settings.measurementUnits)}`}
                placeholderTextColor={screenColors.placeholder}
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
              <Text style={[styles.inputHint, { color: screenColors.textSecondary }]}>
                Measure center-to-center between left and right wheels
              </Text>
            </View>
          )}
        </View>

        {/* Hitch Offset (only for trailers) */}
        {profile.type === 'trailer' && (
          <View style={styles.measurementSection}>
            <Text style={[styles.measurementLabel, { color: screenColors.warning }]}>
              Hitch Offset ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
            </Text>
            {useTypicalMeasurements ? (
              <View style={[styles.measurementDisplay, { backgroundColor: screenColors.surface }]}>
                <Text style={[styles.measurementValue, { color: screenColors.text }]}>
                  {settings.measurementUnits === 'metric'
                    ? `${Math.round(profile.hitchOffsetInches * 2.54)} cm`
                    : `${profile.hitchOffsetInches}"`}
                </Text>
                <Text style={[styles.measurementHint, { color: screenColors.textSecondary }]}>
                  Standard for travel trailers
                </Text>
              </View>
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: screenColors.inputBg,
                      borderColor: screenColors.inputBorder,
                      borderWidth: 1,
                      color: screenColors.text,
                    },
                  ]}
                  placeholder={`e.g., ${convertForDisplay(120, settings.measurementUnits)}`}
                  placeholderTextColor={screenColors.placeholder}
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
                <Text style={[styles.inputHint, { color: screenColors.textSecondary }]}>
                  Measure from rear axle center to hitch ball
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Help section */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: screenColors.tipBg, borderColor: screenColors.tipBorder },
          ]}
        >
          <Text style={[styles.infoTitle, { color: screenColors.text }]}>
            {useTypicalMeasurements ? 'Using Standard Values' : 'Measurement Tips'}
          </Text>
          <Text style={[styles.infoText, { color: screenColors.textSecondary }]}>
            {useTypicalMeasurements
              ? 'These are typical values for your vehicle type. You can always adjust them later in your profile settings if needed.'
              : "Don't have a tape measure? Check your owner's manual or RV specifications. You can also update these later."}
          </Text>
        </View>
      </View>
    );
  };

  const renderBlocksStep = () => {
    // Get sorted heights from blockQuantities
    const sortedHeights = Object.keys(blockQuantities)
      .map((h) => parseFloat(h))
      .sort((a, b) => a - b);

    const totalBlocks = Object.values(blockQuantities).reduce((sum, qty) => sum + qty, 0);

    // Block-specific colors
    const blockColors = {
      switchBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
      switchBorder: screenColors.primary,
      blockItemBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 215, 235, 0.5)',
      blockItemBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 170, 0.3)',
      blockItemActiveBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
      blockItemActiveBorder: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)',
      quantityBtnBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(200, 215, 235, 0.6)',
      quantityBtnBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 130, 170, 0.4)',
      totalCardBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
      totalCardBorder: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)',
      addBtnBg: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
      addBtnBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)',
      addInputBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
      addInputBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)',
      addInputFieldBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(100, 130, 180, 0.12)',
      addInputFieldBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 180, 0.35)',
    };

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: screenColors.text }]}>
            {isOnboarding ? 'Almost Done!' : 'Leveling Blocks'}
          </Text>
          <Text style={[styles.stepSubtitle, { color: screenColors.textSecondary }]}>
            {isOnboarding
              ? 'Do you have leveling blocks? They help get your RV perfectly level.'
              : `Do you have leveling blocks to help level your ${selectedVehicleType?.name}?`}
          </Text>
        </View>

        {/* Toggle for having blocks */}
        <View
          style={[
            styles.switchSection,
            { backgroundColor: blockColors.switchBg, borderColor: blockColors.switchBorder },
          ]}
        >
          <View style={styles.switchRow}>
            <GlassToggle value={hasLevelingBlocks} onValueChange={setHasLevelingBlocks} />
            <Text style={[styles.switchText, { color: screenColors.text }]}>
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
                      style={[
                        styles.blockItem,
                        {
                          backgroundColor: blockColors.blockItemBg,
                          borderColor: blockColors.blockItemBorder,
                        },
                        hasBlocks && {
                          backgroundColor: blockColors.blockItemActiveBg,
                          borderColor: blockColors.blockItemActiveBorder,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.deleteBlockButton}
                        onPress={() => deleteBlockSize(height)}
                        activeOpacity={0.6}
                      >
                        <Trash2 size={16} color={screenColors.danger} />
                      </TouchableOpacity>
                      <Text style={[styles.blockHeight, { color: screenColors.text }]}>
                        {formatHeight(height)}
                      </Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            {
                              backgroundColor: blockColors.quantityBtnBg,
                              borderColor: blockColors.quantityBtnBorder,
                            },
                            quantity === 0 && styles.quantityButtonDisabled,
                          ]}
                          onPress={() => updateBlockQuantity(height, -1)}
                          disabled={quantity === 0}
                          activeOpacity={0.6}
                          delayPressIn={0}
                        >
                          <Text style={[styles.quantityButtonText, { color: screenColors.text }]}>
                            −
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.quantityValue,
                            { color: screenColors.textSecondary },
                            hasBlocks && { color: screenColors.success },
                          ]}
                        >
                          {quantity}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            {
                              backgroundColor: blockColors.quantityBtnBg,
                              borderColor: blockColors.quantityBtnBorder,
                            },
                          ]}
                          onPress={() => updateBlockQuantity(height, 1)}
                          activeOpacity={0.6}
                          delayPressIn={0}
                        >
                          <Text style={[styles.quantityButtonText, { color: screenColors.text }]}>
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.noBlocksText, { color: screenColors.textMuted }]}>
                No block sizes added. Tap below to add some.
              </Text>
            )}

            {totalBlocks > 0 && (
              <View
                style={[
                  styles.totalBlocksCard,
                  {
                    backgroundColor: blockColors.totalCardBg,
                    borderColor: blockColors.totalCardBorder,
                  },
                ]}
              >
                <Text style={[styles.totalBlocksText, { color: screenColors.success }]}>
                  Total: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} ({sortedHeights.length}{' '}
                  size{sortedHeights.length !== 1 ? 's' : ''})
                </Text>
              </View>
            )}

            {/* Add Block Size */}
            {!showAddBlockInput ? (
              <TouchableOpacity
                style={[
                  styles.addBlockButton,
                  { backgroundColor: blockColors.addBtnBg, borderColor: blockColors.addBtnBorder },
                ]}
                onPress={() => {
                  setShowAddBlockInput(true);
                  // Scroll to show the input above keyboard
                  globalThis.setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              >
                <Plus size={18} color={screenColors.primary} />
                <Text style={[styles.addBlockButtonText, { color: screenColors.primary }]}>
                  Add Block Size
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.addBlockInputContainer,
                  {
                    backgroundColor: blockColors.addInputBg,
                    borderColor: blockColors.addInputBorder,
                  },
                ]}
              >
                <View style={styles.addBlockInputGroup}>
                  <Text style={[styles.addBlockLabel, { color: screenColors.textSecondary }]}>
                    Height ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'}):
                  </Text>
                  <View style={styles.addBlockInputRow}>
                    <TextInput
                      style={[
                        styles.addBlockInput,
                        {
                          backgroundColor: blockColors.addInputFieldBg,
                          borderColor: blockColors.addInputFieldBorder,
                          color: screenColors.text,
                        },
                      ]}
                      placeholder="e.g., 2"
                      placeholderTextColor={screenColors.placeholder}
                      keyboardType="decimal-pad"
                      value={newBlockHeight}
                      onChangeText={setNewBlockHeight}
                      autoFocus
                      selectTextOnFocus={true}
                      onFocus={() => {
                        globalThis.setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
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
                      variant="default"
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

        <View
          style={[
            styles.infoBox,
            { backgroundColor: screenColors.tipBg, borderColor: screenColors.tipBorder },
          ]}
        >
          <Text style={[styles.infoText, { color: screenColors.textSecondary }]}>
            Don&apos;t worry if you&apos;re not sure about your block heights. You can always update
            this later in your vehicle profile settings.
          </Text>
        </View>
      </View>
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

  // Check if the current name is taken (allow if it's the same as the original when editing)
  const isEditingSameVehicle =
    editingProfile &&
    profile.name.trim().toLowerCase() === editingProfile.name.trim().toLowerCase();
  const vehicleNameTaken =
    profile.name.trim() && !isEditingSameVehicle && isProfileNameTaken(profile.name);

  const canProceed =
    step === 0
      ? !!profile.type
      : step === 1
        ? !!profile.name.trim() && !vehicleNameTaken
        : step === 2
          ? true
          : step === 3
            ? !hasLevelingBlocks || hasAtLeastOneBlock
            : true;

  if (!isVisible) return null;

  // Modal-specific colors
  const modalColors = {
    progressDotBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.2)',
    progressDotBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 130, 170, 0.3)',
    progressDotActiveBg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)',
    progressLineBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 130, 170, 0.3)',
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: screenColors.overlayBg }]}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: screenColors.modalBg, borderColor: screenColors.modalBorder },
          ]}
        >
          {/* Fixed header */}
          <View style={[styles.header, { borderBottomColor: screenColors.modalBorder }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: screenColors.text }]}>
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
                        {
                          backgroundColor: modalColors.progressDotBg,
                          borderColor: modalColors.progressDotBorder,
                        },
                        isComplete && {
                          backgroundColor: screenColors.success,
                          borderColor: screenColors.success,
                        },
                        isActive && {
                          backgroundColor: modalColors.progressDotActiveBg,
                          borderColor: screenColors.primary,
                        },
                      ]}
                    >
                      {isComplete && <Check size={10} color={isDark ? '#000' : '#fff'} />}
                    </View>
                    {isActive && (
                      <View
                        style={[styles.progressDotGlow, { backgroundColor: screenColors.primary }]}
                      />
                    )}
                    {showLine && (
                      <View
                        style={[
                          styles.progressLine,
                          { backgroundColor: modalColors.progressLineBg },
                          isComplete && { backgroundColor: screenColors.success },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Step Title */}
            <Text style={[styles.stepIndicator, { color: screenColors.textSecondary }]}>
              Step {step + 1} of {STEPS.length}: {currentStepData.title}
            </Text>
          </View>

          {/* Scrollable content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={100}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {currentStepData.component()}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Fixed navigation buttons */}
          <View style={[styles.footer, { borderTopColor: screenColors.modalBorder }]}>
            {/* Back and Next/Complete buttons row */}
            <View style={styles.navButtonRow}>
              {step > 0 && (
                <GlassButton
                  variant="warning"
                  size="md"
                  onPress={handleBack}
                  style={styles.navButton}
                >
                  Back
                </GlassButton>
              )}

              <GlassButton
                variant={canProceed ? 'primary' : 'ghost'}
                size="md"
                disabled={!canProceed}
                onPress={step < STEPS.length - 1 ? handleNext : handleComplete}
                style={styles.navButton}
              >
                {step < STEPS.length - 1
                  ? 'Next'
                  : isOnboarding
                    ? "Let's Go!"
                    : editingProfile
                      ? 'Update'
                      : 'Create'}
              </GlassButton>
            </View>

            {/* Cancel button - hidden during onboarding */}
            {!isOnboarding && onCancel && (
              <GlassButton
                variant="default"
                size="sm"
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
    height: '85%',
    backgroundColor: THEME.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  header: {
    padding: 12,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
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
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    opacity: 0.3,
    left: -4,
    top: -4,
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 3,
  },
  progressLineComplete: {
    backgroundColor: THEME.colors.success,
  },
  stepIndicator: {
    fontSize: 12,
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
    padding: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  navButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    minHeight: 44,
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
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 6,
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
    alignItems: 'center',
    width: '100%',
  },
  addBlockLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  addBlockInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addBlockInput: {
    width: 80,
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
