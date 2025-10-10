import { useAppStore } from './appStore';
import { createCalibration } from '../lib/levelingMath';

describe('AppStore - Profile Calibration', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      profiles: [],
      activeProfileId: null,
      settings: {
        units: 'degrees',
        measurementUnits: 'imperial',
        hapticsEnabled: true,
        audioEnabled: false,
        levelThreshold: 0.5,
        nightMode: false,
        keepAwake: true,
        hasCompletedOnboarding: true,
        onboardingStep: 0,
      },
    });
  });

  test('creates profile with default calibration', () => {
    const { addProfile, profiles } = useAppStore.getState();
    
    addProfile({
      name: 'Test RV',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffsetInches: 48,
      blockInventory: [],
      calibration: createCalibration(),
    });

    const state = useAppStore.getState();
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].calibration).toBeDefined();
    expect(state.profiles[0].calibration.pitchOffsetDegrees).toBe(0);
    expect(state.profiles[0].calibration.rollOffsetDegrees).toBe(0);
  });

  test('updates profile calibration', () => {
    const { addProfile, updateProfile } = useAppStore.getState();
    
    // Add a profile
    addProfile({
      name: 'Test RV',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffsetInches: 48,
      blockInventory: [],
      calibration: createCalibration(),
    });

    const state1 = useAppStore.getState();
    const profileId = state1.profiles[0].id;

    // Update calibration
    const newCalibration = createCalibration({
      pitchOffsetDegrees: 1.5,
      rollOffsetDegrees: -0.8,
    });

    updateProfile(profileId, { calibration: newCalibration });

    const state2 = useAppStore.getState();
    expect(state2.profiles[0].calibration.pitchOffsetDegrees).toBe(1.5);
    expect(state2.profiles[0].calibration.rollOffsetDegrees).toBe(-0.8);
  });

  test('calibrates active profile', () => {
    const { addProfile, setActiveProfile, calibrateActiveProfile } = useAppStore.getState();
    
    // Add and activate a profile
    addProfile({
      name: 'Test RV',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffsetInches: 48,
      blockInventory: [],
      calibration: createCalibration(),
    });

    const state1 = useAppStore.getState();
    const profileId = state1.profiles[0].id;
    setActiveProfile(profileId);

    // Calibrate with new offsets
    const newCalibration = createCalibration({
      pitchOffsetDegrees: 2.0,
      rollOffsetDegrees: -1.2,
    });

    calibrateActiveProfile(newCalibration);

    const state2 = useAppStore.getState();
    const activeProfile = state2.profiles.find(p => p.id === state2.activeProfileId);
    expect(activeProfile?.calibration.pitchOffsetDegrees).toBe(2.0);
    expect(activeProfile?.calibration.rollOffsetDegrees).toBe(-1.2);
  });

  test('preserves calibration when editing other profile fields', () => {
    const { addProfile, updateProfile } = useAppStore.getState();
    
    // Add profile with calibration
    const calibration = createCalibration({
      pitchOffsetDegrees: 1.0,
      rollOffsetDegrees: 0.5,
    });

    addProfile({
      name: 'Test RV',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffsetInches: 48,
      blockInventory: [],
      calibration,
    });

    const state1 = useAppStore.getState();
    const profileId = state1.profiles[0].id;

    // Update name only
    updateProfile(profileId, { name: 'Updated RV' });

    const state2 = useAppStore.getState();
    expect(state2.profiles[0].name).toBe('Updated RV');
    // Calibration should be preserved
    expect(state2.profiles[0].calibration.pitchOffsetDegrees).toBe(1.0);
    expect(state2.profiles[0].calibration.rollOffsetDegrees).toBe(0.5);
  });

  test('handles multiple profiles with different calibrations', () => {
    const { addProfile } = useAppStore.getState();
    
    // Add first profile
    addProfile({
      name: 'RV 1',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffsetInches: 48,
      blockInventory: [],
      calibration: createCalibration({
        pitchOffsetDegrees: 1.0,
        rollOffsetDegrees: 0.5,
      }),
    });

    // Add second profile
    addProfile({
      name: 'RV 2',
      type: 'motorhome',
      wheelbaseInches: 280,
      trackWidthInches: 100,
      blockInventory: [],
      calibration: createCalibration({
        pitchOffsetDegrees: -0.5,
        rollOffsetDegrees: 1.2,
      }),
    });

    const state = useAppStore.getState();
    expect(state.profiles).toHaveLength(2);
    expect(state.profiles[0].calibration.pitchOffsetDegrees).toBe(1.0);
    expect(state.profiles[1].calibration.pitchOffsetDegrees).toBe(-0.5);
  });
});