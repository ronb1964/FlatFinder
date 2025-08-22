import { 
  createCalibrationReading, 
  calculateAverageCalibration,
  assessCalibrationQuality,
  applyCalibration
} from './calibration';

describe('Calibration System', () => {
  test('creates calibration readings correctly', () => {
    const reading = createCalibrationReading(1.5, -0.8);
    
    expect(reading.pitch).toBe(1.5);
    expect(reading.roll).toBe(-0.8);
    expect(reading.timestamp).toBeGreaterThan(0);
  });

  test('calculates average calibration from multiple readings', () => {
    const reading1 = createCalibrationReading(1.5, -0.8);
    const reading2 = createCalibrationReading(1.2, -0.9);
    const reading3 = createCalibrationReading(1.7, -0.7);

    const average = calculateAverageCalibration([reading1, reading2, reading3]);
    
    expect(average.pitchOffsetDegrees).toBeCloseTo(1.4667, 3);
    expect(average.rollOffsetDegrees).toBeCloseTo(-0.8, 3);
  });

  test('applies calibration offsets correctly', () => {
    const rawValues = { pitch: 2, roll: -1.5 };
    const offsets = { pitchOffsetDegrees: 1.0, rollOffsetDegrees: -0.5 };
    
    const calibrated = applyCalibration(rawValues, offsets);
    
    expect(calibrated.pitch).toBeCloseTo(1.0, 3);
    expect(calibrated.roll).toBeCloseTo(-1.0, 3);
  });

  test('assesses calibration quality', () => {
    const goodReading1 = createCalibrationReading(1.5, -0.8);
    const goodReading2 = createCalibrationReading(1.52, -0.82);
    const goodReading3 = createCalibrationReading(1.48, -0.78);

    const quality = assessCalibrationQuality([goodReading1, goodReading2, goodReading3]);
    
    expect(quality.quality).toBe('excellent');
    expect(quality.confidence).toBeGreaterThan(0.8);
  });
});