# FlatFinder - Professional RV & Trailer Leveling App

A React Native/Expo app that helps camper vans and trailers achieve perfect level positioning at campsites using advanced device sensors and proven leveling mathematics.

## 🎯 What FlatFinder Does

FlatFinder transforms your smartphone into a professional-grade leveling tool for RVs, trailers, and motorhomes. Using your device's built-in motion sensors, it provides:

- **Real-time level readings** with sub-degree precision
- **Step-by-step leveling instructions** with exact measurements  
- **Smart block recommendations** for practical leveling solutions
- **Safety warnings** for slopes that may be unsafe
- **Multiple vehicle profiles** with custom dimensions

## 🚀 Tech Stack

- **Expo SDK 53** - Cross-platform React Native development
- **TypeScript** - Type-safe development
- **Tamagui** - Performant, themeable UI components
- **Expo Router** - File-based navigation
- **Zustand** - Lightweight state management
- **Expo Sensors** - Device motion and orientation

## 📱 Features

### ✅ Implemented (MVP Complete)
- **Live Level View** - Real-time pitch and roll measurements using device sensors
- **Bubble Level UI** - Beautiful, high-contrast interface readable in bright sunlight
- **Sensor Fusion** - Combines accelerometer and gyroscope data for accurate readings
- **Calibration** - One-tap "set as level" with per-vehicle profile storage
- **Vehicle Profiles** - Save multiple vehicles with custom wheelbase and track width
- **Haptic Feedback** - Vibration alerts when crossing level thresholds
- **Settings Screen** - Configure haptics, audio, night mode, and level threshold
- **Keep Awake** - Screen stays on while leveling
- **Offline Storage** - All data stored locally with AsyncStorage

### 🚧 Future Enhancements
- Shim height calculator based on wheelbase
- Jack turns estimator
- Bluetooth external sensor support
- Cloud backup for profiles
- Tutorial/onboarding flow

## 🏗️ Project Structure

```
flatfinder-expo/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Main level screen
│   │   ├── profiles.tsx   # Vehicle profiles
│   │   └── settings.tsx   # App settings
│   └── _layout.tsx        # Root layout with providers
├── src/
│   ├── components/        # Reusable UI components
│   │   └── BubbleLevel.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useDeviceAttitude.ts
│   ├── lib/              # Utility functions
│   │   └── calibration.ts
│   └── state/            # Zustand stores
│       └── appStore.ts
├── assets/               # Images, fonts, sounds
├── .husky/              # Git hooks
└── tamagui.config.ts    # Tamagui theme config
```

## 🌐 Production Deployment

### Netlify Web App
The FlatFinder web app is deployed on Netlify for global access:

- **Production URL**: https://flatfinder-app-1755829802.netlify.app
- **Admin Dashboard**: https://app.netlify.com/projects/flatfinder-app-1755829802
- **Project ID**: 9d064cb9-3f1e-4f44-9b73-04992d931cb8

#### Deploying to Netlify
```bash
# Build the web app
npx expo export --platform web

# Deploy to production
npx netlify deploy --prod --dir=dist
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd flatfinder-expo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### Running on Devices

#### iOS Simulator (Mac only)
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Physical Device
1. Install the Expo Go app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. The app will load and run on your device

### Development Commands
```bash
npm run dev       # Start development server
npm run ios       # Run on iOS Simulator
npm run android   # Run on Android Emulator
npm run lint      # Run ESLint
npm run lint:fix  # Fix linting issues
npm run typecheck # TypeScript type checking
npm run format    # Format with Prettier
npm test          # Run tests (placeholder)
```

## 🎨 Architecture & Design

### State Management
- **Zustand**: Lightweight, TypeScript-friendly state management
- **AsyncStorage**: Persistent storage for profiles and settings
- **React Hooks**: Local component state and side effects

### UI Framework
- **Tamagui**: Performant, themeable components with excellent RN support
- **Expo Router**: File-based routing with tab navigation
- **SVG**: Custom bubble level visualization with react-native-svg

### Sensor Handling
- **DeviceMotion API**: Primary sensor data source
- **Sensor Fusion**: Combines accelerometer and gyroscope readings
- **Low-pass Filtering**: Smooths sensor noise (α=0.8) for stable readings
- **Calibration Offsets**: Per-profile zero-point calibration

## 📊 Sensor Math

The app uses device motion sensors to calculate vehicle attitude:

- **Pitch**: Rotation around X-axis (nose up/down)
- **Roll**: Rotation around Y-axis (left/right tilt)
- **Calculation**: `atan2` for angle computation from gravity vector
- **Filtering**: Low-pass filter reduces noise and jitter
- **Update Rate**: 10Hz (100ms intervals) for smooth updates

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sensor readings update in real-time
- [ ] Calibration saves per profile
- [ ] Profile switching updates calibration
- [ ] Haptic feedback works at thresholds
- [ ] Settings persist across app restarts
- [ ] Screen stays awake when enabled
- [ ] Dark mode toggles correctly

### Device Testing
Test on various devices to ensure sensor compatibility:
- Modern smartphones (2020+)
- Tablets (iPad, Android tablets)
- Different orientations (portrait/landscape)

## 🚨 Troubleshooting

### Sensors Not Working
- Ensure device has required sensors (accelerometer, gyroscope)
- Check app permissions for motion sensors
- Try restarting the app or device

### Calibration Issues
- Place device on a known level surface
- Wait for readings to stabilize before calibrating
- Check that the correct profile is active

### Build Errors
- Clear cache: `expo start -c`
- Delete node_modules: `rm -rf node_modules && npm install`
- Reset Metro: `npx react-native start --reset-cache`

## 🎯 Changelog

### Version 1.0.0 (Current)
- ✅ Core leveling functionality
- ✅ Real-time sensor fusion
- ✅ Vehicle profiles with calibration
- ✅ Haptic feedback
- ✅ Settings persistence
- ✅ Tab navigation (Level, Profiles, Settings)
- ✅ Dark mode support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

Built with ❤️ using Expo, React Native, and TypeScript

