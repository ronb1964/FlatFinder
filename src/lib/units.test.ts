import { formatMeasurement } from './units';

describe('formatMeasurement (imperial fractions)', () => {
  test('renders 0.125 as 1/8" when precision 0', () => {
    expect(formatMeasurement(0.125, 'imperial', 0)).toBe('1/8"');
  });

  test('renders 0.375 as 3/8" when precision 0', () => {
    expect(formatMeasurement(0.375, 'imperial', 0)).toBe('3/8"');
  });

  test('renders feet and fractional inches', () => {
    expect(formatMeasurement(12.125, 'imperial', 0)).toBe("1' 1/8\"");
  });
});

