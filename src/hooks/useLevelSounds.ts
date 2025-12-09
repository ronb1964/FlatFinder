import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

// Sound assets - require() is necessary for Expo Audio assets
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DING_SOUND = require('../../assets/sounds/ding.mp3') as number;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TADA_SOUND = require('../../assets/sounds/tada.mp3') as number;

// Interval constants (in ms)
const TADA_INTERVAL = 1500; // Fixed interval for perfect level
const DING_INTERVAL_SLOW = 1500; // At threshold (furthest from perfect)
const DING_INTERVAL_FAST = 300; // Nearly at perfect level

// Deviation thresholds
const PERFECT_THRESHOLD = 0.5; // Below this = perfect level (tada)
const LEVEL_THRESHOLD_DEFAULT = 2.0; // Default level threshold

interface UseLevelSoundsOptions {
  enabled: boolean;
  isActive: boolean; // Whether sounds should be playing (bubble level visible)
}

interface UseLevelSoundsReturn {
  // Play a single sound (for Check Level results)
  playDing: () => Promise<void>;
  playTada: () => Promise<void>;
  // Update repeating sounds based on current deviation
  updateAudioFeedback: (deviation: number, levelThreshold: number) => void;
  // Stop all repeating sounds
  stopRepeating: () => void;
}

/**
 * Calculate the ding interval based on deviation from perfect level.
 * Returns interval in ms - faster (smaller) as deviation approaches perfect.
 *
 * Dings start at "nearly level" (2x threshold) at the slowest rate,
 * and speed up as you approach perfect level.
 *
 * @param deviation - Total deviation from level (degrees)
 * @param levelThreshold - The level threshold setting
 * @returns Interval in milliseconds
 */
function calculateDingInterval(deviation: number, levelThreshold: number): number {
  // "Nearly level" is 2x the level threshold (matches calibration.ts)
  const nearlyLevelThreshold = levelThreshold * 2;

  // Clamp deviation between perfect threshold and nearly level threshold
  const minDev = PERFECT_THRESHOLD;
  const maxDev = nearlyLevelThreshold;
  const clampedDev = Math.max(minDev, Math.min(deviation, maxDev));

  // Linear interpolation: at maxDev (nearly level) -> SLOW, at minDev (perfect) -> FAST
  const range = maxDev - minDev;
  const progress = (clampedDev - minDev) / range; // 0 = close to perfect, 1 = at nearly level

  const interval = DING_INTERVAL_FAST + progress * (DING_INTERVAL_SLOW - DING_INTERVAL_FAST);
  return Math.round(interval);
}

export function useLevelSounds({ enabled, isActive }: UseLevelSoundsOptions): UseLevelSoundsReturn {
  const dingSound = useRef<Sound | null>(null);
  const tadaSound = useRef<Sound | null>(null);
  const timeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const currentMode = useRef<'ding' | 'tada' | null>(null);
  const currentDeviation = useRef<number>(0);
  const currentThreshold = useRef<number>(LEVEL_THRESHOLD_DEFAULT);
  const isActiveRef = useRef<boolean>(isActive);
  const enabledRef = useRef<boolean>(enabled);

  // Keep refs in sync with props
  useEffect(() => {
    isActiveRef.current = isActive;
    enabledRef.current = enabled;
  }, [isActive, enabled]);

  // Load sounds on mount
  useEffect(() => {
    let mounted = true;

    const loadSounds = async () => {
      try {
        // Configure audio mode for mixing with other apps
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: ding } = await Audio.Sound.createAsync(DING_SOUND);
        const { sound: tada } = await Audio.Sound.createAsync(TADA_SOUND);

        if (mounted) {
          dingSound.current = ding;
          tadaSound.current = tada;
        } else {
          // Component unmounted during load, clean up
          await ding.unloadAsync();
          await tada.unloadAsync();
        }
      } catch (error) {
        console.warn('Failed to load level sounds:', error);
      }
    };

    loadSounds();

    return () => {
      mounted = false;
      // Clean up sounds on unmount
      if (dingSound.current) {
        dingSound.current.unloadAsync();
        dingSound.current = null;
      }
      if (tadaSound.current) {
        tadaSound.current.unloadAsync();
        tadaSound.current = null;
      }
      // Clear any running timeout
      if (timeoutRef.current) {
        globalThis.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Stop repeating when disabled or inactive
  useEffect(() => {
    if (!enabled || !isActive) {
      if (timeoutRef.current) {
        globalThis.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        currentMode.current = null;
      }
    }
  }, [enabled, isActive]);

  // Play single ding sound
  const playDing = useCallback(async () => {
    if (!enabledRef.current || !dingSound.current) return;
    try {
      await dingSound.current.setPositionAsync(0);
      await dingSound.current.playAsync();
    } catch (error) {
      console.warn('Failed to play ding:', error);
    }
  }, []);

  // Play single tada sound
  const playTada = useCallback(async () => {
    if (!enabledRef.current || !tadaSound.current) return;
    try {
      await tadaSound.current.setPositionAsync(0);
      await tadaSound.current.playAsync();
    } catch (error) {
      console.warn('Failed to play tada:', error);
    }
  }, []);

  // Schedule the next sound based on current mode and deviation
  const scheduleNextSound = useCallback(() => {
    if (!enabledRef.current || !isActiveRef.current || !currentMode.current) {
      return;
    }

    let interval: number;
    let playSound: () => Promise<void>;

    if (currentMode.current === 'tada') {
      interval = TADA_INTERVAL;
      playSound = playTada;
    } else {
      interval = calculateDingInterval(currentDeviation.current, currentThreshold.current);
      playSound = playDing;
    }

    timeoutRef.current = globalThis.setTimeout(() => {
      if (enabledRef.current && isActiveRef.current && currentMode.current) {
        playSound();
        scheduleNextSound(); // Schedule the next one
      }
    }, interval);
  }, [playDing, playTada]);

  // Update audio feedback based on deviation
  const updateAudioFeedback = useCallback(
    (deviation: number, levelThreshold: number) => {
      if (!enabled || !isActive) {
        // Not active, stop any playing sounds
        if (timeoutRef.current) {
          globalThis.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        currentMode.current = null;
        return;
      }

      // Store current deviation and threshold for interval calculation
      currentDeviation.current = deviation;
      currentThreshold.current = levelThreshold;

      // "Nearly level" is 2x the level threshold (matches calibration.ts)
      const nearlyLevelThreshold = levelThreshold * 2;

      // Determine if we're in perfect level or nearly level
      const isPerfect = deviation < PERFECT_THRESHOLD;
      const isNearlyLevel = deviation <= nearlyLevelThreshold;

      if (!isNearlyLevel) {
        // Not even nearly level - stop sounds
        if (timeoutRef.current) {
          globalThis.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        currentMode.current = null;
        return;
      }

      // Determine desired mode: tada for perfect, ding for approaching level
      const desiredMode = isPerfect ? 'tada' : 'ding';

      // If mode changed, restart the sound loop
      if (currentMode.current !== desiredMode) {
        // Clear existing timeout
        if (timeoutRef.current) {
          globalThis.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        currentMode.current = desiredMode;

        // Play immediately, then schedule next
        if (desiredMode === 'tada') {
          playTada();
        } else {
          playDing();
        }
        scheduleNextSound();
      }
      // If mode is the same (ding), the interval will automatically adjust
      // on the next scheduled timeout since we updated currentDeviation
    },
    [enabled, isActive, playDing, playTada, scheduleNextSound]
  );

  // Stop all repeating sounds
  const stopRepeating = useCallback(() => {
    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    currentMode.current = null;
  }, []);

  return {
    playDing,
    playTada,
    updateAudioFeedback,
    stopRepeating,
  };
}
