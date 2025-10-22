/**
 * Leveling math utilities for the Camper/Trailer Leveling App.
 * 
 * Angles are degrees unless specified. Distances are inches by default.
 * All functions are pure and side-effect-free for easy unit testing.
 */

/**
 * Small helper to convert degrees to radians.
 */
function degToRad(deg: number): number {
  return deg * Math.PI / 180.0
}

/**
 * Returns the required lift (in inches) to raise the low side when the rig has
 * rollDegrees of tilt and a track width of trackWidthInches.
 * 
 * Model: think of the rig as a rigid body pivoting about its centerline.
 * The vertical delta between left/right tire planes is (track/2) * tan(|roll|).
 */
export function computeSideShim({
  trackWidthInches,
  rollDegrees,
}: {
  trackWidthInches: number
  rollDegrees: number
}): number {
  const rollRad = degToRad(Math.abs(rollDegrees))
  return (trackWidthInches / 2.0) * Math.tan(rollRad)
}

/**
 * Returns the fore-aft lift (in inches) at the front axle needed to level
 * when the rig has pitchDegrees of tilt and a wheelbase of wheelbaseInches.
 * 
 * For vans/motorhomes where you might shim at wheels (not applicable to trailers'
 * tongue jacks). If positive pitch means nose-up/down is irrelevant here because
 * we report a magnitude.
 */
export function computeForeAftShimForVans({
  wheelbaseInches,
  pitchDegrees,
}: {
  wheelbaseInches: number
  pitchDegrees: number
}): number {
  const pitchRad = degToRad(Math.abs(pitchDegrees))
  return (wheelbaseInches / 2.0) * Math.tan(pitchRad)
}

/**
 * Returns the required hitch jack vertical movement (in inches) to bring
 * a trailer to level fore–aft, given axleToHitchInches and pitchDegrees.
 * 
 * Positive value means "raise hitch"; the caller can decide wording based on
 * sign if you preserve it. Here we return magnitude.
 */
export function computeHitchLift({
  axleToHitchInches,
  pitchDegrees,
}: {
  axleToHitchInches: number
  pitchDegrees: number
}): number {
  const pitchRad = degToRad(Math.abs(pitchDegrees))
  return axleToHitchInches * Math.tan(pitchRad)
}

/**
 * Given a target lift heightInches and available blockHeightsInches,
 * returns a recommended combination as a list of block heights (greedy)
 * and the total.
 * 
 * Example: height=1.26, blocks=[1.0, 0.5, 0.25] -> [1.0, 0.25, 0.25] (total 1.5)
 * You can then show both the exact needed height and the practical stack.
 */
export class BlockPlan {
  readonly blocks: number[] // individual block heights used
  readonly total: number // total stacked height

  constructor(blocks: number[]) {
    this.blocks = blocks
    this.total = blocks.reduce((a, b) => a + b, 0.0)
  }

  toString(): string {
    return `BlockPlan(total: ${this.total}, blocks: [${this.blocks.join(', ')}])`
  }
}

export function planBlocks({
  heightInches,
  blockHeightsInches,
}: {
  heightInches: number
  blockHeightsInches: number[]
}): BlockPlan {
  if (heightInches <= 0) return new BlockPlan([])
  
  const sorted = [...blockHeightsInches].sort((a, b) => b - a) // desc
  const picked: number[] = []
  let remaining = heightInches

  // Greedy selection up to a sensible cap to avoid runaway loops.
  let safety = 0
  while (remaining > 0 && safety < 1000) {
    safety++
    // Find largest block <= remaining + small epsilon (allow slight overbuild if none fit)
    const candidate = sorted.find(b => b <= (remaining + 1e-6))
    if (candidate === undefined) {
      // No block fits; pick the smallest to overbuild a bit
      picked.push(sorted[sorted.length - 1])
      remaining -= sorted[sorted.length - 1]
    } else {
      picked.push(candidate)
      remaining -= candidate
    }
  }
  
  return new BlockPlan(picked)
}

/**
 * Applies calibration offsets to raw pitch/roll readings.
 * Useful when the van floor isn't perfectly parallel to the chassis or
 * you want to "set this as level."
 */
export class Calibration {
  constructor(
    readonly pitchOffsetDegrees: number,
    readonly rollOffsetDegrees: number
  ) {}

  applyToReadings(pitchDegrees: number, rollDegrees: number): { pitch: number; roll: number } {
    return {
      pitch: pitchDegrees - this.pitchOffsetDegrees,
      roll: rollDegrees - this.rollOffsetDegrees,
    }
  }
}

/**
 * Safety check: returns true if the slope is considered unsafe (>6°).
 */
export function isSlopeUnsafe(pitchDegrees: number, rollDegrees: number): boolean {
  return Math.abs(pitchDegrees) > 6 || Math.abs(rollDegrees) > 6
}

