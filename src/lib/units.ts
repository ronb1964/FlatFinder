/**
 * Unit conversion utilities for imperial/metric measurements
 */

export interface MeasurementUnits {
  measurementUnits: 'imperial' | 'metric';
}

// Conversion constants
const INCHES_TO_CM = 2.54;
const CM_TO_INCHES = 1 / INCHES_TO_CM;

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * INCHES_TO_CM;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm * CM_TO_INCHES;
}

/**
 * Format a measurement value with appropriate units
 */
export function formatMeasurement(
  inches: number, 
  units: 'imperial' | 'metric',
  precision: number = 1
): string {
  if (units === 'metric') {
    const cm = inchesToCm(inches);
    if (cm >= 100) {
      return `${(cm / 100).toFixed(precision)} m`;
    }
    return `${cm.toFixed(precision)} cm`;
  } else {
    // Helper: format inches to nearest 1/8" as a friendly fraction
    const formatImperialFraction = (inchesValue: number): string => {
      const isNegative = inchesValue < 0;
      const abs = Math.abs(inchesValue);
      const whole = Math.floor(abs);
      // Round remainder to nearest eighth
      const remainder = abs - whole;
      const eighths = Math.round(remainder * 8);
      // If we rounded up to 8/8, carry to whole inches
      const normalizedWhole = whole + (eighths === 8 ? 1 : 0);
      const normalizedEighths = eighths === 8 ? 0 : eighths;
      const fractionMap: Record<number, string> = {
        0: '',
        1: '1/8',
        2: '1/4',
        3: '3/8',
        4: '1/2',
        5: '5/8',
        6: '3/4',
        7: '7/8',
      };
      const frac = fractionMap[normalizedEighths];
      const parts: string[] = [];
      if (normalizedWhole > 0) parts.push(String(normalizedWhole));
      if (frac) parts.push(frac);
      // Ensure we never render as 0" for tiny positive values
      if (parts.length === 0 && abs > 0) parts.push('1/8');
      const sign = isNegative ? '-' : '';
      return `${sign}${parts.join(' ')}"`;
    };

    if (inches >= 12) {
      const feet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      if (remainingInches === 0) {
        return `${feet}'`;
      }
      // For display requests with precision 0, prefer fractional inches
      const inchesDisplay = precision === 0
        ? formatImperialFraction(remainingInches)
        : `${remainingInches.toFixed(precision)}"`;
      return `${feet}' ${inchesDisplay}`;
    }
    // For small values, avoid showing 0" when precision=0
    return precision === 0
      ? formatImperialFraction(inches)
      : `${inches.toFixed(precision)}"`;
  }
}

/**
 * Get the unit suffix for measurements
 */
export function getUnitSuffix(units: 'imperial' | 'metric'): string {
  return units === 'metric' ? 'cm' : 'in';
}

/**
 * Convert a measurement value for display based on unit preference
 */
export function convertForDisplay(
  inches: number,
  units: 'imperial' | 'metric'
): number {
  return units === 'metric' ? inchesToCm(inches) : inches;
}

/**
 * Convert a user input value to internal inches
 */
export function convertToInches(
  value: number,
  units: 'imperial' | 'metric'
): number {
  return units === 'metric' ? cmToInches(value) : value;
}

/**
 * Get typical measurement values in the user's preferred units
 */
export function getTypicalMeasurements(units: 'imperial' | 'metric') {
  if (units === 'metric') {
    return {
      trailer: {
        wheelbase: Math.round(inchesToCm(240)), // ~610 cm
        track: Math.round(inchesToCm(96)),     // ~244 cm
        hitch: Math.round(inchesToCm(120))     // ~305 cm
      },
      motorhome: {
        wheelbase: Math.round(inchesToCm(264)), // ~671 cm
        track: Math.round(inchesToCm(96)),      // ~244 cm
        hitch: 0
      },
      van: {
        wheelbase: Math.round(inchesToCm(144)), // ~366 cm
        track: Math.round(inchesToCm(72)),      // ~183 cm
        hitch: 0
      }
    };
  } else {
    return {
      trailer: { wheelbase: 240, track: 96, hitch: 120 },
      motorhome: { wheelbase: 264, track: 96, hitch: 0 },
      van: { wheelbase: 144, track: 72, hitch: 0 }
    };
  }
}

/**
 * Get common leveling block heights in user's preferred units
 */
export function getCommonBlockHeights(units: 'imperial' | 'metric'): Array<{
  label: string;
  value: number; // Always stored in inches internally
  displayValue: number;
  description: string;
}> {
  const blocks = [
    { inches: 1, description: 'Thin blocks/shims' },
    { inches: 2, description: 'Standard blocks' },
    { inches: 4, description: 'Thick blocks' },
    { inches: 6, description: 'Extra thick blocks' },
    { inches: 8, description: 'Heavy duty blocks' }
  ];

  return blocks.map(block => ({
    label: formatMeasurement(block.inches, units, 0),
    value: block.inches, // Internal storage is always inches
    displayValue: units === 'metric' ? Math.round(inchesToCm(block.inches)) : block.inches,
    description: block.description
  }));
}
