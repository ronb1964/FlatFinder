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

## RULES - FOLLOW THESE ALWAYS

1. **Never offer screenshots** - Ron has the app open in the browser. He can see everything. Don't ask "Would you like me to take a screenshot?" - if he needs one, he'll ask.

2. **Wait for approval before proceeding** - After making changes, wait for Ron to review and approve before moving to the next step. Don't assume things are fixed or acceptable.

3. **Don't jump ahead** - Make changes, report what you did, then stop and wait for feedback.

4. **Calculate, don't guess** - For layout/positioning problems, ALWAYS do the math first:
   - Know the container dimensions
   - Know the element sizes
   - Calculate exact positions mathematically
   - Never use trial-and-error guessing with random values
   - Show the calculation before making changes

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

## Current State (as of Dec 3, 2025)

**Onboarding UI Overhaul - COMPLETE**

**Calibration Wizard - COMPLETE:**

- All 3 steps working with proper layouts (portrait for Steps 1 & 3, landscape for Step 2)
- Transition screens with rotation animations
- Phone indicator and text box properly aligned (mathematical centering)
- Cancel returns to home screen (not wizard start)
- Quick Calibrate modal uses glass theme button

**Key file:** `src/components/CalibrationWizard.tsx`

Branch: `ui-overhaul-checkpoint`

## NEXT TASK - START HERE

### Leveling Solution Screen (Post-Calibration)

After calibration completes, the app should show a leveling solution/plan. This is the screen that tells the user how to level their RV.

**What to work on:**

1. Review the LevelingAssistant component (`src/components/LevelingAssistant.tsx`)
2. Test the SVG vehicle diagrams - trailer should show 3 lift points, motorhome should show 4
3. Verify block calculations and leveling recommendations display correctly
4. Test the flow from calibration completion → leveling solution

## CRITICAL - Rotation Coordinate Mapping

When container rotates -90° (counterclockwise), coordinates map:

| Pre-rotation | My View (screenshot) |
| ------------ | -------------------- |
| TOP          | LEFT                 |
| BOTTOM       | RIGHT                |
| LEFT         | BOTTOM               |
| RIGHT        | TOP                  |

**To move element UP in my view:** Use `paddingBottom` or decrease `top` value
**To move element DOWN in my view:** Use `paddingTop` or increase `top` value

**flexDirection behavior:**

- `row` → children stack BOTTOM-to-TOP in my view
- `column` → children stack LEFT-to-RIGHT in my view

**Layout styles for landscape screens:**

- `landscapeDotsTop` - Progress dots (positioned at pre-rotation top = my LEFT)
- `landscapeTitleArea` - Title/subtitle (positioned at pre-rotation top = my LEFT)
- `landscapeTwoColumns` - Two-column layout for Step 2 capture screen
- `landscapeCenteredStack` - Single centered stack for transition screens
- `landscapeButtonsArea` - Buttons (positioned at pre-rotation bottom = my RIGHT)

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

## Future Tools - Add When Ready

### Cali MCP (Add when ready for App Store builds)

When Ron is ready to build native iOS/Android binaries for App Store submission, add the Cali MCP:

```bash
claude mcp add cali -s user -- npx -y @callstack/cali-mcp-server
```

**What it provides:**

- Build automation for iOS/Android
- Device/simulator management
- React Native library search
- Dependency management

**When to add:** Before first App Store / Play Store submission

Source: https://github.com/callstackincubator/cali
