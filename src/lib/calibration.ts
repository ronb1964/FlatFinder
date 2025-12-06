/**
 * Calibration Module
 *
 * Handles device calibration for accurate leveling measurements.
 * Calibration accounts for phone mounting position on the RV surface,
 * compensating for any inherent tilt in how the phone is placed.
 *
 * Key functions:
 * - applyCalibration(): Converts raw sensor values to calibrated values
 * - calculateCalibrationOffsets(): Creates calibration from current position
 * - getLevelStatus(): Returns level state with color coding for UI
 */

import { applyCalibratedValues, createCalibration, type Calibration } from './levelingMath';

export interface CalibratedValues {
  pitch: number;
  roll: number;
}

// Re-export modern calibration types
export type { Calibration };
export { createCalibration };

/**
 * Apply calibration offsets to raw sensor values
 * Uses the enhanced math library for consistent calculations
 */
export function applyCalibration(
  rawValues: { pitch: number; roll: number },
  calibration: Calibration
): CalibratedValues {
  return applyCalibratedValues(rawValues, calibration);
}

/**
 * Calculate calibration offsets from current values (set as level)
 */
export function calculateCalibrationOffsets(currentValues: {
  pitch: number;
  roll: number;
}): Calibration {
  return createCalibration({
    pitchOffsetDegrees: currentValues.pitch,
    rollOffsetDegrees: currentValues.roll,
  });
}

/**
 * Check if values are within level threshold
 */
export function isLevel(values: { pitch: number; roll: number }, threshold: number = 0.5): boolean {
  return Math.abs(values.pitch) <= threshold && Math.abs(values.roll) <= threshold;
}

/**
 * Get level status with color coding
 * @param values - The pitch and roll values to check
 * @param threshold - The level threshold from settings (default 0.5)
 */
export function getLevelStatus(
  values: { pitch: number; roll: number },
  threshold: number = 0.5
): {
  isLevel: boolean;
  nearLevel: boolean;
  color: string;
  description: string;
} {
  const absPitch = Math.abs(values.pitch);
  const absRoll = Math.abs(values.roll);
  const maxAngle = Math.max(absPitch, absRoll);

  // "Perfect" is within 40% of threshold
  const perfectThreshold = threshold * 0.4;
  // "Near level" is within 2x threshold
  const nearThreshold = threshold * 2;
  // "Warning" is within 4x threshold
  const warningThreshold = threshold * 4;

  if (maxAngle <= perfectThreshold) {
    return {
      isLevel: true,
      nearLevel: true,
      color: '#10b981', // green
      description: 'Perfect Level!',
    };
  } else if (maxAngle <= threshold) {
    return {
      isLevel: true,
      nearLevel: true,
      color: '#22c55e', // light green
      description: 'Level',
    };
  } else if (maxAngle <= nearThreshold) {
    return {
      isLevel: false,
      nearLevel: true,
      color: '#eab308', // yellow
      description: 'Nearly Level',
    };
  } else if (maxAngle <= warningThreshold) {
    return {
      isLevel: false,
      nearLevel: false,
      color: '#f97316', // orange
      description: 'Not Level',
    };
  } else {
    return {
      isLevel: false,
      nearLevel: false,
      color: '#ef4444', // red
      description: 'Far From Level',
    };
  }
}

/**
 * Calculate shim height needed based on angle and wheelbase
 */
export function calculateShimHeight(angleDegrees: number, wheelbaseInches: number): number {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const height = Math.tan(angleRadians) * wheelbaseInches;
  return Math.round(height * 10) / 10; // Round to 0.1 inch
}

/**
 * Represents a single calibration reading with metadata
 */
export interface CalibrationReading {
  pitch: number;
  roll: number;
  timestamp: number;
  confidence?: number; // Optional confidence score
}

/**
 * Configuration for calibration process
 */
export interface CalibrationConfig {
  minReadings: number;
  maxReadings: number;
  stabilityThreshold: number; // Maximum deviation between readings
  outlierThreshold: number; // Threshold for detecting outlier readings
}

/**
 * Default calibration configuration
 */
export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  minReadings: 3,
  maxReadings: 5,
  stabilityThreshold: 1.0, // 1 degree
  outlierThreshold: 2.0, // 2 degrees
};

/**
 * Calculate the average calibration from multiple readings with outlier detection
 */
export function calculateAverageCalibration(
  readings: CalibrationReading[],
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): Calibration {
  if (readings.length === 0) {
    return createCalibration();
  }

  if (readings.length === 1) {
    return createCalibration({
      pitchOffsetDegrees: readings[0].pitch,
      rollOffsetDegrees: readings[0].roll,
    });
  }

  // Filter out potential outliers
  const filteredReadings = filterOutliers(readings, config.outlierThreshold);

  // Calculate weighted average (can be enhanced with confidence scores)
  const totalWeight = filteredReadings.reduce((sum, reading) => sum + (reading.confidence || 1), 0);

  const avgPitch =
    filteredReadings.reduce((sum, reading) => {
      const weight = reading.confidence || 1;
      return sum + reading.pitch * weight;
    }, 0) / totalWeight;

  const avgRoll =
    filteredReadings.reduce((sum, reading) => {
      const weight = reading.confidence || 1;
      return sum + reading.roll * weight;
    }, 0) / totalWeight;

  return createCalibration({
    pitchOffsetDegrees: avgPitch,
    rollOffsetDegrees: avgRoll,
  });
}

/**
 * Filter outlier readings based on standard deviation
 */
function filterOutliers(readings: CalibrationReading[], threshold: number): CalibrationReading[] {
  if (readings.length <= 2) {
    return readings; // Can't filter outliers with too few readings
  }

  const pitchValues = readings.map((r) => r.pitch);
  const rollValues = readings.map((r) => r.roll);

  const pitchMean = pitchValues.reduce((sum, val) => sum + val, 0) / pitchValues.length;
  const rollMean = rollValues.reduce((sum, val) => sum + val, 0) / rollValues.length;

  const pitchStdDev = Math.sqrt(
    pitchValues.reduce((sum, val) => sum + Math.pow(val - pitchMean, 2), 0) / pitchValues.length
  );
  const rollStdDev = Math.sqrt(
    rollValues.reduce((sum, val) => sum + Math.pow(val - rollMean, 2), 0) / rollValues.length
  );

  return readings.filter((reading) => {
    const pitchDeviation = Math.abs(reading.pitch - pitchMean);
    const rollDeviation = Math.abs(reading.roll - rollMean);

    return pitchDeviation <= threshold * pitchStdDev && rollDeviation <= threshold * rollStdDev;
  });
}

/**
 * Assess the quality of calibration readings
 */
export function assessCalibrationQuality(readings: CalibrationReading[]): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number; // 0-1 scale
  issues: string[];
  recommendation: string;
} {
  const issues: string[] = [];
  let confidence = 1.0;

  if (readings.length < 3) {
    issues.push('Insufficient readings for reliable calibration');
    confidence *= 0.5;
  }

  if (readings.length === 0) {
    return {
      quality: 'poor',
      confidence: 0,
      issues: ['No readings available'],
      recommendation: 'Take at least 3 readings for calibration',
    };
  }

  // Check reading consistency
  const pitchRange =
    Math.max(...readings.map((r) => r.pitch)) - Math.min(...readings.map((r) => r.pitch));
  const rollRange =
    Math.max(...readings.map((r) => r.roll)) - Math.min(...readings.map((r) => r.roll));

  if (pitchRange > 2.0) {
    issues.push('Large variation in pitch readings');
    confidence *= 0.8;
  }

  if (rollRange > 2.0) {
    issues.push('Large variation in roll readings');
    confidence *= 0.8;
  }

  // Check for temporal spacing
  const timeDiffs = readings
    .slice(1)
    .map((reading, i) => reading.timestamp - readings[i].timestamp);
  const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;

  if (avgTimeDiff < 1000) {
    // Less than 1 second between readings
    issues.push('Readings taken too quickly');
    confidence *= 0.9;
  }

  // Determine quality level
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (confidence >= 0.9) {
    quality = 'excellent';
  } else if (confidence >= 0.75) {
    quality = 'good';
  } else if (confidence >= 0.5) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  // Generate recommendation
  let recommendation = '';
  if (quality === 'excellent') {
    recommendation = 'Calibration quality is excellent. Ready to use.';
  } else if (quality === 'good') {
    recommendation = 'Good calibration quality. Safe to proceed.';
  } else if (quality === 'fair') {
    recommendation =
      'Calibration quality is acceptable but could be improved with more stable readings.';
  } else {
    recommendation =
      'Poor calibration quality. Consider retaking readings on a more stable surface.';
  }

  return {
    quality,
    confidence,
    issues,
    recommendation,
  };
}

/**
 * Create a calibration reading with current timestamp
 */
export function createCalibrationReading(
  pitch: number,
  roll: number,
  confidence?: number
): CalibrationReading {
  return {
    pitch,
    roll,
    timestamp: Date.now(),
    confidence,
  };
}

/**
 * Multi-position calibration reading with orientation info
 */
export interface OrientedCalibrationReading {
  pitch: number;
  roll: number;
  orientation: 0 | 90 | 180; // Phone rotation in degrees (0=normal, 90=clockwise, 180=upside-down)
  timestamp: number;
}

/**
 * Result of multi-position calibration solving
 */
export interface MultiPositionCalibrationResult {
  deviceBias: {
    pitch: number;
    roll: number;
  };
  vehicleTilt: {
    pitch: number;
    roll: number;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
}

/**
 * Solve for device bias and vehicle tilt from multi-position readings.
 *
 * Mathematical approach:
 * - At 0°: measured = vehicle + bias
 * - At 180°: measured = vehicle - bias (bias is inverted when phone is flipped)
 *
 * From these two positions:
 * - device_bias = (reading_0 - reading_180) / 2
 * - vehicle_tilt = (reading_0 + reading_180) / 2
 *
 * The 90° reading provides validation/redundancy.
 *
 * When the phone rotates 90° clockwise:
 * - What was pitch becomes roll (with sign change)
 * - What was roll becomes pitch
 */
export function solveMultiPositionCalibration(
  readings: OrientedCalibrationReading[]
): MultiPositionCalibrationResult {
  // Find readings by orientation
  const reading0 = readings.find((r) => r.orientation === 0);
  const reading90 = readings.find((r) => r.orientation === 90);
  const reading180 = readings.find((r) => r.orientation === 180);

  // Default result if we don't have enough data
  if (!reading0 || !reading180) {
    return {
      deviceBias: { pitch: 0, roll: 0 },
      vehicleTilt: { pitch: 0, roll: 0 },
      quality: 'poor',
      confidence: 0,
    };
  }

  // Solve using 0° and 180° positions
  // At 0°: measured = vehicle + device_bias
  // At 180°: measured = vehicle - device_bias (phone flipped inverts the bias)

  // For pitch:
  // pitch_0 = vehicle_pitch + bias_pitch
  // pitch_180 = vehicle_pitch - bias_pitch
  // Therefore:
  // bias_pitch = (pitch_0 - pitch_180) / 2
  // vehicle_pitch = (pitch_0 + pitch_180) / 2

  const deviceBiasPitch = (reading0.pitch - reading180.pitch) / 2;
  const vehicleTiltPitch = (reading0.pitch + reading180.pitch) / 2;

  // For roll:
  // roll_0 = vehicle_roll + bias_roll
  // roll_180 = vehicle_roll - bias_roll
  // Therefore:
  // bias_roll = (roll_0 - roll_180) / 2
  // vehicle_roll = (roll_0 + roll_180) / 2

  const deviceBiasRoll = (reading0.roll - reading180.roll) / 2;
  const vehicleTiltRoll = (reading0.roll + reading180.roll) / 2;

  // Calculate confidence based on consistency
  let confidence = 1.0;

  // If we have the 90° reading, use it for validation
  // At 90° clockwise rotation, the axes swap:
  // - The phone's pitch axis now measures what was roll
  // - The phone's roll axis now measures what was pitch (inverted)
  if (reading90) {
    // Expected values at 90° based on our solved vehicle tilt and bias
    // When rotated 90° CW: pitch_sensor -> roll_physical, roll_sensor -> -pitch_physical
    // The bias also rotates with the phone
    const expectedPitch90 = vehicleTiltRoll + deviceBiasRoll;
    const expectedRoll90 = -(vehicleTiltPitch + deviceBiasPitch);

    const pitchError = Math.abs(reading90.pitch - expectedPitch90);
    const rollError = Math.abs(reading90.roll - expectedRoll90);

    // Reduce confidence based on validation error
    if (pitchError > 1.0 || rollError > 1.0) {
      confidence *= 0.7;
    } else if (pitchError > 0.5 || rollError > 0.5) {
      confidence *= 0.85;
    }
  } else {
    // No 90° reading means less validation
    confidence *= 0.9;
  }

  // Determine quality level
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (confidence >= 0.9) {
    quality = 'excellent';
  } else if (confidence >= 0.75) {
    quality = 'good';
  } else if (confidence >= 0.5) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {
    deviceBias: {
      pitch: deviceBiasPitch,
      roll: deviceBiasRoll,
    },
    vehicleTilt: {
      pitch: vehicleTiltPitch,
      roll: vehicleTiltRoll,
    },
    quality,
    confidence,
  };
}

/**
 * Create an oriented calibration reading
 */
export function createOrientedReading(
  pitch: number,
  roll: number,
  orientation: 0 | 90 | 180
): OrientedCalibrationReading {
  return {
    pitch,
    roll,
    orientation,
    timestamp: Date.now(),
  };
}
