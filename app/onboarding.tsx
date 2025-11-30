import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
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
import {
  formatMeasurement,
  getTypicalMeasurements,
  getCommonBlockHeights,
  convertToInches,
} from '../src/lib/units';

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

  const [setupData, setSetupData] = useState({
    measurementUnits: 'imperial' as 'imperial' | 'metric',
    vehicleType: '' as 'trailer' | 'motorhome' | 'van' | '',
    vehicleName: '',
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
    hasLevelingBlocks: true,
    selectedBlockHeights: [2, 4] as number[],
    customBlockHeight: '',
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
      if (setupData.showCustomBlockInput && setupData.customBlockHeight.trim()) {
        const customHeight = convertToInches(
          parseFloat(setupData.customBlockHeight),
          setupData.measurementUnits
        );
        blockInventory = [
          { thickness: customHeight, quantity: 8 },
          { thickness: 1.0, quantity: 8 },
          { thickness: 0.5, quantity: 8 },
          { thickness: 0.25, quantity: 8 },
        ];
      } else {
        const baseBlocks = setupData.selectedBlockHeights.map((height) => ({
          thickness: height,
          quantity: 8,
        }));
        const precisionBlocks = [
          { thickness: 1.0, quantity: 12 },
          { thickness: 0.5, quantity: 12 },
          { thickness: 0.25, quantity: 12 },
          { thickness: 0.125, quantity: 8 },
        ];
        blockInventory = [...baseBlocks, ...precisionBlocks];
      }
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

    setTimeout(() => {
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
      case 6:
        if (!setupData.hasLevelingBlocks) return true;
        if (setupData.showCustomBlockInput) {
          return (
            setupData.customBlockHeight.trim() !== '' &&
            !isNaN(parseFloat(setupData.customBlockHeight))
          );
        }
        return setupData.selectedBlockHeights.length > 0;
      default:
        return true;
    }
  };

  function renderWelcomeStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-primary rounded-2xl">
          <Target size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">
            Welcome to FlatFinder!
          </Text>
          <Text className="text-muted-foreground text-center text-xl">
            Your Professional RV Leveling Assistant
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-3">
            <Text className="text-foreground text-base text-center">
              FlatFinder transforms your phone into a precision leveling tool for RVs,
              trailers, and motorhomes.
            </Text>
            <Text className="text-foreground text-base text-center">
              Whether you're a weekend warrior or full-time RVer, proper leveling is
              essential for:
            </Text>
            <Text className="text-foreground text-base text-left">
              {'\u2022'} Comfort - Sleep better on a level bed{'\n'}
              {'\u2022'} Safety - Prevent items from sliding or falling{'\n'}
              {'\u2022'} Appliance protection - Refrigerators need to be level{'\n'}
              {'\u2022'} Stability - Reduce rocking and swaying
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderHowItWorksStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-orange-500 rounded-2xl">
          <AlertTriangle size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">
            How Leveling Works
          </Text>
          <Text className="text-muted-foreground text-center text-xl">
            Understanding Pitch and Roll
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-3">
            <Text className="text-foreground text-base text-center">
              Your RV can be unlevel in two directions:
            </Text>
            <Text className="text-foreground text-base text-left">
              {'\u2022'} PITCH: Front-to-back (nose up/down){'\n'}
              {'\u2022'} ROLL: Side-to-side (left/right high)
            </Text>
            <Text className="text-foreground text-base text-center">
              FlatFinder measures both angles using your phone's built-in motion sensors.
            </Text>
            <Text className="text-foreground text-base text-center">
              The goal is to get both pitch and roll as close to 0° as possible. Most RV
              appliances work fine within ±1° of level.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderSafetyStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-red-500 rounded-2xl">
          <AlertTriangle size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">Safety First</Text>
          <Text className="text-muted-foreground text-center text-xl">
            Important Guidelines
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-3">
            <Text className="text-foreground text-base text-center">
              Before you start leveling:
            </Text>
            <Text className="text-foreground text-base text-left">
              {'\u2022'} Choose the most level spot available{'\n'}
              {'\u2022'} Avoid slopes greater than 8° in any direction{'\n'}
              {'\u2022'} Ensure your RV is stable and chocks are in place{'\n'}
              {'\u2022'} Never level on soft or unstable ground
            </Text>
            <Text className="text-foreground text-base text-center">
              FlatFinder will warn you if angles become unsafe during leveling.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderUnitsStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-purple-500 rounded-2xl">
          <Ruler size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">
            Choose Your Units
          </Text>
          <Text className="text-muted-foreground text-center text-xl">
            Imperial or Metric Measurements
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-4">
            <Text className="text-foreground text-base text-center">
              Choose your preferred measurement system. You can change this later in Settings.
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                className={`p-4 rounded-xl border-2 ${
                  setupData.measurementUnits === 'imperial'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border'
                }`}
                onPress={() =>
                  setSetupData((prev) => ({ ...prev, measurementUnits: 'imperial' }))
                }
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      setupData.measurementUnits === 'imperial'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {setupData.measurementUnits === 'imperial' && (
                      <View className="w-2 h-2 rounded-full bg-white m-auto" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">Imperial</Text>
                    <Text className="text-sm text-muted-foreground">
                      Inches, feet (US standard)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-4 rounded-xl border-2 ${
                  setupData.measurementUnits === 'metric'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border'
                }`}
                onPress={() =>
                  setSetupData((prev) => ({ ...prev, measurementUnits: 'metric' }))
                }
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      setupData.measurementUnits === 'metric'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {setupData.measurementUnits === 'metric' && (
                      <View className="w-2 h-2 rounded-full bg-white m-auto" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">Metric</Text>
                    <Text className="text-sm text-muted-foreground">
                      Centimeters, meters (International)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  function renderVehicleStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-green-500 rounded-2xl">
          <Zap size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">Your Vehicle</Text>
          <Text className="text-muted-foreground text-center text-xl">
            What type of RV do you have?
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-4">
            <Text className="text-foreground text-base text-center">
              This helps us provide accurate measurements and setup defaults for your
              vehicle type.
            </Text>

            <View className="gap-3">
              {VEHICLE_TYPES.map((vehicleType) => {
                const isSelected = setupData.vehicleType === vehicleType.id;
                const VehicleIcon = vehicleType.Icon;

                return (
                  <TouchableOpacity
                    key={vehicleType.id}
                    className={`p-4 rounded-xl border-2 ${
                      isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                    }`}
                    onPress={() =>
                      setSetupData((prev) => ({
                        ...prev,
                        vehicleType: vehicleType.id as 'trailer' | 'motorhome' | 'van',
                      }))
                    }
                  >
                    <View className="flex-row gap-3 items-center">
                      <View
                        className={`p-3 rounded-xl ${isSelected ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <VehicleIcon size={32} color={isSelected ? '#fff' : '#a3a3a3'} />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-lg font-bold text-foreground">
                          {vehicleType.name}
                        </Text>
                        <Text className="text-base text-muted-foreground">
                          {vehicleType.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  }

  function renderVehicleDetailsStep() {
    const typical =
      typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 items-center">
          <View className="p-6 bg-purple-500 rounded-2xl">
            {selectedVehicleType && (
              <selectedVehicleType.Icon size={64} color="#fff" />
            )}
          </View>

          <View className="gap-2 items-center">
            <Text className="text-foreground text-center text-3xl font-bold">
              Vehicle Details
            </Text>
            <Text className="text-muted-foreground text-center text-xl">
              Tell us about your {selectedVehicleType?.name}
            </Text>
          </View>

          <View className="p-6 bg-card border border-border rounded-2xl w-full">
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-foreground font-semibold">Vehicle Name</Text>
                <TextInput
                  className="p-4 bg-muted rounded-xl text-foreground text-base"
                  placeholder={`My ${selectedVehicleType?.name}`}
                  placeholderTextColor="#737373"
                  value={setupData.vehicleName}
                  onChangeText={(text) =>
                    setSetupData((prev) => ({ ...prev, vehicleName: text }))
                  }
                />
                <Text className="text-muted-foreground text-sm">
                  Give your vehicle a memorable name (e.g., "Big Blue", "Family Trailer")
                </Text>
              </View>

              <View className="p-4 bg-primary/10 border border-primary rounded-xl">
                <View className="gap-2">
                  <Text className="text-foreground font-bold">Great news!</Text>
                  <Text className="text-muted-foreground text-sm">
                    We'll use typical measurements for your {selectedVehicleType?.name}. You
                    can adjust these later if needed.
                  </Text>
                  {typical && (
                    <Text className="text-muted-foreground text-sm">
                      {'\u2022'} Wheelbase:{' '}
                      {formatMeasurement(
                        convertToInches(typical.wheelbase, setupData.measurementUnits),
                        setupData.measurementUnits
                      )}
                      {'\n'}
                      {'\u2022'} Track Width:{' '}
                      {formatMeasurement(
                        convertToInches(typical.track, setupData.measurementUnits),
                        setupData.measurementUnits
                      )}
                      {setupData.vehicleType === 'trailer' && typical.hitch
                        ? `\n\u2022 Hitch Offset: ${formatMeasurement(
                            convertToInches(typical.hitch, setupData.measurementUnits),
                            setupData.measurementUnits
                          )}`
                        : ''}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  function renderBlocksStep() {
    const blockHeights = getCommonBlockHeights(setupData.measurementUnits);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 items-center">
          <View className="p-6 bg-green-500 rounded-2xl">
            <Package size={64} color="#fff" />
          </View>

          <View className="gap-2 items-center">
            <Text className="text-foreground text-center text-3xl font-bold">
              Leveling Blocks
            </Text>
            <Text className="text-muted-foreground text-center text-xl">
              Do you have leveling blocks?
            </Text>
          </View>

          <View className="p-6 bg-card border border-border rounded-2xl w-full">
            <View className="gap-4">
              <View className="p-4 bg-primary/10 border border-primary rounded-xl">
                <View className="gap-3">
                  <View className="flex-row gap-2 items-center">
                    <Package size={20} color="#3b82f6" />
                    <Text className="font-bold text-foreground">Block Inventory</Text>
                  </View>
                  <View className="flex-row gap-2 items-center">
                    <Switch
                      value={setupData.hasLevelingBlocks}
                      onValueChange={(checked) =>
                        setSetupData((prev) => ({ ...prev, hasLevelingBlocks: checked }))
                      }
                      trackColor={{ false: '#333', true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                    <Text className="text-foreground">I have leveling blocks</Text>
                  </View>
                  <Text className="text-muted-foreground text-sm">
                    {setupData.hasLevelingBlocks
                      ? 'Great! Select your block heights below for precise leveling instructions.'
                      : "No problem! The app will show you exact measurements instead."}
                  </Text>
                </View>
              </View>

              {setupData.hasLevelingBlocks && (
                <View className="gap-4">
                  <Text className="font-bold text-center text-foreground">
                    What block heights do you have?
                  </Text>

                  <View className="gap-3">
                    {blockHeights.map((block) => (
                      <TouchableOpacity
                        key={block.value}
                        className={`p-3 rounded-xl border ${
                          setupData.selectedBlockHeights.includes(block.value)
                            ? 'bg-green-500/10 border-green-500'
                            : 'bg-card border-border'
                        }`}
                        onPress={() => {
                          setSetupData((prev) => ({
                            ...prev,
                            selectedBlockHeights: prev.selectedBlockHeights.includes(
                              block.value
                            )
                              ? prev.selectedBlockHeights.filter((h) => h !== block.value)
                              : [...prev.selectedBlockHeights, block.value].sort(
                                  (a, b) => a - b
                                ),
                          }));
                        }}
                      >
                        <View className="flex-row gap-3 items-center">
                          <View
                            className={`w-6 h-6 rounded border-2 items-center justify-center ${
                              setupData.selectedBlockHeights.includes(block.value)
                                ? 'border-green-500 bg-green-500'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {setupData.selectedBlockHeights.includes(block.value) && (
                              <Text className="text-white text-xs font-bold">✓</Text>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-foreground">
                              {block.label}
                            </Text>
                            <Text className="text-sm text-muted-foreground">
                              {block.description}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {setupData.selectedBlockHeights.length > 0 && (
                    <View className="p-3 bg-green-500/10 border border-green-500 rounded-xl">
                      <Text className="text-green-500 text-sm text-center">
                        ✓ Selected:{' '}
                        {setupData.selectedBlockHeights
                          .map((h) => formatMeasurement(h, setupData.measurementUnits, 0))
                          .join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  function renderCompletionStep() {
    return (
      <View className="gap-4 items-center">
        <View className="p-6 bg-green-500 rounded-2xl">
          <CheckCircle size={64} color="#fff" />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-foreground text-center text-3xl font-bold">
            Ready to Level!
          </Text>
          <Text className="text-muted-foreground text-center text-xl">
            Your setup is complete
          </Text>
        </View>

        <View className="p-6 bg-card border border-border rounded-2xl w-full">
          <View className="gap-4">
            <Text className="text-foreground text-base text-center">
              Perfect! We've set up FlatFinder with your preferences:
            </Text>

            <View className="gap-2">
              <Text className="text-foreground text-base">
                📱 <Text className="font-bold">Units:</Text>{' '}
                {setupData.measurementUnits === 'imperial'
                  ? 'Imperial (inches/feet)'
                  : 'Metric (cm/meters)'}
              </Text>
              <Text className="text-foreground text-base">
                🚐 <Text className="font-bold">Vehicle:</Text>{' '}
                {setupData.vehicleName || `My ${selectedVehicleType?.name}`}
              </Text>
              <Text className="text-foreground text-base">
                📦 <Text className="font-bold">Blocks:</Text>{' '}
                {(() => {
                  if (!setupData.hasLevelingBlocks) return 'Measurement mode';
                  return `${setupData.selectedBlockHeights.length} height${
                    setupData.selectedBlockHeights.length !== 1 ? 's' : ''
                  }`;
                })()}
              </Text>
            </View>

            <View className="p-4 bg-green-500/10 border border-green-500 rounded-xl">
              <Text className="text-green-500 text-base text-center font-bold">
                You're all set! Tap "Get Started" to begin leveling.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-3 gap-4">
        {/* Progress Indicator */}
        <View className="flex-row gap-2 justify-center items-center">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={`w-3 h-3 rounded-full ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-5 pb-7">{currentStepData.component()}</View>
        </ScrollView>

        {/* Navigation */}
        <View className="gap-3">
          <View className="flex-row gap-3">
            {currentStep > 0 && (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-2 bg-muted py-4 rounded-xl"
                onPress={handleBack}
              >
                <ArrowLeft size={20} color="#a3a3a3" />
                <Text className="text-muted-foreground font-semibold">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
                canProceed() ? 'bg-primary' : 'bg-muted'
              }`}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text
                className={`font-semibold ${
                  canProceed() ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
              </Text>
              {currentStep < STEPS.length - 1 ? (
                <ArrowRight size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
              ) : (
                <CheckCircle size={20} color={canProceed() ? '#fff' : '#a3a3a3'} />
              )}
            </TouchableOpacity>
          </View>

          {/* Skip Option */}
          <TouchableOpacity className="py-2" onPress={skipOnboarding}>
            <Text className="text-muted-foreground text-center">Skip Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* Step Counter */}
        <Text className="text-muted-foreground text-sm text-center">
          {currentStep + 1} of {STEPS.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}
