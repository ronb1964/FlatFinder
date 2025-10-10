/**
 * Validation utilities for sensor inputs and vehicle dimensions
 * Ensures data integrity and prevents calculation errors
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate sensor angle readings
 */
export function validateSensorAngle(
  angle: number,
  fieldName: string = 'angle'
): ValidationResult {
  const errors: string[] = [];

  if (typeof angle !== 'number' || isNaN(angle)) {
    errors.push(`${fieldName} must be a valid number`);
  } else {
    // Check for reasonable angle bounds (-180 to 180 degrees)
    if (angle < -180 || angle > 180) {
      errors.push(`${fieldName} must be between -180 and 180 degrees`);
    }

    // Warn about extreme angles that might indicate sensor issues
    if (Math.abs(angle) > 90) {
      console.warn(`Warning: ${fieldName} value ${angle}° is extreme and may indicate sensor issues`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pitch and roll together
 */
export function validateAttitudeReadings(pitch: number, roll: number): ValidationResult {
  const errors: string[] = [];

  const pitchValidation = validateSensorAngle(pitch, 'Pitch');
  const rollValidation = validateSensorAngle(roll, 'Roll');

  errors.push(...pitchValidation.errors, ...rollValidation.errors);

  // Check for unsafe combined angles (safety threshold)
  const maxSafeAngle = 15; // degrees
  if (Math.abs(pitch) > maxSafeAngle || Math.abs(roll) > maxSafeAngle) {
    console.warn(`Safety warning: Angles exceed ${maxSafeAngle}° safe leveling threshold`);
  }

  // Check for sensor malfunction patterns
  if (Math.abs(pitch) === 180 && Math.abs(roll) === 180) {
    errors.push('Sensor readings indicate possible malfunction');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate vehicle dimensions
 */
export function validateVehicleDimensions(
  wheelbaseInches: number,
  trackWidthInches: number,
  hitchOffsetInches?: number
): ValidationResult {
  const errors: string[] = [];

  // Validate wheelbase
  if (typeof wheelbaseInches !== 'number' || isNaN(wheelbaseInches)) {
    errors.push('Wheelbase must be a valid number');
  } else if (wheelbaseInches <= 0) {
    errors.push('Wheelbase must be positive');
  } else if (wheelbaseInches < 50) {
    errors.push('Wheelbase seems too small (minimum 50 inches)');
  } else if (wheelbaseInches > 600) {
    errors.push('Wheelbase seems too large (maximum 600 inches)');
  }

  // Validate track width
  if (typeof trackWidthInches !== 'number' || isNaN(trackWidthInches)) {
    errors.push('Track width must be a valid number');
  } else if (trackWidthInches <= 0) {
    errors.push('Track width must be positive');
  } else if (trackWidthInches < 40) {
    errors.push('Track width seems too small (minimum 40 inches)');
  } else if (trackWidthInches > 120) {
    errors.push('Track width seems too large (maximum 120 inches)');
  }

  // Validate hitch offset if provided
  if (hitchOffsetInches !== undefined) {
    if (typeof hitchOffsetInches !== 'number' || isNaN(hitchOffsetInches)) {
      errors.push('Hitch offset must be a valid number');
    } else if (hitchOffsetInches < 0) {
      errors.push('Hitch offset cannot be negative');
    } else if (hitchOffsetInches > 200) {
      errors.push('Hitch offset seems too large (maximum 200 inches)');
    }
  }

  // Validate relationships between dimensions
  if (errors.length === 0) {
    if (trackWidthInches > wheelbaseInches) {
      console.warn('Warning: Track width is larger than wheelbase - unusual but not impossible');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate calibration offsets
 */
export function validateCalibrationOffsets(
  pitchOffset: number,
  rollOffset: number
): ValidationResult {
  const errors: string[] = [];

  const pitchValidation = validateSensorAngle(pitchOffset, 'Pitch offset');
  const rollValidation = validateSensorAngle(rollOffset, 'Roll offset');

  errors.push(...pitchValidation.errors, ...rollValidation.errors);

  // Warn about large calibration offsets
  const maxReasonableOffset = 10; // degrees
  if (Math.abs(pitchOffset) > maxReasonableOffset || Math.abs(rollOffset) > maxReasonableOffset) {
    console.warn(
      `Warning: Large calibration offsets detected (pitch: ${pitchOffset}°, roll: ${rollOffset}°). ` +
      'Consider recalibrating on a known level surface.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate block inventory entry
 */
export function validateBlockInventory(
  height: number,
  quantity: number,
  label?: string
): ValidationResult {
  const errors: string[] = [];

  // Validate height
  if (typeof height !== 'number' || isNaN(height)) {
    errors.push('Block height must be a valid number');
  } else if (height <= 0) {
    errors.push('Block height must be positive');
  } else if (height > 12) {
    errors.push('Block height seems too large (maximum 12 inches)');
  }

  // Validate quantity
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    errors.push('Block quantity must be a valid number');
  } else if (quantity < 0) {
    errors.push('Block quantity cannot be negative');
  } else if (!Number.isInteger(quantity)) {
    errors.push('Block quantity must be a whole number');
  } else if (quantity > 100) {
    errors.push('Block quantity seems excessive (maximum 100)');
  }

  // Validate label if provided
  if (label !== undefined && label !== null) {
    if (typeof label !== 'string') {
      errors.push('Block label must be a string');
    } else if (label.length > 50) {
      errors.push('Block label is too long (maximum 50 characters)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and clamp sensor angle to valid range
 */
export function sanitizeSensorAngle(angle: number): number {
  if (typeof angle !== 'number' || isNaN(angle)) {
    return 0;
  }
  
  // Clamp to -180 to 180 range
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  
  return angle;
}

/**
 * Sanitize vehicle dimensions
 */
export function sanitizeVehicleDimensions(
  wheelbaseInches: number,
  trackWidthInches: number,
  hitchOffsetInches?: number
): {
  wheelbase: number;
  trackWidth: number;
  hitchOffset?: number;
} {
  return {
    wheelbase: Math.max(50, Math.min(600, wheelbaseInches || 144)),
    trackWidth: Math.max(40, Math.min(120, trackWidthInches || 72)),
    hitchOffset: hitchOffsetInches !== undefined 
      ? Math.max(0, Math.min(200, hitchOffsetInches))
      : undefined,
  };
}