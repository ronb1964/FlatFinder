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

4. **Calculate, don't guess** - For layout/positioning problems, follow this checklist:

   **BEFORE writing any code:**
   - State the current/known dimensions (container size, element size, etc.)
   - Show the calculation with actual numbers
   - State the expected result

   **AFTER taking a screenshot:**
   - Describe what you ACTUALLY see (not what you expected)
   - If it doesn't match expectations, say so immediately
   - Never claim something is fixed if it visually isn't

5. **Verify centering and alignment during development** - Don't overlook visual details:
   - When creating buttons, cards, or any UI element with content inside, verify centering immediately
   - Use consistent icon sizes across similar components (don't mix 24px, 28px, 32px icons in the same row)
   - When icons vary in size, wrap them in fixed-height containers with `justifyContent: 'center'`
   - For GlassButton: use the `icon` and `rightIcon` props instead of custom View structures inside children
   - Measure centering programmatically when in doubt - don't rely on "looks okay"
   - Fix alignment issues as you build, not after - it's much harder to backtrack

6. **SCREENSHOT ANALYSIS IS MANDATORY** - When you take a screenshot or Ron provides one:
   - **STOP and carefully examine the ACTUAL visual content in the image**
   - **DO NOT assume code renders as written** - describe what you ACTUALLY see
   - **TAKE MEASUREMENTS** - Use browser evaluation tools to measure element positions, dimensions, and gaps
   - Report SPECIFIC measurements with numbers (e.g., "gap at center is 35px, gap at edges is 8px")
   - Compare measurements against expected values from the code/design
   - If measurements don't match expectations, state the discrepancy explicitly with numbers
   - **Screenshots cost tokens and money** - analyze them thoroughly the first time
   - **Example:** "The gap at center is -35px (overlapping), card width is 254px but should be 305px" NOT "looks parallel"

7. **THEME CONSISTENCY IS MANDATORY** - The app has a "Liquid Glass" theme that MUST be consistent across ALL screens in BOTH dark and light modes:

   **Before making ANY style change:**
   - Check how similar elements are styled elsewhere in the app
   - If adding/fixing styles for one component, check ALL similar components
   - Never fix one input field without checking all input fields
   - Never fix one button without checking all buttons of that type

   **When implementing light mode support:**
   - Light mode must maintain the glassy/frosted aesthetic - use translucent colors (rgba), not solid colors
   - Input fields need visible backgrounds AND borders in light mode (the white card background makes subtle colors invisible)
   - Test the SAME component in BOTH dark and light modes

   **Glassy style requirements:**
   - Use `rgba()` colors, not hex, to maintain translucency
   - Light mode inputs: use blue-tinted translucent backgrounds like `rgba(100, 130, 180, 0.12)` with visible borders like `rgba(100, 130, 180, 0.35)`
   - Cards should have subtle borders and translucent backgrounds
   - Never use fully opaque backgrounds for interactive elements

   **After ANY style change:**
   - Ask yourself: "Does this change need to apply to other similar components?"
   - Search for similar patterns in the codebase and update them ALL
   - Don't wait for Ron to ask about consistency - proactively ensure it

8. **KEYBOARD HANDLING IS MANDATORY** - Input fields must NEVER be hidden by the keyboard:

   **Screen structure for keyboard support:**
   - Every screen with input fields MUST have ONE `KeyboardAvoidingView` at the screen level (NOT nested)
   - Use `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` for cross-platform support
   - NEVER nest ScrollViews - use a single ScrollView at the screen level
   - NEVER nest KeyboardAvoidingViews - only one per screen

   **When creating/editing screens with inputs:**
   - Ensure the outer ScrollView has `keyboardShouldPersistTaps="handled"`
   - Add sufficient `paddingBottom` to `contentContainerStyle` (at least 40px)
   - Use `scrollToEnd()` on input focus to ensure the input is visible
   - Test keyboard behavior on ACTUAL device - browser doesn't show keyboard issues

   **Common mistakes to avoid:**
   - Don't put KeyboardAvoidingView or ScrollView inside step/render functions - use the screen's main wrappers
   - Don't assume keyboard handling "just works" - always test with real keyboard

9. **BRANCH PROTECTION - CRITICAL** - The `main` branch is the ONLY working branch. It contains the v1 App Store code.
   - **NEVER** create new branches or switch branches without Ron's explicit permission
   - **NEVER** merge or rebase without Ron's explicit approval
   - The `archived/ui-rewrite` branch is a dead-end rewrite — do NOT use it, cherry-pick from it, or reference its code
   - If you're unsure which branch you're on, run `git branch` and confirm you see `* main` before making any changes
   - All development happens on `main` unless Ron specifically says otherwise

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

## Design Patterns - USE THESE FOR CONSISTENCY

### Button Variants (GlassButton component)

| Action Type      | Variant     | Color        | Example                        |
| ---------------- | ----------- | ------------ | ------------------------------ |
| Cancel/Dismiss   | `default`   | Gray         | Cancel, Close                  |
| Navigation Back  | `warning`   | Orange/Amber | Back (in wizards/flows)        |
| Primary Action   | `primary`   | Blue         | Save, Confirm, Calibrate, Next |
| Destructive      | `danger`    | Red          | Delete, Remove                 |
| Success/Positive | `success`   | Green        | Quick Calibrate, Level Check   |
| Secondary        | `secondary` | Teal/Cyan    | Full Calibration               |
| Subtle/Muted     | `ghost`     | Faded gray   | Low-emphasis options           |

### Modal Pattern

**IMPORTANT: Never use X buttons to close modals. Always use a Cancel button.**

All modals should follow this structure:

1. **Header**: Icon + Title only (NO X close button ever)
2. **Content**: Message/form fields
3. **Buttons**: Action buttons at bottom
   - Cancel button (gray, `variant="default"`) - always include this
   - Primary action (blue/green/red based on action type)

### Color Palette (from theme.ts)

**Dark Mode (default):**

- **Background**: `#111111` (near black)
- **Surface**: `#1a1a1a` (dark gray)
- **Primary**: `#3b82f6` (electric blue)
- **Success**: `#22c55e` (green)
- **Warning**: `#eab308` (yellow)
- **Danger**: `#ef4444` (red)
- **Text**: `#fafafa` (white), `#a3a3a3` (secondary), `#737373` (muted)
- **Inputs**: `rgba(255, 255, 255, 0.05)` bg, `rgba(255, 255, 255, 0.15)` border

**Light Mode:**

- **Background**: `#dce4ed` (light blue-gray)
- **Cards**: `rgba(255, 255, 255, 0.9)` (frosted white)
- **Text**: `#1a1a1a` (near black), `#525252` (secondary)
- **Inputs**: `rgba(100, 130, 180, 0.12)` bg, `rgba(100, 130, 180, 0.35)` border (blue-tinted glassy)
- **Borders**: Use `rgba(0, 0, 0, 0.08)` to `rgba(0, 0, 0, 0.15)` range

**IMPORTANT:** Both modes use the same accent colors (Primary, Success, Warning, Danger). Light mode must maintain the glassy aesthetic with translucent colors.

## Key Files

- `app/(tabs)/index.tsx` - Main level screen with bubble level, warnings, calibration buttons
- `src/components/BubbleLevel.tsx` - SVG bubble level with compass ring
- `src/components/DebugControls.tsx` - Virtual device controls for desktop testing (pitch/roll/heading sliders)
- `src/hooks/useDeviceAttitude.ts` - Device sensor hook with debug override
- `src/state/debugStore.ts` - Zustand store for mock sensor values
- `src/theme.ts` - App color palette (Charcoal + Electric Blue theme)

## Current State (as of March 15, 2026)

**Branch: `main`** — This is the v1 App Store code (previously called `ui-overhaul-checkpoint`).

**Core Functionality - WORKING:**

- Roll sensor inversion fixed for native devices (`invertRoll: true` in EXPO_DEVICE_MOTION preset)
- Bubble correctly floats to HIGH side on actual phone
- Check Level feature with percentage feedback implemented
- Calibration → Leveling flow with prompt modal implemented
- Compass ring with heading display, cardinal directions (N/S/E/W)
- Quick Calibrate and Full Calibration buttons
- Block quantity tracking with +/- steppers in onboarding and profile editor
- GestureHandlerRootView wrapper (iPad crash fix) in place
- Privacy policy and support pages deployed at flatfinder-app.netlify.app

**v1.0**: Released on iOS App Store ✅
**v1.0.1**: In progress — URL fixes, iPad crash fix, Android/Google Play support

**Known Issues:**

- Cancel buttons are still RED (should be gray per design patterns)
- ProfileEditor modal doesn't show form fields on phone (just header + buttons)
- Browser preview doesn't match phone (browser shows larger usable area than phone actually has)
- **Compass heading is 180° off** — both the displayed degrees AND the ring are wrong
- **App icon**: New icon created (FF_final.png) but may need verification for App Store/Play Store

**Archived branches (DO NOT USE):**

- `archived/ui-rewrite` — dead-end complete UI rewrite, not the App Store code
- `old-main-initial` — original initial commit
- `expo-go-setup` — old experimental branch

## NEXT TASK - START HERE

### 1. Google Play Store Release

- Ron has a Galaxy S26 Ultra for Android testing
- EAS config updated with Android submit profile
- **Next steps:**
  1. Ron creates Google Play Developer account ($25 one-time fee)
  2. Build Android dev client: `npx eas build --profile development --platform android`
  3. Install on S26 Ultra and test sensors, UI, leveling
  4. Fix any Android-specific issues
  5. Ron sets up Google Play API service account (JSON credentials)
  6. Build production AAB: `npx eas build --profile production --platform android`
  7. Submit: `npx eas submit --platform android`
  8. Complete Play Store listing (screenshots, descriptions, feature graphic)

### 2. iOS v1.0.1 Resubmission

- URL fixes done (privacy, support pages)
- iPad crash fix already in place (GestureHandlerRootView)
- Ron needs to update App Store Connect privacy policy URL to `https://flatfinder-app.netlify.app/privacy`
- Build and submit: `npx eas build --profile production --platform ios && npx eas submit --platform ios`

### 3. Block Quantity Regression Fix

Block quantities in onboarding were working in v1 but need verification. See plan file for details.

### 4. Known UI Fixes (lower priority)

- Cancel buttons should be gray (`variant="default"`), not red
- ProfileEditor modal doesn't show form fields on phone
- Compass heading 180° off

---

## UI Development Rules - ENFORCED PATTERNS

### 1. Always Use `useSafeInsets()` for Layout Calculations

```typescript
// CORRECT - use our custom hook
import { useSafeInsets } from '../hooks/useSafeInsets';
const insets = useSafeInsets();
const usableHeight = screenHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT;

// WRONG - raw screen dimensions without safe area consideration
const { height } = useWindowDimensions(); // Don't use this alone for sizing!
```

### 2. Always Use `SafeAreaSimulator` Instead of `SafeAreaView` on Screens

```typescript
// CORRECT - shows accurate preview on web
import { SafeAreaSimulator } from '../components/SafeAreaSimulator';
<SafeAreaSimulator showIndicators={Platform.OS === 'web'}>

// WRONG - returns 0 insets on web, misleading preview
import { SafeAreaView } from 'react-native-safe-area-context';
```

### 3. Size Elements Based on Usable Space, Not Screen Size

```typescript
// CORRECT - calculate what actually fits
const reservedSpace = 350; // status + card + buttons + padding
const maxBubbleSize = Math.min(usableHeight - reservedSpace, 280);

// WRONG - assume full screen is available
const bubbleSize = screenHeight * 0.4; // Will overflow on real device!
```

### 4. Test Button Text Fits Before Committing

Before creating buttons with text:

1. Calculate available width: `screenWidth - margins - padding`
2. If two buttons side-by-side: `(availableWidth - gap) / 2`
3. If text is longer than ~10 characters, consider stacking vertically

### 5. Always Verify Centering Visually

When creating centered elements:

- Use `alignItems: 'center'` and `justifyContent: 'center'` together
- For buttons with icons: use the `icon` prop, not custom View structures
- Check the browser preview shows proper centering before moving on

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

- **Browser testing is NOT pixel-accurate** - Safe areas, tab bar, and platform rendering differences mean the actual device will look different
- **Test on actual device for layout work** - Use `npx expo start --tunnel` and scan QR with Expo Go
- Browser testing is still useful for logic/flow testing, just not for pixel-perfect layout
- Don't click the blue "Cancel" banner at the top of Chrome - that's the Playwright MCP connection indicator

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
