/// Leveling math utilities for the Camper/Trailer Leveling App.
///
/// Angles are degrees unless specified. Distances are inches by default.
/// All functions are pure and side-effect-free for easy unit testing.
library leveling_math;

import 'dart:math' as math;

/// Small helper to convert degrees to radians.
double _degToRad(double deg) => deg * math.pi / 180.0;

/// Returns the required lift (in inches) to raise the low side when the rig has
/// [rollDegrees] of tilt and a track width of [trackWidthInches].
///
/// Model: think of the rig as a rigid body pivoting about its centerline.
/// The vertical delta between left/right tire planes is (track/2) * tan(|roll|).
double computeSideShim({
  required double trackWidthInches,
  required double rollDegrees,
}) {
  final rollRad = _degToRad(rollDegrees.abs());
  return (trackWidthInches / 2.0) * math.tan(rollRad);
}

/// Returns the fore-aft lift (in inches) at the front axle needed to level
/// when the rig has [pitchDegrees] of tilt and a wheelbase of [wheelbaseInches].
///
/// For vans/motorhomes where you might shim at wheels (not applicable to trailers'
/// tongue jacks). If positive pitch means nose-up/down is irrelevant here because
/// we report a magnitude.
double computeForeAftShimForVans({
  required double wheelbaseInches,
  required double pitchDegrees,
}) {
  final pitchRad = _degToRad(pitchDegrees.abs());
  return (wheelbaseInches / 2.0) * math.tan(pitchRad);
}

/// Returns the required hitch jack vertical movement (in inches) to bring
/// a trailer to level fore–aft, given [axleToHitchInches] and [pitchDegrees].
///
/// Positive value means "raise hitch"; the caller can decide wording based on
/// sign if you preserve it. Here we return magnitude.
double computeHitchLift({
  required double axleToHitchInches,
  required double pitchDegrees,
}) {
  final pitchRad = _degToRad(pitchDegrees.abs());
  return axleToHitchInches * math.tan(pitchRad);
}

/// Given a target lift [heightInches] and available [blockHeightsInches],
/// returns a recommended combination as a list of block heights (greedy)
/// and the total.
///
/// Example: height=1.26, blocks=[1.0, 0.5, 0.25] -> [1.0, 0.25, 0.25] (total 1.5)
/// You can then show both the exact needed height and the practical stack.
class BlockPlan {
  final List<double> blocks; // individual block heights used
  final double total; // total stacked height

  BlockPlan(this.blocks) : total = blocks.fold(0.0, (a, b) => a + b);

  @override
  String toString() => 'BlockPlan(total: $total, blocks: $blocks)';
}

BlockPlan planBlocks({
  required double heightInches,
  required List<double> blockHeightsInches,
}) {
  if (heightInches <= 0) return BlockPlan(const []);
  final sorted = [...blockHeightsInches]..sort((a, b) => b.compareTo(a)); // desc
  final picked = <double>[];
  double remaining = heightInches;

  // Greedy selection up to a sensible cap to avoid runaway loops.
  int safety = 0;
  while (remaining > 0 && safety < 1000) {
    safety++;
    // Find largest block <= remaining + small epsilon (allow slight overbuild if none fit)
    double? candidate = sorted.firstWhere(
      (b) => b <= (remaining + 1e-6),
      orElse: () => -1,
    );
    if (candidate == -1) {
      // No block fits; pick the smallest to overbuild a bit
      candidate = sorted.last;
    }
    picked.add(candidate);
    remaining -= candidate;
  }
  return BlockPlan(picked);
}

/// Applies calibration offsets to raw pitch/roll readings.
/// Useful when the van floor isn’t perfectly parallel to the chassis or
/// you want to “set this as level.”
class Calibration {
  final double pitchOffsetDegrees;
  final double rollOffsetDegrees;

  const Calibration({
    this.pitchOffsetDegrees = 0.0,
    this.rollOffsetDegrees = 0.0,
  });

  double applyPitch(double rawPitch) => rawPitch - pitchOffsetDegrees;
  double applyRoll(double rawRoll) => rawRoll - rollOffsetDegrees;

  Calibration copyWith({
    double? pitchOffsetDegrees,
    double? rollOffsetDegrees,
  }) =>
      Calibration(
        pitchOffsetDegrees: pitchOffsetDegrees ?? this.pitchOffsetDegrees,
        rollOffsetDegrees: rollOffsetDegrees ?? this.rollOffsetDegrees,
      );
}

/// Simple safety heuristic: beyond this slope (degrees), advise caution.
bool isSlopePossiblyUnsafe({
  required double pitchDegrees,
  required double rollDegrees,
  double limitDegrees = 6.0,
}) {
  return pitchDegrees.abs() >= limitDegrees || rollDegrees.abs() >= limitDegrees;
}
