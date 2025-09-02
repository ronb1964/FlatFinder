import React, { useState } from 'react';
import { YStack, XStack, Text, Button, H1, H2, Card, ScrollView, useTheme, Switch, Input, Label } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowRight, ArrowLeft, Target, AlertTriangle, Zap, CheckCircle, Car, Truck, Home, Ruler, Package, Info } from '@tamagui/lucide-icons';
import { useAppStore } from '../src/state/appStore';
import { StandardBlockSets, BlockInventory } from '../src/lib/rvLevelingMath';
import { createCalibration } from '../src/lib/levelingMath';
import { formatMeasurement, getTypicalMeasurements, getCommonBlockHeights, convertToInches, convertForDisplay } from '../src/lib/units';

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    icon: Car
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    description: 'Self-contained with engine, drives itself',
    icon: Truck
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    description: 'Converted van or small RV',
    icon: Home
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateSettings, addProfile, setActiveProfile, settings } = useAppStore();
  const theme = useTheme();

  // Setup data collected during onboarding
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
    showCustomBlockInput: false
  });

  // Get typical measurements based on selected units
  const typicalMeasurements = getTypicalMeasurements(setupData.measurementUnits);
  const selectedVehicleType = VEHICLE_TYPES.find(v => v.id === setupData.vehicleType);

  // Define onboarding steps with setup
  const STEPS = [
    { title: "Welcome", component: renderWelcomeStep },
    { title: "How It Works", component: renderHowItWorksStep },
    { title: "Safety First", component: renderSafetyStep },
    { title: "Choose Units", component: renderUnitsStep },
    { title: "Your Vehicle", component: renderVehicleStep },
    { title: "Vehicle Details", component: renderVehicleDetailsStep },
    { title: "Leveling Blocks", component: renderBlocksStep },
    { title: "Ready to Level", component: renderCompletionStep }
  ];

  const currentStepData = STEPS[currentStep];

  const handleNext = () => {
    // Apply typical measurements when vehicle type is selected
    if (currentStep === 4 && setupData.vehicleType) {
      const typical = typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
      if (typical) {
        setSetupData(prev => ({
          ...prev,
          wheelbaseInches: convertToInches(typical.wheelbase, setupData.measurementUnits),
          trackWidthInches: convertToInches(typical.track, setupData.measurementUnits),
          hitchOffsetInches: convertToInches(typical.hitch || 0, setupData.measurementUnits)
        }));
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    // Create block inventory from selected heights
    let blockInventory: BlockInventory[] = [];
    
    if (setupData.hasLevelingBlocks) {
      if (setupData.showCustomBlockInput && setupData.customBlockHeight.trim()) {
        // Custom block height
        const customHeight = convertToInches(parseFloat(setupData.customBlockHeight), setupData.measurementUnits);
        blockInventory = [
          { thickness: customHeight, quantity: 8 },
          // Add some precision blocks for better stacking
          { thickness: 1.0, quantity: 8 },
          { thickness: 0.5, quantity: 8 },
          { thickness: 0.25, quantity: 8 }
        ];
      } else {
        // Standard block heights with more inventory and precision blocks
        const baseBlocks = setupData.selectedBlockHeights.map(height => ({
          thickness: height,
          quantity: 8 // More blocks per height
        }));
        
        // Add smaller increment blocks for better precision and higher stacking
        const precisionBlocks = [
          { thickness: 1.0, quantity: 12 },
          { thickness: 0.5, quantity: 12 },
          { thickness: 0.25, quantity: 12 },
          { thickness: 0.125, quantity: 8 }
        ];
        
        blockInventory = [...baseBlocks, ...precisionBlocks];
      }
    }

    // Create the vehicle profile
    addProfile({
      name: setupData.vehicleName || `My ${selectedVehicleType?.name || 'Vehicle'}`,
      type: setupData.vehicleType as 'trailer' | 'motorhome' | 'van',
      wheelbaseInches: setupData.wheelbaseInches,
      trackWidthInches: setupData.trackWidthInches,
      hitchOffsetInches: setupData.vehicleType === 'trailer' ? setupData.hitchOffsetInches : undefined,
      blockInventory,
      calibration: createCalibration()
    });

    // Update settings with units and completion
    updateSettings({ 
      hasCompletedOnboarding: true,
      onboardingStep: STEPS.length,
      measurementUnits: setupData.measurementUnits
    });

    // Set the newly created profile as active
    setTimeout(() => {
      const state = useAppStore.getState();
      if (state.profiles.length > 0) {
        setActiveProfile(state.profiles[state.profiles.length - 1].id);
      }
    }, 100);
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const skipOnboarding = () => {
    updateSettings({ 
      hasCompletedOnboarding: true,
      onboardingStep: STEPS.length 
    });
    
    router.replace('/(tabs)');
  };

  // Validation for each step
  const canProceed = () => {
    switch (currentStep) {
      case 3: return !!setupData.measurementUnits; // Units step
      case 4: return !!setupData.vehicleType; // Vehicle type step
      case 5: return !!setupData.vehicleName.trim(); // Vehicle details step
      case 6: // Blocks step
        if (!setupData.hasLevelingBlocks) return true;
        if (setupData.showCustomBlockInput) {
          return setupData.customBlockHeight.trim() !== '' && !isNaN(parseFloat(setupData.customBlockHeight));
        }
        return setupData.selectedBlockHeights.length > 0;
      default: return true;
    }
  };

  // Step rendering functions
  function renderWelcomeStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$blue9" borderRadius="$8">
          <Target size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            Welcome to LevelMate!
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Your Professional RV Leveling Assistant
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$3">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              LevelMate transforms your phone into a precision leveling tool for RVs, trailers, and motorhomes.
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              Whether you're a weekend warrior or full-time RVer, proper leveling is essential for:
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="left">
              • Comfort - Sleep better on a level bed{'\n'}
              • Safety - Prevent items from sliding or falling{'\n'}
              • Appliance protection - Refrigerators need to be level{'\n'}
              • Stability - Reduce rocking and swaying
            </Text>
          </YStack>
        </Card>
      </YStack>
    );
  }

  function renderHowItWorksStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$orange9" borderRadius="$8">
          <AlertTriangle size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            How Leveling Works
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Understanding Pitch and Roll
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$3">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              Your RV can be unlevel in two directions:
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="left">
              • PITCH: Front-to-back (nose up/down){'\n'}
              • ROLL: Side-to-side (left/right high)
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              LevelMate measures both angles using your phone's built-in motion sensors.
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              The goal is to get both pitch and roll as close to 0° as possible. Most RV appliances work fine within ±1° of level.
            </Text>
          </YStack>
        </Card>
      </YStack>
    );
  }

  function renderSafetyStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$red9" borderRadius="$8">
          <AlertTriangle size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            Safety First
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Important Guidelines
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$3">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              Before you start leveling:
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="left">
              • Choose the most level spot available{'\n'}
              • Avoid slopes greater than 8° in any direction{'\n'}
              • Ensure your RV is stable and chocks are in place{'\n'}
              • Never level on soft or unstable ground
            </Text>
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              LevelMate will warn you if angles become unsafe during leveling.
            </Text>
          </YStack>
        </Card>
      </YStack>
    );
  }

  function renderUnitsStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$purple9" borderRadius="$8">
          <Ruler size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            Choose Your Units
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Imperial or Metric Measurements
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$4">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              Choose your preferred measurement system. You can change this later in Settings.
            </Text>
            
            <YStack space="$3">
              <Card
                padding="$4"
                backgroundColor={setupData.measurementUnits === 'imperial' ? '$blue3' : '$background'}
                borderColor={setupData.measurementUnits === 'imperial' ? '$blue9' : '$borderColor'}
                borderWidth={2}
                pressStyle={{ scale: 0.98 }}
                onPress={() => setSetupData(prev => ({ ...prev, measurementUnits: 'imperial' }))}
              >
                <XStack alignItems="center" space="$3">
                  <Card
                    width={20}
                    height={20}
                    borderRadius={10}
                    borderWidth={2}
                    borderColor="$blue9"
                    backgroundColor={setupData.measurementUnits === 'imperial' ? '$blue9' : '$background'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {setupData.measurementUnits === 'imperial' && (
                      <Card width={8} height={8} borderRadius={4} backgroundColor="white" />
                    )}
                  </Card>
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="bold">Imperial</Text>
                    <Text fontSize="$3" color="$colorPress">Inches, feet (US standard)</Text>
                  </YStack>
                </XStack>
              </Card>
              
              <Card
                padding="$4"
                backgroundColor={setupData.measurementUnits === 'metric' ? '$blue3' : '$background'}
                borderColor={setupData.measurementUnits === 'metric' ? '$blue9' : '$borderColor'}
                borderWidth={2}
                pressStyle={{ scale: 0.98 }}
                onPress={() => setSetupData(prev => ({ ...prev, measurementUnits: 'metric' }))}
              >
                <XStack alignItems="center" space="$3">
                  <Card
                    width={20}
                    height={20}
                    borderRadius={10}
                    borderWidth={2}
                    borderColor="$blue9"
                    backgroundColor={setupData.measurementUnits === 'metric' ? '$blue9' : '$background'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {setupData.measurementUnits === 'metric' && (
                      <Card width={8} height={8} borderRadius={4} backgroundColor="white" />
                    )}
                  </Card>
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="bold">Metric</Text>
                    <Text fontSize="$3" color="$colorPress">Centimeters, meters (International)</Text>
                  </YStack>
                </XStack>
              </Card>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    );
  }

  function renderVehicleStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$green9" borderRadius="$8">
          <Zap size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            Your Vehicle
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            What type of RV do you have?
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$4">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              This helps us provide accurate measurements and setup defaults for your vehicle type.
            </Text>
            
            <YStack space="$3">
              {VEHICLE_TYPES.map((vehicleType) => {
                const Icon = vehicleType.icon;
                const isSelected = setupData.vehicleType === vehicleType.id;
                
                return (
                  <Card
                    key={vehicleType.id}
                    padding="$4"
                    backgroundColor={isSelected ? '$blue3' : '$background'}
                    borderColor={isSelected ? '$blue9' : '$borderColor'}
                    borderWidth={2}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => setSetupData(prev => ({ ...prev, vehicleType: vehicleType.id as any }))}
                  >
                    <XStack space="$3" alignItems="center">
                      <Card padding="$3" backgroundColor={isSelected ? '$blue9' : '$gray6'}>
                        <Icon size={32} color={isSelected ? 'white' : '$color'} />
                      </Card>
                      <YStack flex={1} space="$1">
                        <Text fontSize="$6" fontWeight="bold" color="$color">
                          {vehicleType.name}
                        </Text>
                        <Text fontSize="$4" color="$colorPress">
                          {vehicleType.description}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                );
              })}
            </YStack>
          </YStack>
        </Card>
      </YStack>
    );
  }

  function renderVehicleDetailsStep() {
    return (
      <ScrollView>
        <YStack space="$4" alignItems="center">
          <Card padding="$6" backgroundColor="$purple9" borderRadius="$8">
            {selectedVehicleType && <selectedVehicleType.icon size={64} color="white" />}
          </Card>
          
          <YStack space="$2" alignItems="center">
            <H1 color="$color" textAlign="center" fontSize="$9">
              Vehicle Details
            </H1>
            <H2 color="$colorPress" textAlign="center" fontSize="$6">
              Tell us about your {selectedVehicleType?.name}
            </H2>
          </YStack>

          <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
            <YStack space="$4">
              <YStack space="$2">
                <Label htmlFor="vehicle-name">Vehicle Name</Label>
                <Input
                  id="vehicle-name"
                  size="$5"
                  placeholder={`My ${selectedVehicleType?.name}`}
                  value={setupData.vehicleName}
                  onChangeText={(text) => setSetupData(prev => ({ ...prev, vehicleName: text }))}
                />
                <Text color="$colorPress" fontSize="$3">
                  Give your vehicle a memorable name (e.g., "Big Blue", "Family Trailer")
                </Text>
              </YStack>

              <Card padding="$4" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
                <YStack space="$2">
                  <Text fontWeight="bold">Great news!</Text>
                  <Text color="$colorPress" fontSize="$3">
                    We'll use typical measurements for your {selectedVehicleType?.name}. You can adjust these later if needed.
                  </Text>
                  <Text color="$colorPress" fontSize="$3">
                    {(() => {
                      const typical = typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
                      if (!typical) return 'Loading measurements...';
                      
                      let text = `• Wheelbase: ${formatMeasurement(convertToInches(typical.wheelbase, setupData.measurementUnits), setupData.measurementUnits)}\n`;
                      text += `• Track Width: ${formatMeasurement(convertToInches(typical.track, setupData.measurementUnits), setupData.measurementUnits)}`;
                      
                      if (setupData.vehicleType === 'trailer' && typical.hitch) {
                        text += `\n• Hitch Offset: ${formatMeasurement(convertToInches(typical.hitch, setupData.measurementUnits), setupData.measurementUnits)}`;
                      }
                      
                      return text;
                    })()}
                  </Text>
                </YStack>
              </Card>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    );
  }

  function renderBlocksStep() {
    return (
      <ScrollView>
        <YStack space="$4" alignItems="center">
          <Card padding="$6" backgroundColor="$green9" borderRadius="$8">
            <Package size={64} color="white" />
          </Card>
          
          <YStack space="$2" alignItems="center">
            <H1 color="$color" textAlign="center" fontSize="$9">
              Leveling Blocks
            </H1>
            <H2 color="$colorPress" textAlign="center" fontSize="$6">
              Do you have leveling blocks?
            </H2>
          </YStack>

          <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
            <YStack space="$4">
              <Card padding="$4" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
                <YStack space="$3">
                  <XStack space="$2" alignItems="center">
                    <Package size={20} color="$blue9" />
                    <Text fontWeight="bold">Block Inventory</Text>
                  </XStack>
                  <XStack space="$2" alignItems="center">
                    <Switch
                      size="$4"
                      checked={setupData.hasLevelingBlocks}
                      onCheckedChange={(checked) => setSetupData(prev => ({ ...prev, hasLevelingBlocks: checked }))}
                    >
                      <Switch.Thumb animation="quick" />
                    </Switch>
                    <Text>I have leveling blocks</Text>
                  </XStack>
                  <Text color="$colorPress" fontSize="$3">
                    {setupData.hasLevelingBlocks 
                      ? "Great! Select your block heights below for precise leveling instructions."
                      : "No problem! The app will show you exact measurements instead."
                    }
                  </Text>
                </YStack>
              </Card>

              {setupData.hasLevelingBlocks && (
                <YStack space="$4">
                  <Text fontWeight="bold" textAlign="center">
                    What block heights do you have?
                  </Text>
                  
                  <YStack space="$3">
                    {getCommonBlockHeights(setupData.measurementUnits).map((block) => (
                      <Card
                        key={block.value}
                        padding="$3"
                        backgroundColor={setupData.selectedBlockHeights.includes(block.value) ? '$green2' : '$background'}
                        borderColor={setupData.selectedBlockHeights.includes(block.value) ? '$green9' : '$borderColor'}
                        borderWidth={1}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => {
                          setSetupData(prev => ({
                            ...prev,
                            selectedBlockHeights: prev.selectedBlockHeights.includes(block.value)
                              ? prev.selectedBlockHeights.filter(h => h !== block.value)
                              : [...prev.selectedBlockHeights, block.value].sort((a, b) => a - b)
                          }));
                        }}
                      >
                        <XStack space="$3" alignItems="center">
                          <Card
                            width={24}
                            height={24}
                            borderRadius={4}
                            borderWidth={2}
                            borderColor="$green9"
                            backgroundColor={setupData.selectedBlockHeights.includes(block.value) ? '$green9' : '$background'}
                            justifyContent="center"
                            alignItems="center"
                          >
                            {setupData.selectedBlockHeights.includes(block.value) && (
                              <Text color="white" fontSize="$3" fontWeight="bold">✓</Text>
                            )}
                          </Card>
                          <YStack flex={1}>
                            <Text fontSize="$5" fontWeight="bold">
                              {block.label}
                            </Text>
                            <Text fontSize="$3" color="$colorPress">
                              {block.description}
                            </Text>
                          </YStack>
                        </XStack>
                      </Card>
                    ))}

                    {/* Custom block option */}
                    <Card
                      padding="$3"
                      backgroundColor={setupData.showCustomBlockInput ? '$blue2' : '$background'}
                      borderColor={setupData.showCustomBlockInput ? '$blue9' : '$borderColor'}
                      borderWidth={1}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => {
                        setSetupData(prev => ({
                          ...prev,
                          showCustomBlockInput: !prev.showCustomBlockInput,
                          selectedBlockHeights: prev.showCustomBlockInput ? prev.selectedBlockHeights : []
                        }));
                      }}
                    >
                      <XStack space="$3" alignItems="center">
                        <Card
                          width={24}
                          height={24}
                          borderRadius={4}
                          borderWidth={2}
                          borderColor="$blue9"
                          backgroundColor={setupData.showCustomBlockInput ? '$blue9' : '$background'}
                          justifyContent="center"
                          alignItems="center"
                        >
                          {setupData.showCustomBlockInput && (
                            <Text color="white" fontSize="$3" fontWeight="bold">✓</Text>
                          )}
                        </Card>
                        <YStack flex={1}>
                          <Text fontSize="$5" fontWeight="bold">
                            Custom Size
                          </Text>
                          <Text fontSize="$3" color="$colorPress">
                            Enter your own block height
                          </Text>
                        </YStack>
                      </XStack>
                    </Card>
                  </YStack>

                  {/* Custom input field */}
                  {setupData.showCustomBlockInput && (
                    <YStack space="$2">
                      <Label htmlFor="custom-block">Custom Block Height</Label>
                      <XStack space="$2" alignItems="center">
                        <Input
                          id="custom-block"
                          flex={1}
                          size="$4"
                          placeholder={setupData.measurementUnits === 'imperial' ? 'e.g., 1.5' : 'e.g., 3.8'}
                          value={setupData.customBlockHeight}
                          onChangeText={(text) => setSetupData(prev => ({ ...prev, customBlockHeight: text }))}
                          keyboardType="decimal-pad"
                        />
                        <Text color="$colorPress" fontSize="$4" minWidth={30}>
                          {setupData.measurementUnits === 'imperial' ? 'in' : 'cm'}
                        </Text>
                      </XStack>
                      <Text color="$colorPress" fontSize="$3">
                        Enter the height of your custom leveling blocks
                      </Text>
                    </YStack>
                  )}

                  {/* Summary */}
                  {!setupData.showCustomBlockInput && setupData.selectedBlockHeights.length > 0 && (
                    <Card padding="$3" backgroundColor="$green2" borderColor="$green9" borderWidth={1}>
                      <Text color="$green11" fontSize="$3" textAlign="center">
                        ✓ Selected: {setupData.selectedBlockHeights.map(h => formatMeasurement(h, setupData.measurementUnits, 0)).join(', ')}
                      </Text>
                    </Card>
                  )}

                  {setupData.showCustomBlockInput && setupData.customBlockHeight.trim() && !isNaN(parseFloat(setupData.customBlockHeight)) && (
                    <Card padding="$3" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
                      <Text color="$blue11" fontSize="$3" textAlign="center">
                        ✓ Custom: {formatMeasurement(convertToInches(parseFloat(setupData.customBlockHeight), setupData.measurementUnits), setupData.measurementUnits, 1)}
                      </Text>
                    </Card>
                  )}
                </YStack>
              )}
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    );
  }

  function renderCompletionStep() {
    return (
      <YStack space="$4" alignItems="center">
        <Card padding="$6" backgroundColor="$green9" borderRadius="$8">
          <CheckCircle size={64} color="white" />
        </Card>
        
        <YStack space="$2" alignItems="center">
          <H1 color="$color" textAlign="center" fontSize="$9">
            Ready to Level!
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Your setup is complete
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$4">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              Perfect! We've set up LevelMate with your preferences:
            </Text>
            
            <YStack space="$2">
              <Text color="$color" fontSize="$4">
                📱 <Text fontWeight="bold">Units:</Text> {setupData.measurementUnits === 'imperial' ? 'Imperial (inches/feet)' : 'Metric (cm/meters)'}
              </Text>
              <Text color="$color" fontSize="$4">
                🚐 <Text fontWeight="bold">Vehicle:</Text> {setupData.vehicleName || `My ${selectedVehicleType?.name}`}
              </Text>
              <Text color="$color" fontSize="$4">
                📦 <Text fontWeight="bold">Blocks:</Text> {(() => {
                  if (!setupData.hasLevelingBlocks) return 'Measurement mode';
                  if (setupData.showCustomBlockInput && setupData.customBlockHeight.trim()) {
                    return `Custom (${formatMeasurement(convertToInches(parseFloat(setupData.customBlockHeight), setupData.measurementUnits), setupData.measurementUnits, 1)})`;
                  }
                  return `${setupData.selectedBlockHeights.length} height${setupData.selectedBlockHeights.length !== 1 ? 's' : ''}`;
                })()}
              </Text>
            </YStack>

            <Card padding="$4" backgroundColor="$green2" borderColor="$green9" borderWidth={1}>
              <Text color="$green11" fontSize="$4" textAlign="center" fontWeight="bold">
                You're all set! Tap "Get Started" to begin leveling.
              </Text>
            </Card>
          </YStack>
        </Card>
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val || '#000' }}>
      <YStack 
        flex={1} 
        padding="$3" 
        space="$4"
      >
        {/* Progress Indicator */}
        <XStack space="$2" justifyContent="center" alignItems="center">
          {STEPS.map((_, index) => (
            <Card
              key={index}
              width={12}
              height={12}
              backgroundColor={index <= currentStep ? '$blue9' : '$gray6'}
              borderRadius="$10"
            />
          ))}
        </XStack>

        {/* Content */}
        <ScrollView 
          flex={1} 
          showsVerticalScrollIndicator={false}
        >
          <YStack space="$5" paddingBottom="$7">
            {currentStepData.component()}
          </YStack>
        </ScrollView>

        {/* Navigation */}
        <YStack space="$3">
          <XStack space="$3">
            {currentStep > 0 && (
              <Button
                flex={1}
                size="$5"
                backgroundColor="$gray9"
                pressStyle={{ scale: 0.95 }}
                onPress={handleBack}
                icon={ArrowLeft}
              >
                Back
              </Button>
            )}
            
            <Button
              flex={1}
              size="$5"
              backgroundColor="$blue9"
              pressStyle={{ scale: 0.95 }}
              onPress={handleNext}
              disabled={!canProceed()}
              iconAfter={currentStep < STEPS.length - 1 ? ArrowRight : CheckCircle}
            >
              {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </XStack>

          {/* Skip Option */}
          <Button
            size="$4"
            backgroundColor="transparent"
            color="$colorPress"
            pressStyle={{ scale: 0.95 }}
            onPress={skipOnboarding}
          >
            Skip Tutorial
          </Button>
        </YStack>

        {/* Step Counter */}
        <Text color="$colorPress" fontSize="$3" textAlign="center">
          {currentStep + 1} of {STEPS.length}
        </Text>
      </YStack>
    </SafeAreaView>
  );
}
