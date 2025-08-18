import 'package:test/test.dart';
import 'package:leveling_math/leveling_math.dart' as lm;

void main() {
  group('Leveling Math', () {
    test('Side shim for 72" track & 2° roll ≈ 1.26"', () {
      final h = lm.computeSideShim(trackWidthInches: 72.0, rollDegrees: 2.0);
      expect(h, closeTo(1.26, 0.02)); // allow tiny numeric tolerance
    });

    test('Hitch lift for 144" axle→hitch & 0.8° pitch ≈ 2.01"', () {
      final h = lm.computeHitchLift(axleToHitchInches: 144.0, pitchDegrees: 0.8);
      expect(h, closeTo(2.01, 0.03));
    });

    test('Fore-aft shim (van) 130" wheelbase & 1.5° pitch', () {
      final h = lm.computeForeAftShimForVans(wheelbaseInches: 130.0, pitchDegrees: 1.5);
      // Expected ≈ (130/2)*tan(1.5°) = 65 * 0.02618 ≈ 1.702
      expect(h, closeTo(1.70, 0.03));
    });

    test('Block planning chooses practical stack', () {
      final plan = lm.planBlocks(heightInches: 1.26, blockHeightsInches: [1.0, 0.5, 0.25]);
      // One possible greedy outcome is [1.0, 0.25, 0.25] -> total 1.5"
      expect(plan.total, closeTo(1.5, 1e-9));
      expect(plan.blocks.contains(1.0), isTrue);
    });

    test('Calibration offsets apply correctly', () {
      final c = lm.Calibration(pitchOffsetDegrees: 0.3, rollOffsetDegrees: -0.2);
      expect(c.applyPitch(1.0), closeTo(0.7, 1e-9));
      expect(c.applyRoll(1.0), closeTo(1.2, 1e-9));
    });

    test('Safety heuristic', () {
      expect(lm.isSlopePossiblyUnsafe(pitchDegrees: 5.9, rollDegrees: 0.0), isFalse);
      expect(lm.isSlopePossiblyUnsafe(pitchDegrees: 6.0, rollDegrees: 0.0), isTrue);
      expect(lm.isSlopePossiblyUnsafe(pitchDegrees: 0.0, rollDegrees: -6.5), isTrue);
    });
  });
}
