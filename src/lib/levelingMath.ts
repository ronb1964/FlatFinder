/**
 * Leveling math utilities for the LevelMate Camper/Trailer Leveling App.
 * 
 * Angles are in degrees unless specified. Distances are in inches by default.
 * All functions are pure and side-effect-free for easy unit testing.
 * 
 * Ported from original Flutter/Dart implementation.
 */

/**
 * Small helper to convert degrees to radians
 */
const degToRad = (deg: number): number => deg * Math.PI / 180.0;

/**
 * Returns the required lift (in inches) to raise the low side when the rig has
 * rollDegrees of tilt and a track width of trackWidthInches.
 * 
 * Model: think of the rig as a rigid body pivoting about its centerline.
 * The vertical delta between left/right tire planes is (track/2) * tan(|roll|).
 */
export const computeSideShim = ({
  trackWidthInches,
  rollDegrees,
}: {
  trackWidthInches: number;
  rollDegrees: number;
}): number => {
  const rollRad = degToRad(Math.abs(rollDegrees));
  return (trackWidthInches / 2.0) * Math.tan(rollRad);
};

/**
 * Returns the fore-aft lift (in inches) at the front axle needed to level
 * when the rig has pitchDegrees of tilt and a wheelbase of wheelbaseInches.
 * 
 * For vans/motorhomes where you might shim at wheels (not applicable to trailers'
 * tongue jacks). If positive pitch means nose-up/down is irrelevant here because
 * we report a magnitude.
 */
export const computeForeAftShimForVans = ({
  wheelbaseInches,
  pitchDegrees,
}: {
  wheelbaseInches: number;
  pitchDegrees: number;
}): number => {
  const pitchRad = degToRad(Math.abs(pitchDegrees));
  return (wheelbaseInches / 2.0) * Math.tan(pitchRad);
};

/**
 * Returns the required hitch jack vertical movement (in inches) to bring
 * a trailer to level fore–aft, given axleToHitchInches and pitchDegrees.
 * 
 * Positive value means "raise hitch"; the caller can decide wording based on
 * sign if you preserve it. Here we return magnitude.
 */
export const computeHitchLift = ({
  axleToHitchInches,
  pitchDegrees,
}: {
  axleToHitchInches: number;
  pitchDegrees: number;
}): number => {
  const pitchRad = degToRad(Math.abs(pitchDegrees));
  return axleToHitchInches * Math.tan(pitchRad);
};

/**
 * Represents a recommended combination of blocks and their total height
 */
export interface BlockPlan {
  blocks: number[];  // individual block heights used
  total: number;     // total stacked height
}

/**
 * Given a target lift heightInches and available blockHeightsInches,
 * returns a recommended combination as a list of block heights (greedy)
 * and the total.
 * 
 * Example: height=1.26, blocks=[1.0, 0.5, 0.25] -> {blocks: [1.0, 0.25, 0.25], total: 1.5}
 * You can then show both the exact needed height and the practical stack.
 */
export const planBlocks = ({
  heightInches,
  blockHeightsInches,
}: {
  heightInches: number;
  blockHeightsInches: number[];
}): BlockPlan => {
  if (heightInches <= 0) {
    return { blocks: [], total: 0 };
  }

  const sorted = [...blockHeightsInches].sort((a, b) => b - a); // descending
  const picked: number[] = [];
  let remaining = heightInches;

  // Greedy selection up to a sensible cap to avoid runaway loops
  let safety = 0;
  while (remaining > 0 && safety < 1000) {
    safety++;
    
    // Find largest block <= remaining + small epsilon (allow slight overbuild if none fit)
    let candidate = sorted.find(b => b <= (remaining + 1e-6));
    
    if (candidate === undefined) {
      // No block fits; pick the smallest to overbuild a bit
      candidate = sorted[sorted.length - 1];
    }
    
    picked.push(candidate);
    remaining -= candidate;
  }

  const total = picked.reduce((sum, block) => sum + block, 0);
  return { blocks: picked, total };
};

/**
 * Calibration offsets for raw pitch/roll readings.
 * Useful when the device isn't perfectly parallel to the vehicle chassis or
 * you want to "set this as level."
 */
export interface Calibration {
  pitchOffsetDegrees: number;
  rollOffsetDegrees: number;
}

/**
 * Create a new calibration with default values
 */
export const createCalibration = ({
  pitchOffsetDegrees = 0.0,
  rollOffsetDegrees = 0.0,
}: Partial<Calibration> = {}): Calibration => ({
  pitchOffsetDegrees,
  rollOffsetDegrees,
});

/**
 * Apply calibration to raw pitch reading
 */
export const applyPitchCalibration = (
  rawPitch: number,
  calibration: Calibration
): number => rawPitch - calibration.pitchOffsetDegrees;

/**
 * Apply calibration to raw roll reading
 */
export const applyRollCalibration = (
  rawRoll: number,
  calibration: Calibration
): number => rawRoll - calibration.rollOffsetDegrees;

/**
 * Apply calibration to both pitch and roll readings
 */
export const applyCalibratedValues = (
  raw: { pitch: number; roll: number },
  calibration: Calibration
): { pitch: number; roll: number } => ({
  pitch: applyPitchCalibration(raw.pitch, calibration),
  roll: applyRollCalibration(raw.roll, calibration),
});

/**
 * Simple safety heuristic: beyond this slope (degrees), advise caution.
 * Default limit is 6.0 degrees as per industry standards.
 */
export const isSlopePossiblyUnsafe = ({
  pitchDegrees,
  rollDegrees,
  limitDegrees = 6.0,
}: {
  pitchDegrees: number;
  rollDegrees: number;
  limitDegrees?: number;
}): boolean => {
  return Math.abs(pitchDegrees) >= limitDegrees || Math.abs(rollDegrees) >= limitDegrees;
};

/**
 * Standard block sizes commonly available for RV leveling
 */
export const STANDARD_BLOCK_SIZES = [
  4.0,  // 4" blocks for major leveling
  2.0,  // 2" blocks
  1.0,  // 1" blocks
  0.5,  // 1/2" blocks for fine adjustment
  0.25, // 1/4" blocks for precision
];

/**
 * Get level status based on current readings and threshold
 */
export const getLevelStatus = (
  { pitch, roll }: { pitch: number; roll: number },
  threshold: number = 0.5
): {
  isLevel: boolean;
  description: string;
  color: string;
} => {
  const isLevel = Math.abs(pitch) < threshold && Math.abs(roll) < threshold;
  
  return {
    isLevel,
    description: isLevel ? "LEVEL" : "ADJUSTING",
    color: isLevel ? "#22c55e" : "#ef4444",
  };
};

/**
 * Calculate which side needs to be raised based on roll angle
 */
export const getSideToRaise = (rollDegrees: number): 'LEFT' | 'RIGHT' => {
  return rollDegrees > 0 ? 'LEFT' : 'RIGHT';
};

/**
 * Calculate hitch jack direction based on pitch angle
 */
export const getHitchDirection = (pitchDegrees: number): 'UP' | 'DOWN' => {
  return pitchDegrees > 0 ? 'UP' : 'DOWN';
};