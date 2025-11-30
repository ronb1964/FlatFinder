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

## Current State (as of last session)

- All screens (Onboarding, Settings, Profiles) converted to StyleSheet - WORKING
- Firefox browser working with Playwright MCP for testing
- Block inventory tracks quantities (how many of each size block)
- Custom vehicle measurements option in onboarding
- Switch visibility improved (track color #555 instead of #333)
- GlassCard fixed with width: '100%' to prevent content overflow
- Branch: `ui-overhaul-checkpoint`
- Last commit: `09b7762` - refactor: convert onboarding, settings, profiles to StyleSheet

## NEXT TASK - START HERE

### Ready for Next Feature

The UI overhaul is complete! All screens use StyleSheet.create() and match the liquid glass theme.

**Potential next tasks:**

1. Fix pre-existing ESLint errors in profiles.tsx (window not defined, setTimeout, etc.)
2. Test the complete onboarding flow on a real device
3. Add any new features Ron requests

**Dev server:** `npx expo start --clear`
**Web testing:** Firefox via Playwright MCP at `http://localhost:8081`

## Development

```bash
# Start dev server
npx expo start --clear

# Web testing (for desktop debugging)
# App runs on http://localhost:8081
```

## Testing with MCP Tools

This project uses both Playwright MCP and Browser Automation MCP for testing:

### Playwright MCP (mcp**playwright**\*)

- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Get accessibility tree (preferred over screenshots for interactions)
- `mcp__playwright__browser_click` - Click elements by ref
- `mcp__playwright__browser_type` - Type into inputs
- `mcp__playwright__browser_take_screenshot` - Visual screenshots
- `mcp__playwright__browser_evaluate` - Run JS in browser

### Browser Automation MCP (mcp**browser-automation**\*)

- `mcp__browser-automation__takeScreenshot` - Screenshot current tab
- `mcp__browser-automation__getConsoleLogs` - Check console output
- `mcp__browser-automation__getConsoleErrors` - Check for errors
- `mcp__browser-automation__getNetworkErrors` - Check network issues
- `mcp__browser-automation__runDebuggerMode` - Debug issues
- `mcp__browser-automation__runAccessibilityAudit` - A11y checks
- `mcp__browser-automation__runPerformanceAudit` - Performance checks

### React Native Guide MCP (mcp**react-native-guide**\*)

- `mcp__react-native-guide__analyze_component` - Analyze components for best practices
- `mcp__react-native-guide__analyze_codebase_performance` - Full codebase performance audit
- `mcp__react-native-guide__analyze_codebase_comprehensive` - Performance, security, code quality analysis
- `mcp__react-native-guide__optimize_performance` - Get optimization suggestions for specific scenarios
- `mcp__react-native-guide__debug_issue` - Debugging guidance for crashes, performance, UI issues
- `mcp__react-native-guide__generate_component_test` - Generate Jest/Detox tests for components
- `mcp__react-native-guide__architecture_advice` - Project structure recommendations
- `mcp__react-native-guide__refactor_component` - Refactoring suggestions

### Typical Testing Flow

1. Start Expo dev server: `npx expo start --clear`
2. Navigate Playwright to `http://localhost:8081`
3. Use browser_snapshot for element refs, then interact
4. Use browser-automation tools for debugging/audits

## Git

- Remote: git@github.com:ronb1964/FlatFinder.git (SSH)
- Main branch: `main`
- Current feature branch: `ui-overhaul-checkpoint`
