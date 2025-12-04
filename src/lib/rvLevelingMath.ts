/**
 * Professional RV Leveling Mathematics
 *
 * This module provides precise geometric calculations for determining
 * exact shimming requirements to level RVs and trailers.
 */

// Type definitions for RV geometry and leveling calculations
export interface RVGeometry {
  wheelbaseInches: number; // Distance from front axle to rear axle
  trackWidthInches: number; // Distance between left and right wheels
  hitchOffsetInches?: number; // Distance from rear axle to hitch point (trailers only)
  jackLocations?: JackLocation[]; // For motorhomes with leveling jacks
}

export interface JackLocation {
  id: string;
  name: string;
  xOffset: number; // Distance from rear axle (+ = forward, - = behind)
  yOffset: number; // Distance from centerline (+ = right, - = left)
}

export interface LevelingMeasurement {
  pitchDegrees: number; // Positive = nose up, negative = nose down
  rollDegrees: number; // Positive = right side up, negative = left side up
}

export interface WheelLiftRequirement {
  location: string;
  liftInches: number;
  description: string;
}

export interface BlockInventory {
  thickness: number; // Block thickness in inches
  quantity: number; // Number of blocks available
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
   *
   * TRAILER vs MOTORHOME GEOMETRY:
   * - Trailers have ONE axle (2 wheels) + tongue jack = 3 lift points
   * - Motorhomes/vans have TWO axles (4 wheels) = 4 lift points
   *
   * For trailers, "wheelbase" doesn't apply - we use hitchOffsetInches
   * to calculate the tongue jack position relative to the single axle.
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

    // Half track width for roll calculations
    const halfTrack = trackWidthInches / 2;

    const lifts: WheelLiftRequirement[] = [];

    // COORDINATE SYSTEM:
    // When phone shows +roll (right side up): right side is already raised, left side needs blocks
    // When phone shows -roll (left side up): left side is already raised, right side needs blocks

    // Determine vehicle type - trailers have a hitchOffsetInches value
    const isTrailer = hitchOffsetInches !== undefined;

    if (isTrailer) {
      // TRAILER GEOMETRY: Single axle (2 wheels) + tongue jack (3 points total)
      // The single axle is the reference point (origin), only affected by roll
      // The tongue jack is forward of the axle, affected by pitch

      // Left Wheel (on single axle): only affected by roll
      lifts.push({
        location: 'left',
        liftInches: -halfTrack * Math.tan(rollRad),
        description: 'Left Wheel',
      });

      // Right Wheel (on single axle): only affected by roll
      lifts.push({
        location: 'right',
        liftInches: halfTrack * Math.tan(rollRad),
        description: 'Right Wheel',
      });

      // Tongue Jack: forward of axle, affected by pitch
      // hitchOffsetInches = distance from axle to hitch point
      // Positive pitch (nose up) means hitch is higher, needs less lift
      lifts.push({
        location: 'tongue',
        liftInches: hitchOffsetInches * Math.tan(pitchRad),
        description: 'Tongue Jack',
      });
    } else {
      // MOTORHOME/VAN GEOMETRY: Two axles (4 wheels total)
      // Front axle is wheelbaseInches forward of rear axle (origin)
      //
      // Roll convention: +roll = right side UP, -roll = left side UP
      // If right side is UP, LEFT side needs lift (positive roll -> positive left lift)
      // If left side is UP, RIGHT side needs lift (negative roll -> positive right lift)

      // Rear Left Wheel: only affected by roll (at origin for pitch)
      lifts.push({
        location: 'rear_left',
        liftInches: halfTrack * Math.tan(rollRad),
        description: 'Rear Left Wheel',
      });

      // Rear Right Wheel: only affected by roll (at origin for pitch)
      lifts.push({
        location: 'rear_right',
        liftInches: -halfTrack * Math.tan(rollRad),
        description: 'Rear Right Wheel',
      });

      // Front Left Wheel: affected by both pitch and roll
      // Pitch convention: +pitch (nose up) means front is HIGH, so front needs LESS lift (negative)
      const frontLeftPitch = -wheelbaseInches * Math.tan(pitchRad);
      const frontLeftRoll = halfTrack * Math.tan(rollRad);
      lifts.push({
        location: 'front_left',
        liftInches: frontLeftPitch + frontLeftRoll,
        description: 'Front Left Wheel',
      });

      // Front Right Wheel: affected by both pitch and roll
      const frontRightPitch = -wheelbaseInches * Math.tan(pitchRad);
      const frontRightRoll = -halfTrack * Math.tan(rollRad);
      lifts.push({
        location: 'front_right',
        liftInches: frontRightPitch + frontRightRoll,
        description: 'Front Right Wheel',
      });
    }

    // Normalize lifts so minimum lift is 0 (we can only add blocks, not remove ground)
    const minLift = Math.min(...lifts.map((l) => l.liftInches));
    if (minLift < 0) {
      lifts.forEach((lift) => {
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
    maxTolerance: number = 0.125 // 1/8 inch tolerance
  ): BlockStack {
    // Filter out zero-thickness blocks and sort by thickness (largest first for greedy algorithm)
    const sortedBlocks = [...inventory]
      .filter((block) => block.thickness > 0.001 && block.quantity > 0) // Must be at least 0.001 inches thick
      .sort((a, b) => b.thickness - a.thickness);

    const result: BlockStack = {
      blocks: [],
      totalHeight: 0,
      totalBlocks: 0,
    };

    let remainingHeight = targetHeight;

    // Greedy algorithm: use largest blocks first
    for (const block of sortedBlocks) {
      if (block.quantity === 0) continue;

      const blocksNeeded = Math.floor(remainingHeight / block.thickness);
      const blocksToUse = Math.min(blocksNeeded, block.quantity);

      if (blocksToUse > 0) {
        result.blocks.push({
          thickness: block.thickness,
          count: blocksToUse,
        });

        const heightAdded = blocksToUse * block.thickness;
        result.totalHeight += heightAdded;
        result.totalBlocks += blocksToUse;
        remainingHeight -= heightAdded;

        // Update inventory
        block.quantity -= blocksToUse;
      }
    }

    // Check if we're within tolerance
    if (remainingHeight > maxTolerance) {
      // Try to get closer with smaller blocks (excluding zero-thickness)
      for (const block of sortedBlocks) {
        if (
          block.quantity > 0 &&
          block.thickness > 0 &&
          block.thickness <= remainingHeight + maxTolerance
        ) {
          result.blocks.push({
            thickness: block.thickness,
            count: 1,
          });
          result.totalHeight += block.thickness;
          result.totalBlocks += 1;
          break;
        }
      }
    }

    return result;
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
    const totalSlope = Math.sqrt(measurement.pitchDegrees ** 2 + measurement.rollDegrees ** 2);

    if (totalSlope > maxSafeSlope) {
      warnings.push(
        `Steep slope warning: The ground is tilted ${totalSlope.toFixed(1)}° which exceeds the ${maxSafeSlope}° safe limit. Use extra caution with wheel chocks and stabilizers.`
      );
    }

    // Calculate lift requirements
    const wheelLifts = this.calculateLiftRequirements(geometry, measurement);
    const maxLiftRequired = Math.max(...wheelLifts.map((w) => w.liftInches));

    // Create block stacks for each wheel/jack point
    const blockStacks: Record<string, BlockStack> = {};
    let isLevelable = true;
    const blockShortages: string[] = []; // Collect shortage info for combined message

    // Create a copy of inventory for each calculation
    for (const lift of wheelLifts) {
      if (lift.liftInches <= 0.125) {
        // Within 1/8" tolerance, no blocks needed
        blockStacks[lift.location] = {
          blocks: [],
          totalHeight: 0,
          totalBlocks: 0,
        };
        continue;
      }

      // Clone inventory for this calculation
      const inventoryCopy = inventory.map((item) => ({ ...item }));
      const stack = this.calculateOptimalBlocks(lift.liftInches, inventoryCopy);

      blockStacks[lift.location] = stack;

      // Check if we achieved the target height within tolerance
      const heightDifference = Math.abs(stack.totalHeight - lift.liftInches);
      if (heightDifference > 0.25) {
        // 1/4" tolerance for feasibility
        isLevelable = false;
        // Format the difference nicely
        const diffFormatted =
          heightDifference < 1
            ? `${heightDifference.toFixed(1)}"`
            : `${Math.floor(heightDifference / 12)}' ${(heightDifference % 12).toFixed(1)}"`;
        blockShortages.push(`${lift.description} (${diffFormatted} short)`);
      }
    }

    // Create combined user-friendly message for block shortages
    if (blockShortages.length > 0) {
      const shortageList = blockShortages.join(' and ');
      warnings.push(
        `Not enough blocks for perfect leveling. ${shortageList}. Consider adding more blocks to your inventory.`
      );
    }

    // Check total block usage
    const totalBlocksUsed = Object.values(blockStacks).reduce(
      (sum, stack) => sum + stack.totalBlocks,
      0
    );

    const totalBlocksAvailable = inventory.reduce((sum, item) => sum + item.quantity, 0);

    if (totalBlocksUsed > totalBlocksAvailable) {
      warnings.push("You don't have enough blocks in your inventory for complete leveling.");
      isLevelable = false;
    }

    return {
      wheelLifts,
      blockStacks,
      maxLiftRequired,
      isLevelable,
      warnings,
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
    _originalMeasurement: LevelingMeasurement,
    _plan: LevelingPlan,
    _geometry: RVGeometry
  ): { finalPitch: number; finalRoll: number; accuracy: number } {
    // This would simulate the final level after applying the leveling plan
    // For now, return theoretical perfect level
    return {
      finalPitch: 0,
      finalRoll: 0,
      accuracy: 100, // percentage
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
    hitchOffsetInches: 60,
  }),

  mediumTrailer: (): RVGeometry => ({
    wheelbaseInches: 180,
    trackWidthInches: 84,
    hitchOffsetInches: 84,
  }),

  largeTrailer: (): RVGeometry => ({
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffsetInches: 120,
  }),

  // Common motorhome configurations
  classAMotorhome: (): RVGeometry => ({
    wheelbaseInches: 300,
    trackWidthInches: 96,
  }),

  classBMotorhome: (): RVGeometry => ({
    wheelbaseInches: 180,
    trackWidthInches: 84,
  }),

  classCMotorhome: (): RVGeometry => ({
    wheelbaseInches: 144,
    trackWidthInches: 72,
  }),
};

/**
 * Standard block sets commonly used for RV leveling
 */
export const StandardBlockSets = {
  basic: (): BlockInventory[] => [
    { thickness: 1.0, quantity: 8 },
    { thickness: 0.5, quantity: 4 },
    { thickness: 0.25, quantity: 4 },
  ],

  professional: (): BlockInventory[] => [
    { thickness: 2.0, quantity: 4 },
    { thickness: 1.0, quantity: 12 },
    { thickness: 0.5, quantity: 8 },
    { thickness: 0.25, quantity: 8 },
    { thickness: 0.125, quantity: 4 },
  ],

  extended: (): BlockInventory[] => [
    { thickness: 3.0, quantity: 2 },
    { thickness: 2.0, quantity: 6 },
    { thickness: 1.0, quantity: 16 },
    { thickness: 0.5, quantity: 12 },
    { thickness: 0.25, quantity: 12 },
    { thickness: 0.125, quantity: 8 },
  ],
};
