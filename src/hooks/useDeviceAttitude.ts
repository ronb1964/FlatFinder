/**
 * useDeviceAttitude Hook
 *
 * Provides real-time device orientation data (pitch, roll, heading/yaw) from
 * the device's motion sensors. This is the core sensor hook for the leveling feature.
 *
 * Features:
 * - Automatic sensor initialization and permission handling
 * - Platform-specific sensor adaptation (iOS/Android/Web)
 * - Debug mode override for testing without physical device tilting
 * - Graceful error handling for unavailable/denied sensors
 *
 * Usage:
 *   const { pitchDeg, rollDeg, yawDeg, isReliable } = useDeviceAttitude();
 */

import { useEffect, useState, useRef } from 'react';
import {
  createDefaultAttitudeAdapter,
  type AttitudeReading,
  type AttitudeAdapter,
  type AttitudeConfig,
} from '../sensors/attitudeAdapter';
import { useDebugStore } from '../state/debugStore';

export interface DeviceAttitudeData {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  raw: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  isReliable: boolean;
  errorMessage?: string;
  isAvailable: boolean | null;
  permissionStatus: string;
}

const DEFAULT_ATTITUDE: DeviceAttitudeData = {
  pitchDeg: 0,
  rollDeg: 0,
  yawDeg: 0,
  raw: { pitch: 0, roll: 0, yaw: 0 },
  isReliable: false,
  errorMessage: '',
  isAvailable: null,
  permissionStatus: 'unknown',
};

export function useDeviceAttitude(customConfig?: Partial<AttitudeConfig>): DeviceAttitudeData {
  const [attitude, setAttitude] = useState<DeviceAttitudeData>(DEFAULT_ATTITUDE);

  const adapterRef = useRef<AttitudeAdapter | null>(null);
  const configRef = useRef<AttitudeConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSensors = async () => {
      try {
        // Create adapter and config
        const { adapter, config } = createDefaultAttitudeAdapter();

        // Apply custom config if provided
        const finalConfig = customConfig ? { ...config, ...customConfig } : config;

        adapterRef.current = adapter;
        configRef.current = finalConfig;

        // Check availability
        const isAvailable = await adapter.isAvailable();

        if (!mounted) return;

        if (!isAvailable) {
          setAttitude((prev) => ({
            ...prev,
            isAvailable: false,
            errorMessage: 'Device orientation sensors not available on this platform',
            permissionStatus: 'not-required',
          }));
          return;
        }

        setAttitude((prev) => ({
          ...prev,
          isAvailable: true,
        }));

        // Check/request permissions
        const initialPermissionStatus = adapter.getPermissionStatus();
        let permissionStatus = initialPermissionStatus;

        if (initialPermissionStatus === 'unknown') {
          permissionStatus = await adapter.requestPermission();
        }

        if (!mounted) return;

        setAttitude((prev) => ({
          ...prev,
          permissionStatus,
        }));

        if (permissionStatus === 'denied') {
          setAttitude((prev) => ({
            ...prev,
            errorMessage: 'Permission denied for device orientation sensors',
          }));
          return;
        }

        // Start listening for attitude updates
        const handleAttitudeUpdate = (reading: AttitudeReading) => {
          if (!mounted) return;

          setAttitude((prev) => ({
            ...prev,
            pitchDeg: reading.pitchDeg,
            rollDeg: reading.rollDeg,
            yawDeg: reading.yawDeg,
            raw: {
              pitch: reading.pitchDeg,
              roll: reading.rollDeg,
              yaw: reading.yawDeg,
            },
            isReliable: reading.isReliable,
            errorMessage: '',
          }));
        };

        await adapter.start(finalConfig, handleAttitudeUpdate);

        if (!mounted) return;

        setAttitude((prev) => ({
          ...prev,
          errorMessage: '',
        }));
      } catch (error) {
        console.error('Failed to initialize device attitude sensors:', error);

        if (mounted) {
          setAttitude((prev) => ({
            ...prev,
            isAvailable: false,
            isReliable: false,
            errorMessage: `Sensor initialization failed: ${error} `,
          }));
        }
      }
    };

    initializeSensors();

    // Cleanup function
    return () => {
      mounted = false;
      if (adapterRef.current) {
        adapterRef.current.stop();
        adapterRef.current = null;
      }
    };
  }, [customConfig]);

  // Debug override
  const { isDebugMode, mockPitch, mockRoll, mockHeading } = useDebugStore();

  // Return current attitude data (with debug override if active)
  if (isDebugMode) {
    return {
      ...attitude,
      pitchDeg: mockPitch,
      rollDeg: mockRoll,
      yawDeg: mockHeading,
      raw: {
        pitch: mockPitch,
        roll: mockRoll,
        yaw: mockHeading,
      },
      isReliable: true,
      isAvailable: true,
      errorMessage: '',
    };
  }

  return attitude;
}
