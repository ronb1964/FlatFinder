/**
 * LevelMate Coordinate System Normalization
 *
 * This module defines the canonical coordinate system for LevelMate and provides
 * normalization functions to ensure consistent behavior across all components.
 *
 * ## LevelMate Canonical Coordinate System:
 *
 * - **+pitch (nose up)**: Front of vehicle is higher than rear
 * - **-pitch (nose down)**: Front of vehicle is lower than rear
 * - **+roll (right side up)**: Right side of vehicle is higher than left
 * - **-roll (left side up)**: Left side of vehicle is lower than right
 *
 * ## Physical Interpretation:
 *
 * - When pitch > 0: Need to LOWER the front (or raise the rear)
 * - When pitch < 0: Need to RAISE the front (or lower the rear)
 * - When roll > 0: Need to LOWER the right side (or raise the left)
 * - When roll < 0: Need to RAISE the right side (or lower the left)
 *
 * ## For RV Leveling Math:
 *
 * The geometric calculations in rvLevelingMath.ts expect this coordinate system
 * and will calculate the correct lift requirements for each wheel/jack point.
 */

export interface AttitudeReading {
  pitch: number; // degrees, +nose up, -nose down
  roll: number; // degrees, +right up, -left up
  yaw?: number; // degrees, compass heading (optional)
}

export interface CalibratedAttitude extends AttitudeReading {
  isReliable: boolean;
  timestamp?: number;
}

/**
 * Normalize raw sensor attitude to LevelMate canonical coordinate system.
 *
 * Different sensor sources may use different coordinate conventions:
 * - Some sensors: +roll = left side up
 * - Some sensors: +pitch = nose down
 * - Device orientation: depends on device mounting
 *
 * This function converts any input to our canonical system.
 *
 * @param rawAttitude Raw attitude from sensors (any coordinate convention)
 * @param options Normalization options to handle different sensor conventions
 * @returns Normalized attitude in LevelMate canonical coordinate system
 */
export function normalizeAttitude(
  rawAttitude: AttitudeReading,
  options: {
    invertPitch?: boolean; // true if sensor +pitch = nose down
    invertRoll?: boolean; // true if sensor +roll = left side up
    swapAxes?: boolean; // true if pitch/roll are swapped
  } = {}
): AttitudeReading {
  const { invertPitch = false, invertRoll = false, swapAxes = false } = options;

  let pitch = rawAttitude.pitch;
  let roll = rawAttitude.roll;

  // Swap axes if needed (rare, but some mounting orientations need this)
  if (swapAxes) {
    [pitch, roll] = [roll, pitch];
  }

  // Apply coordinate system inversions
  if (invertPitch) {
    pitch = -pitch;
  }

  if (invertRoll) {
    roll = -roll;
  }

  return {
    pitch,
    roll,
    yaw: rawAttitude.yaw,
  };
}

/**
 * Apply calibration offsets to normalized attitude readings.
 *
 * Calibration compensates for:
 * - Device mounting angle relative to vehicle
 * - Sensor bias/offset errors
 * - Vehicle's "natural" tilt when parked level
 *
 * @param attitude Normalized attitude reading
 * @param calibration Calibration offsets (in same coordinate system)
 * @returns Calibrated attitude reading
 */
export function applyCalibrationToAttitude(
  attitude: AttitudeReading,
  calibration: { pitch: number; roll: number }
): AttitudeReading {
  return {
    pitch: attitude.pitch - calibration.pitch,
    roll: attitude.roll - calibration.roll,
    yaw: attitude.yaw,
  };
}

/**
 * Convert normalized attitude to leveling measurement format.
 *
 * This is a simple pass-through since our coordinate system matches
 * the expectation of the leveling math, but it provides a clear
 * conversion point and ensures type safety.
 *
 * @param attitude Normalized, calibrated attitude
 * @returns Leveling measurement for rvLevelingMath calculations
 */
export function attitudeToLevelingMeasurement(attitude: AttitudeReading): {
  pitchDegrees: number;
  rollDegrees: number;
} {
  return {
    pitchDegrees: attitude.pitch,
    rollDegrees: attitude.roll,
  };
}

/**
 * Get human-readable description of current attitude.
 *
 * @param attitude Normalized attitude reading
 * @param threshold Threshold in degrees below which we consider "level"
 * @returns Human-readable description
 */
export function describeAttitude(
  attitude: AttitudeReading,
  threshold: number = 0.5
): {
  isLevel: boolean;
  pitchDescription: string;
  rollDescription: string;
  overallDescription: string;
} {
  const isLevel = Math.abs(attitude.pitch) < threshold && Math.abs(attitude.roll) < threshold;

  const pitchDescription =
    Math.abs(attitude.pitch) < threshold
      ? 'Level'
      : attitude.pitch > 0
        ? `${attitude.pitch.toFixed(1)}° nose up`
        : `${Math.abs(attitude.pitch).toFixed(1)}° nose down`;

  const rollDescription =
    Math.abs(attitude.roll) < threshold
      ? 'Level'
      : attitude.roll > 0
        ? `${attitude.roll.toFixed(1)}° right high`
        : `${Math.abs(attitude.roll).toFixed(1)}° left high`;

  const overallDescription = isLevel ? 'Level' : `${pitchDescription}, ${rollDescription}`;

  return {
    isLevel,
    pitchDescription,
    rollDescription,
    overallDescription,
  };
}

/**
 * Default normalization options for common sensor types.
 */
export const SENSOR_NORMALIZATION_PRESETS = {
  // Standard DeviceOrientationEvent (most web browsers)
  WEB_DEVICE_ORIENTATION: {
    invertPitch: false, // beta: +nose up is correct
    invertRoll: false, // gamma: +right up is correct
    swapAxes: false,
  },

  // expo-sensors DeviceMotion (React Native)
  EXPO_DEVICE_MOTION: {
    invertPitch: false, // rotation.beta: +nose up is correct
    invertRoll: true, // rotation.gamma: native reports opposite to our convention
    swapAxes: false,
  },

  // Custom preset for sensors that use different conventions
  INVERTED_CONVENTION: {
    invertPitch: true, // if sensor +pitch = nose down
    invertRoll: true, // if sensor +roll = left up
    swapAxes: false,
  },
} as const;
