# Leveling Math Starter

This is a lightweight, pure-Dart starter you can drop into your Flutter repo or run as a tiny Dart package.
It includes:
- `lib/features/level/math/leveling_math.dart` with pure math utilities
- `test/features/level/math/leveling_math_test.dart` with unit tests
- minimal `pubspec.yaml` so you can run tests even outside Flutter

## Try the tests (pure Dart)
```bash
cd levelmate_starter
dart pub get
dart test
```

## Integrate into Flutter
Move the `lib/` and `test/` folders into your Flutter app repo. In your app's `pubspec.yaml`, add:
```yaml
dev_dependencies:
  test: ^1.25.0
```
Then run:
```bash
flutter test
```

## Notes
- All angles are in degrees; distances are inches.
- For trailers, level side-to-side with wheel shims first, then use `computeHitchLift` to set tongue jack height.
- Use `Calibration` to zero out minor floor/chassis differences.
- `planBlocks` helps convert exact lift to a stack of common leveling blocks.
