# Original Flutter Project - Key Information Extracted

This document captures important information from the original Flutter LevelMate project for reference.

## 🏗️ Original Project Structure

```
LevelMate/ (Flutter)
├── lib/
│   ├── features/
│   │   ├── home/home_screen.dart
│   │   ├── trailer/
│   │   │   ├── trailer_mode_screen.dart
│   │   │   ├── providers/trailer_providers.dart
│   │   │   └── widgets/
│   │   │       ├── level_gauge.dart
│   │   │       └── step_card.dart
│   │   ├── van/van_mode_screen.dart
│   │   └── level/math/leveling_math.dart
├── test/ (comprehensive test suite)
├── design/figma-link.md
├── api/openapi.yaml (placeholder)
└── DESIGN_BRIEF.md
```

## 📊 Default Values & Specifications

### Trailer Profile Defaults
- **Default Name**: "Default Trailer"
- **Track Width**: 72.0 inches (6 feet - common trailer width)
- **Axle to Hitch Distance**: 144.0 inches (12 feet - typical distance)

### Block Sizes
- Standard blocks: `[1.0, 0.5, 0.25, 0.125]` inches
- Common blocks in providers: `[1.0, 0.5, 0.25, 0.125]` inches

### Test Case Specifications
- **Side shim test**: 72" track width + 2° roll = ~1.26" lift needed
- **Hitch lift test**: 144" axle-to-hitch + 0.8° pitch = ~2.01" movement
- **Van fore-aft test**: 130" wheelbase + 1.5° pitch = ~1.70" lift
- **Safety threshold**: 6.0° is the unsafe slope limit

### Mock Data Used
- **Pitch**: 1.2° (nose slightly up)
- **Roll**: -2.1° (left side slightly down)

## 🎨 UI Components Specifications

### StepCard Component
- **Elevation**: 4dp shadow
- **Border**: Left border with step color (4px width)
- **Step Number**: Circular badge with white text
- **Layout**: Icon on right, numbered badge + title/subtitle on left
- **Padding**: 20px internal padding

### Level Gauge Specifications
- Visual bubble level display
- Real-time pitch and roll indicators
- Color-coded feedback system

## 🧮 Mathematical Accuracy Requirements

### Precision Standards
- **Side shim calculation**: ±0.02" tolerance
- **Hitch lift calculation**: ±0.03" tolerance  
- **Fore-aft van calculation**: ±0.03" tolerance
- **Block planning**: Must handle greedy selection algorithm
- **Safety detection**: Exactly 6.0° threshold (inclusive)

### Edge Cases Handled
- Zero angle inputs (should return 0)
- Negative angles (absolute value used)
- Impossible block heights (overbuild with smallest block)
- Safety counter to prevent infinite loops (1000 iteration limit)

## 🏛️ Architecture Patterns

### State Management (Flutter/Riverpod)
- `StateProvider` for mutable data (profiles, current readings)
- `Provider` for computed values (shim calculations, block plans)
- Reactive updates when dependencies change
- Separation of pure math from UI logic

### Component Design
- Small, composable widgets
- Clear prop interfaces
- Consistent theming with material design
- Accessibility considerations

## 📱 Feature Completeness

### Implemented in Flutter
- ✅ Complete trailer mode workflow
- ✅ Step-by-step instructions with exact measurements
- ✅ Block recommendation system
- ✅ Safety slope detection
- ✅ Visual level gauge with real-time updates
- ✅ Profile management
- ✅ Comprehensive test suite

### Placeholder Features
- 🚧 Van mode (basic placeholder screen)
- 🚧 Real sensor integration (using mock data)
- 🚧 Profile editing screens
- 🚧 API integration (empty OpenAPI spec)

## 🎯 Migration Status to React Native

### ✅ Successfully Ported
- Complete math engine with all functions
- Test cases and accuracy requirements
- Design specifications and UI patterns
- Feature requirements and workflows
- Component architecture (StepCard, etc.)

### ⚡ Enhanced in React Native Version
- Modern dark theme with gradients
- Glass-morphism effects
- Improved color palette
- Better typography and spacing
- Enhanced visual hierarchy
- More sophisticated animations

## 📚 Key Learnings for React Native Implementation

1. **Math accuracy is critical** - maintain exact same calculations and tolerances
2. **Block planning algorithm** - greedy selection with practical stacking
3. **Safety thresholds** - 6° limit is industry standard
4. **Default measurements** - 72" track width, 144" axle-to-hitch are realistic
5. **Step-by-step workflow** - proven UX pattern for leveling process
6. **Component reusability** - StepCard pattern works well for instructions
7. **Real-time updates** - UI must respond immediately to sensor changes

This information ensures our React Native implementation maintains the proven functionality and accuracy of the original Flutter design while adding modern visual enhancements.