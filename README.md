# FlatFinder

A beautiful, modern Flutter app for RV and camper leveling. FlatFinder uses your device's sensors to calculate exactly how much you need to adjust your rig to get perfectly level.

![Flutter](https://img.shields.io/badge/Flutter-3.16+-blue.svg)
![Dart](https://img.shields.io/badge/Dart-3.0+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- **Visual Bubble Level** - Stunning animated 2D bubble level showing pitch and roll
- **Smart Calculations** - Precise leveling math for trailers, vans, and motorhomes
- **Block Planning** - Recommends the right combination of leveling blocks
- **Calibration** - Zero out floor/chassis differences with one tap
- **Safety Alerts** - Warns when slope exceeds safe limits
- **Demo Mode** - Test the app without device sensors
- **Dark Theme** - Beautiful, modern dark UI with glassmorphism effects

## Screenshots

The app features:
- Main dashboard with live bubble level
- Pitch and roll indicators
- Side-to-side and front-to-back adjustment tabs
- Vehicle settings with dimensions
- One-tap calibration

## Getting Started

### Prerequisites

- Flutter SDK 3.16 or higher
- Dart SDK 3.0 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FlatFinder.git
cd FlatFinder
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
flutter run
```

## Architecture

```
lib/
├── main.dart                           # App entry point
├── core/
│   ├── theme/
│   │   └── app_theme.dart              # Dark theme & styling
│   └── providers/
│       └── level_provider.dart         # State management
└── features/
    ├── level/
    │   ├── math/
    │   │   └── leveling_math.dart      # Pure math utilities
    │   ├── screens/
    │   │   └── home_screen.dart        # Main dashboard
    │   └── widgets/
    │       ├── bubble_level.dart       # Visual level indicator
    │       ├── tilt_card.dart          # Pitch/roll display
    │       └── adjustment_card.dart    # Block recommendations
    └── settings/
        └── screens/
            └── settings_screen.dart    # Vehicle configuration
```

## Math Utilities

The app uses pure Dart math utilities for calculations:

- **computeSideShim** - Calculates lift needed to level side-to-side
- **computeHitchLift** - Calculates hitch jack adjustment for trailers
- **computeForeAftShimForVans** - Calculates front axle lift for vans
- **planBlocks** - Recommends block combinations for target lift
- **Calibration** - Applies offset corrections to sensor readings

## Running Tests

```bash
# Run all tests
flutter test

# Run just the math unit tests
dart test test/features/level/math/leveling_math_test.dart
```

## Vehicle Types Supported

- **Trailer** - Uses hitch jack for front-to-back leveling
- **Van** - Uses front axle shims for leveling
- **Motorhome** - Same as van, larger dimensions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Flutter and Provider for state management
- Uses sensors_plus for device accelerometer access
- Google Fonts for typography
