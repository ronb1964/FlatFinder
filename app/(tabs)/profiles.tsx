import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, Car, Truck, Home, HelpCircle } from 'lucide-react-native';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';
import { BlockInventory } from '../../src/lib/rvLevelingMath';
import { VehicleSetupWizard } from '../../src/components/VehicleSetupWizard';
import { createCalibration } from '../../src/lib/levelingMath';
import { THEME } from '../../src/theme';

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
      if (Platform.OS === 'web') {
        // Use window.confirm for web (globalThis works in all JS environments)
        const confirmed = globalThis.confirm(
          `Are you sure you want to delete "${profileName}"? This action cannot be undone.`
        );
        if (!confirmed) {
          return;
        }
        deleteProfile(profileId);
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
              onPress: () => deleteProfile(profileId),
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
  }, [loadProfiles]);

  const handleAddProfile = (profileData: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => {
    try {
      const calibration = createCalibration();

      if (editingProfile) {
        const updateData = {
          ...profileData,
          calibration: editingProfile.calibration || calibration,
        };
        updateProfile(editingProfile.id, updateData);
      } else {
        const finalProfileData = {
          ...profileData,
          calibration,
        };
        addProfile(finalProfileData);
      }

      // Small delay to ensure state updates complete before closing wizard
      globalThis.setTimeout(() => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Vehicle Profiles</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowSetupWizard(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.profileList}>
            {profiles.length === 0 ? (
              <View style={styles.emptyState}>
                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                  <View style={styles.welcomeContent}>
                    <Car size={48} color="#3b82f6" />
                    <View style={styles.welcomeTextContainer}>
                      <Text style={styles.welcomeTitle}>Welcome to FlatFinder!</Text>
                      <Text style={styles.welcomeDescription}>
                        To get started, you&apos;ll need to set up a profile for your RV, trailer,
                        or van.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.setupButton}
                      onPress={() => setShowSetupWizard(true)}
                    >
                      <Plus size={18} color="#fff" />
                      <Text style={styles.setupButtonText}>Set Up My Vehicle</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Help Card */}
                <View style={styles.helpCard}>
                  <View style={styles.helpContent}>
                    <HelpCircle size={20} color="#eab308" />
                    <View style={styles.helpTextContainer}>
                      <Text style={styles.helpTitle}>Need help?</Text>
                      <Text style={styles.helpDescription}>
                        Don&apos;t worry if you don&apos;t know your exact vehicle measurements. Our
                        setup wizard will guide you through the process and provide typical values
                        for your vehicle type.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileCard,
                    activeProfileId === profile.id && styles.profileCardActive,
                  ]}
                  onPress={() => setActiveProfile(profile.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileRow}>
                    <View style={styles.profileLeft}>
                      {getVehicleIcon(profile.type)}
                      <View style={styles.profileInfo}>
                        <View style={styles.profileNameRow}>
                          <Text style={styles.profileName}>{profile.name}</Text>
                          {activeProfileId === profile.id && <Check size={16} color="#22c55e" />}
                        </View>
                        <Text style={styles.profileDetails}>
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} •
                          Wheelbase: {profile.wheelbaseInches}&quot; • Track:{' '}
                          {profile.trackWidthInches}&quot;
                        </Text>
                      </View>
                    </View>
                    <View style={styles.profileActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditProfile(profile)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileList: {
    gap: 12,
  },
  emptyState: {
    gap: 16,
  },
  welcomeCard: {
    padding: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 12,
  },
  welcomeContent: {
    alignItems: 'center',
    gap: 16,
  },
  welcomeTextContainer: {
    gap: 8,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  welcomeDescription: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpCard: {
    padding: 16,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
    borderRadius: 12,
  },
  helpContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  helpTextContainer: {
    flex: 1,
    gap: 8,
  },
  helpTitle: {
    color: '#eab308',
    fontWeight: 'bold',
  },
  helpDescription: {
    color: 'rgba(234, 179, 8, 0.8)',
    fontSize: 14,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
  },
  profileCardActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: THEME.colors.success,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  profileDetails: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: THEME.colors.primary,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
});
