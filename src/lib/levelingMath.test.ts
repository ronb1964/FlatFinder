/**
 * Test suite for leveling math utilities
 * Ported from original Flutter/Dart test cases
 */

import {
  computeSideShim,
  computeHitchLift,
  computeForeAftShimForVans,
  planBlocks,
  createCalibration,
  applyPitchCalibration,
  applyRollCalibration,
  isSlopePossiblyUnsafe,
  STANDARD_BLOCK_SIZES,
} from './levelingMath';

describe('Leveling Math', () => {
  test('Side shim for 72" track & 2° roll ≈ 1.26"', () => {
    const h = computeSideShim({ trackWidthInches: 72.0, rollDegrees: 2.0 });
    expect(h).toBeCloseTo(1.26, 2); // allow tiny numeric tolerance
  });

  test('Hitch lift for 144" axle→hitch & 0.8° pitch ≈ 2.01"', () => {
    const h = computeHitchLift({ axleToHitchInches: 144.0, pitchDegrees: 0.8 });
    expect(h).toBeCloseTo(2.01, 2);
  });

  test('Fore-aft shim (van) 130" wheelbase & 1.5° pitch', () => {
    const h = computeForeAftShimForVans({ wheelbaseInches: 130.0, pitchDegrees: 1.5 });
    // Expected ≈ (130/2)*tan(1.5°) = 65 * 0.02618 ≈ 1.702
    expect(h).toBeCloseTo(1.70, 2);
  });

  test('Block planning chooses practical stack', () => {
    const plan = planBlocks({ heightInches: 1.26, blockHeightsInches: [1.0, 0.5, 0.25] });
    // One possible greedy outcome is [1.0, 0.25, 0.25] -> total 1.5"
    expect(plan.total).toBeCloseTo(1.5, 6);
    expect(plan.blocks).toContain(1.0);
  });

  test('Calibration offsets apply correctly', () => {
    const c = createCalibration({ pitchOffsetDegrees: 0.3, rollOffsetDegrees: -0.2 });
    expect(applyPitchCalibration(1.0, c)).toBeCloseTo(0.7, 6);
    expect(applyRollCalibration(1.0, c)).toBeCloseTo(1.2, 6);
  });

  test('Safety heuristic', () => {
    expect(isSlopePossiblyUnsafe({ pitchDegrees: 5.9, rollDegrees: 0.0 })).toBe(false);
    expect(isSlopePossiblyUnsafe({ pitchDegrees: 6.0, rollDegrees: 0.0 })).toBe(true);
    expect(isSlopePossiblyUnsafe({ pitchDegrees: 0.0, rollDegrees: -6.5 })).toBe(true);
  });

  test('Standard block sizes are available', () => {
    expect(STANDARD_BLOCK_SIZES).toContain(1.0);
    expect(STANDARD_BLOCK_SIZES).toContain(0.5);
    expect(STANDARD_BLOCK_SIZES).toContain(0.25);
    expect(STANDARD_BLOCK_SIZES).toHaveLength(5);
  });

  test('Zero angle requires no shim', () => {
    expect(computeSideShim({ trackWidthInches: 72.0, rollDegrees: 0.0 })).toBe(0);
    expect(computeHitchLift({ axleToHitchInches: 144.0, pitchDegrees: 0.0 })).toBe(0);
  });

  test('Negative angles work correctly', () => {
    const positiveShim = computeSideShim({ trackWidthInches: 72.0, rollDegrees: 2.0 });
    const negativeShim = computeSideShim({ trackWidthInches: 72.0, rollDegrees: -2.0 });
    expect(positiveShim).toBeCloseTo(negativeShim, 6);
  });

  test('Block planning handles zero height', () => {
    const plan = planBlocks({ heightInches: 0, blockHeightsInches: [1.0, 0.5, 0.25] });
    expect(plan.blocks).toHaveLength(0);
    expect(plan.total).toBe(0);
  });

  test('Block planning handles impossible height', () => {
    const plan = planBlocks({ heightInches: 0.1, blockHeightsInches: [1.0, 0.5] });
    // Should use smallest block to overbuild slightly
    expect(plan.blocks).toContain(0.5);
    expect(plan.total).toBe(0.5);
  });
});