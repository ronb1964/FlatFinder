import React, { useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  H2,
  H3,
  Card,
  ScrollView,
  Input,
  Label,
  RadioGroup,
  Sheet,
  useTheme,
  Switch,
  Checkbox,
} from 'tamagui';
import { ArrowRight, ArrowLeft, Car, Truck, Home, Ruler, Info, Package } from '@tamagui/lucide-icons';
import { StandardBlockSets, BlockInventory } from '../lib/rvLevelingMath';
import { createCalibration } from '../lib/levelingMath';
import { formatMeasurement, getTypicalMeasurements, getCommonBlockHeights, convertToInches, convertForDisplay } from '../lib/units';
import { useAppStore } from '../state/appStore';

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
}

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    description: 'Towed behind a vehicle, has a hitch',
    icon: Truck
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    description: 'Self-contained with engine, drives itself',
    icon: Home
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    description: 'Converted van or small RV',
    icon: Car
  }
];

const MEASUREMENT_INFO = {
  wheelbase: {
    title: "Wheelbase Length",
    description: "Distance from front axle to rear axle",
    howToMeasure: "Measure from the center of your front wheel to the center of your rear wheel on the same side.",
    typical: "Most travel trailers: 20-22 feet (240-264 inches)",
    tips: [
      "Look for axle centerlines - usually marked on RV specs or owner's manual",
      "If unsure, measure from wheel center to wheel center",
      "This measurement affects front-to-back leveling calculations"
    ]
  },
  track: {
    title: "Track Width", 
    description: "Distance between left and right wheels",
    howToMeasure: "Measure from the center of your left wheel to the center of your right wheel on the same axle.",
    typical: "Most RVs: 6-8 feet (72-96 inches)",
    tips: [
      "Measure across the same axle (front or rear - they're usually the same)",
      "Use the center of each tire, not the outside edge",
      "This measurement affects side-to-side leveling calculations"
    ]
  },
  hitch: {
    title: "Hitch Offset",
    description: "Distance from rear axle to hitch ball",
    howToMeasure: "Measure from the center of your rear axle to the center of your hitch ball.",
    typical: "Most travel trailers: 8-12 feet (96-144 inches)",
    tips: [
      "Only needed for travel trailers (not motorhomes)",
      "Affects weight distribution calculations",
      "If you don't know, estimate based on your trailer length"
    ]
  }
};

export function VehicleSetupWizard({ onComplete, onCancel, isVisible }: VehicleSetupWizardProps) {
  const { settings } = useAppStore();
  const [step, setStep] = useState(0);
  
  // Get typical measurements based on user's unit preference
  const typicalMeasurements = getTypicalMeasurements(settings.measurementUnits);
  
  const [profile, setProfile] = useState({
    name: '',
    type: 'trailer' as 'trailer' | 'motorhome' | 'van',
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
    blockInventory: StandardBlockSets.basic()
  });
  const [useTypicalMeasurements, setUseTypicalMeasurements] = useState(true);
  const [hasLevelingBlocks, setHasLevelingBlocks] = useState(true);
  const [selectedBlockHeights, setSelectedBlockHeights] = useState<number[]>([2, 4]);

  const selectedVehicleType = VEHICLE_TYPES.find(v => v.id === profile.type);

  const handleNext = () => {
    if (step === 0 && selectedVehicleType) {
      // Apply typical measurements when vehicle type is selected
      const typical = typicalMeasurements[profile.type];
      setProfile(prev => ({
        ...prev,
        wheelbaseInches: convertToInches(typical.wheelbase, settings.measurementUnits),
        trackWidthInches: convertToInches(typical.track, settings.measurementUnits),
        hitchOffsetInches: convertToInches(typical.hitch, settings.measurementUnits)
      }));
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = () => {
    try {
      console.log('VehicleSetupWizard - Starting completion...');
      
      // Build block inventory based on user selections
      const blockInventory: BlockInventory[] = hasLevelingBlocks 
        ? selectedBlockHeights.map(height => ({
            heightInches: height,
            quantity: 4 // Default to 4 blocks per height
          }))
        : [];

      console.log('VehicleSetupWizard - Block inventory:', blockInventory);
      console.log('VehicleSetupWizard - Profile data:', profile);

      const profileData = {
        ...profile,
        hitchOffsetInches: profile.type === 'trailer' ? profile.hitchOffsetInches : undefined,
        blockInventory
      };

      console.log('VehicleSetupWizard - Final profile data:', profileData);
      
      onComplete(profileData);
      
      console.log('VehicleSetupWizard - onComplete called successfully');
    } catch (error) {
      console.error('VehicleSetupWizard - Error during completion:', error);
    }
  };

  const renderVehicleTypeStep = () => (
    <YStack space="$4">
      <YStack space="$2" alignItems="center">
        <H2 color="$color" textAlign="center">What type of vehicle do you have?</H2>
        <Text color="$colorPress" textAlign="center" fontSize="$4">
          This helps us set up realistic measurements for your vehicle.
        </Text>
      </YStack>

      <YStack space="$3">
        {VEHICLE_TYPES.map((vehicleType) => {
          const Icon = vehicleType.icon;
          const isSelected = profile.type === vehicleType.id;
          
          return (
            <Card
              key={vehicleType.id}
              padding="$4"
              backgroundColor={isSelected ? '$blue3' : '$background'}
              borderColor={isSelected ? '$blue9' : '$borderColor'}
              borderWidth={2}
              pressStyle={{ scale: 0.98 }}
              onPress={() => setProfile(prev => ({ ...prev, type: vehicleType.id as any }))}
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
  );

  const renderNameStep = () => (
    <YStack space="$4">
      <YStack space="$2" alignItems="center">
        <H2 color="$color" textAlign="center">Give your {selectedVehicleType?.name} a name</H2>
        <Text color="$colorPress" textAlign="center" fontSize="$4">
          This helps you identify it if you have multiple vehicles.
        </Text>
      </YStack>

      <YStack space="$3">
        <Label htmlFor="vehicle-name">Vehicle Name</Label>
        <Input
          id="vehicle-name"
          size="$5"
          placeholder={`My ${selectedVehicleType?.name}`}
          value={profile.name}
          onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
        />
        <Card padding="$3" backgroundColor="$purple1" borderColor="$purple6" borderWidth={1}>
          <Text color="$purple11" fontSize="$3" fontWeight="600" marginBottom="$2">💡 Naming Tips:</Text>
          <Text color="$purple11" fontSize="$3" marginBottom="$1">
            • Use something memorable and descriptive
          </Text>
          <Text color="$purple11" fontSize="$3" marginBottom="$1">
            • Consider color, size, or brand (e.g., "Big Blue", "Little Winnebago")
          </Text>
          <Text color="$purple11" fontSize="$3">
            • Helpful if you have multiple RVs or share the app
          </Text>
        </Card>
      </YStack>
    </YStack>
  );

  const renderMeasurementsStep = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <YStack space="$4">
        <YStack space="$2" alignItems="center">
          <H2 color="$color" textAlign="center">Vehicle Measurements</H2>
          <Text color="$colorPress" textAlign="center" fontSize="$4">
            We need a few measurements to calculate leveling accurately.
          </Text>
        </YStack>

        {/* Simplified radio button selection */}
        <YStack space="$2">
          <Card 
            padding="$3" 
            backgroundColor={useTypicalMeasurements ? "$blue2" : "$background"}
            borderColor={useTypicalMeasurements ? "$blue9" : "$borderColor"}
            borderWidth={1}
            pressStyle={{ scale: 0.98 }}
            onPress={() => setUseTypicalMeasurements(true)}
          >
            <XStack space="$3" alignItems="center">
              <Card
                width={20}
                height={20}
                borderRadius={10}
                backgroundColor={useTypicalMeasurements ? "$blue9" : "$background"}
                borderColor={useTypicalMeasurements ? "$blue9" : "$borderColor"}
                borderWidth={2}
                justifyContent="center"
                alignItems="center"
              >
                {useTypicalMeasurements && (
                  <Card
                    width={8}
                    height={8}
                    borderRadius={4}
                    backgroundColor="white"
                  />
                )}
              </Card>
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="600">Use Typical Values</Text>
                <Text fontSize="$3" color="$colorPress">Quick setup with standard measurements</Text>
              </YStack>
            </XStack>
          </Card>
          
          <Card 
            padding="$3" 
            backgroundColor={!useTypicalMeasurements ? "$blue2" : "$background"}
            borderColor={!useTypicalMeasurements ? "$blue9" : "$borderColor"}
            borderWidth={1}
            pressStyle={{ scale: 0.98 }}
            onPress={() => setUseTypicalMeasurements(false)}
          >
            <XStack space="$3" alignItems="center">
              <Card
                width={20}
                height={20}
                borderRadius={10}
                backgroundColor={!useTypicalMeasurements ? "$blue9" : "$background"}
                borderColor={!useTypicalMeasurements ? "$blue9" : "$borderColor"}
                borderWidth={2}
                justifyContent="center"
                alignItems="center"
              >
                {!useTypicalMeasurements && (
                  <Card
                    width={8}
                    height={8}
                    borderRadius={4}
                    backgroundColor="white"
                  />
                )}
              </Card>
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="600">Enter Custom Values</Text>
                <Text fontSize="$3" color="$colorPress">Most accurate for your specific vehicle</Text>
              </YStack>
            </XStack>
          </Card>
        </YStack>

        {/* Measurements */}
        <YStack space="$4">
          {/* Wheelbase */}
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <Ruler size={20} color="$blue10" />
              <Text fontSize="$5" fontWeight="600" color="$blue11">
                Wheelbase Length ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>
            </XStack>
            
            {useTypicalMeasurements ? (
              <Card padding="$3" backgroundColor="$gray2">
                <Text fontSize="$4" fontWeight="500">
                  {settings.measurementUnits === 'metric' 
                    ? `${Math.round(profile.wheelbaseInches * 2.54)} cm`
                    : `${profile.wheelbaseInches}"`
                  }
                </Text>
                <Text fontSize="$3" color="$colorPress">
                  Standard for {selectedVehicleType?.name}
                </Text>
              </Card>
            ) : (
              <YStack space="$2">
                <Input
                  size="$5"
                  placeholder={`e.g., ${convertForDisplay(240, settings.measurementUnits)} ${settings.measurementUnits === 'metric' ? 'cm' : 'inches'}`}
                  value={convertForDisplay(profile.wheelbaseInches, settings.measurementUnits).toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setProfile(prev => ({ 
                      ...prev, 
                      wheelbaseInches: convertToInches(num, settings.measurementUnits) 
                    }));
                  }}
                  keyboardType="decimal-pad"
                />
                <Text color="$colorPress" fontSize="$3">
                  Measure center-to-center between front and rear wheels
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Track Width */}
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <Ruler size={20} color="$green10" />
              <Text fontSize="$5" fontWeight="600" color="$green11">
                Track Width ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
              </Text>
            </XStack>
            
            {useTypicalMeasurements ? (
              <Card padding="$3" backgroundColor="$gray2">
                <Text fontSize="$4" fontWeight="500">
                  {settings.measurementUnits === 'metric' 
                    ? `${Math.round(profile.trackWidthInches * 2.54)} cm`
                    : `${profile.trackWidthInches}"`
                  }
                </Text>
                <Text fontSize="$3" color="$colorPress">
                  Standard for {selectedVehicleType?.name}
                </Text>
              </Card>
            ) : (
              <YStack space="$2">
                <Input
                  size="$5"
                  placeholder={`e.g., ${convertForDisplay(96, settings.measurementUnits)} ${settings.measurementUnits === 'metric' ? 'cm' : 'inches'}`}
                  value={convertForDisplay(profile.trackWidthInches, settings.measurementUnits).toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setProfile(prev => ({ 
                      ...prev, 
                      trackWidthInches: convertToInches(num, settings.measurementUnits) 
                    }));
                  }}
                  keyboardType="decimal-pad"
                />
                <Text color="$colorPress" fontSize="$3">
                  Measure center-to-center between left and right wheels
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Hitch Offset (only for trailers) */}
          {profile.type === 'trailer' && (
            <YStack space="$2">
              <XStack space="$2" alignItems="center">
                <Ruler size={20} color="$orange10" />
                <Text fontSize="$5" fontWeight="600" color="$orange11">
                  Hitch Offset ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'})
                </Text>
              </XStack>
              
              {useTypicalMeasurements ? (
                <Card padding="$3" backgroundColor="$gray2">
                  <Text fontSize="$4" fontWeight="500">
                    {settings.measurementUnits === 'metric' 
                      ? `${Math.round(profile.hitchOffsetInches * 2.54)} cm`
                      : `${profile.hitchOffsetInches}"`
                    }
                  </Text>
                  <Text fontSize="$3" color="$colorPress">
                    Standard for travel trailers
                  </Text>
                </Card>
              ) : (
                <YStack space="$2">
                  <Input
                    size="$5"
                    placeholder={`e.g., ${convertForDisplay(120, settings.measurementUnits)} ${settings.measurementUnits === 'metric' ? 'cm' : 'inches'}`}
                    value={convertForDisplay(profile.hitchOffsetInches, settings.measurementUnits).toString()}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      setProfile(prev => ({ 
                        ...prev, 
                        hitchOffsetInches: convertToInches(num, settings.measurementUnits) 
                      }));
                    }}
                    keyboardType="decimal-pad"
                  />
                  <Text color="$colorPress" fontSize="$3">
                    Measure from rear axle center to hitch ball
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Single help section at the bottom */}
        <Card padding="$3" backgroundColor="$blue1" borderColor="$blue6" borderWidth={1}>
          <XStack space="$2" alignItems="flex-start">
            <Info size={18} color="$blue11" marginTop="$1" />
            <YStack flex={1} space="$1">
              <Text color="$blue11" fontSize="$3" fontWeight="600">
                {useTypicalMeasurements ? "Using Standard Values" : "Measurement Tips"}
              </Text>
              <Text color="$blue11" fontSize="$3">
                {useTypicalMeasurements 
                  ? "These are typical values for your vehicle type. You can always adjust them later in your profile settings if needed."
                  : "Don't have a tape measure? Check your owner's manual or RV specifications. You can also update these later."}
              </Text>
            </YStack>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );

  const renderBlocksStep = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <YStack space="$4">
        <YStack space="$2" alignItems="center">
          <H2 color="$color" textAlign="center">Leveling Blocks</H2>
          <Text color="$colorPress" textAlign="center" fontSize="$4">
            Do you have leveling blocks to help level your {selectedVehicleType?.name}?
          </Text>
        </YStack>

        {/* Do you have blocks? */}
        <Card padding="$4" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
          <YStack space="$3">
            <XStack space="$2" alignItems="center">
              <Package size={20} color="$blue9" />
              <Text fontWeight="bold">Leveling Block Inventory</Text>
            </XStack>
            <XStack space="$2" alignItems="center">
              <Switch
                size="$4"
                checked={hasLevelingBlocks}
                onCheckedChange={setHasLevelingBlocks}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
              <Text>I have leveling blocks</Text>
            </XStack>
            <Text color="$colorPress" fontSize="$3">
              {hasLevelingBlocks 
                ? "Great! This will help you get precise leveling instructions with block counts."
                : "No problem! The app will show you exact measurements instead of block counts."
              }
            </Text>
          </YStack>
        </Card>

        {/* Block selection if they have blocks */}
        {hasLevelingBlocks && (
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
                • Common heights: 1", 2", 4" blocks work for most situations
              </Text>
              <Text color="$cyan11" fontSize="$3">
                • Check your block packaging or measure with a ruler if unsure
              </Text>
            </Card>
            
            <YStack space="$3">
              {getCommonBlockHeights(settings.measurementUnits).map((block) => (
                <Card
                  key={block.value}
                  padding="$3"
                  backgroundColor={selectedBlockHeights.includes(block.value) ? '$green2' : '$background'}
                  borderColor={selectedBlockHeights.includes(block.value) ? '$green9' : '$borderColor'}
                  borderWidth={1}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => {
                    setSelectedBlockHeights(prev => 
                      prev.includes(block.value)
                        ? prev.filter(h => h !== block.value)
                        : [...prev, block.value].sort((a, b) => a - b)
                    );
                  }}
                >
                  <XStack space="$3" alignItems="center">
                    <Checkbox
                      size="$5"
                      checked={selectedBlockHeights.includes(block.value)}
                      onCheckedChange={() => {
                        setSelectedBlockHeights(prev => 
                          prev.includes(block.value)
                            ? prev.filter(h => h !== block.value)
                            : [...prev, block.value].sort((a, b) => a - b)
                        );
                      }}
                    >
                      <Checkbox.Indicator>
                        <Checkbox.Icon />
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

            {selectedBlockHeights.length === 0 && hasLevelingBlocks && (
              <Card padding="$3" backgroundColor="$yellow2" borderColor="$yellow9" borderWidth={1}>
                <XStack space="$2" alignItems="center">
                  <Info size={16} color="$yellow11" />
                  <Text color="$yellow11" fontSize="$3" flex={1}>
                    Please select at least one block height, or turn off "I have leveling blocks" above.
                  </Text>
                </XStack>
              </Card>
            )}

            {selectedBlockHeights.length > 0 && (
              <Card padding="$3" backgroundColor="$green2" borderColor="$green9" borderWidth={1}>
                <Text color="$green11" fontSize="$3" textAlign="center">
                  ✓ Selected: {selectedBlockHeights.map(h => formatMeasurement(h, settings.measurementUnits, 0)).join(', ')}
                </Text>
              </Card>
            )}
          </YStack>
        )}

        <Card padding="$3" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
          <XStack space="$2" alignItems="flex-start">
            <Info size={16} color="$blue11" />
            <Text color="$blue11" fontSize="$3" flex={1}>
              Don't worry if you're not sure about your block heights. You can always update this later in your vehicle profile settings.
            </Text>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );

  const STEPS = [
    { title: "Vehicle Type", component: renderVehicleTypeStep },
    { title: "Vehicle Name", component: renderNameStep },
    { title: "Measurements", component: renderMeasurementsStep },
    { title: "Leveling Blocks", component: renderBlocksStep }
  ];

  const currentStepData = STEPS[step];
  const canProceed = step === 0 ? !!profile.type : 
                   step === 1 ? !!profile.name.trim() : 
                   step === 2 ? true : // measurements step
                   step === 3 ? (!hasLevelingBlocks || selectedBlockHeights.length > 0) : // blocks step
                   true;

  return (
    <Sheet
      modal
      open={isVisible}
      onOpenChange={(open) => {
        console.log('VehicleSetupWizard - Sheet onOpenChange called with:', open);
        if (!open) {
          console.log('VehicleSetupWizard - Calling onCancel');
          onCancel();
        }
      }}
      snapPoints={[90]}
      position={0}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame>
        <YStack flex={1} height="100%">
          {/* Fixed header */}
          <YStack padding="$4" paddingBottom="$2" space="$3">
            {/* Progress */}
            <XStack space="$2" justifyContent="center">
              {STEPS.map((_, index) => (
                <Card
                  key={index}
                  width={40}
                  height={4}
                  backgroundColor={index <= step ? '$blue9' : '$gray6'}
                  borderRadius="$2"
                />
              ))}
            </XStack>

            {/* Step Title */}
            <H3 color="$colorPress" textAlign="center">
              Step {step + 1} of {STEPS.length}: {currentStepData.title}
            </H3>
          </YStack>

          {/* Scrollable content */}
          <YStack flex={1} paddingHorizontal="$4">
            {currentStepData.component()}
          </YStack>

          {/* Fixed navigation buttons */}
          <XStack padding="$4" paddingTop="$2" space="$3" backgroundColor="$background">
            {step > 0 && (
              <Button
                flex={1}
                size="$5"
                backgroundColor="$gray9"
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
              disabled={!canProceed}
              onPress={step < STEPS.length - 1 ? handleNext : handleComplete}
              iconAfter={step < STEPS.length - 1 ? ArrowRight : undefined}
            >
              {step < STEPS.length - 1 ? 'Next' : 'Create Profile'}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
