import { 
  createCalibrationReading, 
  calculateAverageCalibration,
  assessCalibrationQuality,
  createCalibration,
  applyCalibration
} from './calibration';

// Test basic calibration reading creation
console.log('Testing calibration reading creation...');
const reading1 = createCalibrationReading(1.5, -0.8);
const reading2 = createCalibrationReading(1.2, -0.9);
const reading3 = createCalibrationReading(1.7, -0.7);

console.log('Created readings:', { reading1, reading2, reading3 });

// Test average calibration calculation
console.log('\nTesting average calibration calculation...');
const avgCalibration = calculateAverageCalibration([reading1, reading2, reading3]);
console.log('Average calibration:', avgCalibration);

// Test calibration quality assessment
console.log('\nTesting calibration quality assessment...');
const quality = assessCalibrationQuality([reading1, reading2, reading3]);
console.log('Calibration quality:', quality);

// Test calibration application
console.log('\nTesting calibration application...');
const rawValues = { pitch: 2.0, roll: -1.5 };
const calibrated = applyCalibration(rawValues, avgCalibration);
console.log('Raw values:', rawValues);
console.log('Calibrated values:', calibrated);

// Test with poor quality readings (large variations)
console.log('\nTesting with poor quality readings...');
const poorReading1 = createCalibrationReading(1.0, -1.0);
const poorReading2 = createCalibrationReading(5.0, 2.0); // Large variation
const poorReading3 = createCalibrationReading(1.2, -0.8);

const poorQuality = assessCalibrationQuality([poorReading1, poorReading2, poorReading3]);
console.log('Poor quality assessment:', poorQuality);

const poorAvgCalibration = calculateAverageCalibration([poorReading1, poorReading2, poorReading3]);
console.log('Poor average calibration (with outlier filtering):', poorAvgCalibration);

console.log('\nAll calibration tests completed successfully! ✅');