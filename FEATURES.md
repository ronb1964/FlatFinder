# FlatFinder - Complete Feature Specification

## 🚐 Trailer Mode (Primary Feature)

### Step 1: Side-to-Side Leveling
- **Purpose**: Level the trailer from left to right using wheel shims
- **Calculation**: Uses track width and roll angle to determine exact lift needed
- **Output**: 
  - Required lift in inches (e.g., "1.26 inches")
  - Practical block combinations (e.g., "1.0 + 0.25 + 0.25 = 1.5 inches")
  - Clear instruction: "Raise LEFT/RIGHT side wheels by X inches"
- **Visual**: Direction indicators showing which side to raise

### Step 2: Fore-Aft Leveling  
- **Purpose**: Level the trailer from front to back using hitch jack
- **Calculation**: Uses axle-to-hitch distance and pitch angle
- **Output**:
  - Required hitch movement in inches
  - Practical block combinations for hitch stands
  - Clear instruction: "Crank hitch jack UP/DOWN by X inches"
- **Visual**: Up/down arrows with precise measurements

### Visual Level Gauge
- **Bubble-level style display** showing current pitch and roll
- **Real-time updates** as user makes adjustments
- **Color-coded feedback** (green = level, red = needs adjustment)
- **Precise numeric readouts** alongside visual representation

### Safety Features
- **Slope safety detection** - warns when slopes exceed 6° (configurable)
- **Safety warnings** with clear messaging about finding flatter spots
- **Orange warning cards** with prominent icon and text

### Profile Management
- **Track Width**: Distance between left and right wheels
- **Axle-to-Hitch Distance**: Distance from rear axle to hitch ball
- **Profile editing**: Allow users to input custom trailer dimensions
- **Multiple profiles**: Save settings for different trailers

## 🚗 Van Mode (Future Feature)

### 4-Wheel Leveling
- **Purpose**: Level motorhomes and camper vans using wheel blocks
- **Calculation**: Determine which wheels need blocks and how much
- **Different math**: Uses wheelbase instead of hitch distance
- **Progressive leveling**: May require multiple adjustment rounds

## 🧮 Smart Math Engine

### Core Calculations
- **`computeSideShim(trackWidth, rollDegrees)`**: Calculate wheel shim height
- **`computeHitchLift(axleToHitch, pitchDegrees)`**: Calculate hitch adjustment
- **`planBlocks(height, availableBlocks)`**: Recommend block combinations
- **`isSlopePossiblyUnsafe(pitch, roll, limit)`**: Safety validation

### Block Planning System
- **Available block sizes**: [1.0", 0.5", 0.25", custom sizes]
- **Greedy algorithm**: Finds optimal combination of blocks
- **Practical recommendations**: Suggests real-world block stacks
- **Overage handling**: Allows slight overbuild when exact match impossible

### Calibration System
- **Offset corrections**: Account for device placement vs vehicle level
- **"Set as level" functionality**: Use current position as reference point
- **Pitch/roll offsets**: Independent calibration for each axis
- **Profile-specific calibration**: Different offsets per vehicle

## 📱 User Interface Components

### Home Screen
- **Mode selection**: Large, clear cards for Trailer vs Van mode
- **Visual hierarchy**: App branding with professional subtitle
- **Modern design**: Gradient backgrounds with glass-morphism effects

### Level Display Components
- **Current level indicators**: Large, bold degree readouts
- **Status indicators**: LEVEL vs ADJUSTING with color coding
- **Trend indicators**: Up/down arrows showing direction of tilt
- **Progress feedback**: Visual and haptic feedback during leveling

### Step Cards
- **Numbered progression**: Clear step 1, step 2 workflow
- **Action-oriented**: Specific instructions with measurements
- **Visual feedback**: Icons and color coding for each step
- **Block recommendations**: Practical stacking suggestions

### Settings & Profiles
- **Profile management**: Create, edit, delete vehicle profiles
- **Calibration wizard**: Step-by-step calibration process
- **Measurement units**: Imperial/metric toggle
- **Safety thresholds**: Adjustable slope limits
- **Feedback settings**: Haptic and audio preferences

## 🔊 Enhanced Audio Feedback System (Planned)

### Audio Cues for Hands-Free Leveling
- **Proximity Beeps**: Increasing frequency as device approaches level
  - Getting closer: Beeps every 2°, 1°, 0.5°
  - Near level: Continuous soft tone when within 0.5°
  - Perfect level: Distinct success sound when ±0.1°
- **Directional Voice Commands**: 
  - "Raise left side", "Lower front", "Almost level", "Perfect level"
  - Configurable voice settings (gender, speed, language)
- **Smart Audio Logic**:
  - Debounced feedback to prevent audio spam
  - Context-aware patterns for different leveling phases
  - Battery-optimized timing

### Audio Settings & Customization
- **Audio Volume Control**: 0-100% volume slider
- **Audio Style Options**: "Beeps Only", "Voice Only", or "Beeps + Voice"
- **Proximity Sensitivity**: Conservative/Normal/Frequent timing
- **Achievement Sounds**: Success/level celebration audio
- **Cross-Platform Support**: Works with earbuds, phone speakers, external audio

### Accessibility Benefits
- **Hands-free operation**: Level without constantly watching screen
- **Low-light compatibility**: Audio cues work in dark/dawn conditions
- **Visual impairment support**: Full audio-guided leveling process
- **Multitasking friendly**: Listen for cues while handling equipment

## 🔧 Technical Requirements

### Sensor Integration
- **Device motion API**: Real-time pitch and roll from device sensors
- **High precision**: Sub-degree accuracy for professional leveling
- **Filtering**: Smooth out sensor noise and vibrations
- **Calibration**: Account for device placement and orientation

### Performance
- **Real-time updates**: 10Hz refresh rate for smooth feedback
- **Low latency**: Immediate response to device movement
- **Battery efficient**: Optimized sensor polling
- **Offline capable**: No internet required for core functionality

### Data Persistence
- **Vehicle profiles**: Store multiple trailer/van configurations
- **Calibration data**: Save offset corrections per profile
- **User preferences**: Settings and measurement units
- **Usage history**: Optional campsite and leveling logs

## 🎯 Success Metrics

### Accuracy
- **±0.1° precision**: Professional-grade leveling accuracy
- **Practical recommendations**: Block suggestions users can actually implement
- **Safety compliance**: Proper warnings for unsafe conditions

### Usability
- **Single-handed operation**: Large touch targets and clear visual hierarchy
- **Sunlight readable**: High contrast design for outdoor use
- **Intuitive workflow**: Self-explanatory step-by-step process
- **Error prevention**: Clear warnings before potentially unsafe actions

### Professional Quality
- **Industry-standard calculations**: Proven leveling mathematics
- **Robust engineering**: Handles edge cases and error conditions
- **Documentation**: Clear help and tutorial content
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design