import React, { useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  H2,
  Card,
  ScrollView,
  Input,
  Label,
  RadioGroup,
  useTheme,
  Switch,
} from 'tamagui';
import { ArrowRight, ArrowLeft, Caravan, Bus, Truck } from '@tamagui/lucide-icons';
import { StandardBlockSets, BlockInventory } from '../lib/rvLevelingMath';
import { useAppStore } from '../state/appStore';

interface SimpleProfileWizardProps {
  onComplete: (profile: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => void;
  onCancel: () => void;
}

const VEHICLE_TYPES = [
  { id: 'trailer', name: 'Travel Trailer', icon: Caravan },
  { id: 'motorhome', name: 'Motorhome/RV', icon: Bus },
  { id: 'van', name: 'Van/Camper Van', icon: Truck }
];

export function SimpleProfileWizard({ onComplete, onCancel }: SimpleProfileWizardProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    type: 'trailer' as 'trailer' | 'motorhome' | 'van',
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
  });

  const handleComplete = () => {
    try {
      console.log('SimpleProfileWizard - Creating profile...');
      
      onComplete({
        ...profile,
        hitchOffsetInches: profile.type === 'trailer' ? profile.hitchOffsetInches : undefined,
        blockInventory: StandardBlockSets.basic()
      });
      
      console.log('SimpleProfileWizard - Profile creation completed');
    } catch (error) {
      console.error('SimpleProfileWizard - Error:', error);
    }
  };

  const selectedVehicleType = VEHICLE_TYPES.find(v => v.id === profile.type);

  return (
    <Card 
      position="absolute" 
      top="$4" 
      left="$4" 
      right="$4" 
      bottom="$4"
      zIndex={1000}
      backgroundColor="$background" 
      borderColor="$borderColor" 
      borderWidth={2}
      borderRadius="$4"
      padding="$4"
    >
      <YStack flex={1} space="$4">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <H2>Add Vehicle Profile</H2>
          <Button size="$3" backgroundColor="$gray9" onPress={onCancel}>
            Cancel
          </Button>
        </XStack>

        <ScrollView flex={1}>
          <YStack space="$4">
            {/* Step 1: Vehicle Type */}
            <YStack space="$3">
              <Text fontWeight="bold">Vehicle Type:</Text>
              <YStack space="$2">
                {VEHICLE_TYPES.map((vehicleType) => {
                  const Icon = vehicleType.icon;
                  const isSelected = profile.type === vehicleType.id;
                  
                  return (
                    <Card
                      key={vehicleType.id}
                      padding="$3"
                      backgroundColor={isSelected ? '$blue3' : '$background'}
                      borderColor={isSelected ? '$blue9' : '$borderColor'}
                      borderWidth={1}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => setProfile(prev => ({ ...prev, type: vehicleType.id as any }))}
                    >
                      <XStack space="$2" alignItems="center">
                        <Icon size={24} color={isSelected ? '$blue9' : '$color'} />
                        <Text fontWeight={isSelected ? 'bold' : 'normal'}>
                          {vehicleType.name}
                        </Text>
                      </XStack>
                    </Card>
                  );
                })}
              </YStack>
            </YStack>

            {/* Step 2: Name */}
            <YStack space="$3">
              <Text fontWeight="bold">Vehicle Name:</Text>
              <Input
                size="$4"
                placeholder={`My ${selectedVehicleType?.name}`}
                value={profile.name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              />
            </YStack>

            {/* Step 3: Basic Measurements (simplified) */}
            <YStack space="$3">
              <Text fontWeight="bold">Basic Measurements:</Text>
              
              <YStack space="$2">
                <Label>Wheelbase (inches):</Label>
                <Text color="$colorPress" fontSize="$2">
                  Distance from front axle to rear axle. Typical: 180-300"
                </Text>
                <Input
                  size="$4"
                  value={profile.wheelbaseInches.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 240;
                    setProfile(prev => ({ ...prev, wheelbaseInches: num }));
                  }}
                  keyboardType="numeric"
                />
              </YStack>

              <YStack space="$2">
                <Label>Track Width (inches):</Label>
                <Text color="$colorPress" fontSize="$2">
                  Distance between left and right wheels. Typical: 80-100"
                </Text>
                <Input
                  size="$4"
                  value={profile.trackWidthInches.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 96;
                    setProfile(prev => ({ ...prev, trackWidthInches: num }));
                  }}
                  keyboardType="numeric"
                />
              </YStack>

              {profile.type === 'trailer' && (
                <YStack space="$2">
                  <Label>Hitch Offset (inches):</Label>
                  <Text color="$colorPress" fontSize="$2">
                    Distance from trailer's rear axle to hitch ball. Typical: 24-48"
                  </Text>
                  <Input
                    size="$4"
                    value={profile.hitchOffsetInches.toString()}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 120;
                      setProfile(prev => ({ ...prev, hitchOffsetInches: num }));
                    }}
                    keyboardType="numeric"
                  />
                </YStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>

        {/* Create Button */}
        <Button
          size="$5"
          backgroundColor="$blue9"
          disabled={!profile.name.trim()}
          onPress={handleComplete}
        >
          Create Profile
        </Button>
      </YStack>
    </Card>
  );
}