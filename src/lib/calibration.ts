import { 
  applyCalibratedValues, 
  createCalibration, 
  getLevelStatus as getMathLevelStatus,
  type Calibration 
} from './levelingMath'

// Legacy interfaces for compatibility
export interface CalibrationOffsets {
  pitch: number;
  roll: number;
}

export interface CalibratedValues {
  pitch: number;
  roll: number;
}

// Re-export modern calibration types
export type { Calibration }
export { createCalibration }

/**
 * Apply calibration offsets to raw sensor values
 * Uses the enhanced math library for consistent calculations
 */
export function applyCalibration(
  rawValues: { pitch: number; roll: number },
  offsets: CalibrationOffsets | Calibration
): CalibratedValues {
  // Debug logging
  console.log('=== APPLY CALIBRATION ===');
  console.log('Raw values:', rawValues);
  console.log('Offsets received:', offsets);
  console.log('Offsets type check - has pitchOffsetDegrees:', 'pitchOffsetDegrees' in offsets);
  
  // Convert legacy format to modern format if needed
  const calibration = 'pitchOffsetDegrees' in offsets 
    ? offsets 
    : createCalibration({
        pitchOffsetDegrees: offsets.pitch,
        rollOffsetDegrees: offsets.roll,
      });
  
  console.log('Final calibration object:', calibration);
  
  const result = applyCalibratedValues(rawValues, calibration);
  console.log('Calibrated result:', result);
  
  return result;
}

/**
 * Calculate calibration offsets from current values (set as level)
 */
export function calculateCalibrationOffsets(
  currentValues: { pitch: number; roll: number }
): Calibration {
  return createCalibration({
    pitchOffsetDegrees: currentValues.pitch,
    rollOffsetDegrees: currentValues.roll,
  });
}

/**
 * Check if values are within level threshold
 */
export function isLevel(
  values: { pitch: number; roll: number },
  threshold: number = 0.5
): boolean {
  return Math.abs(values.pitch) <= threshold && Math.abs(values.roll) <= threshold;
}

/**
 * Get level status with color coding
 */
export function getLevelStatus(values: { pitch: number; roll: number }): {
  isLevel: boolean;
  nearLevel: boolean;
  color: string;
  description: string;
} {
  const absPitch = Math.abs(values.pitch);
  const absRoll = Math.abs(values.roll);
  const maxAngle = Math.max(absPitch, absRoll);

  if (maxAngle <= 0.2) {
    return {
      isLevel: true,
      nearLevel: true,
      color: '#10b981', // green
      description: 'Perfect Level',
    };
  } else if (maxAngle <= 0.5) {
    return {
      isLevel: true,
      nearLevel: true,
      color: '#22c55e', // light green
      description: 'Level',
    };
  } else if (maxAngle <= 1.0) {
    return {
      isLevel: false,
      nearLevel: true,
      color: '#eab308', // yellow
      description: 'Nearly Level',
    };
  } else if (maxAngle <= 2.0) {
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
export function calculateShimHeight(
  angleDegrees: number,
  wheelbaseInches: number
): number {
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
  
  const avgPitch = filteredReadings.reduce((sum, reading) => {
    const weight = reading.confidence || 1;
    return sum + (reading.pitch * weight);
  }, 0) / totalWeight;
  
  const avgRoll = filteredReadings.reduce((sum, reading) => {
    const weight = reading.confidence || 1;
    return sum + (reading.roll * weight);
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

  const pitchValues = readings.map(r => r.pitch);
  const rollValues = readings.map(r => r.roll);
  
  const pitchMean = pitchValues.reduce((sum, val) => sum + val, 0) / pitchValues.length;
  const rollMean = rollValues.reduce((sum, val) => sum + val, 0) / rollValues.length;
  
  const pitchStdDev = Math.sqrt(
    pitchValues.reduce((sum, val) => sum + Math.pow(val - pitchMean, 2), 0) / pitchValues.length
  );
  const rollStdDev = Math.sqrt(
    rollValues.reduce((sum, val) => sum + Math.pow(val - rollMean, 2), 0) / rollValues.length
  );

  return readings.filter(reading => {
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
  const pitchRange = Math.max(...readings.map(r => r.pitch)) - Math.min(...readings.map(r => r.pitch));
  const rollRange = Math.max(...readings.map(r => r.roll)) - Math.min(...readings.map(r => r.roll));
  
  if (pitchRange > 2.0) {
    issues.push('Large variation in pitch readings');
    confidence *= 0.8;
  }
  
  if (rollRange > 2.0) {
    issues.push('Large variation in roll readings');
    confidence *= 0.8;
  }

  // Check for temporal spacing
  const timeDiffs = readings.slice(1).map((reading, i) => reading.timestamp - readings[i].timestamp);
  const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  
  if (avgTimeDiff < 1000) { // Less than 1 second between readings
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
    recommendation = 'Calibration quality is acceptable but could be improved with more stable readings.';
  } else {
    recommendation = 'Poor calibration quality. Consider retaking readings on a more stable surface.';
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