/**
 * Sensor Sampling & Filtering Module
 *
 * Provides robust sensor data collection by sampling over a time window
 * and applying filtering to reduce noise and improve calibration accuracy.
 */

export interface SensorReading {
  pitch: number;
  roll: number;
  timestamp: number;
}

export interface SamplingConfig {
  /** Duration to sample in milliseconds (default: 1000ms) */
  durationMs?: number;
  /** Interval between samples in milliseconds (default: 50ms = 20 samples/sec) */
  intervalMs?: number;
  /** Whether to apply median filter before averaging (default: true) */
  useMedianFilter?: boolean;
  /** Percentage of outliers to remove from each end (0-0.5, default: 0.1 = 10%) */
  outlierThreshold?: number;
}

export interface SamplingResult {
  pitch: number;
  roll: number;
  sampleCount: number;
  durationMs: number;
}

/**
 * Calculate median of a sorted array
 */
function median(sortedArray: number[]): number {
  const mid = Math.floor(sortedArray.length / 2);

  if (sortedArray.length % 2 === 0) {
    return (sortedArray[mid - 1] + sortedArray[mid]) / 2;
  }
  return sortedArray[mid];
}

/**
 * Apply median filter by removing outliers and returning median
 *
 * @param values - Array of numbers
 * @param outlierThreshold - Percentage of values to remove from each end (0-0.5)
 */
function applyMedianFilter(values: number[], outlierThreshold: number = 0.1): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);

  // Remove outliers from both ends
  const removeCount = Math.floor(sorted.length * outlierThreshold);
  const filtered = sorted.slice(removeCount, sorted.length - removeCount);

  if (filtered.length === 0) return median(sorted);

  return median(filtered);
}

/**
 * Calculate simple average of an array
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Sample sensor data over a time window and apply filtering
 *
 * @param getSensorReading - Function that returns current pitch and roll
 * @param config - Sampling configuration
 * @returns Promise that resolves with filtered sensor reading
 *
 * @example
 * ```ts
 * const result = await sampleSensorData(
 *   () => ({ pitch: pitchDeg, roll: rollDeg }),
 *   { durationMs: 1000, intervalMs: 50 }
 * );
 * console.log(`Filtered pitch: ${result.pitch}, roll: ${result.roll}`);
 * ```
 */
export async function sampleSensorData(
  getSensorReading: () => { pitch: number; roll: number },
  config: SamplingConfig = {}
): Promise<SamplingResult> {
  const {
    durationMs = 1000,
    intervalMs = 50,
    useMedianFilter = true,
    outlierThreshold = 0.1
  } = config;

  const readings: SensorReading[] = [];
  const startTime = Date.now();
  const endTime = startTime + durationMs;

  // Collect readings over the sampling window
  while (Date.now() < endTime) {
    const reading = getSensorReading();
    readings.push({
      pitch: reading.pitch,
      roll: reading.roll,
      timestamp: Date.now()
    });

    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  // Extract pitch and roll arrays
  const pitchValues = readings.map(r => r.pitch);
  const rollValues = readings.map(r => r.roll);

  // Apply filtering
  let filteredPitch: number;
  let filteredRoll: number;

  if (useMedianFilter) {
    filteredPitch = applyMedianFilter(pitchValues, outlierThreshold);
    filteredRoll = applyMedianFilter(rollValues, outlierThreshold);
  } else {
    // Simple average without filtering
    filteredPitch = average(pitchValues);
    filteredRoll = average(rollValues);
  }

  return {
    pitch: filteredPitch,
    roll: filteredRoll,
    sampleCount: readings.length,
    durationMs: Date.now() - startTime
  };
}

/**
 * PURE FUNCTIONS FOR TESTING
 * These don't depend on async/timers and can be easily unit tested
 */

/**
 * Filter a set of readings using median filter
 *
 * @param readings - Array of sensor readings
 * @param outlierThreshold - Percentage of values to remove from each end (0-0.5)
 */
export function filterReadings(
  readings: SensorReading[],
  outlierThreshold: number = 0.1
): { pitch: number; roll: number } {
  const pitchValues = readings.map(r => r.pitch);
  const rollValues = readings.map(r => r.roll);

  return {
    pitch: applyMedianFilter(pitchValues, outlierThreshold),
    roll: applyMedianFilter(rollValues, outlierThreshold)
  };
}

/**
 * Calculate simple average of readings (no filtering)
 */
export function averageReadings(
  readings: SensorReading[]
): { pitch: number; roll: number } {
  const pitchValues = readings.map(r => r.pitch);
  const rollValues = readings.map(r => r.roll);

  return {
    pitch: average(pitchValues),
    roll: average(rollValues)
  };
}
