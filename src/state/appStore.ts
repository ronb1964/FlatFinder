import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalibrationOffsets } from '../lib/calibration';
import { BlockInventory } from '../lib/rvLevelingMath';

export interface VehicleProfile {
  id: string;
  name: string;
  type: 'trailer' | 'motorhome' | 'van';
  wheelbaseInches: number;
  trackWidthInches: number;
  hitchOffsetInches?: number;
  blockInventory: BlockInventory[];
  calibration: CalibrationOffsets;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  units: 'degrees' | 'percent';
  hapticsEnabled: boolean;
  audioEnabled: boolean;
  levelThreshold: number;
  nightMode: boolean;
  keepAwake: boolean;
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
  
  calibrateActiveProfile: (offsets: CalibrationOffsets) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'degrees',
  hapticsEnabled: true,
  audioEnabled: false,
  levelThreshold: 0.5,
  nightMode: false,
  keepAwake: true,
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
        const profiles = JSON.parse(profilesJson);
        const activeProfile = activeId ? profiles.find((p: VehicleProfile) => p.id === activeId) : null;
        
        set({
          profiles,
          activeProfileId: activeId,
          activeProfile,
        });
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

    get().saveProfiles();
  },

  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        set({ settings: JSON.parse(settingsJson) });
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

  calibrateActiveProfile: (offsets) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;

    get().updateProfile(activeProfileId, { calibration: offsets });
  },
}));