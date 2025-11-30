import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, Car, Truck, Home, HelpCircle } from 'lucide-react-native';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';
import { BlockInventory } from '../../src/lib/rvLevelingMath';
import { VehicleSetupWizard } from '../../src/components/VehicleSetupWizard';
import { createCalibration } from '../../src/lib/levelingMath';

export default function ProfilesScreen() {
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

  const handleEditProfile = (profile: VehicleProfile) => {
    setEditingProfile(profile);
    setShowSetupWizard(true);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    try {
      console.log('ProfilesScreen - Deleting profile:', profileId, profileName);

      if (Platform.OS === 'web') {
        // Use window.confirm for web
        const confirmed = window.confirm(
          `Are you sure you want to delete "${profileName}"? This action cannot be undone.`
        );
        if (!confirmed) {
          console.log('ProfilesScreen - Profile deletion cancelled by user');
          return;
        }
        console.log('ProfilesScreen - Proceeding with profile deletion');
        deleteProfile(profileId);
        console.log('ProfilesScreen - Profile deleted successfully');
      } else {
        // Use Alert for native
        Alert.alert(
          'Delete Profile',
          `Are you sure you want to delete "${profileName}"? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteProfile(profileId);
                console.log('ProfilesScreen - Profile deleted successfully');
              },
            },
          ]
        );
      }
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
        const updateData = {
          ...profileData,
          calibration: editingProfile.calibration || calibration,
        };

        console.log('ProfilesScreen - Updating existing profile:', editingProfile.id, updateData);
        updateProfile(editingProfile.id, updateData);
        console.log('ProfilesScreen - Profile updated successfully');
      } else {
        const finalProfileData = {
          ...profileData,
          calibration,
        };

        console.log('ProfilesScreen - Final profile data before addProfile:', finalProfileData);
        addProfile(finalProfileData);
        console.log('ProfilesScreen - Profile added successfully');
      }

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
    const iconProps = { size: 20, color: '#a3a3a3' };
    switch (type) {
      case 'trailer':
        return <Truck {...iconProps} />;
      case 'motorhome':
        return <Home {...iconProps} />;
      case 'van':
        return <Car {...iconProps} />;
      default:
        return <Car {...iconProps} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4 gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-foreground">Vehicle Profiles</Text>
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary px-4 py-3 rounded-lg"
            onPress={() => setShowSetupWizard(true)}
          >
            <Plus size={18} color="#fff" />
            <Text className="text-primary-foreground font-semibold">Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {profiles.length === 0 ? (
              <View className="gap-4">
                {/* Welcome Card */}
                <View className="p-6 bg-primary/10 border border-primary rounded-xl">
                  <View className="items-center gap-4">
                    <Car size={48} color="#3b82f6" />
                    <View className="gap-2 items-center">
                      <Text className="text-foreground text-center text-lg font-bold">
                        Welcome to FlatFinder!
                      </Text>
                      <Text className="text-muted-foreground text-center">
                        To get started, you'll need to set up a profile for your RV, trailer, or
                        van.
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="flex-row items-center gap-2 bg-primary px-5 py-3 rounded-lg"
                      onPress={() => setShowSetupWizard(true)}
                    >
                      <Plus size={18} color="#fff" />
                      <Text className="text-primary-foreground font-semibold">Set Up My Vehicle</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Help Card */}
                <View className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl">
                  <View className="flex-row gap-3 items-start">
                    <HelpCircle size={20} color="#eab308" />
                    <View className="flex-1 gap-2">
                      <Text className="text-yellow-500 font-bold">Need help?</Text>
                      <Text className="text-yellow-500/80 text-sm">
                        Don't worry if you don't know your exact vehicle measurements. Our setup
                        wizard will guide you through the process and provide typical values for
                        your vehicle type.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  className={`p-4 rounded-xl border-2 ${
                    activeProfileId === profile.id
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-card border-border'
                  }`}
                  onPress={() => setActiveProfile(profile.id)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-3 items-center flex-1">
                      {getVehicleIcon(profile.type)}
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg font-bold text-foreground">{profile.name}</Text>
                          {activeProfileId === profile.id && (
                            <Check size={16} color="#22c55e" />
                          )}
                        </View>
                        <Text className="text-muted-foreground text-xs">
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} • Wheelbase:{' '}
                          {profile.wheelbaseInches}" • Track: {profile.trackWidthInches}"
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="px-3 py-2"
                        onPress={() => handleEditProfile(profile)}
                      >
                        <Text className="text-primary font-bold">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => handleDeleteProfile(profile.id, profile.name)}
                      >
                        <Trash2 size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>

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
    </SafeAreaView>
  );
}
