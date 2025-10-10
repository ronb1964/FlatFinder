# LevelMate - RV/Trailer Leveling App

## Project Overview
LevelMate is a React Native/Expo app that helps RV owners level their vehicles using device sensors. Built with TypeScript, Tamagui UI framework, and Zustand state management.

**Production URL:** https://levelmate-app-1755829802.netlify.app

## Current Status (✅ Recently Completed)

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

### Leveling UI Enhancements - COMPLETED ✅ Latest
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
- `src/lib/levelingMath.ts` - Core leveling calculations and math functions
- `src/sensors/attitudeAdapter.ts` - Device sensor integration

### Tech Stack
- **Frontend**: React Native + Expo
- **UI**: Tamagui design system
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
npm run dev          # Start development server
npm run web          # Start web development
npx expo export      # Build for production
npx netlify deploy --dir=dist --prod  # Deploy to Netlify
```

### Known Issues
- TypeScript circular reference causing max call stack exceeded (doesn't affect runtime)
- Some Tamagui shadow props show deprecation warnings

## Recent Git Status
- Multiple files modified with profile management improvements
- New components: ErrorBoundary, LoadingSpinner, SimpleProfileWizard
- Enhanced existing components with better UX and indicators

## Session Startup Protocol
**MANDATORY: Read these key files at the start of every session to understand established procedures:**
1. `CLAUDE.md` - This file for project overview and procedures
2. `FEATURES.md` - Complete feature specification and planned roadmap
3. `src/components/LevelingAssistant.tsx` - Main leveling UI logic and recent improvements
4. `src/lib/rvLevelingMath.ts` - Core leveling calculations and block optimization
5. `src/lib/units.ts` - Unit conversion and measurement formatting
6. `src/state/appStore.ts` - App state management and profile handling
7. Recent git status to understand current state

**After completing tasks:**
- ALWAYS build and deploy changes to Netlify after completing tasks
- Commands: `npx expo export` then `npx netlify deploy --dir=dist --prod`
- Test changes at: https://levelmate-app-1755829802.netlify.app
- Review recent git status and current branch before starting work

**Key Established Procedures:**
- Use practical measurement rounding (1/4" Imperial, 1cm Metric)
- Block selection restricted to standard sizes: 0.75", 1", 1.5", 2" only
- Green borders indicate "position optimized" (level OR best achievable)
- Always show spatial layout and bubble level, hide detailed instructions when level
- Text standards: "Raise:" not "Need:", "Setup blocks in profile" not "Setup blocks"

## Testing Limitations
- **Desktop browser CANNOT test leveling features** - no motion sensors
- **Onboarding tutorial** can be tested on desktop (no sensors needed)
- **Block Instructions/Leveling screens** MUST be tested on phone via Netlify
- **Local development server** useful for: UI layout, navigation, non-sensor features only

## Development Notes
- Always test profile selection logic with both single and multiple profiles
- Ensure active profile indicators are visible throughout the app
- Profile safety is critical - wrong vehicle settings could cause dangerous leveling
- App must work offline since RV locations often have poor connectivity