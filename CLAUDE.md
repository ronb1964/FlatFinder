# FlatFinder - RV/Trailer Leveling App

## Project Overview
FlatFinder is a React Native/Expo app that helps RV owners level their vehicles using device sensors. Built with TypeScript, Tamagui UI framework, and Zustand state management.

**Production URL:** https://flatfinder-app.netlify.app (backup/demo only - see Testing Strategy below)

## Current Status (✅ Recently Completed)

### Modern UI Revamp - COMPLETED ✅ Latest (2025-10-09)
- **Glassmorphism design system**: Frosted glass cards with CSS backdrop-filter throughout app
- **Animated gradient backgrounds**: Screen-specific color palettes with smooth animations
- **Modern gradient buttons**: Color-coded actions with semantic meanings (primary/success/warning/danger)
- **Enhanced visual hierarchy**: Consistent color system documented in `COLOR_PALETTE.md`
- **Components updated**:
  - All main screens (Level, Profiles, Settings)
  - Leveling Assistant with glass effect cards
  - Vehicle Setup Wizard with indigo-tinted modal
  - Bubble Level with radial gradients and glow effects
- **Design documentation**: Complete color palette and usage guidelines in `COLOR_PALETTE.md`

### Profile Management Fixes - COMPLETED
- **Fixed profile card layout**: Text wrapping issues resolved with `numberOfLines` props
- **Automatic profile selection**: Single profiles auto-select, multiple profiles remember last used
- **Active profile indicators**: Green/red indicators throughout app showing which vehicle is active
- **Enhanced UX**: Users can never accidentally level with wrong vehicle settings

### Calibration Wizard Improvements - COMPLETED
- **Smart UI rotation**: Interface automatically rotates so instructions are always readable
- **Completion screen**: Prominent "Continue" button and success feedback after calibration
- **Button text fixes**: Fixed "Start Calibration Wizard" overflow → "Start Calibration"
- **Smooth UX**: No more struggling to read upside-down instructions during calibration

### Leveling UI Enhancements - COMPLETED
- **Always visible layout**: Spatial wheel/hitch cards and bubble level remain when vehicle is level
- **Smart status indicators**: "✓ Good" for positions within 1/8" tolerance vs tiny measurements
- **Green border system**: Level positions AND "No blocks fit" positions show green borders
- **Practical measurements**: Quarter-inch rounding (Imperial), centimeter rounding (Metric)
- **Eliminated phantom blocks**: Fixed 0.8" blocks appearing with multi-layer validation
- **Improved text clarity**: "Raise:" instead of "Need:", "Setup blocks in profile"
- **Cohesive green theme**: Entire screen shows green when properly leveled

### Technical Implementation Details
- Added `lastUsedProfileId` to AppSettings for profile persistence
- Enhanced `loadProfiles()` with smart auto-selection logic
- Added prominent profile indicators on Level, Settings, and Profiles screens
- Restructured profile card buttons from XStack to YStack for better mobile layout

## Architecture

### Key Files
- `src/state/appStore.ts` - Zustand store with profile and settings management
- `app/(tabs)/` - Main tab screens (Level, Profiles, Settings)
- `src/components/` - Reusable components including wizards and level indicators
- `src/components/GlassCard.tsx` - Glassmorphism card component
- `src/components/GradientButton.tsx` - Gradient button component
- `src/components/GradientBackground.tsx` - Screen-specific gradient backgrounds
- `src/lib/levelingMath.ts` - Core leveling calculations and math functions
- `src/sensors/attitudeAdapter.ts` - Device sensor integration
- `COLOR_PALETTE.md` - **Official color palette and design system documentation**

### Tech Stack
- **Frontend**: React Native + Expo
- **UI**: Tamagui design system + custom glassmorphism components
- **Animations**: React Native Reanimated 3, Expo Linear Gradient
- **Graphics**: React Native SVG, React Native Skia
- **State**: Zustand + AsyncStorage
- **Sensors**: Expo DeviceMotion
- **Deployment**: Netlify (web), Expo (mobile)

## Future Features & Roadmap
*See FEATURES.md for complete specification*

### High-Priority Planned Features
1. **Enhanced Audio Feedback System** - Hands-free leveling with beeps and voice guidance
   - Proximity beeps increasing as device approaches level
   - Directional voice commands ("Raise left side", "Almost level")  
   - Configurable audio settings and accessibility support
   
2. **Head-High Leveling Mode** - Intentional 1-3° head elevation for better sleep
   - Settings toggle with angle slider for comfort
   - Modified calibration targeting intentional pitch offset
   - Safety warnings for angles >5° to protect appliances

3. **Advanced Block Planning** - Smarter block recommendations
   - Greedy algorithm for optimal block combinations
   - Handle custom block sizes and quantities
   - Progressive leveling for complex scenarios

4. **Van/Motorhome Mode Enhancements** - 4-wheel leveling optimizations
   - Different math using wheelbase instead of hitch distance
   - Progressive adjustment workflows
   - Multiple leveling jack support

## Development Workflow

### Available Commands
```bash
npm run dev          # Start Expo development server (PRIMARY)
npx expo start       # Same as npm run dev
npm run web          # Start web development (limited - no sensors)
npx expo export      # Build for production
npx netlify deploy --dir=dist --prod  # Deploy to Netlify (optional backup)
```

### Testing Strategy
**PRIMARY: Expo Go on iPhone**
- ✅ Real device sensors (accelerometer, gyroscope) - leveling features work
- ✅ Accurate mobile layout, safe areas, touch targets
- ✅ Instant testing with QR code scan
- ✅ True representation of production app
- **Workflow:** `npm run dev` → Scan QR code with iPhone Camera app → Tap notification → App opens in Expo Go
- **Note:** Modern Expo Go doesn't have built-in QR scanner - use native iPhone Camera app instead

**BACKUP: Netlify Web Deployment**
- ⚠️ NO motion sensors - leveling features don't work
- ⚠️ Different layout from mobile (web viewport vs native)
- ✅ Shareable URL for demos/screenshots
- **Use case:** Only for sharing UI demos or basic navigation testing
- **Important:** UI that looks good on web may not fit on mobile - always verify on Expo Go

### Known Issues
- TypeScript circular reference causing max call stack exceeded (doesn't affect runtime)
- Some Tamagui shadow props show deprecation warnings

## Recent Git Status
- Multiple files modified with profile management improvements
- New components: ErrorBoundary, LoadingSpinner, SimpleProfileWizard
- Enhanced existing components with better UX and indicators

## User Profile & Communication Style
**CRITICAL - READ FIRST:**
- **User is a complete coding novice** - Cannot read code, no programming experience
- **Has basic Linux terminal experience** - Comfortable with simple commands
- **Develops conversationally** - Describes features, I implement them
- **Needs step-by-step instructions** - Assume zero knowledge, explain every step
- **Mobile-first user** - Testing on iPhone via Expo Go, not a desktop developer

**Communication requirements:**
1. **Always provide complete, numbered steps** for any actions user needs to take
2. **Explain terminal commands** before asking user to run them
3. **Don't assume technical knowledge** - explain what things do and why
4. **Ask for feedback** if instructions are too detailed (user will say so)
5. **Focus on outcomes** - user cares about app behavior, not implementation details
6. **Test instructions** - make sure they're copy-paste ready and will work

**Expo Go QR code scanning:**
- Modern Expo Go doesn't have built-in QR scanner
- User scans QR codes with native iPhone Camera app
- Camera shows notification → User taps it → Opens in Expo Go

## Session Startup Protocol
**MANDATORY: Read these key files at the start of every session to understand established procedures:**
1. `DEVELOPMENT_SETUP.md` - **Development workflow, custom dev client setup, and testing strategy**
2. `CLAUDE.md` - This file for project overview and procedures
3. `COLOR_PALETTE.md` - **Official color palette and design system standards**
4. `FEATURES.md` - Complete feature specification and planned roadmap
5. `src/components/LevelingAssistant.tsx` - Main leveling UI logic and recent improvements
6. `src/lib/rvLevelingMath.ts` - Core leveling calculations and block optimization
6. `src/lib/units.ts` - Unit conversion and measurement formatting
7. `src/state/appStore.ts` - App state management and profile handling
8. Recent git status to understand current state

**After completing tasks:**
- **PRIMARY:** Test on iPhone via Expo Go - this is the source of truth
- **OPTIONAL:** Deploy to Netlify only if needed for demos/sharing
  - Commands: `npx expo export` then `npx netlify deploy --dir=dist --prod`
  - URL: https://flatfinder-app.netlify.app
- Review recent git status and current branch before starting work
- **CRITICAL:** Always ask user to test on Expo Go before considering UI tasks complete

**Key Established Procedures:**
- **Design**: Follow COLOR_PALETTE.md for all colors, gradients, and glassmorphism patterns
- **Measurements**: Use practical rounding (1/4" Imperial, 1cm Metric)
- **Block sizes**: Restricted to standard sizes: 0.75", 1", 1.5", 2" only
- **Visual indicators**: Green borders = "position optimized" (level OR best achievable)
- **Layout**: Always show spatial layout and bubble level, hide detailed instructions when level
- **Text standards**: "Raise:" not "Need:", "Setup blocks in profile" not "Setup blocks"
- **UI components**: Use GlassCard for cards, GradientButton for primary actions

## Testing Requirements
- ✅ **PRIMARY: Expo Go on iPhone** - ALWAYS test here first
  - Real sensors work (accelerometer, gyroscope)
  - Accurate mobile layout and touch targets
  - True safe areas (notch, rounded corners, home indicator)
  - All features testable

- ⚠️ **AVOID: Desktop browser/Netlify for development**
  - NO motion sensors - leveling doesn't work
  - Different layout than mobile - what fits on web may overflow on mobile
  - Missing safe area considerations
  - Only useful for: onboarding tutorial, basic navigation, UI demos for sharing

## Development Notes
- Always test profile selection logic with both single and multiple profiles
- Ensure active profile indicators are visible throughout the app
- Profile safety is critical - wrong vehicle settings could cause dangerous leveling
- App must work offline since RV locations often have poor connectivity