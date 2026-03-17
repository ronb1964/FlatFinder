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

## PRE-BUILD CHECKLIST - MANDATORY BEFORE ANY BUILD

**Every single time** before running `eas build` (local or cloud) for any platform, run these two checks first. No exceptions. Do not skip. Do not ask Ron if he wants to run them — just run them automatically.

```bash
npx tsc --noEmit
```

Catches TypeScript errors. Must show 0 errors before proceeding.

```bash
npx expo export --platform ios
```

(or `--platform android` for Android builds)
Catches bundling errors — missing modules, broken imports, bad config. This is what EAS does internally. If it fails here, it will fail in the build. Fix it now, not after a 3-hour queue wait.

**If either check fails:** Stop. Fix the error. Re-run the checks. Only proceed to `eas build` when both pass cleanly.

**Never tell Ron a build is ready to go without having run these checks first.**

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

## Current State (as of March 16, 2026)

**Branch: `main`** — This is the v1 App Store code.

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
- Nav link vertical alignment fixed across all three pages (home, privacy, support)

**v1.0**: Released on iOS App Store ✅
**v1.0.1**: Submitted for App Store review Mar 16, 2026 — Waiting for Review ✅

**MacBook setup:**

- `~/Projects/FlatFinder-main` — clean clone of `main`, npm installed, Xcode 16.3 ready for local builds
- Old MacBook folders (FlatFinder, FlatFinder-1) moved to trash ✅
- For future iOS builds: use MacBook local build (`eas build --local --profile production --platform ios`) — free and fast
- For future iOS uploads: use Apple Transporter on Mac (EAS submit is broken for this account)

**EAS notes:**

- Ron has paid Expo account (priority queue)
- eas-cli updated to ^18.4.0 in package.json
- `eas submit --platform ios` consistently fails — use Transporter instead
- Android EAS submit may or may not work — test when needed

**Android crash fixes applied (main branch):**

- `@react-native-community/slider` removed — was crashing via Fabric component descriptor / invalid pointer free on Android 15
- `expo-av` replaced with `expo-audio` — expo-av's AVManager.onHostDestroy was releasing ExoPlayer from a background thread (IllegalStateException on Android 15)
- `GlassCard` gets solid Android background layer — BlurView doesn't create real backdrop blur on Android, so warning cards were transparent over compass
- Warning status text hidden when warning card is active — avoids giant text between card and compass on Android

**Known Issues (lower priority):**

- Cancel buttons are still RED (should be gray per design patterns)
- ProfileEditor modal doesn't show form fields on phone (just header + buttons)

**Archived branches (DO NOT USE):**

- `archived/ui-rewrite` — dead-end complete UI rewrite, not the App Store code
- `old-main-initial` — original initial commit
- `expo-go-setup` — old experimental branch

## NEXT TASK - START HERE

### 1. iOS v1.0.1 — SUBMITTED ✅

- Build 9 submitted for App Store review on Mar 16, 2026 at 7:28 PM
- Status: Waiting for Review
- Submission ID: e8b34f22-0a46-42b3-b64e-4bb1c0717f7e
- **NOTE:** `eas submit` consistently fails for this account. Use **Apple Transporter** on Mac instead.
  - Download IPA: `npx eas build:view [build-id] --json` to get artifact URL, then `curl -L -o file.ipa [url]`
  - Send to Mac via LocalSend, open in Transporter, click Deliver
  - eas-cli updated to ^18.4.0 in package.json (was 16.28.0)

### 2. Android — Submit to Play Store 🔜 (pick up here next session)

- Dev APK tested and working on S26 Ultra ✅
- Build ID: `39b468bd-6e8b-4cbb-9d5d-b6a4eec6b255` (dev build, not for Play Store)
- **Production build steps:**
  1. Run pre-build checks: `npx tsc --noEmit` + `npx expo export --platform android`
  2. Build production AAB: `npx eas build --profile production --platform android`
  3. Download AAB from EAS dashboard when done
- **Play Store submission steps:**
  1. Complete store listing in Play Console (screenshots, description, feature graphic)
     - Privacy policy URL: `https://flatfinder-app.netlify.app/privacy` ✅
  2. First release MUST be uploaded manually via Play Console web UI (Google requirement)
     - Play Console → App → Release → Production → Create new release → Upload AAB
  3. Future releases: `npx eas submit --platform android` may work after first manual upload
- **versionCode**: currently `1` in app.json — correct for first Play Store submission ✅
- **version**: currently `1.0.1` in app.json — fine for Play Store (first submission)

### 3. Known UI Fixes (lower priority — do after both store submissions)

- Cancel buttons should be gray (`variant="default"`), not red
- ProfileEditor modal doesn't show form fields on phone

### 4. Future Features / Iteration Ideas

**IMPORTANT:** Every feature built here must be implemented for BOTH iOS and Android.
Never build something for one platform without considering the other.

- **Scroll affordance indicator** — mockup APPROVED ✅, ready to build in 1.0.2
  - Softly pulsing translucent chevron at bottom of any scrollable screen
  - Pure visual: `pointer-events: none` — cannot be tapped accidentally
  - Breathes: fades 60% → 8% opacity over 2.4s cycle, no movement
  - Disappears smoothly (0.6s transition) when scrolled to bottom
  - **EXACT approved CSS (do not deviate without Ron's approval):**
    ```css
    /* SVG: width=42 height=42, stroke="white", stroke-width="2.5",
       stroke-linecap="round", viewBox="0 0 24 24"
       path: "m6 9 6 6 6-6" */
    filter: blur(1px) drop-shadow(0 0 7px rgba(255, 255, 255, 0.55))
      drop-shadow(0 0 14px rgba(255, 255, 255, 0.25));
    /* blur(1px) makes the stroke edges wispy/foggy.
       drop-shadows add the outer glow. Together = diffuse light shape,
       not a hard drawn line. Ron specifically approved this look. */
    ```
  - Mockup lives at: `.mockups/scroll-chevron.html` (start Mockups server on port 8083)
  - React Native equivalent: use `style={{ filter: ... }}` isn't supported natively —
    use `expo-blur` or a custom SVG with feGaussianBlur filter, or wrap in a View with
    `shadowColor/shadowRadius` for the glow. The blur on the stroke itself requires
    SVG's `<feGaussianBlur>` filter applied to the path element.
  - Implementation: `onScroll` + `onContentSizeChange` to detect overflow,
    Reanimated `withRepeat(withSequence(...))` for the breathe animation

- **Landing website "Learn More" section** — Ron approved the existing design
  - The flatfinder-app.netlify.app site has a "Learn More ↓" link Ron likes
  - Keep this style/approach for any future landing page updates

- **Parallel iOS/Android development** — standing rule going forward:
  - Any UI feature or fix goes into both platforms in the same commit
  - Test on both before considering a feature done

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
