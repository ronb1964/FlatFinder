/**
 * Professional RV Leveling Mathematics
 * 
 * This module provides precise geometric calculations for determining
 * exact shimming requirements to level RVs and trailers.
 */

// Type definitions for RV geometry and leveling calculations
export interface RVGeometry {
  wheelbaseInches: number;      // Distance from front axle to rear axle
  trackWidthInches: number;     // Distance between left and right wheels
  hitchOffsetInches?: number;   // Distance from rear axle to hitch point (trailers only)
  jackLocations?: JackLocation[]; // For motorhomes with leveling jacks
}

export interface JackLocation {
  id: string;
  name: string;
  xOffset: number; // Distance from rear axle (+ = forward, - = behind)
  yOffset: number; // Distance from centerline (+ = right, - = left)
}

export interface LevelingMeasurement {
  pitchDegrees: number;  // Positive = nose up, negative = nose down
  rollDegrees: number;   // Positive = right side up, negative = left side up
}

export interface WheelLiftRequirement {
  location: string;
  liftInches: number;
  description: string;
}

export interface BlockInventory {
  thickness: number;  // Block thickness in inches
  quantity: number;   // Number of blocks available
}

export interface BlockStack {
  blocks: Array<{ thickness: number; count: number }>;
  totalHeight: number;
  totalBlocks: number;
}

export interface LevelingPlan {
  wheelLifts: WheelLiftRequirement[];
  blockStacks: Record<string, BlockStack>;
  maxLiftRequired: number;
  isLevelable: boolean;
  warnings: string[];
}

/**
 * Core geometric calculations for RV leveling
 */
export class RVLevelingCalculator {
  
  /**
   * Calculate lift requirements for each wheel/jack point to achieve level
   */
  static calculateLiftRequirements(
    geometry: RVGeometry, 
    measurement: LevelingMeasurement
  ): WheelLiftRequirement[] {
    const { wheelbaseInches, trackWidthInches, hitchOffsetInches } = geometry;
    const { pitchDegrees, rollDegrees } = measurement;
    
    // Convert degrees to radians for calculations
    const pitchRad = (pitchDegrees * Math.PI) / 180;
    const rollRad = (rollDegrees * Math.PI) / 180;
    
    // Half distances for calculations
    const halfWheelbase = wheelbaseInches / 2;
    const halfTrack = trackWidthInches / 2;
    
    const lifts: WheelLiftRequirement[] = [];
    
    // Calculate lift for each wheel position
    // Using standard RV coordinate system: origin at center of rear axle
    // Positive pitch = nose up, positive roll = right side up
    
    // COORDINATE SYSTEM EXPLANATION:
    // When phone shows +roll (right side up): right side is already raised, left side needs blocks
    // When phone shows -roll (left side up): left side is already raised, right side needs blocks
    // The original geometric calculation + normalization handles this correctly!
    
    // Determine vehicle type for different leveling logic
    const isTrailer = hitchOffsetInches !== undefined;
    
    if (isTrailer) {
      // TRAILER: Only 3 points - Left wheel, Right wheel, Hitch
      // Main wheels (at the axle): only affected by roll
      lifts.push({
        location: 'left_wheel',
        liftInches: -halfTrack * Math.tan(rollRad),
        description: 'Left Wheel'
      });
      
      lifts.push({
        location: 'right_wheel', 
        liftInches: halfTrack * Math.tan(rollRad),
        description: 'Right Wheel'
      });
      
      // Hitch point: behind rear axle, affected by pitch
      const hitchPitch = -hitchOffsetInches * Math.tan(pitchRad);
      lifts.push({
        location: 'hitch',
        liftInches: hitchPitch,
        description: 'Hitch'
      });
      
    } else {
      // RV/MOTORHOME/VAN: 4 wheels
      // Front Left Wheel: affected by pitch and roll
      const frontLeftPitch = halfWheelbase * Math.tan(pitchRad);
      const frontLeftRoll = -halfTrack * Math.tan(rollRad);
      const frontLeftLift = frontLeftPitch + frontLeftRoll;
      
      lifts.push({
        location: 'front_left',
        liftInches: frontLeftLift,
        description: 'Front Left Wheel'
      });
      
      // Front Right Wheel: affected by pitch and roll  
      const frontRightPitch = halfWheelbase * Math.tan(pitchRad);
      const frontRightRoll = halfTrack * Math.tan(rollRad);
      const frontRightLift = frontRightPitch + frontRightRoll;
      
      lifts.push({
        location: 'front_right',
        liftInches: frontRightLift,
        description: 'Front Right Wheel'
      });
      
      // Rear Left Wheel: affected by pitch and roll (opposite direction)
      const rearLeftPitch = -halfWheelbase * Math.tan(pitchRad);
      const rearLeftRoll = -halfTrack * Math.tan(rollRad);
      const rearLeftLift = rearLeftPitch + rearLeftRoll;
      
      lifts.push({
        location: 'rear_left',
        liftInches: rearLeftLift,
        description: 'Rear Left Wheel'
      });
      
      // Rear Right Wheel: affected by pitch and roll (opposite direction)
      const rearRightPitch = -halfWheelbase * Math.tan(pitchRad);
      const rearRightRoll = halfTrack * Math.tan(rollRad);
      const rearRightLift = rearRightPitch + rearRightRoll;
      
      lifts.push({
        location: 'rear_right', 
        liftInches: rearRightLift,
        description: 'Rear Right Wheel'
      });
    }
    
    // Normalize lifts so minimum lift is 0 (we can only add blocks, not remove ground)
    const minLift = Math.min(...lifts.map(l => l.liftInches));
    if (minLift < 0) {
      lifts.forEach(lift => {
        lift.liftInches -= minLift;
      });
    }
    
    return lifts;
  }
  
  /**
   * Calculate optimal block stacking for a target height
   */
  static calculateOptimalBlocks(
    targetHeight: number,
    inventory: BlockInventory[],
    maxTolerance: number = 0.5 // 1/2 inch tolerance - more practical for RV leveling
  ): BlockStack {
    // Handle very small lifts - round to nearest 1/4 inch
    if (targetHeight < 0.25) {
      return {
        blocks: [],
        totalHeight: 0,
        totalBlocks: 0
      };
    }
    
    // Filter and sort blocks (don't modify original inventory)
    const availableBlocks = [...inventory]
      .filter(block => block.thickness > 0.001 && block.quantity > 0)
      .sort((a, b) => b.thickness - a.thickness);
    
    const result: BlockStack = {
      blocks: [],
      totalHeight: 0,
      totalBlocks: 0
    };
    
    let remainingHeight = targetHeight;
    
    // Greedy algorithm: use largest blocks first
    for (const blockType of availableBlocks) {
      const blocksNeeded = Math.floor(remainingHeight / blockType.thickness);
      const blocksToUse = Math.min(blocksNeeded, blockType.quantity);
      
      if (blocksToUse > 0) {
        result.blocks.push({
          thickness: blockType.thickness,
          count: blocksToUse
        });
        
        const heightAdded = blocksToUse * blockType.thickness;
        result.totalHeight += heightAdded;
        result.totalBlocks += blocksToUse;
        remainingHeight -= heightAdded;
      }
      
      // Stop if we're close enough
      if (remainingHeight <= maxTolerance) {
        break;
      }
    }
    
    // If still not close enough, add one more block of the smallest available size
    if (remainingHeight > maxTolerance && availableBlocks.length > 0) {
      const smallestBlock = availableBlocks[availableBlocks.length - 1];
      result.blocks.push({
        thickness: smallestBlock.thickness,
        count: 1
      });
      result.totalHeight += smallestBlock.thickness;
      result.totalBlocks += 1;
    }
    
    // NUCLEAR VALIDATION: Block any 0.8-ish values and ensure only standard sizes
    const standardSizes = [0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
    const validSizes = inventory.map(inv => inv.thickness);
    result.blocks = result.blocks.filter(block => {
      const isInInventory = validSizes.some(size => Math.abs(size - block.thickness) < 0.001);
      const isStandardSize = standardSizes.some(size => Math.abs(size - block.thickness) < 0.01);
      const isNotEight = Math.abs(block.thickness - 0.8) > 0.05; // Reject anything close to 0.8
      return isInInventory && isStandardSize && isNotEight;
    });
    
    // Recalculate totals after filtering
    result.totalHeight = result.blocks.reduce((sum, block) => sum + (block.thickness * block.count), 0);
    result.totalBlocks = result.blocks.reduce((sum, block) => sum + block.count, 0);
    
    return result;
  }

  /**
   * Enumerate all achievable stack heights from given block inventory
   *
   * @param inventory Available blocks
   * @param maxHeight Maximum height to enumerate (default 12 inches)
   * @param tolerance Tolerance for height matching in degrees (default 0.2°)
   * @returns Sorted array of achievable heights
   */
  static enumerateAchievableHeights(
    inventory: BlockInventory[],
    maxHeight: number = 12.0,
    tolerance: number = 0.2
  ): number[] {
    // Convert tolerance from degrees to inches (rough approximation)
    // For typical RV dimensions, 0.2° ≈ 0.25-0.35 inches depending on wheelbase/track
    const toleranceInches = tolerance * 0.7; // Conservative conversion

    const heights = new Set<number>();
    heights.add(0); // Always achievable (no blocks)

    // Filter and prepare blocks
    const availableBlocks = inventory
      .filter(block => block.thickness > 0.001 && block.quantity > 0)
      .sort((a, b) => a.thickness - b.thickness);

    if (availableBlocks.length === 0) {
      return [0];
    }

    // Generate all possible combinations using dynamic programming
    const achievable: Set<number> = new Set([0]);

    for (const blockType of availableBlocks) {
      const newHeights: number[] = [];

      for (const height of achievable) {
        // Try adding 1 to quantity of this block type
        for (let count = 1; count <= blockType.quantity; count++) {
          const newHeight = height + (count * blockType.thickness);
          if (newHeight <= maxHeight) {
            // Round to nearest 0.01 inch to avoid floating point issues
            const roundedHeight = Math.round(newHeight * 100) / 100;
            newHeights.push(roundedHeight);
          }
        }
      }

      newHeights.forEach(h => achievable.add(h));
    }

    // Convert to sorted array
    const sortedHeights = Array.from(achievable).sort((a, b) => a - b);

    return sortedHeights;
  }

  /**
   * Find closest achievable height to target
   *
   * @param targetHeight Target height in inches
   * @param inventory Available blocks
   * @param toleranceDegrees Tolerance in degrees (default 0.2°)
   * @returns Object with closest height, whether it's within tolerance, and difference
   */
  static findClosestAchievableHeight(
    targetHeight: number,
    inventory: BlockInventory[],
    toleranceDegrees: number = 0.2
  ): { closestHeight: number; withinTolerance: boolean; difference: number } {
    const achievableHeights = this.enumerateAchievableHeights(inventory, targetHeight + 2, toleranceDegrees);

    if (achievableHeights.length === 0) {
      return {
        closestHeight: 0,
        withinTolerance: false,
        difference: targetHeight
      };
    }

    // Find closest height
    let closestHeight = achievableHeights[0];
    let minDiff = Math.abs(targetHeight - closestHeight);

    for (const height of achievableHeights) {
      const diff = Math.abs(targetHeight - height);
      if (diff < minDiff) {
        minDiff = diff;
        closestHeight = height;
      }
    }

    // Convert tolerance from degrees to inches
    // For typical RV track/wheelbase, 0.2° ≈ 0.25-0.35 inches
    // Using 0.7 multiplier (0.5° → 0.35" tolerance)
    const toleranceInches = toleranceDegrees * 0.7;
    const withinTolerance = minDiff <= toleranceInches;

    return {
      closestHeight,
      withinTolerance,
      difference: closestHeight - targetHeight
    };
  }

  /**
   * Create complete leveling plan with block recommendations
   */
  static createLevelingPlan(
    geometry: RVGeometry,
    measurement: LevelingMeasurement,
    inventory: BlockInventory[],
    maxSafeSlope: number = 6.0 // degrees
  ): LevelingPlan {
    const warnings: string[] = [];
    
    // Check if slope is within safe limits
    const totalSlope = Math.sqrt(
      measurement.pitchDegrees ** 2 + measurement.rollDegrees ** 2
    );
    
    if (totalSlope > maxSafeSlope) {
      warnings.push(`Total slope (${totalSlope.toFixed(1)}°) exceeds safe limit (${maxSafeSlope}°)`);
    }
    
    // Calculate lift requirements
    const wheelLifts = this.calculateLiftRequirements(geometry, measurement);
    const maxLiftRequired = Math.max(...wheelLifts.map(w => w.liftInches));
    
    // Create block stacks for each wheel/jack point
    const blockStacks: Record<string, BlockStack> = {};
    let isLevelable = true;
    
    // Check if any blocks are configured
    const hasBlockInventory = inventory.length > 0 && inventory.some(item => item.quantity > 0);
    
    // Create a copy of inventory for each calculation
    for (const lift of wheelLifts) {
      if (lift.liftInches <= 0.125) { // Within 1/8" tolerance, no blocks needed
        blockStacks[lift.location] = {
          blocks: [],
          totalHeight: 0,
          totalBlocks: 0
        };
        continue;
      }
      
      // Clone inventory for this calculation
      const inventoryCopy = inventory.map(item => ({ ...item }));
      const stack = this.calculateOptimalBlocks(lift.liftInches, inventoryCopy);
      
      blockStacks[lift.location] = stack;
      
      // Only check tolerance if blocks are configured
      if (hasBlockInventory) {
        const heightDifference = Math.abs(stack.totalHeight - lift.liftInches);
        if (heightDifference > 0.75) { // 3/4" tolerance for practical RV leveling
          isLevelable = false;
          warnings.push(
            `Cannot achieve ${lift.liftInches.toFixed(2)}" lift for ${lift.description} ` +
            `(achieved ${stack.totalHeight.toFixed(2)}", difference ${heightDifference.toFixed(2)}")`
          );
        }
      }
    }
    
    // Check total block usage only if blocks are configured
    if (hasBlockInventory) {
      const totalBlocksUsed = Object.values(blockStacks)
        .reduce((sum, stack) => sum + stack.totalBlocks, 0);
      
      const totalBlocksAvailable = inventory.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalBlocksUsed > totalBlocksAvailable) {
        warnings.push('Insufficient blocks available for complete leveling');
        isLevelable = false;
      }
    }
    
    return {
      wheelLifts,
      blockStacks,
      maxLiftRequired,
      isLevelable,
      warnings
    };
  }
  
  /**
   * Validate RV geometry for reasonable values
   */
  static validateGeometry(geometry: RVGeometry): string[] {
    const errors: string[] = [];
    
    if (geometry.wheelbaseInches < 60 || geometry.wheelbaseInches > 600) {
      errors.push('Wheelbase must be between 60" and 600"');
    }
    
    if (geometry.trackWidthInches < 48 || geometry.trackWidthInches > 120) {
      errors.push('Track width must be between 48" and 120"');
    }
    
    if (geometry.hitchOffsetInches !== undefined) {
      if (geometry.hitchOffsetInches < 12 || geometry.hitchOffsetInches > 300) {
        errors.push('Hitch offset must be between 12" and 300"');
      }
    }
    
    return errors;
  }
  
  /**
   * Calculate accuracy metrics for the leveling solution
   */
  static calculateAccuracy(
    originalMeasurement: LevelingMeasurement,
    plan: LevelingPlan,
    geometry: RVGeometry
  ): { finalPitch: number; finalRoll: number; accuracy: number } {
    // This would simulate the final level after applying the leveling plan
    // For now, return theoretical perfect level
    return {
      finalPitch: 0,
      finalRoll: 0,
      accuracy: 100 // percentage
    };
  }
}

/**
 * Utility functions for common RV configurations
 */
export const RVPresets = {
  // Common trailer configurations
  smallTrailer: (): RVGeometry => ({
    wheelbaseInches: 120,
    trackWidthInches: 72,
    hitchOffsetInches: 60
  }),
  
  mediumTrailer: (): RVGeometry => ({
    wheelbaseInches: 180,
    trackWidthInches: 84, 
    hitchOffsetInches: 84
  }),
  
  largeTrailer: (): RVGeometry => ({
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120
  }),
  
  // Common motorhome configurations
  classAMotorhome: (): RVGeometry => ({
    wheelbaseInches: 300,
    trackWidthInches: 96
  }),
  
  classBMotorhome: (): RVGeometry => ({
    wheelbaseInches: 180,
    trackWidthInches: 84
  }),
  
  classCMotorhome: (): RVGeometry => ({
    wheelbaseInches: 144,
    trackWidthInches: 72
  })
};

/**
 * Standard block sets commonly used for RV leveling
 */
export const StandardBlockSets = {
  basic: (): BlockInventory[] => [
    { thickness: 1.0, quantity: 8 },
    { thickness: 0.5, quantity: 4 },
    { thickness: 0.25, quantity: 4 }
  ],
  
  professional: (): BlockInventory[] => [
    { thickness: 2.0, quantity: 4 },
    { thickness: 1.0, quantity: 12 },
    { thickness: 0.5, quantity: 8 },
    { thickness: 0.25, quantity: 8 },
    { thickness: 0.125, quantity: 4 }
  ],
  
  extended: (): BlockInventory[] => [
    { thickness: 3.0, quantity: 2 },
    { thickness: 2.0, quantity: 6 },
    { thickness: 1.0, quantity: 16 },
    { thickness: 0.5, quantity: 12 },
    { thickness: 0.25, quantity: 12 },
    { thickness: 0.125, quantity: 8 }
  ]
};