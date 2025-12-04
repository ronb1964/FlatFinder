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

5. **Verify centering and alignment during development** - Don't overlook visual details:
   - When creating buttons, cards, or any UI element with content inside, verify centering immediately
   - Use consistent icon sizes across similar components (don't mix 24px, 28px, 32px icons in the same row)
   - When icons vary in size, wrap them in fixed-height containers with `justifyContent: 'center'`
   - For GlassButton: use the `icon` and `rightIcon` props instead of custom View structures inside children
   - Measure centering programmatically when in doubt - don't rely on "looks okay"
   - Fix alignment issues as you build, not after - it's much harder to backtrack

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

## Current State (as of Dec 4, 2025)

**Onboarding UI Overhaul - COMPLETE**

**Calibration Wizard - COMPLETE**

**Leveling Plan Screen - MOSTLY COMPLETE:**

- Vehicle diagrams working for trailer, van, motorhome (glass-themed SVGs)
- Diagram shows correct orientation: F (front) left, R (rear) right, Driver (Left) at bottom, Passenger (Right) at top
- Color-coded wheel indicators: Green (ground), Blue (blocks sufficient), Yellow (needs attention)
- Yellow wheels pulse to draw attention
- Block instruction cards match wheel colors
- Cards show "Lift needed" and "Blocks provide" for clarity
- Left/Right (Driver/Passenger) labels on diagram for user clarity

**Bubble Level & Math - FIXED THIS SESSION:**

- Bubble now correctly floats to HIGH side (was inverted)
- Roll math corrected: +roll = right high → left wheels need lift
- Pitch math corrected: +pitch = nose up → rear wheels need lift
- Display text matches: "Right High" / "Left High" / "Nose Up" / "Nose Down"

Branch: `ui-overhaul-checkpoint`

## NEXT TASK - START HERE

### 1. Implement Block Tolerance Threshold (Quick Fix)

Currently, wheels show yellow (warning) if blocks don't EXACTLY match the lift needed. This means almost every wheel shows yellow. Need to implement a tolerance threshold.

**Recommended tolerance:** 0.5" (based on research - see below)

**Changes needed in `src/components/LevelingAssistant.tsx`:**

In `getWheelStatus()` function (~line 90) and `WheelCard` component (~line 472), change the "solution" check from exact match to within tolerance:

```javascript
// Current (too strict):
if (stack.totalHeight >= lift.liftInches - 0.1)

// Change to (with tolerance for overshoot too):
const tolerance = 0.5; // inches
if (Math.abs(stack.totalHeight - lift.liftInches) <= tolerance)
```

Also consider allowing slight OVERSHOOT (blocks provide more than needed) as acceptable - being 0.3" high is fine.

### 2. Implement Calibration → Leveling Flow

When user taps "Leveling Assistant" from home screen:

- If never calibrated → Prompt with options: "Quick Calibrate" / "Full Calibration"
- If previously calibrated → Show options: "Quick Calibrate" / "Full Calibration" / "Use Last Calibration"

After completing calibration wizard:

- Show two buttons: "View Leveling Plan" / "Go Home"

**Key messaging to include:**

- "If your vehicle has moved since last calibration, please calibrate again"
- For Quick Calibrate: "Only use if phone is on a known level surface"

### 3. Review Trailer and Motorhome Diagrams

Van diagram is done and looks good. Still need to verify:

- Trailer diagram (has tongue/hitch graphic)
- Motorhome diagram (has cab-over section)

Create test profiles for each type and verify diagrams display correctly.

---

## RV Leveling Research (for reference)

### Acceptable Leveling Tolerance

- **Target:** 1-2 degrees for comfort
- **Maximum:** 3 degrees (to protect absorption refrigerator)
- **Auto-levelers:** Typically achieve 0.5-0.7 degrees

**Why it matters:** Refrigerators and AC coils rely on gravity. Slides need level surface to extend/retract properly.

**Block height tolerance recommendation:** 0.5" is reasonable - most RVers consider "close enough" acceptable.

### Common Block Sizes

| Product          | Dimensions              | Lift Per Block      |
| ---------------- | ----------------------- | ------------------- |
| Lynx Levelers    | 8.5" × 8.5" × 1.5"      | 1"                  |
| Camco Blocks     | 8.5" × 8.5" × 1"        | 1"                  |
| Andersen Leveler | Curved ramp             | 0.5" to 4" variable |
| 2×6 Lumber       | 1.5" thick × 5.5" wide  | 1.5"                |
| 2×8 Lumber       | 1.5" thick × 7.25" wide | 1.5"                |
| 3/4" Plywood     | 0.75" thick             | 0.75"               |

**Default block inventory suggestion:**

- 4× 1" blocks (like Camco)
- 2× 2" blocks
- 2× 0.5" blocks (for fine-tuning)

Sources:

- [GoDownsize - How Level Should RVs Be?](https://www.godownsize.com/how-level-rv/)
- [Camper Report - Why RVs Have to Be Level](https://camperreport.com/why-rvs-have-to-be-level-and-how-to-do-it-faster/)
- [Tri-Lynx Levelers](https://trilynx.com/products/lynx-leveler-10-pack)
- [Getaway Couple - Camco vs Lynx Comparison](https://www.getawaycouple.com/camco-vs-lynx-levelers/)

---

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
