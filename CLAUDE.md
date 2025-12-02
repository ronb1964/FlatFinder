# FlatFinder - RV Leveling App

## SESSION MANAGEMENT - READ THIS FIRST

### At Session Start

Read this entire CLAUDE.md file. The "NEXT TASK - START HERE" section tells you exactly what to do.

### At Session End

When Ron says we're done for the day (or similar), **before closing**:

1. Update the "NEXT TASK - START HERE" section with what to do next session
2. Update "Current State" with any progress made
3. Remove outdated information that's no longer relevant
4. Add any new decisions, strategies, or context the next session needs to know
5. Keep it concise - this is a handoff document, not a diary

This keeps continuity between sessions so you don't start fresh every time.

---

## Project Overview

FlatFinder is a React Native/Expo app for RV leveling with a "Liquid Glass" UI theme. It uses device sensors to show pitch/roll via a bubble level with an integrated compass.

## Tech Stack

- **Framework**: React Native with Expo (Expo Go compatible)
- **UI**: React Native `StyleSheet.create()` ONLY - no Tamagui, no NativeWind, no Tailwind
- **Animations**: react-native-reanimated
- **Graphics**: react-native-svg for bubble level and compass
- **State**: Zustand (appStore, debugStore)
- **Navigation**: Expo Router (file-based routing in `app/`)

## STYLING RULES - IMPORTANT

**DO NOT** install or use:

- NativeWind
- Tailwind CSS
- Tamagui
- Any other CSS-in-JS or utility-first styling library

**DO** use:

- `StyleSheet.create()` from React Native (like BubbleLevel.tsx does)
- Inline styles when simple
- Theme colors from `src/theme.ts`

This keeps the app simple, minimal dependencies, and consistent.

## Key Files

- `app/(tabs)/index.tsx` - Main level screen with bubble level, warnings, calibration buttons
- `src/components/BubbleLevel.tsx` - SVG bubble level with compass ring
- `src/components/DebugControls.tsx` - Virtual device controls for desktop testing (pitch/roll/heading sliders)
- `src/hooks/useDeviceAttitude.ts` - Device sensor hook with debug override
- `src/state/debugStore.ts` - Zustand store for mock sensor values
- `src/theme.ts` - App color palette (Charcoal + Electric Blue theme)

## Current State (as of Dec 2, 2025)

**Onboarding UI Overhaul - COMPLETE:**

All onboarding screens (pages 1-8) now follow the "Liquid Glass" theme with:

- Custom SVG vehicle icons (trailer, motorhome, van) from SVG Repo
- GlassCard and GlassButton components throughout
- Semi-transparent backgrounds, subtle borders, top highlight bars
- Proper radio button and option card glass styling
- Block inventory with glass-styled input panel

**Trailer Leveling Math - FIXED:**

The leveling math in `src/lib/rvLevelingMath.ts` now correctly handles trailers:

- Trailers: 3 lift points (left wheel, right wheel, tongue jack) - uses pitch/roll correctly
- Motorhomes/Vans: 4 lift points (all 4 wheels) - uses wheelbase for pitch calculations
- Wheelbase field is now hidden for trailers in onboarding (they only need Track Width + Hitch Offset)

**Calibration Routine - CODE COMPLETE, NEEDS VISUAL TESTING:**

1. **Math layer done** - `src/lib/calibration.ts` has `solveMultiPositionCalibration()`
2. **CalibrationWizard.tsx** - Complete with StyleSheet, rotating UI, 5-step flow
3. **app/calibration.tsx** - Complete with Quick Calibrate option
4. **LevelingAssistant.tsx** - Complete with SVG vehicle diagrams

Branch: `ui-overhaul-checkpoint`

## NEXT TASK - START HERE

### Test Calibration UI

The onboarding is complete. Next up:

1. Navigate to Calibration screen - verify UI looks correct
2. Test the calibration wizard flow (Start Calibration button)
3. Navigate to Leveling Assistant - verify SVG vehicle diagram displays
4. Test the leveling calculations with different pitch/roll values
5. Verify trailer shows 3 lift points (left wheel, right wheel, tongue jack)
6. Verify motorhome shows 4 lift points (all wheels)

**Dev server:** `npx expo start --clear`

**Key files changed this session:**

- `src/lib/rvLevelingMath.ts` - Fixed trailer geometry (3 points vs 4)
- `app/onboarding.tsx` - Hidden wheelbase field for trailers
- `src/components/icons/VehicleIcons.tsx` - Custom SVG vehicle icons

## Development

```bash
# Start dev server
npx expo start --clear

# Web testing (for desktop debugging)
# App runs on http://localhost:8081
```

## Browser Testing Setup

### Browser: Use Chrome (Not Firefox)

Playwright MCP is configured to use **Chrome**. Firefox has issues with Wayland on this system.

### How to Start a Testing Session

1. **Start the Expo dev server** (if not already running):

   ```bash
   npx expo start --clear
   ```

   App runs at `http://localhost:8081`

2. **Launch Chrome and navigate to the app**:

   ```
   mcp__playwright__browser_navigate to http://localhost:8081
   ```

   This opens Chrome automatically - no manual browser launch needed.

3. **Set mobile viewport** (iPhone 14 Pro Max: 430x932):

   ```
   mcp__playwright__browser_resize with width=430, height=932
   ```

4. **Interact with the app**:
   - `browser_snapshot` - Get element refs for clicking/typing
   - `browser_click` - Click buttons/links using ref from snapshot
   - `browser_type` - Type into text fields
   - `browser_take_screenshot` - Capture visual state

### Important Notes

- **Don't click the blue "Cancel" banner** at the top of Chrome - that's the Playwright MCP connection indicator. Clicking it disconnects Playwright.
- The white area on the sides of narrow viewport is normal - it's browser chrome outside the app viewport.
- Screenshots from Playwright show only the viewport (the app), not the browser chrome.

### Common Device Viewport Sizes

| Device            | Width | Height |
| ----------------- | ----- | ------ |
| iPhone 14 Pro Max | 430   | 932    |
| iPhone 14 Pro     | 393   | 852    |
| iPhone SE         | 375   | 667    |
| Pixel 7           | 412   | 915    |
| iPad Mini         | 768   | 1024   |

---

## MCP Tools Reference

### Playwright MCP (mcp**playwright**\*)

Primary tool for browser automation and testing:

- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Get accessibility tree (preferred for interactions)
- `browser_click` - Click elements by ref
- `browser_type` - Type into inputs
- `browser_take_screenshot` - Visual screenshots
- `browser_resize` - Set viewport dimensions
- `browser_wait_for` - Wait for text or time delay
- `browser_evaluate` - Run JS in browser
- `browser_run_code` - Run Playwright code snippets

### Browser Automation MCP (mcp**browser-automation**\*)

For debugging and audits (works with existing browser):

- `takeScreenshot` - Screenshot current tab
- `getConsoleLogs` - Check console output
- `getConsoleErrors` - Check for errors
- `getNetworkErrors` - Check network issues
- `runDebuggerMode` - Debug issues
- `runAccessibilityAudit` - A11y checks
- `runPerformanceAudit` - Performance checks

### React Native Guide MCP (mcp**react-native-guide**\*)

- `analyze_component` - Analyze components for best practices
- `analyze_codebase_performance` - Full codebase performance audit
- `analyze_codebase_comprehensive` - Performance, security, code quality analysis
- `optimize_performance` - Get optimization suggestions
- `debug_issue` - Debugging guidance for crashes, performance, UI issues
- `generate_component_test` - Generate Jest/Detox tests
- `architecture_advice` - Project structure recommendations
- `refactor_component` - Refactoring suggestions

### Typical Testing Flow

1. Start Expo dev server: `npx expo start --clear`
2. Navigate Playwright to `http://localhost:8081`
3. Resize to mobile viewport (e.g., 430x932 for iPhone 14 Pro Max)
4. Use `browser_snapshot` for element refs, then interact
5. Use `browser_take_screenshot` to capture visuals
6. Use browser-automation tools for debugging/audits

## Git

- Remote: git@github.com:ronb1964/FlatFinder.git (SSH)
- Main branch: `main`
- Current feature branch: `ui-overhaul-checkpoint`
