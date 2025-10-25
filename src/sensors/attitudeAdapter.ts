/**
 * Cross-platform attitude sensor adapter
 * Uses expo-sensors on native platforms and DeviceOrientationEvent on web
 * 
 * All outputs use FlatFinder canonical coordinate system:
 * +pitch = nose up, -pitch = nose down
 * +roll = right side up, -roll = left side up
 */

import { Platform } from 'react-native';
import { normalizeAttitude, SENSOR_NORMALIZATION_PRESETS } from '../lib/coordinateSystem';

export interface AttitudeReading {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  isReliable: boolean;
  timestamp: number;
}

export interface AttitudeConfig {
  updateInterval: number; // milliseconds
  lowPassAlpha: number; // 0-1, smoothing factor
}

export interface AttitudeAdapter {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'not-required'>;
  start(config: AttitudeConfig, callback: (reading: AttitudeReading) => void): Promise<void>;
  stop(): void;
  getPermissionStatus(): 'granted' | 'denied' | 'unknown' | 'not-required';
}

const DEFAULT_CONFIG: AttitudeConfig = {
  updateInterval: 100, // 10 Hz
  lowPassAlpha: 0.8,
};

/**
 * Native implementation using expo-sensors
 */
class NativeAttitudeAdapter implements AttitudeAdapter {
  private subscription: any = null;
  private prevReading: { pitch: number; roll: number } = { pitch: 0, roll: 0 };
  private isStarted = false;

  async isAvailable(): Promise<boolean> {
    try {
      const { DeviceMotion } = await import('expo-sensors');
      return await DeviceMotion.isAvailableAsync();
    } catch (error) {
      console.log('Native sensors not available:', error);
      return false;
    }
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'not-required'> {
    try {
      const { DeviceMotion } = await import('expo-sensors');
      const { status } = await DeviceMotion.requestPermissionsAsync();
      return status === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.log('Permission request failed:', error);
      return 'denied';
    }
  }

  getPermissionStatus(): 'granted' | 'denied' | 'unknown' | 'not-required' {
    // On native, we assume permission is required and unknown until explicitly checked
    return 'unknown';
  }

  async start(config: AttitudeConfig, callback: (reading: AttitudeReading) => void): Promise<void> {
    if (this.isStarted) {
      this.stop();
    }

    try {
      const { DeviceMotion } = await import('expo-sensors');
      
      // Set update interval
      DeviceMotion.setUpdateInterval(config.updateInterval);

      // Subscribe to device motion
      this.subscription = DeviceMotion.addListener((motionData) => {
        if (!motionData.rotation) {
          return;
        }

        // Convert from expo-sensors format (radians) to degrees
        const rawPitch = (motionData.rotation.beta || 0) * (180 / Math.PI);
        const rawRoll = (motionData.rotation.gamma || 0) * (180 / Math.PI);
        const rawYaw = (motionData.rotation.alpha || 0) * (180 / Math.PI);

        // Apply low-pass filter
        const filteredPitch = config.lowPassAlpha * rawPitch + 
                             (1 - config.lowPassAlpha) * this.prevReading.pitch;
        const filteredRoll = config.lowPassAlpha * rawRoll + 
                            (1 - config.lowPassAlpha) * this.prevReading.roll;

        this.prevReading = { pitch: filteredPitch, roll: filteredRoll };

        // Normalize to FlatFinder canonical coordinate system
        const normalized = normalizeAttitude(
          { pitch: filteredPitch, roll: filteredRoll, yaw: rawYaw },
          SENSOR_NORMALIZATION_PRESETS.EXPO_DEVICE_MOTION
        );

        const reading: AttitudeReading = {
          pitchDeg: normalized.pitch,
          rollDeg: normalized.roll,
          yawDeg: normalized.yaw || rawYaw,
          isReliable: true, // expo-sensors is generally reliable when available
          timestamp: Date.now(),
        };

        callback(reading);
      });

      this.isStarted = true;
    } catch (error) {
      console.error('Failed to start native attitude sensor:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isStarted = false;
  }
}

/**
 * Web implementation using DeviceOrientationEvent
 */
class WebAttitudeAdapter implements AttitudeAdapter {
  private eventListener: ((event: DeviceOrientationEvent) => void) | null = null;
  private prevReading: { pitch: number; roll: number } = { pitch: 0, roll: 0 };
  private isStarted = false;
  private permissionStatus: 'granted' | 'denied' | 'unknown' | 'not-required' = 'unknown';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           typeof (window as any).DeviceOrientationEvent !== 'undefined';
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'not-required'> {
    if (typeof window === 'undefined') {
      return 'denied';
    }

    // Check if we're on iOS Safari which requires permission
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOSSafari) {
      const DeviceOrientationEvent = (window as any).DeviceOrientationEvent;
      
      if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          this.permissionStatus = permission === 'granted' ? 'granted' : 'denied';
          return this.permissionStatus;
        } catch (error) {
          console.log('Permission request failed:', error);
          this.permissionStatus = 'denied';
          return 'denied';
        }
      }
    }

    // For non-iOS or older browsers, permission is not required
    this.permissionStatus = 'not-required';
    return 'not-required';
  }

  getPermissionStatus(): 'granted' | 'denied' | 'unknown' | 'not-required' {
    return this.permissionStatus;
  }

  async start(config: AttitudeConfig, callback: (reading: AttitudeReading) => void): Promise<void> {
    if (this.isStarted) {
      this.stop();
    }

    if (typeof window === 'undefined') {
      throw new Error('Window not available');
    }

    // Throttle updates to respect updateInterval
    let lastUpdate = 0;

    this.eventListener = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastUpdate < config.updateInterval) {
        return;
      }
      lastUpdate = now;

      const rawPitch = event.beta || 0;   // front/back tilt -180 to 180
      const rawRoll = event.gamma || 0;   // left/right tilt -90 to 90
      const rawYaw = event.alpha || 0;    // compass heading

      // Apply low-pass filter
      const filteredPitch = config.lowPassAlpha * rawPitch + 
                           (1 - config.lowPassAlpha) * this.prevReading.pitch;
      const filteredRoll = config.lowPassAlpha * rawRoll + 
                          (1 - config.lowPassAlpha) * this.prevReading.roll;

      this.prevReading = { pitch: filteredPitch, roll: filteredRoll };

      // Normalize to FlatFinder canonical coordinate system
      const normalized = normalizeAttitude(
        { pitch: filteredPitch, roll: filteredRoll, yaw: rawYaw },
        SENSOR_NORMALIZATION_PRESETS.WEB_DEVICE_ORIENTATION
      );

      const reading: AttitudeReading = {
        pitchDeg: normalized.pitch,
        rollDeg: normalized.roll,
        yawDeg: normalized.yaw || rawYaw,
        isReliable: true, // Assume reliable if we're getting events
        timestamp: now,
      };

      callback(reading);
    };

    window.addEventListener('deviceorientation', this.eventListener);
    this.isStarted = true;

    // Test if events are actually firing after a delay
    setTimeout(() => {
      if (this.isStarted && this.prevReading.pitch === 0 && this.prevReading.roll === 0) {
        console.warn('Device orientation events may not be firing');
      }
    }, 2000);
  }

  stop(): void {
    if (this.eventListener && typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.eventListener);
      this.eventListener = null;
    }
    this.isStarted = false;
  }
}

/**
 * Factory function to get the appropriate adapter for the current platform
 */
export function createAttitudeAdapter(): AttitudeAdapter {
  if (Platform.OS === 'web') {
    return new WebAttitudeAdapter();
  } else {
    return new NativeAttitudeAdapter();
  }
}

/**
 * Convenience function to create adapter with default config
 */
export function createDefaultAttitudeAdapter(): { adapter: AttitudeAdapter; config: AttitudeConfig } {
  return {
    adapter: createAttitudeAdapter(),
    config: DEFAULT_CONFIG,
  };
}
