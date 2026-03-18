import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet, Modal } from 'react-native';
import ScrollViewWithChevron from '../../src/components/ScrollViewWithChevron';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, HelpCircle, AlertTriangle, Caravan } from 'lucide-react-native';
import { MotorhomeIcon, VanIcon } from '../../src/components/icons/VehicleIcons';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';
import { BlockInventory } from '../../src/lib/rvLevelingMath';
import { VehicleSetupWizard } from '../../src/components/VehicleSetupWizard';
import { ProfileEditor } from '../../src/components/ProfileEditor';
import { GlassButton } from '../../src/components/ui/GlassButton';
import { createCalibration } from '../../src/lib/levelingMath';
import { useTheme } from '../../src/hooks/useTheme';

export default function ProfilesScreen() {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  // Theme-aware colors for this screen
  const screenColors = {
    // Card backgrounds
    cardBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
    cardBorder: theme.colors.primary,
    helpCardBg: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.08)',
    helpCardBorder: isDark ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.4)',
    helpDescColor: isDark ? 'rgba(234, 179, 8, 0.8)' : 'rgba(180, 140, 0, 0.9)',
    // Buttons
    addBtnBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
    addBtnBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.35)',
    editBtnBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
    editBtnBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
    deleteBtnBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
    deleteBtnBorder: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
    // Profile card
    profileCardBg: theme.colors.surface,
    profileCardBorder: theme.colors.border,
    profileCardActiveBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
    // Modal
    modalBorder: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
    modalIconBg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)',
    // Icon color
    iconColor: theme.colors.textSecondary,
  };
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
    const color = screenColors.iconColor;
    switch (type) {
      case 'trailer':
        return <Caravan size={22} color={color} />;
      case 'motorhome':
        return <MotorhomeIcon size={24} color={color} />;
      case 'van':
        return <VanIcon size={20} color={color} />;
      default:
        return <VanIcon size={20} color={color} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Vehicle Profiles</Text>
          {profiles.length > 0 && (
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: screenColors.addBtnBg, borderColor: screenColors.addBtnBorder },
              ]}
              onPress={() => setShowSetupWizard(true)}
            >
              <Plus size={18} color={theme.colors.primary} />
              <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollViewWithChevron style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.profileList}>
            {profiles.length === 0 ? (
              <View style={styles.emptyState}>
                {/* Welcome Card */}
                <View
                  style={[
                    styles.welcomeCard,
                    { backgroundColor: screenColors.cardBg, borderColor: screenColors.cardBorder },
                  ]}
                >
                  <View style={styles.welcomeContent}>
                    <MotorhomeIcon size={48} color="#3b82f6" />
                    <View style={styles.welcomeTextContainer}>
                      <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                        Add Your First Vehicle
                      </Text>
                      <Text
                        style={[styles.welcomeDescription, { color: theme.colors.textSecondary }]}
                      >
                        Set up a profile for your RV, trailer, or van to get started with leveling.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.setupButton,
                        {
                          backgroundColor: screenColors.addBtnBg,
                          borderColor: screenColors.addBtnBorder,
                        },
                      ]}
                      onPress={() => setShowSetupWizard(true)}
                    >
                      <Plus size={18} color={theme.colors.primary} />
                      <Text style={[styles.setupButtonText, { color: theme.colors.primary }]}>
                        Add Vehicle
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Help Card */}
                <View
                  style={[
                    styles.helpCard,
                    {
                      backgroundColor: screenColors.helpCardBg,
                      borderColor: screenColors.helpCardBorder,
                    },
                  ]}
                >
                  <View style={styles.helpContent}>
                    <HelpCircle size={20} color="#eab308" />
                    <View style={styles.helpTextContainer}>
                      <Text style={styles.helpTitle}>Need help?</Text>
                      <Text style={[styles.helpDescription, { color: screenColors.helpDescColor }]}>
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
                    {
                      backgroundColor: screenColors.profileCardBg,
                      borderColor: screenColors.profileCardBorder,
                    },
                    activeProfileId === profile.id && [
                      styles.profileCardActive,
                      { backgroundColor: screenColors.profileCardActiveBg },
                    ],
                  ]}
                  onPress={() => setActiveProfile(profile.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileRow}>
                    <View style={styles.profileLeft}>
                      {getVehicleIcon(profile.type)}
                      <View style={styles.profileInfo}>
                        <View style={styles.profileNameRow}>
                          <Text style={[styles.profileName, { color: theme.colors.text }]}>
                            {profile.name}
                          </Text>
                          {activeProfileId === profile.id && <Check size={16} color="#22c55e" />}
                        </View>
                        <Text
                          style={[styles.profileDetails, { color: theme.colors.textSecondary }]}
                        >
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} •{' '}
                          {profile.type === 'trailer'
                            ? `Track: ${Math.round(profile.trackWidthInches)}" • Hitch: ${Math.round(profile.hitchOffsetInches || 0)}"`
                            : `Wheelbase: ${Math.round(profile.wheelbaseInches)}" • Track: ${Math.round(profile.trackWidthInches)}"`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.profileActions}>
                      <TouchableOpacity
                        style={[
                          styles.editButton,
                          {
                            backgroundColor: screenColors.editBtnBg,
                            borderColor: screenColors.editBtnBorder,
                          },
                        ]}
                        onPress={() => handleEditProfile(profile)}
                      >
                        <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.deleteButton,
                          {
                            backgroundColor: screenColors.deleteBtnBg,
                            borderColor: screenColors.deleteBtnBorder,
                          },
                        ]}
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
        </ScrollViewWithChevron>
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
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent
        onRequestClose={cancelDelete}
      >
        <View
          style={[
            styles.deleteModalOverlay,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
          ]}
        >
          <View
            style={[
              styles.deleteModalContainer,
              { backgroundColor: theme.colors.background, borderColor: screenColors.modalBorder },
            ]}
          >
            <View style={[styles.deleteModalIcon, { backgroundColor: screenColors.modalIconBg }]}>
              <AlertTriangle size={32} color="#ef4444" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
              Delete Profile
            </Text>
            <Text style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
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
    flexShrink: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  addButtonText: {
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
    borderWidth: 1,
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
    textAlign: 'center',
  },
  welcomeDescription: {
    textAlign: 'center',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  setupButtonText: {
    fontWeight: '600',
  },
  helpCard: {
    padding: 16,
    borderWidth: 1,
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
    fontSize: 14,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  profileCardActive: {
    borderColor: '#22c55e',
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
  },
  profileDetails: {
    fontSize: 12,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteModalMessage: {
    fontSize: 14,
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
