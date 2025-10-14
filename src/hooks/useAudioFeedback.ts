import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AppSettings } from '../state/appStore';

interface AudioFeedbackConfig {
  pitch: number;
  roll: number;
  isLevel: boolean;
  settings: AppSettings;
}

interface BeepThreshold {
  maxAngle: number;
  frequency: number;
  duration: number;
  interval: number;
}

export function useAudioFeedback({ pitch, roll, isLevel, settings }: AudioFeedbackConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef<number>(0);
  const lastVoiceTimeRef = useRef<number>(0);
  const lastAngleBracketRef = useRef<string>('');
  const successPlayedRef = useRef<boolean>(false);
  const unlockAttemptedRef = useRef<boolean>(false);
  const audioInitializedRef = useRef<boolean>(false);

  // Initialize Web Audio API context
  useEffect(() => {
    if (Platform.OS === 'web' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Comprehensive audio initialization - unlock both AudioContext and SpeechSynthesis
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeAudio = async () => {
      let successfulInit = false;

      // Initialize AudioContext
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('AudioContext resumed, state:', audioContextRef.current.state);
          successfulInit = true;
        } catch (error) {
          console.error('Failed to resume AudioContext:', error);
        }
      }

      // Initialize SpeechSynthesis by triggering it once
      if ('speechSynthesis' in window && settings.audioEnabled) {
        try {
          // Cancel any pending speech to reset
          window.speechSynthesis.cancel();

          // Speak a silent utterance to "warm up" the API
          const warmup = new SpeechSynthesisUtterance('');
          warmup.volume = 0;
          window.speechSynthesis.speak(warmup);
          console.log('SpeechSynthesis initialized');
          successfulInit = true;
        } catch (error) {
          console.error('Failed to initialize SpeechSynthesis:', error);
        }
      }

      if (successfulInit) {
        audioInitializedRef.current = true;
        console.log('Audio systems initialized successfully');
      }
    };

    // If audio is enabled and not yet initialized, try to initialize
    if (settings.audioEnabled && !audioInitializedRef.current) {
      initializeAudio();
    }

    // Reset initialization flag when audio is disabled
    if (!settings.audioEnabled) {
      audioInitializedRef.current = false;
    }

    // Listen for user interactions to initialize audio
    if (settings.audioEnabled && !unlockAttemptedRef.current) {
      const events = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
      const handleInteraction = () => {
        initializeAudio();
      };

      events.forEach(event => {
        document.addEventListener(event, handleInteraction, { once: true, passive: true });
      });
      unlockAttemptedRef.current = true;

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleInteraction);
        });
      };
    }
  }, [settings.audioEnabled, settings.audioStyle]);

  // Define beep thresholds based on sensitivity
  const getBeepThresholds = (): BeepThreshold[] => {
    const { audioSensitivity } = settings;

    if (audioSensitivity === 'conservative') {
      return [
        { maxAngle: 0.5, frequency: 1000, duration: 200, interval: 1000 },
        { maxAngle: 1.0, frequency: 800, duration: 150, interval: 2000 },
        { maxAngle: 2.0, frequency: 600, duration: 100, interval: 3000 },
      ];
    } else if (audioSensitivity === 'frequent') {
      return [
        { maxAngle: 0.5, frequency: 1000, duration: 200, interval: 300 },
        { maxAngle: 1.0, frequency: 800, duration: 150, interval: 500 },
        { maxAngle: 2.0, frequency: 600, duration: 100, interval: 800 },
        { maxAngle: 5.0, frequency: 400, duration: 80, interval: 1500 },
      ];
    } else { // normal
      return [
        { maxAngle: 0.5, frequency: 1000, duration: 200, interval: 500 },
        { maxAngle: 1.0, frequency: 800, duration: 150, interval: 1000 },
        { maxAngle: 2.0, frequency: 600, duration: 100, interval: 1500 },
        { maxAngle: 5.0, frequency: 400, duration: 80, interval: 2500 },
      ];
    }
  };

  // Play beep using Web Audio API
  const playBeep = async (frequency: number, duration: number) => {
    if (!audioContextRef.current || settings.audioStyle === 'voice') return;

    const ctx = audioContextRef.current;

    // Safari fix: Resume context if suspended
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('AudioContext resumed in playBeep, state:', ctx.state);
      } catch (error) {
        console.error('Failed to resume AudioContext in playBeep:', error);
        return;
      }
    }

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Apply volume (0-100 to 0-1)
      gainNode.gain.value = settings.audioVolume / 100;

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  // Play success sound
  const playSuccessSound = async () => {
    if (!audioContextRef.current || settings.audioStyle === 'voice') return;

    const ctx = audioContextRef.current;

    // Safari fix: Resume context if suspended
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('AudioContext resumed in playSuccessSound');
      } catch (error) {
        console.error('Failed to resume AudioContext in playSuccessSound:', error);
        return;
      }
    }

    // Three ascending tones for success
    setTimeout(() => playBeep(523, 150), 0);    // C5
    setTimeout(() => playBeep(659, 150), 150);  // E5
    setTimeout(() => playBeep(784, 300), 300);  // G5
  };

  // Speak voice command using Web Speech API
  const speak = (text: string) => {
    if (Platform.OS !== 'web' || settings.audioStyle === 'beeps') return;
    if (!('speechSynthesis' in window)) return;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = settings.audioVolume / 100;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      console.log('Speaking:', text);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking:', error);
    }
  };

  // Get directional voice command
  const getVoiceCommand = (pitch: number, roll: number): string => {
    const absPitch = Math.abs(pitch);
    const absRoll = Math.abs(roll);
    const maxAngle = Math.max(absPitch, absRoll);

    if (maxAngle < 0.5) {
      return 'Almost level';
    }

    // Determine primary correction needed
    if (absRoll > absPitch) {
      if (roll > 0) {
        return 'Lower right side';
      } else {
        return 'Lower left side';
      }
    } else {
      if (pitch > 0) {
        return 'Lower front';
      } else {
        return 'Lower back';
      }
    }
  };

  // Main audio feedback logic
  useEffect(() => {
    if (!settings.audioEnabled) {
      successPlayedRef.current = false;
      return;
    }

    const maxAngle = Math.max(Math.abs(pitch), Math.abs(roll));
    const now = Date.now();

    // Play success sound when level is achieved
    if (isLevel && !successPlayedRef.current) {
      if (settings.audioStyle !== 'voice') {
        playSuccessSound();
      }
      if (settings.audioStyle !== 'beeps') {
        speak('Perfect level');
      }
      successPlayedRef.current = true;
      lastAngleBracketRef.current = 'level';
      return;
    }

    // Reset success flag when no longer level
    if (!isLevel && successPlayedRef.current) {
      successPlayedRef.current = false;
    }

    // Don't play other sounds when level
    if (isLevel) return;

    // Find appropriate beep threshold
    const thresholds = getBeepThresholds();
    const threshold = thresholds.find(t => maxAngle <= t.maxAngle);

    if (!threshold) return;

    // Determine angle bracket for voice commands
    const angleBracket = maxAngle <= 0.5 ? '0.5' :
                         maxAngle <= 1.0 ? '1.0' :
                         maxAngle <= 2.0 ? '2.0' : '5.0';

    // Play beeps at intervals
    if (settings.audioStyle !== 'voice') {
      if (now - lastBeepTimeRef.current >= threshold.interval) {
        console.log('Playing beep:', threshold.frequency, 'Hz, AudioContext state:', audioContextRef.current?.state);
        playBeep(threshold.frequency, threshold.duration);
        lastBeepTimeRef.current = now;
      }
    }

    // Play voice commands when crossing thresholds
    if (settings.audioStyle !== 'beeps') {
      const voiceInterval = settings.audioSensitivity === 'conservative' ? 5000 :
                           settings.audioSensitivity === 'frequent' ? 2000 : 3000;

      if ((angleBracket !== lastAngleBracketRef.current || now - lastVoiceTimeRef.current >= voiceInterval) &&
          now - lastVoiceTimeRef.current >= 1000) { // Minimum 1s between voice commands
        const command = getVoiceCommand(pitch, roll);
        speak(command);
        lastVoiceTimeRef.current = now;
        lastAngleBracketRef.current = angleBracket;
      }
    }
  }, [pitch, roll, isLevel, settings]);

  return null;
}
