import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, HelpCircle, AlertTriangle } from 'lucide-react-native';
import { TrailerIcon, MotorhomeIcon, VanIcon } from '../../src/components/icons/VehicleIcons';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';
import { BlockInventory } from '../../src/lib/rvLevelingMath';
import { VehicleSetupWizard } from '../../src/components/VehicleSetupWizard';
import { ProfileEditor } from '../../src/components/ProfileEditor';
import { GlassButton } from '../../src/components/ui/GlassButton';
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
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VehicleProfile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleEditProfile = (profile: VehicleProfile) => {
    setEditingProfile(profile);
    setShowProfileEditor(true);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    try {
      if (Platform.OS === 'web') {
        // Show custom modal for web
        setProfileToDelete({ id: profileId, name: profileName });
        setShowDeleteConfirm(true);
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

  const confirmDelete = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete.id);
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProfileToDelete(null);
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
      const finalProfileData = {
        ...profileData,
        calibration,
      };
      addProfile(finalProfileData);

      // Small delay to ensure state updates complete before closing wizard
      globalThis.setTimeout(() => {
        setShowSetupWizard(false);
      }, 100);
    } catch (error) {
      console.error('ProfilesScreen - Error adding profile:', error);
    }
  };

  const handleUpdateProfile = (profileData: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => {
    try {
      if (!editingProfile) return;

      const updateData = {
        ...profileData,
        calibration: editingProfile.calibration || createCalibration(),
      };
      updateProfile(editingProfile.id, updateData);

      globalThis.setTimeout(() => {
        setShowProfileEditor(false);
        setEditingProfile(null);
      }, 100);
    } catch (error) {
      console.error('ProfilesScreen - Error updating profile:', error);
    }
  };

  const getVehicleIcon = (type: string) => {
    const color = '#a3a3a3';
    switch (type) {
      case 'trailer':
        return <TrailerIcon size={22} color={color} />;
      case 'motorhome':
        return <MotorhomeIcon size={24} color={color} />;
      case 'van':
        return <VanIcon size={20} color={color} />;
      default:
        return <VanIcon size={20} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Vehicle Profiles</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowSetupWizard(true)}>
            <Plus size={18} color={THEME.colors.primary} />
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
                    <MotorhomeIcon size={48} color="#3b82f6" />
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
                      <Plus size={18} color={THEME.colors.primary} />
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
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} •{' '}
                          {profile.type === 'trailer'
                            ? `Track: ${profile.trackWidthInches}" • Hitch: ${profile.hitchOffsetInches || 0}"`
                            : `Wheelbase: ${profile.wheelbaseInches}" • Track: ${profile.trackWidthInches}"`}
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

      {/* Vehicle Setup Wizard - for adding new profiles */}
      <VehicleSetupWizard
        isVisible={showSetupWizard}
        onComplete={handleAddProfile}
        onCancel={() => {
          setShowSetupWizard(false);
        }}
        editingProfile={null}
      />

      {/* Profile Editor - for editing existing profiles */}
      {editingProfile && (
        <ProfileEditor
          isVisible={showProfileEditor}
          profile={editingProfile}
          onSave={handleUpdateProfile}
          onCancel={() => {
            setShowProfileEditor(false);
            setEditingProfile(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalIcon}>
              <AlertTriangle size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Profile</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete &quot;{profileToDelete?.name}&quot;? This action
              cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <GlassButton
                variant="default"
                size="md"
                onPress={cancelDelete}
                style={styles.deleteModalButton}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="danger"
                size="md"
                onPress={confirmDelete}
                style={styles.deleteModalButton}
              >
                Delete
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  addButtonText: {
    color: THEME.colors.primary,
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  setupButtonText: {
    color: THEME.colors.primary,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: THEME.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  // Delete confirmation modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  deleteModalButton: {
    flex: 1,
  },
});
