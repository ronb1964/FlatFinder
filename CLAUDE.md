# FlatFinder - RV Leveling App

## Project Overview
FlatFinder is a React Native/Expo app for RV leveling with a "Liquid Glass" UI theme. It uses device sensors to show pitch/roll via a bubble level with an integrated compass.

## Tech Stack
- **Framework**: React Native with Expo (Expo Go compatible)
- **UI**: Tamagui + custom React Native StyleSheet components
- **Animations**: react-native-reanimated
- **Graphics**: react-native-svg for bubble level and compass
- **State**: Zustand (appStore, debugStore)
- **Navigation**: Expo Router (file-based routing in `app/`)

## Key Files
- `app/(tabs)/index.tsx` - Main level screen with bubble level, warnings, calibration buttons
- `src/components/BubbleLevel.tsx` - SVG bubble level with compass ring
- `src/components/DebugControls.tsx` - Virtual device controls for desktop testing (pitch/roll/heading sliders)
- `src/hooks/useDeviceAttitude.ts` - Device sensor hook with debug override
- `src/state/debugStore.ts` - Zustand store for mock sensor values
- `src/theme.ts` - App color palette (Charcoal + Electric Blue theme)

## Current State (as of last session)
- Bubble level with dynamic compass heading display
- Cardinal directions (N/E/S/W) counter-rotate to stay readable
- Color scheme: Red N, White E/S/W, Gray intercardinals
- Two-tier safety warnings: Yellow caution (6-10°), Red danger (>10°)
- Debug controls with pitch/roll/heading sliders for desktop testing
- Branch: `ui-overhaul-checkpoint`

## Development
```bash
# Start dev server
npx expo start --clear

# Web testing (for desktop debugging)
# App runs on http://localhost:8081
```

## Testing with MCP Tools
This project uses both Playwright MCP and Browser Automation MCP for testing:

### Playwright MCP (mcp__playwright__*)
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Get accessibility tree (preferred over screenshots for interactions)
- `mcp__playwright__browser_click` - Click elements by ref
- `mcp__playwright__browser_type` - Type into inputs
- `mcp__playwright__browser_take_screenshot` - Visual screenshots
- `mcp__playwright__browser_evaluate` - Run JS in browser

### Browser Automation MCP (mcp__browser-automation__*)
- `mcp__browser-automation__takeScreenshot` - Screenshot current tab
- `mcp__browser-automation__getConsoleLogs` - Check console output
- `mcp__browser-automation__getConsoleErrors` - Check for errors
- `mcp__browser-automation__getNetworkErrors` - Check network issues
- `mcp__browser-automation__runDebuggerMode` - Debug issues
- `mcp__browser-automation__runAccessibilityAudit` - A11y checks
- `mcp__browser-automation__runPerformanceAudit` - Performance checks

### React Native Guide MCP (mcp__react-native-guide__*)
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
