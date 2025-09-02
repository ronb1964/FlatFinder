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

const MEASUREMENT_INFO = {
  wheelbase: {
    title: "Wheelbase Length",
    description: "Distance from front axle to rear axle",
    howToMeasure: "Measure from the center of your front wheel to the center of your rear wheel on the same side.",
    typical: "Most travel trailers: 20-22 feet (240-264 inches)"
  },
  track: {
    title: "Track Width", 
    description: "Distance between left and right wheels",
    howToMeasure: "Measure from the center of your left wheel to the center of your right wheel on the same axle.",
    typical: "Most RVs: 6-8 feet (72-96 inches)"
  },
  hitch: {
    title: "Hitch Offset",
    description: "Distance from rear axle to hitch ball",
    howToMeasure: "Measure from the center of your rear axle to the center of your hitch ball.",
    typical: "Most travel trailers: 8-12 feet (96-144 inches)"
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
    // Build block inventory based on user selections
    const blockInventory: BlockInventory[] = hasLevelingBlocks 
      ? selectedBlockHeights.map(height => ({
          heightInches: height,
          quantity: 4 // Default to 4 blocks per height
        }))
      : [];

    onComplete({
      ...profile,
      hitchOffsetInches: profile.type === 'trailer' ? profile.hitchOffsetInches : undefined,
      blockInventory
    });
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
        <Text color="$colorPress" fontSize="$3">
          Examples: "Big Blue", "Family Trailer", "Weekend Warrior"
        </Text>
      </YStack>
    </YStack>
  );

  const renderMeasurementsStep = () => (
    <ScrollView>
      <YStack space="$4">
        <YStack space="$2" alignItems="center">
          <H2 color="$color" textAlign="center">Vehicle Measurements</H2>
          <Text color="$colorPress" textAlign="center" fontSize="$4">
            Accurate measurements help LevelMate provide better leveling guidance.
          </Text>
        </YStack>

        {/* Option to use typical measurements */}
        <Card padding="$4" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
          <YStack space="$3">
            <XStack space="$2" alignItems="center">
              <RadioGroup
                value={useTypicalMeasurements ? "typical" : "custom"}
                onValueChange={(value) => setUseTypicalMeasurements(value === "typical")}
              >
                <XStack space="$4">
                  <XStack space="$2" alignItems="center">
                    <RadioGroup.Item value="typical" id="typical">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="typical">Use typical measurements</Label>
                  </XStack>
                  <XStack space="$2" alignItems="center">
                    <RadioGroup.Item value="custom" id="custom">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="custom">Enter my exact measurements</Label>
                  </XStack>
                </XStack>
              </RadioGroup>
            </XStack>
            <Text color="$colorPress" fontSize="$3">
              {useTypicalMeasurements 
                ? "We'll use typical measurements for your vehicle type. You can adjust these later."
                : "Enter your exact measurements for the most accurate leveling assistance."
              }
            </Text>
          </YStack>
        </Card>

        {/* Measurements */}
        <YStack space="$4">
          {/* Wheelbase */}
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <Ruler size={16} color="$colorPress" />
              <Text fontWeight="bold">{MEASUREMENT_INFO.wheelbase.title}</Text>
            </XStack>
            <Text color="$colorPress" fontSize="$3">
              {MEASUREMENT_INFO.wheelbase.description}
            </Text>
            
            {useTypicalMeasurements ? (
              <Card padding="$3" backgroundColor="$gray2">
                <Text>
                  {formatMeasurement(profile.wheelbaseInches, settings.measurementUnits)} (typical for {selectedVehicleType?.name})
                </Text>
              </Card>
            ) : (
              <YStack space="$2">
                <Input
                  size="$4"
                  placeholder={convertForDisplay(240, settings.measurementUnits).toString()}
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
                <Text color="$colorPress" fontSize="$2">
                  {MEASUREMENT_INFO.wheelbase.howToMeasure} (in {settings.measurementUnits === 'metric' ? 'centimeters' : 'inches'})
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Track Width */}
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <Ruler size={16} color="$colorPress" />
              <Text fontWeight="bold">{MEASUREMENT_INFO.track.title}</Text>
            </XStack>
            <Text color="$colorPress" fontSize="$3">
              {MEASUREMENT_INFO.track.description}
            </Text>
            
            {useTypicalMeasurements ? (
              <Card padding="$3" backgroundColor="$gray2">
                <Text>
                  {formatMeasurement(profile.trackWidthInches, settings.measurementUnits)} (typical for {selectedVehicleType?.name})
                </Text>
              </Card>
            ) : (
              <YStack space="$2">
                <Input
                  size="$4"
                  placeholder={convertForDisplay(96, settings.measurementUnits).toString()}
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
                <Text color="$colorPress" fontSize="$2">
                  {MEASUREMENT_INFO.track.howToMeasure} (in {settings.measurementUnits === 'metric' ? 'centimeters' : 'inches'})
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Hitch Offset (only for trailers) */}
          {profile.type === 'trailer' && (
            <YStack space="$2">
              <XStack space="$2" alignItems="center">
                <Ruler size={16} color="$colorPress" />
                <Text fontWeight="bold">{MEASUREMENT_INFO.hitch.title}</Text>
              </XStack>
              <Text color="$colorPress" fontSize="$3">
                {MEASUREMENT_INFO.hitch.description}
              </Text>
              
              {useTypicalMeasurements ? (
                <Card padding="$3" backgroundColor="$gray2">
                  <Text>
                    {formatMeasurement(profile.hitchOffsetInches, settings.measurementUnits)} (typical for travel trailers)
                  </Text>
                </Card>
              ) : (
                <YStack space="$2">
                  <Input
                    size="$4"
                    placeholder={convertForDisplay(120, settings.measurementUnits).toString()}
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
                  <Text color="$colorPress" fontSize="$2">
                    {MEASUREMENT_INFO.hitch.howToMeasure} (in {settings.measurementUnits === 'metric' ? 'centimeters' : 'inches'})
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {!useTypicalMeasurements && (
          <Card padding="$3" backgroundColor="$yellow2" borderColor="$yellow9" borderWidth={1}>
            <XStack space="$2" alignItems="flex-start">
              <Info size={16} color="$yellow11" />
              <Text color="$yellow11" fontSize="$3" flex={1}>
                Don't worry if you don't have exact measurements. You can always update these later in your profile settings.
              </Text>
            </XStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );

  const renderBlocksStep = () => (
    <ScrollView>
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
            <Text color="$colorPress" textAlign="center" fontSize="$3">
              Select all the block heights in your inventory. The app will calculate how many blocks to use.
            </Text>
            
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
      onOpenChange={(open) => !open && onCancel()}
      snapPointsMode="fit"
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" space="$4">
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

        {/* Step Content */}
        <YStack flex={1} minHeight={400}>
          {currentStepData.component()}
        </YStack>

        {/* Navigation */}
        <XStack space="$3">
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
      </Sheet.Frame>
    </Sheet>
  );
}
