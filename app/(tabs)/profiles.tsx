import React, { useEffect, useState } from 'react';
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
  Sheet,
  useTheme,
} from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, Car, Truck, Home, HelpCircle, Crosshair } from '@tamagui/lucide-icons';
// Temporarily removing Edit icon to fix undefined component error
// import { Edit } from '@tamagui/lucide-icons';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';
import { StandardBlockSets, BlockInventory } from '../../src/lib/rvLevelingMath';
import { VehicleSetupWizard } from '../../src/components/VehicleSetupWizard';
import { ProfileCreationTest } from '../../src/components/ProfileCreationTest';
import { SimpleProfileWizard } from '../../src/components/SimpleProfileWizard';
import { CalibrationWizard } from '../../src/components/CalibrationWizard';

import { createCalibration, type Calibration } from '../../src/lib/levelingMath';

export default function ProfilesScreen() {
  const theme = useTheme();
  const {
    profiles,
    activeProfileId,
    loadProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  } = useAppStore();

  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VehicleProfile | null>(null);
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false);
  const [calibratingProfile, setCalibratingProfile] = useState<VehicleProfile | null>(null);

  const handleEditProfile = (profile: VehicleProfile) => {
    setEditingProfile(profile);
    setShowSetupWizard(true);
  };

  const handleCalibrateProfile = (profile: VehicleProfile) => {
    setCalibratingProfile(profile);
    setShowCalibrationWizard(true);
  };

  const handleCalibrationComplete = (calibration: Calibration) => {
    if (calibratingProfile) {
      updateProfile(calibratingProfile.id, { calibration });
    }
    setShowCalibrationWizard(false);
    setCalibratingProfile(null);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    try {
      console.log('ProfilesScreen - Deleting profile:', profileId, profileName);
      
      // Simple confirmation using window.confirm for web
      const confirmed = window.confirm(`Are you sure you want to delete "${profileName}"? This action cannot be undone.`);
      
      if (!confirmed) {
        console.log('ProfilesScreen - Profile deletion cancelled by user');
        return;
      }
      
      console.log('ProfilesScreen - Proceeding with profile deletion');
      deleteProfile(profileId);
      console.log('ProfilesScreen - Profile deleted successfully');
      
    } catch (error) {
      console.error('ProfilesScreen - Error deleting profile:', error);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleAddProfile = (profileData: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => {
    try {
      console.log('ProfilesScreen - Received profile data:', profileData);
      
      const calibration = createCalibration();
      console.log('ProfilesScreen - Created calibration:', calibration);
      
      if (editingProfile) {
        // Update existing profile
        const updateData = {
          ...profileData,
          calibration: editingProfile.calibration || calibration, // Keep existing calibration
        };
        
        console.log('ProfilesScreen - Updating existing profile:', editingProfile.id, updateData);
        updateProfile(editingProfile.id, updateData);
        console.log('ProfilesScreen - Profile updated successfully');
      } else {
        // Create new profile
        const finalProfileData = {
          ...profileData,
          calibration,
        };
        
        console.log('ProfilesScreen - Final profile data before addProfile:', finalProfileData);
        addProfile(finalProfileData);
        console.log('ProfilesScreen - Profile added successfully');
      }
      
      // Close the wizard and clear editing state
      setTimeout(() => {
        console.log('ProfilesScreen - Closing setup wizard');
        setShowSetupWizard(false);
        setEditingProfile(null);
      }, 100);
    } catch (error) {
      console.error('ProfilesScreen - Error adding profile:', error);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'trailer':
        return <Truck size={20} />;
      case 'motorhome':
        return <Home size={20} />;
      case 'van':
        return <Car size={20} />;
      default:
        return <Car size={20} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val || '#000' }}>
      <YStack 
        flex={1} 
        padding="$4" 
        space="$4"
      >
        <XStack justifyContent="space-between" alignItems="center">
          <H2>Vehicle Profiles</H2>
          <Button
            size="$5"
            height="$5"
            backgroundColor="$blue9"
            icon={Plus}
            onPress={() => setShowSetupWizard(true)}
            fontSize="$4"
          >
            Add Vehicle
          </Button>
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack space="$3">
            {profiles.length === 0 ? (
              <YStack space="$4">
                <Card padding="$6" backgroundColor="$blue2" borderColor="$blue9" borderWidth={1}>
                  <YStack alignItems="center" space="$4">
                    <Car size={48} color="$blue9" />
                    <YStack space="$2" alignItems="center">
                      <Text color="$color" textAlign="center" fontSize="$5" fontWeight="bold">
                        Welcome to LevelMate!
                      </Text>
                      <Text color="$colorPress" textAlign="center" fontSize="$4">
                        To get started, you'll need to set up a profile for your RV, trailer, or van.
                      </Text>
                    </YStack>
                    <Button
                      size="$5"
                      backgroundColor="$blue9"
                      icon={Plus}
                      onPress={() => setShowSetupWizard(true)}
                    >
                      Set Up My Vehicle
                    </Button>
                  </YStack>
                </Card>
                
                <Card padding="$4" backgroundColor="$yellow2" borderColor="$yellow9" borderWidth={1}>
                  <XStack space="$3" alignItems="flex-start">
                    <HelpCircle size={20} color="$yellow11" />
                    <YStack flex={1} space="$2">
                      <Text color="$yellow11" fontSize="$4" fontWeight="bold">
                        Need help?
                      </Text>
                      <Text color="$yellow11" fontSize="$3">
                        Don't worry if you don't know your exact vehicle measurements. Our setup wizard will guide you through the process and provide typical values for your vehicle type.
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              </YStack>
            ) : (
              profiles.map((profile) => (
                <Card
                  key={profile.id}
                  padding="$4"
                  backgroundColor={
                    activeProfileId === profile.id ? '$green2' : '$background'
                  }
                  borderColor={
                    activeProfileId === profile.id ? '$green9' : '$borderColor'
                  }
                  borderWidth={activeProfileId === profile.id ? 2 : 1}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => setActiveProfile(profile.id)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack space="$3" alignItems="center" flex={1}>
                      {getVehicleIcon(profile.type)}
                      <YStack flex={1}>
                        <XStack alignItems="center" space="$2">
                          <Text fontSize="$5" fontWeight="bold">
                            {profile.name}
                          </Text>
                          {/* Calibration Status Indicator */}
                          <YStack
                            width={8}
                            height={8}
                            borderRadius={4}
                            backgroundColor={
                              profile.calibration && 
                              (profile.calibration.pitchOffsetDegrees !== 0 || 
                               profile.calibration.rollOffsetDegrees !== 0) 
                                ? '$green9' 
                                : '$yellow9'
                            }
                          />
                          {activeProfileId === profile.id && (
                            <Check size={16} color={theme.green10?.val || '#0f0'} />
                          )}
                        </XStack>
                        <Text color="$colorPress" fontSize="$2" numberOfLines={1}>
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} • Wheelbase: {profile.wheelbaseInches}" • Track: {profile.trackWidthInches}"
                        </Text>
                        {profile.calibration && (
                          <Text color="$colorPress" fontSize="$1" marginTop="$1" numberOfLines={2}>
                            {profile.calibration.pitchOffsetDegrees !== 0 || 
                             profile.calibration.rollOffsetDegrees !== 0 
                              ? `Calibrated: P:${profile.calibration.pitchOffsetDegrees.toFixed(1)}°, R:${profile.calibration.rollOffsetDegrees.toFixed(1)}°`
                              : 'Not calibrated - tap Calibrate to set baseline'}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <YStack space="$2" minWidth={120}>
                      {activeProfileId === profile.id && (
                        <Button
                          size="$3"
                          backgroundColor="transparent"
                          color="$green9"
                          onPress={() => handleCalibrateProfile(profile)}
                          paddingHorizontal="$2"
                        >
                          <XStack space="$1" alignItems="center">
                            <Crosshair size={16} color="$green9" />
                            <Text color="$green9" fontWeight="bold" fontSize="$3">Calibrate</Text>
                          </XStack>
                        </Button>
                      )}
                      <XStack space="$2">
                        <Button
                          size="$3"
                          backgroundColor="transparent"
                          color="$blue9"
                          onPress={() => handleEditProfile(profile)}
                          flex={1}
                        >
                          <Text color="$blue9" fontWeight="bold" fontSize="$3">Edit</Text>
                        </Button>
                        <Button
                          size="$3"
                          backgroundColor="transparent"
                          color="$red9"
                          onPress={() => handleDeleteProfile(profile.id, profile.name)}
                        >
                          <Trash2 size={18} color="$red9" />
                        </Button>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Vehicle Setup Wizard */}
      <VehicleSetupWizard
        isVisible={showSetupWizard}
        onComplete={handleAddProfile}
        onCancel={() => {
          setShowSetupWizard(false);
          setEditingProfile(null);
        }}
        editingProfile={editingProfile}
      />

      {/* Calibration Wizard */}
      <CalibrationWizard
        isVisible={showCalibrationWizard}
        onComplete={handleCalibrationComplete}
        onCancel={() => {
          setShowCalibrationWizard(false);
          setCalibratingProfile(null);
        }}
      />

    </SafeAreaView>
  );
}