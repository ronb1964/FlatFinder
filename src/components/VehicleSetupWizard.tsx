import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { Car, Truck, Home } from 'lucide-react-native';
import { StandardBlockSets, BlockInventory } from '../lib/rvLevelingMath';
import { useAppStore } from '../state/appStore';
import {
  formatMeasurement,
  getTypicalMeasurements,
  getCommonBlockHeights,
  convertToInches,
  convertForDisplay,
} from '../lib/units';

interface VehicleSetupWizardProps {
  onComplete: (profile: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
  editingProfile?: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  } | null;
}

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

export function VehicleSetupWizard({
  onComplete,
  onCancel,
  isVisible,
  editingProfile,
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
  const [selectedBlockHeights, setSelectedBlockHeights] = useState<number[]>(
    editingProfile?.blockInventory?.map((block) => block.thickness) || [2, 4]
  );
  const [customBlockInput, setCustomBlockInput] = useState('');

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
      setSelectedBlockHeights(
        editingProfile?.blockInventory?.map((block) => block.thickness) || [2, 4]
      );
      setCustomBlockInput('');
    }
  }, [editingProfile, isVisible]);

  const selectedVehicleType = VEHICLE_TYPES.find((v) => v.id === profile.type);

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
      console.log('VehicleSetupWizard - Starting completion...');

      const allSelectedHeights = [...selectedBlockHeights];
      if (customBlockInput.trim()) {
        const customValue = parseFloat(customBlockInput);
        if (
          customValue &&
          customValue > 0 &&
          customValue <= 12 &&
          !allSelectedHeights.includes(customValue)
        ) {
          allSelectedHeights.push(customValue);
          allSelectedHeights.sort((a, b) => a - b);
        }
      }

      const blockInventory: BlockInventory[] = hasLevelingBlocks
        ? allSelectedHeights.map((height) => ({
            thickness: height,
            quantity: 4,
          }))
        : [];

      console.log('VehicleSetupWizard - Block inventory:', blockInventory);
      console.log('VehicleSetupWizard - Profile data:', profile);

      const profileData = {
        ...profile,
        hitchOffsetInches: profile.type === 'trailer' ? profile.hitchOffsetInches : undefined,
        blockInventory,
      };

      console.log('VehicleSetupWizard - Final profile data:', profileData);

      onComplete(profileData);

      console.log('VehicleSetupWizard - onComplete called successfully');
    } catch (error) {
      console.error('VehicleSetupWizard - Error during completion:', error);
    }
  };

  const renderVehicleTypeStep = () => (
    <View className="gap-4">
      <View className="gap-2 items-center">
        <Text className="text-foreground text-center text-xl font-bold">
          What type of vehicle do you have?
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          This helps us set up realistic measurements for your vehicle.
        </Text>
      </View>

      <View className="gap-3">
        {VEHICLE_TYPES.map((vehicleType) => {
          const isSelected = profile.type === vehicleType.id;
          const VehicleIcon = vehicleType.Icon;

          return (
            <TouchableOpacity
              key={vehicleType.id}
              className={`p-4 rounded-xl border-2 ${
                isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
              }`}
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
              <View className="flex-row gap-3 items-center">
                <View className={`p-3 rounded-xl ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                  <VehicleIcon size={32} color={isSelected ? '#fff' : '#a3a3a3'} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-lg font-bold text-foreground">{vehicleType.name}</Text>
                  <Text className="text-base text-muted-foreground">{vehicleType.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderNameStep = () => (
    <View className="gap-4">
      <View className="gap-2 items-center">
        <Text className="text-foreground text-center text-xl font-bold">
          Give your {selectedVehicleType?.name} a name
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          This helps you identify it if you have multiple vehicles.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-foreground font-semibold">Vehicle Name</Text>
        <TextInput
          className="p-4 bg-muted rounded-xl text-foreground text-base"
          placeholder={`My ${selectedVehicleType?.name}`}
          placeholderTextColor="#737373"
          value={profile.name}
          onChangeText={(text) => setProfile((prev) => ({ ...prev, name: text }))}
        />
        <View className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <Text className="text-purple-400 text-sm font-semibold mb-2">Naming Tips:</Text>
          <Text className="text-purple-400/80 text-sm">
            {'\u2022'} Use something memorable and descriptive{'\n'}
            {'\u2022'} Consider color, size, or brand (e.g., "Big Blue", "Little Winnebago"){'\n'}
            {'\u2022'} Helpful if you have multiple RVs or share the app
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMeasurementsStep = () => {
    const typical = typicalMeasurements[profile.type];

    return (
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-4 pb-4">
          <View className="gap-2 items-center">
            <Text className="text-foreground text-center text-xl font-bold">
              Vehicle Measurements
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              We need a few measurements to calculate leveling accurately.
            </Text>
          </View>

          {/* Measurement Type Selection */}
          <View className="gap-2">
            <TouchableOpacity
              className={`p-3 rounded-xl border ${
                useTypicalMeasurements ? 'bg-primary/10 border-primary' : 'bg-card border-border'
              }`}
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
              <View className="flex-row gap-3 items-center">
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    useTypicalMeasurements ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                >
                  {useTypicalMeasurements && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">Use Typical Values</Text>
                  <Text className="text-sm text-muted-foreground">
                    Quick setup with standard measurements
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`p-3 rounded-xl border ${
                !useTypicalMeasurements ? 'bg-primary/10 border-primary' : 'bg-card border-border'
              }`}
              onPress={() => setUseTypicalMeasurements(false)}
            >
              <View className="flex-row gap-3 items-center">
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    !useTypicalMeasurements
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {!useTypicalMeasurements && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">Enter Custom Values</Text>
                  <Text className="text-sm text-muted-foreground">
                    Most accurate for your specific vehicle
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Measurements */}
          <View className="gap-4">
            {/* Wheelbase */}
            <View className="gap-2">
              <Text className="text-lg font-semibold text-primary">
                Wheelbase Length ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>

              {useTypicalMeasurements ? (
                <View className="p-3 bg-muted rounded-xl">
                  <Text className="text-base font-medium text-foreground">
                    {settings.measurementUnits === 'metric'
                      ? `${Math.round(profile.wheelbaseInches * 2.54)} cm`
                      : `${profile.wheelbaseInches}"`}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Standard for {selectedVehicleType?.name}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  <TextInput
                    className="p-4 bg-muted rounded-xl text-foreground text-base"
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
                  />
                  <Text className="text-sm text-muted-foreground">
                    Measure center-to-center between front and rear wheels
                  </Text>
                </View>
              )}
            </View>

            {/* Track Width */}
            <View className="gap-2">
              <Text className="text-lg font-semibold text-green-500">
                Track Width ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>

              {useTypicalMeasurements ? (
                <View className="p-3 bg-muted rounded-xl">
                  <Text className="text-base font-medium text-foreground">
                    {settings.measurementUnits === 'metric'
                      ? `${Math.round(profile.trackWidthInches * 2.54)} cm`
                      : `${profile.trackWidthInches}"`}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Standard for {selectedVehicleType?.name}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  <TextInput
                    className="p-4 bg-muted rounded-xl text-foreground text-base"
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
                  />
                  <Text className="text-sm text-muted-foreground">
                    Measure center-to-center between left and right wheels
                  </Text>
                </View>
              )}
            </View>

            {/* Hitch Offset (only for trailers) */}
            {profile.type === 'trailer' && (
              <View className="gap-2">
                <Text className="text-lg font-semibold text-orange-500">
                  Hitch Offset ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
                </Text>

                {useTypicalMeasurements ? (
                  <View className="p-3 bg-muted rounded-xl">
                    <Text className="text-base font-medium text-foreground">
                      {settings.measurementUnits === 'metric'
                        ? `${Math.round(profile.hitchOffsetInches * 2.54)} cm`
                        : `${profile.hitchOffsetInches}"`}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Standard for travel trailers
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    <TextInput
                      className="p-4 bg-muted rounded-xl text-foreground text-base"
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
                    />
                    <Text className="text-sm text-muted-foreground">
                      Measure from rear axle center to hitch ball
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Help section */}
          <View className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
            <Text className="text-primary text-sm font-semibold">
              {useTypicalMeasurements ? 'Using Standard Values' : 'Measurement Tips'}
            </Text>
            <Text className="text-primary/80 text-sm">
              {useTypicalMeasurements
                ? "These are typical values for your vehicle type. You can always adjust them later in your profile settings if needed."
                : "Don't have a tape measure? Check your owner's manual or RV specifications. You can also update these later."}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderBlocksStep = () => {
    const blockHeights = getCommonBlockHeights(settings.measurementUnits);

    return (
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-4 pb-4">
          <View className="gap-2 items-center">
            <Text className="text-foreground text-center text-xl font-bold">Leveling Blocks</Text>
            <Text className="text-muted-foreground text-center text-base">
              Do you have leveling blocks to help level your {selectedVehicleType?.name}?
            </Text>
          </View>

          {/* Do you have blocks? */}
          <View className="p-4 bg-primary/10 border border-primary rounded-xl">
            <View className="gap-3">
              <Text className="font-bold text-foreground">Leveling Block Inventory</Text>
              <View className="flex-row gap-2 items-center">
                <Switch
                  value={hasLevelingBlocks}
                  onValueChange={setHasLevelingBlocks}
                  trackColor={{ false: '#333', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
                <Text className="text-foreground">I have leveling blocks</Text>
              </View>
              <Text className="text-muted-foreground text-sm">
                {hasLevelingBlocks
                  ? 'Great! This will help you get precise leveling instructions with block counts.'
                  : 'No problem! The app will show you exact measurements instead of block counts.'}
              </Text>
            </View>
          </View>

          {/* Block selection if they have blocks */}
          {hasLevelingBlocks && (
            <View className="gap-4">
              <Text className="font-bold text-center text-foreground">
                What block heights do you have?
              </Text>

              <View className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <Text className="text-cyan-400 text-sm font-semibold mb-2">
                  Block Selection Tips:
                </Text>
                <Text className="text-cyan-400/80 text-sm">
                  {'\u2022'} Select all heights you own - the app will optimize which to use{'\n'}
                  {'\u2022'} Common heights: 1", 2", 4" blocks work for most situations{'\n'}
                  {'\u2022'} Check your block packaging or measure with a ruler if unsure
                </Text>
              </View>

              <View className="gap-3">
                {blockHeights.map((block) => (
                  <TouchableOpacity
                    key={block.value}
                    className={`p-3 rounded-xl border ${
                      selectedBlockHeights.includes(block.value)
                        ? 'bg-green-500/10 border-green-500'
                        : 'bg-card border-border'
                    }`}
                    onPress={() => {
                      setSelectedBlockHeights((prev) =>
                        prev.includes(block.value)
                          ? prev.filter((h) => h !== block.value)
                          : [...prev, block.value].sort((a, b) => a - b)
                      );
                    }}
                  >
                    <View className="flex-row gap-3 items-center">
                      <View
                        className={`w-6 h-6 rounded border-2 items-center justify-center ${
                          selectedBlockHeights.includes(block.value)
                            ? 'border-green-500 bg-green-500'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedBlockHeights.includes(block.value) && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground">{block.label}</Text>
                        <Text className="text-sm text-muted-foreground">{block.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom block size input */}
              <View className="p-4 bg-muted rounded-xl gap-3">
                <Text className="text-base font-bold text-foreground">Add Custom Block Size</Text>
                <View className="flex-row gap-3 items-center">
                  <TextInput
                    className="flex-1 p-3 bg-card rounded-lg text-foreground text-base"
                    placeholder="e.g., 1.25"
                    placeholderTextColor="#737373"
                    keyboardType="decimal-pad"
                    value={customBlockInput}
                    onChangeText={setCustomBlockInput}
                    onSubmitEditing={() => {
                      const value = parseFloat(customBlockInput);
                      if (value && value > 0 && value <= 12 && !selectedBlockHeights.includes(value)) {
                        setSelectedBlockHeights((prev) => [...prev, value].sort((a, b) => a - b));
                        setCustomBlockInput('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    className={`px-4 py-3 rounded-lg ${
                      customBlockInput.trim() ? 'bg-primary' : 'bg-muted'
                    }`}
                    onPress={() => {
                      const value = parseFloat(customBlockInput);
                      if (value && value > 0 && value <= 12 && !selectedBlockHeights.includes(value)) {
                        setSelectedBlockHeights((prev) => [...prev, value].sort((a, b) => a - b));
                        setCustomBlockInput('');
                      }
                    }}
                    disabled={!customBlockInput.trim()}
                  >
                    <Text
                      className={`font-semibold ${
                        customBlockInput.trim() ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-muted-foreground">inches</Text>
                </View>
                <Text className="text-xs text-muted-foreground">
                  Enter a custom block height (0.1 - 12 inches)
                </Text>
              </View>

              {selectedBlockHeights.length === 0 && hasLevelingBlocks && (
                <View className="p-3 bg-yellow-500/10 border border-yellow-500 rounded-xl">
                  <Text className="text-yellow-500 text-sm">
                    Please select at least one block height, or turn off "I have leveling blocks"
                    above.
                  </Text>
                </View>
              )}

              {selectedBlockHeights.length > 0 && (
                <View className="p-3 bg-green-500/10 border border-green-500 rounded-xl">
                  <Text className="text-green-500 text-sm text-center">
                    ✓ Selected:{' '}
                    {selectedBlockHeights
                      .map((h) => formatMeasurement(h, settings.measurementUnits))
                      .join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
            <Text className="text-primary/80 text-sm">
              Don't worry if you're not sure about your block heights. You can always update this
              later in your vehicle profile settings.
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
  const canProceed =
    step === 0
      ? !!profile.type
      : step === 1
        ? !!profile.name.trim()
        : step === 2
          ? true
          : step === 3
            ? !hasLevelingBlocks || selectedBlockHeights.length > 0
            : true;

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="w-full max-w-[500px] max-h-[90%] bg-background border-2 border-border rounded-2xl overflow-hidden">
          {/* Fixed header */}
          <View className="p-4 pb-2 gap-3 border-b border-border">
            {/* Close button */}
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-foreground">
                {editingProfile ? 'Edit Vehicle' : 'Vehicle Setup'}
              </Text>
              <TouchableOpacity
                className="px-4 py-2 bg-muted rounded-lg"
                onPress={onCancel}
              >
                <Text className="text-muted-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Progress */}
            <View className="flex-row gap-2 justify-center">
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  className={`w-10 h-1 rounded ${
                    index <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </View>

            {/* Step Title */}
            <Text className="text-muted-foreground text-center">
              Step {step + 1} of {STEPS.length}: {currentStepData.title}
            </Text>
          </View>

          {/* Scrollable content */}
          <View className="flex-1 px-4 py-2">{currentStepData.component()}</View>

          {/* Fixed navigation buttons */}
          <View className="flex-row p-4 pt-2 gap-3 border-t border-border">
            {step > 0 && (
              <TouchableOpacity
                className="flex-1 py-4 bg-muted rounded-xl items-center"
                onPress={handleBack}
              >
                <Text className="text-muted-foreground font-semibold">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-1 py-4 rounded-xl items-center ${
                canProceed ? 'bg-primary' : 'bg-muted'
              }`}
              disabled={!canProceed}
              onPress={step < STEPS.length - 1 ? handleNext : handleComplete}
            >
              <Text
                className={`font-semibold ${
                  canProceed ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {step < STEPS.length - 1
                  ? 'Next'
                  : editingProfile
                    ? 'Update Profile'
                    : 'Create Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
