/**
 * App Store (Zustand)
 *
 * Central state management for FlatFinder. Persists to AsyncStorage.
 *
 * Key state:
 * - profiles: Vehicle profiles with dimensions and calibration data
 * - activeProfile: Currently selected vehicle for leveling
 * - settings: User preferences (units, haptics, thresholds, etc.)
 *
 * Persistence: Profile and settings changes are auto-saved to device storage.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calibration, createCalibration } from '../lib/levelingMath';
import { BlockInventory } from '../lib/rvLevelingMath';

export interface VehicleProfile {
  id: string;
  name: string;
  type: 'trailer' | 'motorhome' | 'van';
  wheelbaseInches: number;
  trackWidthInches: number;
  hitchOffsetInches?: number;
  blockInventory: BlockInventory[];
  calibration: Calibration;
  createdAt: Date;
  updatedAt: Date;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  units: 'degrees' | 'percent';
  measurementUnits: 'imperial' | 'metric';
  hapticsEnabled: boolean;
  audioEnabled: boolean;
  levelThreshold: number;
  themePreference: ThemePreference;
  keepAwake: boolean;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
}

interface AppState {
  // Profiles
  profiles: VehicleProfile[];
  activeProfileId: string | null;
  activeProfile: VehicleProfile | null;

  // Settings
  settings: AppSettings;

  // UI State
  showLevelingAssistant: boolean;

  // Actions
  loadProfiles: () => Promise<void>;
  saveProfiles: () => Promise<void>;
  addProfile: (profile: Omit<VehicleProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (id: string, updates: Partial<VehicleProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  isProfileNameTaken: (name: string, excludeId?: string) => boolean;

  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetOnboarding: () => void;

  calibrateActiveProfile: (offsets: Calibration) => void;

  // UI Actions
  setShowLevelingAssistant: (show: boolean) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'degrees',
  measurementUnits: 'imperial',
  hapticsEnabled: true,
  audioEnabled: false,
  levelThreshold: 1.0,
  themePreference: 'system',
  keepAwake: true,
  hasCompletedOnboarding: false,
  onboardingStep: 0,
};

const STORAGE_KEYS = {
  PROFILES: 'flatfinder_profiles',
  ACTIVE_PROFILE: 'flatfinder_active_profile',
  SETTINGS: 'flatfinder_settings',
};

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
  settings: DEFAULT_SETTINGS,
  showLevelingAssistant: false,

  loadProfiles: async () => {
    try {
      const [profilesJson, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILES),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE),
      ]);

      if (profilesJson) {
        const rawProfiles = JSON.parse(profilesJson);

        // Migrate legacy calibration format to modern format
        const profiles = rawProfiles.map(
          (profile: VehicleProfile & { calibration?: { pitch?: number; roll?: number } }) => {
            if (profile.calibration) {
              // Check if calibration is in legacy format
              if ('pitch' in profile.calibration && 'roll' in profile.calibration) {
                // Convert legacy {pitch, roll} to modern {pitchOffsetDegrees, rollOffsetDegrees}
                profile.calibration = createCalibration({
                  pitchOffsetDegrees: profile.calibration.pitch,
                  rollOffsetDegrees: profile.calibration.roll,
                });
              }
            } else {
              // Set default calibration if missing
              profile.calibration = createCalibration();
            }
            return profile;
          }
        );

        // Determine active profile:
        // 1. Use saved activeId if it exists and matches a profile
        // 2. If no active profile but profiles exist, auto-select the first one
        let finalActiveId = activeId;
        let activeProfile = activeId
          ? profiles.find((p: VehicleProfile) => p.id === activeId)
          : null;

        if (!activeProfile && profiles.length > 0) {
          // Auto-select the first profile if none is active
          finalActiveId = profiles[0].id;
          activeProfile = profiles[0];
        }

        set({
          profiles,
          activeProfileId: finalActiveId,
          activeProfile,
        });

        // Save migrated profiles to storage (and updated active profile)
        if (
          rawProfiles.length !== profiles.length ||
          JSON.stringify(rawProfiles) !== JSON.stringify(profiles) ||
          finalActiveId !== activeId
        ) {
          get().saveProfiles();
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  },

  saveProfiles: async () => {
    try {
      const { profiles, activeProfileId } = get();
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles)),
        activeProfileId
          ? AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId)
          : AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE),
      ]);
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  },

  addProfile: (profileData) => {
    const newProfile: VehicleProfile = {
      ...profileData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add the profile and automatically set it as active
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      activeProfileId: newProfile.id,
      activeProfile: newProfile,
    }));

    get().saveProfiles();
  },

  updateProfile: (id, updates) => {
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      activeProfile:
        state.activeProfileId === id
          ? { ...state.activeProfile!, ...updates, updatedAt: new Date() }
          : state.activeProfile,
    }));

    get().saveProfiles();
  },

  deleteProfile: (id) => {
    set((state) => {
      const remainingProfiles = state.profiles.filter((p) => p.id !== id);
      const wasActiveDeleted = state.activeProfileId === id;

      // If we deleted the active profile, auto-select another one if available
      let newActiveId: string | null = state.activeProfileId;
      let newActiveProfile: VehicleProfile | null = state.activeProfile;

      if (wasActiveDeleted) {
        if (remainingProfiles.length > 0) {
          // Select the most recently created profile
          const sorted = [...remainingProfiles].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Newest first
          });
          newActiveId = sorted[0].id;
          newActiveProfile = sorted[0];
        } else {
          newActiveId = null;
          newActiveProfile = null;
        }
      }

      return {
        profiles: remainingProfiles,
        activeProfileId: newActiveId,
        activeProfile: newActiveProfile,
      };
    });

    get().saveProfiles();
  },

  setActiveProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);

    set({
      activeProfileId: id,
      activeProfile: profile || null,
    });

    get().saveProfiles();
  },

  // Check if a profile name is already taken (case-insensitive)
  // excludeId allows checking during edit (exclude the profile being edited)
  isProfileNameTaken: (name, excludeId) => {
    const { profiles } = get();
    const normalizedName = name.trim().toLowerCase();
    return profiles.some(
      (p) => p.name.trim().toLowerCase() === normalizedName && p.id !== excludeId
    );
  },

  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        const loadedSettings = JSON.parse(settingsJson);

        // Migrate legacy nightMode to themePreference
        if ('nightMode' in loadedSettings && !('themePreference' in loadedSettings)) {
          loadedSettings.themePreference = loadedSettings.nightMode ? 'dark' : 'system';
          delete loadedSettings.nightMode;
        }

        // Merge with defaults to ensure new fields are present for existing users
        const mergedSettings = { ...DEFAULT_SETTINGS, ...loadedSettings };
        set({ settings: mergedSettings });

        // Save the merged settings to ensure new fields are persisted
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mergedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(get().settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));

    get().saveSettings();
  },

  resetOnboarding: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        hasCompletedOnboarding: false,
        onboardingStep: 0,
      },
      // Clear all profiles for a complete fresh start
      profiles: [],
      activeProfileId: null,
    }));

    get().saveSettings();
    get().saveProfiles();
  },

  calibrateActiveProfile: (offsets) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;

    get().updateProfile(activeProfileId, { calibration: offsets });
  },

  setShowLevelingAssistant: (show) => {
    set({ showLevelingAssistant: show });
  },
}));
