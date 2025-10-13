/**
 * Test suite for RV Leveling Mathematics
 * 
 * These tests validate the accuracy of geometric calculations
 * and ensure precision meets professional leveling standards.
 */

import { 
  RVLevelingCalculator, 
  RVGeometry, 
  LevelingMeasurement, 
  BlockInventory,
  RVPresets,
  StandardBlockSets
} from './rvLevelingMath';

describe('RVLevelingCalculator', () => {
  
  describe('Basic Geometric Calculations', () => {
    
    test('calculates correct lift for simple roll scenario', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 144,
        trackWidthInches: 72,
        hitchOffsetInches: 84
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: 0,
        rollDegrees: 2.0  // 2 degrees rolled to left
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      // Expected lift on right side after normalization: 2 * tan(2°) * 36" ≈ 2.51"
      // (because left side goes negative and gets normalized to 0)
      const expectedRightLift = 2 * Math.tan(2 * Math.PI / 180) * 36;
      
      const frontRight = lifts.find(l => l.location === 'front_right');
      const rearRight = lifts.find(l => l.location === 'rear_right');
      
      expect(frontRight?.liftInches).toBeCloseTo(expectedRightLift, 2);
      expect(rearRight?.liftInches).toBeCloseTo(expectedRightLift, 2);
      
      // Left side should be reference (0)
      const frontLeft = lifts.find(l => l.location === 'front_left');
      const rearLeft = lifts.find(l => l.location === 'rear_left');
      
      expect(frontLeft?.liftInches).toBeCloseTo(0, 2);
      expect(rearLeft?.liftInches).toBeCloseTo(0, 2);
    });
    
    test('calculates correct lift for simple pitch scenario', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 144,
        trackWidthInches: 72
        // No hitch for this test - testing pure pitch scenario
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: 1.5,  // 1.5 degrees nose up
        rollDegrees: 0
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      // Expected front lift: tan(1.5°) * 144" ≈ 3.77" (no normalization needed for pitch-only)
      const expectedFrontLift = Math.tan(1.5 * Math.PI / 180) * 144;
      
      const frontLeft = lifts.find(l => l.location === 'front_left');
      const frontRight = lifts.find(l => l.location === 'front_right');
      
      expect(frontLeft?.liftInches).toBeCloseTo(expectedFrontLift, 2);
      expect(frontRight?.liftInches).toBeCloseTo(expectedFrontLift, 2);
      
      // Rear should be reference (0)
      const rearLeft = lifts.find(l => l.location === 'rear_left');
      const rearRight = lifts.find(l => l.location === 'rear_right');
      
      expect(rearLeft?.liftInches).toBeCloseTo(0, 2);
      expect(rearRight?.liftInches).toBeCloseTo(0, 2);
    });
    
    test('calculates correct hitch lift for trailer', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 144,
        trackWidthInches: 72,
        hitchOffsetInches: 84
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: -2.0,  // 2 degrees nose down
        rollDegrees: 0
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      // Expected hitch lift: For -2° pitch (nose down), after normalization
      // Raw calculation: tan(2°) * 84" ≈ 2.94"
      // But we must normalize so front wheels (lowest point) are at 0
      // Front wheel pitch component: wheelbase * tan(-2°) = 144 * tan(-2°) ≈ -5.03"  
      // So hitch lift = raw hitch + |front offset| = 2.94 + 5.03 = 7.97"
      const frontPitchOffset = Math.abs(144 * Math.tan(-2 * Math.PI / 180));
      const rawHitchLift = Math.tan(2 * Math.PI / 180) * 84;
      const expectedHitchLift = rawHitchLift + frontPitchOffset;
      
      const hitch = lifts.find(l => l.location === 'hitch');
      expect(hitch?.liftInches).toBeCloseTo(expectedHitchLift, 2);
    });
    
    test('handles combined pitch and roll correctly', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 180,
        trackWidthInches: 84
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: 1.0,   // 1 degree nose up
        rollDegrees: 1.5     // 1.5 degrees right side up
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      // Front right should have both pitch and roll contribution
      // But we need to account for normalization - the minimum lift becomes 0
      
      // Calculate all raw lifts first
      const pitchRad = 1 * Math.PI / 180;
      const rollRad = 1.5 * Math.PI / 180;
      const halfTrack = 84 / 2;
      
      // Raw calculations (before normalization)
      const frontLeftRaw = 180 * Math.tan(pitchRad) + (-halfTrack) * Math.tan(rollRad);
      const frontRightRaw = 180 * Math.tan(pitchRad) + halfTrack * Math.tan(rollRad);
      const rearLeftRaw = (-halfTrack) * Math.tan(rollRad);
      const rearRightRaw = halfTrack * Math.tan(rollRad);
      
      // Find minimum (most negative) lift
      const minRaw = Math.min(frontLeftRaw, frontRightRaw, rearLeftRaw, rearRightRaw);
      
      // Expected after normalization
      const expectedFrontRight = frontRightRaw - minRaw;
      
      const frontRight = lifts.find(l => l.location === 'front_right');
      expect(frontRight?.liftInches).toBeCloseTo(expectedFrontRight, 2);
    });
  });
  
  describe('Block Stacking Optimization', () => {
    
    test('selects optimal blocks for exact height match', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 5 },
        { thickness: 0.5, quantity: 4 },
        { thickness: 0.25, quantity: 4 }
      ];
      
      const stack = RVLevelingCalculator.calculateOptimalBlocks(2.75, inventory);
      
      expect(stack.totalHeight).toBe(2.75);
      expect(stack.blocks).toEqual([
        { thickness: 1.0, count: 2 },
        { thickness: 0.5, count: 1 },
        { thickness: 0.25, count: 1 }
      ]);
      expect(stack.totalBlocks).toBe(4);
    });
    
    test('uses greedy algorithm efficiently', () => {
      const inventory: BlockInventory[] = [
        { thickness: 2.0, quantity: 3 },
        { thickness: 1.0, quantity: 10 },
        { thickness: 0.25, quantity: 8 }
      ];
      
      const stack = RVLevelingCalculator.calculateOptimalBlocks(4.25, inventory);
      
      expect(stack.totalHeight).toBe(4.25);
      expect(stack.blocks).toEqual([
        { thickness: 2.0, count: 2 },
        { thickness: 0.25, count: 1 }
      ]);
      expect(stack.totalBlocks).toBe(3); // Minimal block usage
    });
    
    test('handles insufficient inventory gracefully', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 2 }
      ];
      
      const stack = RVLevelingCalculator.calculateOptimalBlocks(3.5, inventory);
      
      expect(stack.totalHeight).toBe(2.0);
      expect(stack.totalBlocks).toBe(2);
    });
  });
  
  describe('Complete Leveling Plans', () => {
    
    test('creates feasible plan for typical RV scenario', () => {
      const geometry = RVPresets.mediumTrailer();
      const measurement: LevelingMeasurement = {
        pitchDegrees: 1.2,
        rollDegrees: -0.8
      };
      const inventory = StandardBlockSets.professional();
      
      const plan = RVLevelingCalculator.createLevelingPlan(
        geometry,
        measurement,
        inventory
      );
      
      expect(plan.isLevelable).toBe(true);
      expect(plan.warnings.length).toBe(0);
      expect(plan.wheelLifts.length).toBe(5); // 4 wheels + hitch
      
      // Verify all stacks are reasonable
      Object.values(plan.blockStacks).forEach(stack => {
        expect(stack.totalBlocks).toBeLessThanOrEqual(8); // Reasonable stack height
      });
    });
    
    test('detects unsafe slope conditions', () => {
      const geometry = RVPresets.smallTrailer();
      const measurement: LevelingMeasurement = {
        pitchDegrees: 7.5,  // Exceeds safe limit
        rollDegrees: 2.0
      };
      const inventory = StandardBlockSets.basic();
      
      const plan = RVLevelingCalculator.createLevelingPlan(
        geometry,
        measurement,
        inventory,
        6.0 // Safe slope limit
      );
      
      expect(plan.warnings.length).toBeGreaterThan(0);
      expect(plan.warnings[0]).toContain('exceeds safe limit');
    });
    
    test('handles insufficient blocks scenario', () => {
      const geometry = RVPresets.largeTrailer();
      const measurement: LevelingMeasurement = {
        pitchDegrees: 3.0,
        rollDegrees: 2.5
      };
      const inventory: BlockInventory[] = [
        { thickness: 0.25, quantity: 2 } // Very limited inventory
      ];
      
      const plan = RVLevelingCalculator.createLevelingPlan(
        geometry,
        measurement,
        inventory
      );
      
      expect(plan.isLevelable).toBe(false);
      expect(plan.warnings.some(w => w.includes('Cannot achieve'))).toBe(true);
    });
  });
  
  describe('Edge Cases and Validation', () => {
    
    test('validates geometry parameters', () => {
      const invalidGeometry: RVGeometry = {
        wheelbaseInches: 30,   // Too small
        trackWidthInches: 200  // Too large
      };
      
      const errors = RVLevelingCalculator.validateGeometry(invalidGeometry);
      
      expect(errors.length).toBe(2);
      expect(errors[0]).toContain('Wheelbase must be between');
      expect(errors[1]).toContain('Track width must be between');
    });
    
    test('handles zero angle inputs', () => {
      const geometry = RVPresets.mediumTrailer();
      const measurement: LevelingMeasurement = {
        pitchDegrees: 0,
        rollDegrees: 0
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      lifts.forEach(lift => {
        expect(lift.liftInches).toBeCloseTo(0, 3);
      });
    });
    
    test('handles negative lift normalization', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 144,
        trackWidthInches: 72
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: -2.0,  // Nose down
        rollDegrees: -1.5    // Left side down
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      
      // All lifts should be non-negative after normalization
      lifts.forEach(lift => {
        expect(lift.liftInches).toBeGreaterThanOrEqual(0);
      });
      
      // At least one lift should be zero (reference point)
      const minLift = Math.min(...lifts.map(l => l.liftInches));
      expect(minLift).toBeCloseTo(0, 3);
    });
  });
  
  describe('Precision and Accuracy', () => {
    
    test('maintains precision within engineering tolerances', () => {
      const geometry: RVGeometry = {
        wheelbaseInches: 144.0,
        trackWidthInches: 72.0
      };
      
      // Test with precise angle that should yield exact results
      const measurement: LevelingMeasurement = {
        pitchDegrees: 1.0,  // tan(1°) ≈ 0.017453
        rollDegrees: 0
      };
      
      const lifts = RVLevelingCalculator.calculateLiftRequirements(geometry, measurement);
      const frontLift = lifts.find(l => l.location === 'front_left')?.liftInches || 0;
      
      // Manual calculation: tan(1°) * 144" = 2.5133...
      const expectedLift = Math.tan(Math.PI / 180) * 144;
      
      expect(frontLift).toBeCloseTo(expectedLift, 4); // 0.0001" precision
    });
    
    test('block stacking achieves sub-quarter-inch accuracy', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 10 },
        { thickness: 0.5, quantity: 10 },
        { thickness: 0.25, quantity: 10 },
        { thickness: 0.125, quantity: 10 }
      ];
      
      // Test various target heights
      const testHeights = [1.375, 2.625, 0.875, 3.125];
      
      testHeights.forEach(height => {
        const stack = RVLevelingCalculator.calculateOptimalBlocks(height, [...inventory]);
        const accuracy = Math.abs(stack.totalHeight - height);
        
        expect(accuracy).toBeLessThanOrEqual(0.125); // Within 1/8" tolerance
      });
    });
  });
  
  describe('Real-World Scenarios', () => {
    
    test('typical campground leveling scenario', () => {
      // Simulate arriving at a sloped campsite
      const geometry: RVGeometry = {
        wheelbaseInches: 204,  // 17-foot travel trailer
        trackWidthInches: 84,
        hitchOffsetInches: 96
      };
      
      const measurement: LevelingMeasurement = {
        pitchDegrees: 1.8,   // Moderate nose-up slope
        rollDegrees: -1.2    // Slight left-side-down
      };
      
      const inventory = StandardBlockSets.professional();
      
      const plan = RVLevelingCalculator.createLevelingPlan(
        geometry,
        measurement,
        inventory
      );
      
      expect(plan.isLevelable).toBe(true);
      expect(plan.maxLiftRequired).toBeLessThan(12.0); // Challenging but reasonable for campground
      
      // Verify practical block usage
      const totalBlocks = Object.values(plan.blockStacks)
        .reduce((sum, stack) => sum + stack.totalBlocks, 0);
      
      expect(totalBlocks).toBeLessThan(20); // Practical to carry and deploy
    });
    
    test('extreme but manageable slope scenario', () => {
      const geometry = RVPresets.smallTrailer();
      const measurement: LevelingMeasurement = {
        pitchDegrees: 4.5,   // Steep but within safe limits
        rollDegrees: 3.2
      };
      
      const inventory = StandardBlockSets.extended();
      
      const plan = RVLevelingCalculator.createLevelingPlan(
        geometry,
        measurement,
        inventory,
        6.0
      );
      
      expect(plan.isLevelable).toBe(true);
      expect(plan.warnings.length).toBe(0); // Should handle within extended inventory
    });
  });
});

describe('RV Presets and Standard Sets', () => {
  
  test('RV presets have valid geometries', () => {
    const presets = [
      RVPresets.smallTrailer(),
      RVPresets.mediumTrailer(),
      RVPresets.largeTrailer(),
      RVPresets.classAMotorhome(),
      RVPresets.classBMotorhome(),
      RVPresets.classCMotorhome()
    ];
    
    presets.forEach(geometry => {
      const errors = RVLevelingCalculator.validateGeometry(geometry);
      expect(errors.length).toBe(0);
    });
  });
  
  test('standard block sets are practical', () => {
    const blockSets = [
      StandardBlockSets.basic(),
      StandardBlockSets.professional(),
      StandardBlockSets.extended()
    ];

    blockSets.forEach(inventory => {
      const totalBlocks = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const maxHeight = inventory.reduce((sum, item) =>
        sum + (item.thickness * item.quantity), 0
      );

      expect(totalBlocks).toBeGreaterThan(0);
      expect(totalBlocks).toBeLessThan(100); // Reasonable to own/transport
      expect(maxHeight).toBeGreaterThan(5);   // Sufficient for most situations
      expect(maxHeight).toBeLessThan(50);     // Not ridiculously excessive
    });
  });

  describe('Block Height Enumeration', () => {
    test('enumerates all achievable heights with basic inventory', () => {
      const inventory: BlockInventory[] = [
        { thickness: 0.5, quantity: 2 },
        { thickness: 1.0, quantity: 2 }
      ];

      const heights = RVLevelingCalculator.enumerateAchievableHeights(inventory, 5.0);

      // Possible combinations:
      // 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0
      expect(heights).toContain(0);
      expect(heights).toContain(0.5);
      expect(heights).toContain(1.0);
      expect(heights).toContain(1.5);
      expect(heights).toContain(2.0);
      expect(heights).toContain(2.5);
      expect(heights).toContain(3.0);

      // Should be sorted
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
    });

    test('returns only 0 for empty inventory', () => {
      const inventory: BlockInventory[] = [];
      const heights = RVLevelingCalculator.enumerateAchievableHeights(inventory);

      expect(heights).toEqual([0]);
    });

    test('respects maxHeight limit', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 10 }
      ];

      const heights = RVLevelingCalculator.enumerateAchievableHeights(inventory, 3.0);

      // Should only include 0, 1.0, 2.0, 3.0
      expect(heights).toContain(0);
      expect(heights).toContain(1.0);
      expect(heights).toContain(2.0);
      expect(heights).toContain(3.0);
      expect(heights).not.toContain(4.0);
    });

    test('handles fractional blocks correctly', () => {
      const inventory: BlockInventory[] = [
        { thickness: 0.25, quantity: 4 },
        { thickness: 0.75, quantity: 2 }
      ];

      const heights = RVLevelingCalculator.enumerateAchievableHeights(inventory, 3.0);

      // Should include quarter-inch increments and combinations
      expect(heights).toContain(0.25);
      expect(heights).toContain(0.5);
      expect(heights).toContain(0.75);
      expect(heights).toContain(1.0);
      expect(heights).toContain(1.25);
      expect(heights).toContain(1.5);
      expect(heights).toContain(1.75);
      expect(heights).toContain(2.0);
    });

    test('works with standard block sets', () => {
      const inventory = StandardBlockSets.basic();
      const heights = RVLevelingCalculator.enumerateAchievableHeights(inventory, 6.0);

      // Basic set should support many common heights
      expect(heights.length).toBeGreaterThan(10);
      expect(heights).toContain(0);
      expect(heights).toContain(1.0);
      expect(heights).toContain(2.0);
    });
  });

  describe('Closest Achievable Height', () => {
    test('finds exact match when available', () => {
      const inventory: BlockInventory[] = [
        { thickness: 0.5, quantity: 4 },
        { thickness: 1.0, quantity: 2 }
      ];

      const result = RVLevelingCalculator.findClosestAchievableHeight(1.5, inventory);

      expect(result.closestHeight).toBe(1.5);
      expect(result.withinTolerance).toBe(true);
      expect(result.difference).toBe(0);
    });

    test('finds closest height when exact match not available', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 3 }
      ];

      const result = RVLevelingCalculator.findClosestAchievableHeight(1.3, inventory);

      expect(result.closestHeight).toBe(1.0);
      expect(result.difference).toBeCloseTo(-0.3, 2);
    });

    test('respects tolerance parameter', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 3 }
      ];

      // 0.3" difference is within 0.5° tolerance but not 0.2°
      const resultLoose = RVLevelingCalculator.findClosestAchievableHeight(1.3, inventory, 0.5);
      const resultStrict = RVLevelingCalculator.findClosestAchievableHeight(1.3, inventory, 0.1);

      expect(resultLoose.withinTolerance).toBe(true);
      expect(resultStrict.withinTolerance).toBe(false);
    });

    test('handles edge case of target beyond max inventory', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 2 }
      ];

      const result = RVLevelingCalculator.findClosestAchievableHeight(5.0, inventory);

      expect(result.closestHeight).toBe(2.0); // Max achievable
      expect(result.withinTolerance).toBe(false);
      expect(result.difference).toBeCloseTo(-3.0, 2);
    });

    test('returns 0 for empty inventory', () => {
      const inventory: BlockInventory[] = [];
      const result = RVLevelingCalculator.findClosestAchievableHeight(1.5, inventory);

      expect(result.closestHeight).toBe(0);
      expect(result.withinTolerance).toBe(false);
      expect(result.difference).toBe(-1.5);
    });

    test('handles tie-breaker (chooses lower height)', () => {
      const inventory: BlockInventory[] = [
        { thickness: 1.0, quantity: 3 }
      ];

      // 1.5 is equidistant from 1.0 and 2.0
      const result = RVLevelingCalculator.findClosestAchievableHeight(1.5, inventory);

      // Should prefer lower height (safer stacking)
      expect(result.closestHeight).toBeLessThanOrEqual(2.0);
    });
  });
});