import React, { useState } from 'react';
import { YStack, XStack, Text, Button, H1, H2, Card, ScrollView, useTheme, Switch, Input, Label, Checkbox } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowRight, ArrowLeft, Target, AlertTriangle, Zap, CheckCircle, Caravan, Bus, Truck, Ruler, Package, Info } from '@tamagui/lucide-icons';
import { useAppStore } from '../src/state/appStore';
import { StandardBlockSets, BlockInventory } from '../src/lib/rvLevelingMath';
import { createCalibration } from '../src/lib/levelingMath';
import { formatMeasurement, getTypicalMeasurements, getCommonBlockHeights, convertToInches, convertForDisplay } from '../src/lib/units';

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    icon: Caravan
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    description: 'Self-contained with engine, drives itself',
    icon: Bus
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    description: 'Converted van or small RV',
    icon: Truck
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
    selectedBlockHeights: [0.75, 1] as number[],
    customBlockHeight: ''
  });
  
  const [useTypicalMeasurements, setUseTypicalMeasurements] = useState(true);

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
      // Build block inventory based on selected heights (user manages actual quantity)
      blockInventory = setupData.selectedBlockHeights.map(height => ({
        thickness: height,
        quantity: 20 // Sufficient quantity for calculations
      }));
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
            Welcome to FlatFinder!
          </H1>
          <H2 color="$colorPress" textAlign="center" fontSize="$6">
            Your Professional RV Leveling Assistant
          </H2>
        </YStack>

        <Card padding="$6" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" width="100%">
          <YStack space="$3">
            <Text color="$color" fontSize="$4" lineHeight="$4" textAlign="center">
              FlatFinder transforms your phone into a precision leveling tool for RVs, trailers, and motorhomes.
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
              FlatFinder measures both angles using your phone's built-in motion sensors.
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
              FlatFinder will warn you if angles become unsafe during leveling.
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

              <YStack space="$4">
                {/* Typical vs Custom measurements toggle */}
                <YStack space="$3">
                  <Card
                    padding="$3"
                    backgroundColor={useTypicalMeasurements ? '$blue2' : '$background'}
                    borderColor={useTypicalMeasurements ? '$blue9' : '$borderColor'}
                    borderWidth={1}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => {
                      setUseTypicalMeasurements(true);
                      // Reset to typical measurements when toggled
                      const typical = typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
                      if (typical) {
                        setSetupData(prev => ({
                          ...prev,
                          wheelbaseInches: convertToInches(typical.wheelbase, setupData.measurementUnits),
                          trackWidthInches: convertToInches(typical.track, setupData.measurementUnits),
                          hitchOffsetInches: convertToInches(typical.hitch || 0, setupData.measurementUnits)
                        }));
                      }
                    }}
                  >
                    <XStack space="$3" alignItems="center">
                      <Card
                        width={20}
                        height={20}
                        borderRadius={10}
                        borderWidth={2}
                        borderColor="$blue9"
                        backgroundColor={useTypicalMeasurements ? '$blue9' : '$background'}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {useTypicalMeasurements && (
                          <Card width={10} height={10} borderRadius={5} backgroundColor="white" />
                        )}
                      </Card>
                      <YStack flex={1}>
                        <Text fontSize="$5" fontWeight="bold">
                          Use typical measurements
                        </Text>
                        <Text fontSize="$3" color="$colorPress">
                          Perfect for most {selectedVehicleType?.name}s
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>

                  <Card
                    padding="$3"
                    backgroundColor={!useTypicalMeasurements ? '$orange2' : '$background'}
                    borderColor={!useTypicalMeasurements ? '$orange9' : '$borderColor'}
                    borderWidth={1}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => setUseTypicalMeasurements(false)}
                  >
                    <XStack space="$3" alignItems="center">
                      <Card
                        width={20}
                        height={20}
                        borderRadius={10}
                        borderWidth={2}
                        borderColor="$orange9"
                        backgroundColor={!useTypicalMeasurements ? '$orange9' : '$background'}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {!useTypicalMeasurements && (
                          <Card width={10} height={10} borderRadius={5} backgroundColor="white" />
                        )}
                      </Card>
                      <YStack flex={1}>
                        <Text fontSize="$5" fontWeight="bold">
                          Enter custom measurements
                        </Text>
                        <Text fontSize="$3" color="$colorPress">
                          For exact precision
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                </YStack>

                {/* Show measurements based on choice */}
                {useTypicalMeasurements ? (
                  <Card padding="$4" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
                    <YStack space="$2">
                      <Text fontWeight="bold">Typical {selectedVehicleType?.name} measurements:</Text>
                      <Text color="$colorPress" fontSize="$3">
                        {(() => {
                          const typical = typicalMeasurements[setupData.vehicleType as keyof typeof typicalMeasurements];
                          if (!typical) return 'Loading measurements...';
                          
                          let text = `• ${setupData.vehicleType === 'trailer' ? 'Hitch to Axle' : 'Wheelbase'}: ${formatMeasurement(convertToInches(typical.wheelbase, setupData.measurementUnits), setupData.measurementUnits, 0, true)}\n`;
                          text += `• Track Width: ${formatMeasurement(convertToInches(typical.track, setupData.measurementUnits), setupData.measurementUnits, 0, true)}`;
                          
                          return text;
                        })()}
                      </Text>
                      <Text fontSize="$2" color="$colorPress" fontStyle="italic">
                        You can adjust these later if needed
                      </Text>
                    </YStack>
                  </Card>
                ) : (
                  <YStack space="$4">
                    {/* Custom Hitch Distance Input (trailers only) - Show FIRST */}
                    {setupData.vehicleType === 'trailer' && (
                      <YStack space="$2">
                        <Text fontSize="$5" fontWeight="bold">Hitch to Axle Distance</Text>
                        <Text color="$colorPress" fontSize="$3">
                          Distance from hitch ball to rear axle center
                        </Text>
                        <XStack space="$2" alignItems="center">
                          <Input
                            flex={1}
                            size="$5"
                            placeholder={`e.g., ${setupData.measurementUnits === 'metric' ? '305' : '120'}`}
                            value={setupData.measurementUnits === 'metric' 
                              ? Math.round(setupData.hitchOffsetInches * 2.54).toString()
                              : setupData.hitchOffsetInches.toString()
                            }
                            onChangeText={(text) => {
                              const num = parseFloat(text) || 0;
                              const inches = convertToInches(num, setupData.measurementUnits);
                              setSetupData(prev => ({ 
                                ...prev, 
                                hitchOffsetInches: inches,
                                wheelbaseInches: inches // For trailers, hitch offset IS the wheelbase
                              }));
                            }}
                            keyboardType="decimal-pad"
                          />
                          <Text color="$colorPress" fontSize="$4" minWidth={50}>
                            {setupData.measurementUnits === 'metric' ? 'cm' : 'inches'}
                          </Text>
                        </XStack>
                      </YStack>
                    )}

                    {/* Custom Wheelbase Input (motorhomes and vans only) */}
                    {setupData.vehicleType !== 'trailer' && (
                      <YStack space="$2">
                        <Text fontSize="$5" fontWeight="bold">Wheelbase Length</Text>
                        <Text color="$colorPress" fontSize="$3">
                          Distance from front axle to rear axle center-to-center
                        </Text>
                        <XStack space="$2" alignItems="center">
                          <Input
                            flex={1}
                            size="$5"
                            placeholder={`e.g., ${setupData.measurementUnits === 'metric' ? '610' : '240'}`}
                            value={setupData.measurementUnits === 'metric' 
                              ? Math.round(setupData.wheelbaseInches * 2.54).toString()
                              : setupData.wheelbaseInches.toString()
                            }
                            onChangeText={(text) => {
                              const num = parseFloat(text) || 0;
                              setSetupData(prev => ({ 
                                ...prev, 
                                wheelbaseInches: convertToInches(num, setupData.measurementUnits)
                              }));
                            }}
                            keyboardType="decimal-pad"
                          />
                          <Text color="$colorPress" fontSize="$4" minWidth={50}>
                            {setupData.measurementUnits === 'metric' ? 'cm' : 'inches'}
                          </Text>
                        </XStack>
                      </YStack>
                    )}

                    {/* Custom Track Width Input */}
                    <YStack space="$2">
                      <Text fontSize="$5" fontWeight="bold">Track Width</Text>
                      <Text color="$colorPress" fontSize="$3">
                        Distance between left and right wheels
                      </Text>
                      <XStack space="$2" alignItems="center">
                        <Input
                          flex={1}
                          size="$5"
                          placeholder={`e.g., ${setupData.measurementUnits === 'metric' ? '244' : '96'}`}
                          value={setupData.measurementUnits === 'metric' 
                            ? Math.round(setupData.trackWidthInches * 2.54).toString()
                            : setupData.trackWidthInches.toString()
                          }
                          onChangeText={(text) => {
                            const num = parseFloat(text) || 0;
                            setSetupData(prev => ({ 
                              ...prev, 
                              trackWidthInches: convertToInches(num, setupData.measurementUnits)
                            }));
                          }}
                          keyboardType="decimal-pad"
                        />
                        <Text color="$colorPress" fontSize="$4" minWidth={50}>
                          {setupData.measurementUnits === 'metric' ? 'cm' : 'inches'}
                        </Text>
                      </XStack>
                    </YStack>

                  </YStack>
                )}
              </YStack>
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
                  
                  <Card padding="$3" backgroundColor="$cyan1" borderColor="$cyan6" borderWidth={1}>
                    <Text color="$cyan11" fontSize="$3" fontWeight="600" marginBottom="$2">💡 Block Selection Tips:</Text>
                    <Text color="$cyan11" fontSize="$3" marginBottom="$1">
                      • Select all heights you own - the app will optimize which to use
                    </Text>
                    <Text color="$cyan11" fontSize="$3" marginBottom="$1">
                      • Common heights: 3/4", 1", 1½", 2" blocks work for most situations
                    </Text>
                    <Text color="$cyan11" fontSize="$3">
                      • You can add custom heights if needed
                    </Text>
                  </Card>
                  
                  <YStack space="$3">
                    {(() => {
                      // Use our defined common block heights only
                      const standardHeights = [0.75, 1, 1.5, 2];
                      const customHeights = setupData.selectedBlockHeights.filter(h => !standardHeights.includes(h));
                      const allHeights = [...standardHeights, ...customHeights].sort((a, b) => a - b);
                      
                      return allHeights.map((height) => ({ 
                        value: height, 
                        label: formatMeasurement(height, setupData.measurementUnits, 0, true),
                        description: `${formatMeasurement(height, setupData.measurementUnits, 0, true)} leveling block` 
                      }));
                    })().map((block) => (
                      <Card
                        key={block.value}
                        padding="$3"
                        backgroundColor={setupData.selectedBlockHeights.includes(block.value) ? '$green2' : '$background'}
                        borderColor={setupData.selectedBlockHeights.includes(block.value) ? '$green9' : '$borderColor'}
                        borderWidth={1}
                      >
                        <XStack space="$3" alignItems="center">
                          <Checkbox
                            size="$5"
                            checked={setupData.selectedBlockHeights.includes(block.value)}
                            onCheckedChange={() => {
                              setSetupData(prev => ({
                                ...prev,
                                selectedBlockHeights: prev.selectedBlockHeights.includes(block.value)
                                  ? prev.selectedBlockHeights.filter(h => h !== block.value)
                                  : [...prev.selectedBlockHeights, block.value].sort((a, b) => a - b)
                              }));
                            }}
                          >
                            <Checkbox.Indicator>
                              {setupData.selectedBlockHeights.includes(block.value) ? <Text>✓</Text> : null}
                            </Checkbox.Indicator>
                          </Checkbox>
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
                  </YStack>

                  {/* Custom block input */}
                  <Card padding="$3" backgroundColor="$blue1" borderColor="$blue6" borderWidth={1}>
                    <YStack space="$3">
                      <Text fontWeight="bold">Add Custom Height</Text>
                      <XStack space="$2" alignItems="center">
                        <Input
                          flex={1}
                          size="$4"
                          placeholder={setupData.measurementUnits === 'imperial' ? 'e.g., 1.75' : 'e.g., 4.5'}
                          keyboardType="decimal-pad"
                          value={setupData.customBlockHeight}
                          onChangeText={(text) => setSetupData(prev => ({ ...prev, customBlockHeight: text }))}
                          onSubmitEditing={() => {
                            const value = parseFloat(setupData.customBlockHeight);
                            const maxValue = setupData.measurementUnits === 'metric' ? 30 : 12;
                            if (value && value > 0 && value <= maxValue) {
                              // Convert to inches for internal storage
                              const inches = convertToInches(value, setupData.measurementUnits);
                              if (!setupData.selectedBlockHeights.includes(inches)) {
                                setSetupData(prev => ({
                                  ...prev,
                                  selectedBlockHeights: [...prev.selectedBlockHeights, inches].sort((a, b) => a - b),
                                  customBlockHeight: ''
                                }));
                              }
                            }
                          }}
                        />
                        <Button
                          size="$4"
                          backgroundColor="$blue9"
                          onPress={() => {
                            const value = parseFloat(setupData.customBlockHeight);
                            const maxValue = setupData.measurementUnits === 'metric' ? 30 : 12;
                            if (value && value > 0 && value <= maxValue) {
                              // Convert to inches for internal storage
                              const inches = convertToInches(value, setupData.measurementUnits);
                              if (!setupData.selectedBlockHeights.includes(inches)) {
                                setSetupData(prev => ({
                                  ...prev,
                                  selectedBlockHeights: [...prev.selectedBlockHeights, inches].sort((a, b) => a - b),
                                  customBlockHeight: ''
                                }));
                              }
                            }
                          }}
                          disabled={!setupData.customBlockHeight.trim()}
                        >
                          Add
                        </Button>
                        <Text>{setupData.measurementUnits === 'imperial' ? 'inches' : 'cm'}</Text>
                      </XStack>
                      <Text fontSize="$2" color="$colorPress">
                        Enter a custom block height ({setupData.measurementUnits === 'imperial' ? '0.1 - 12 inches' : '0.5 - 30 cm'})
                      </Text>
                    </YStack>
                  </Card>

                  {/* Validation messages */}
                  {setupData.selectedBlockHeights.length === 0 && (
                    <Card padding="$3" backgroundColor="$yellow2" borderColor="$yellow9" borderWidth={1}>
                      <Text color="$yellow11" fontSize="$3">
                        Please select at least one block height, or turn off "I have leveling blocks" above.
                      </Text>
                    </Card>
                  )}

                  {setupData.selectedBlockHeights.length > 0 && (
                    <Card padding="$3" backgroundColor="$green2" borderColor="$green9" borderWidth={1}>
                      <Text color="$green11" fontSize="$3" textAlign="center">
                        ✓ Selected: {setupData.selectedBlockHeights.map(h => formatMeasurement(h, setupData.measurementUnits, 0, true)).join(', ')}
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
              Perfect! We've set up FlatFinder with your preferences:
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
                    return `Custom (${formatMeasurement(convertToInches(parseFloat(setupData.customBlockHeight), setupData.measurementUnits), setupData.measurementUnits, 1, true)})`;
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
        <YStack space="$2">
          <XStack space="$3">
            {currentStep > 0 && (
              <Button
                flex={1}
                size="$4"
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
              size="$4"
              backgroundColor="$blue9"
              pressStyle={{ scale: 0.95 }}
              onPress={handleNext}
              disabled={!canProceed()}
              iconAfter={currentStep < STEPS.length - 1 ? ArrowRight : CheckCircle}
            >
              {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </XStack>

          <XStack justifyContent="space-between" alignItems="center">
            {/* Skip Option */}
            <Button
              size="$3"
              backgroundColor="transparent"
              color="$colorPress"
              pressStyle={{ scale: 0.95 }}
              onPress={skipOnboarding}
            >
              Skip Tutorial
            </Button>

            {/* Step Counter */}
            <Text color="$colorPress" fontSize="$3">
              {currentStep + 1} of {STEPS.length}
            </Text>
          </XStack>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
