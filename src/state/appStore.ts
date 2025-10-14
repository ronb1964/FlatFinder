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

export interface AppSettings {
  units: 'degrees' | 'percent';
  measurementUnits: 'imperial' | 'metric';
  hapticsEnabled: boolean;
  audioEnabled: boolean;
  audioStyle: 'beeps' | 'voice' | 'both';
  audioVolume: number; // 0-100
  audioSensitivity: 'conservative' | 'normal' | 'frequent';
  levelThreshold: number;
  nightMode: boolean;
  keepAwake: boolean;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  lastUsedProfileId?: string;
}

interface AppState {
  // Profiles
  profiles: VehicleProfile[];
  activeProfileId: string | null;
  activeProfile: VehicleProfile | null;
  
  // Settings
  settings: AppSettings;
  
  // Actions
  loadProfiles: () => Promise<void>;
  saveProfiles: () => Promise<void>;
  addProfile: (profile: Omit<VehicleProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (id: string, updates: Partial<VehicleProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetOnboarding: () => void;
  
  calibrateActiveProfile: (offsets: Calibration) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'degrees',
  measurementUnits: 'imperial',
  hapticsEnabled: true,
  audioEnabled: false,
  audioStyle: 'both',
  audioVolume: 75,
  audioSensitivity: 'normal',
  levelThreshold: 0.5,
  nightMode: false,
  keepAwake: true,
  hasCompletedOnboarding: false,
  onboardingStep: 0,
  lastUsedProfileId: undefined,
};

const STORAGE_KEYS = {
  PROFILES: 'levelmate_profiles',
  ACTIVE_PROFILE: 'levelmate_active_profile',
  SETTINGS: 'levelmate_settings',
};

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
  settings: DEFAULT_SETTINGS,

  loadProfiles: async () => {
    try {
      const [profilesJson, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILES),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE),
      ]);

      if (profilesJson) {
        const rawProfiles = JSON.parse(profilesJson);
        
        // Migrate legacy calibration format to modern format
        const profiles = rawProfiles.map((profile: any) => {
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
        });
        
        // Determine which profile to auto-select
        let selectedProfileId = activeId;
        let selectedProfile = activeId ? profiles.find((p: VehicleProfile) => p.id === activeId) : null;
        
        // Auto-select profile logic
        if (!selectedProfile && profiles.length > 0) {
          const { lastUsedProfileId } = get().settings;
          
          if (profiles.length === 1) {
            // If only one profile, auto-select it
            selectedProfile = profiles[0];
            selectedProfileId = profiles[0].id;
          } else if (lastUsedProfileId) {
            // If multiple profiles, try to select the last used one
            const lastUsedProfile = profiles.find((p: VehicleProfile) => p.id === lastUsedProfileId);
            if (lastUsedProfile) {
              selectedProfile = lastUsedProfile;
              selectedProfileId = lastUsedProfile.id;
            }
          }
        }
        
        set({
          profiles,
          activeProfileId: selectedProfileId,
          activeProfile: selectedProfile,
        });
        
        // Save migrated profiles to storage
        if (rawProfiles.length !== profiles.length || 
            JSON.stringify(rawProfiles) !== JSON.stringify(profiles)) {
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

    set((state) => ({
      profiles: [...state.profiles, newProfile],
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
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
      activeProfile: state.activeProfileId === id ? null : state.activeProfile,
    }));

    get().saveProfiles();
  },

  setActiveProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    
    set({
      activeProfileId: id,
      activeProfile: profile || null,
    });

    // Save the last used profile ID to settings
    get().updateSettings({ lastUsedProfileId: id });
    get().saveProfiles();
  },

  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        const loadedSettings = JSON.parse(settingsJson);
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
        onboardingStep: 0 
      },
    }));

    get().saveSettings();
  },

  calibrateActiveProfile: (offsets) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;

    get().updateProfile(activeProfileId, { calibration: offsets });
  },
}));