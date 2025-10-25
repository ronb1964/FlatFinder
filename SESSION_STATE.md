# Session State - 2025-10-24

## ✅ Current Status: Moving to MacBook Pro for iOS Development

### Current Setup (WORKING)
- **App is on Expo SDK 53** (bleeding edge, unreleased)
- **Custom development client built and installed on iPhone**
- **Dev server connects successfully**
- **Real device sensors are working**
- **Planning to use MacBook Pro + iOS Simulator** for more efficient UI development

## What We Accomplished Today

### 1. Built Custom Development Client ✅
- Logged into Apple Developer account (ronb1964@me.com)
- Registered iPhone device via provisioning profile
- Fixed package conflicts:
  - Removed `netlify-cli` (was pulling in Android rollup binaries)
  - Removed `react-native-worklets` (duplicate symbols with reanimated)
- Successfully built iOS development client via EAS
- Build time: ~20 minutes
- Installed on iPhone successfully

### 2. Fixed Build Issues ✅
**Problem 1**: Android rollup packages breaking iOS build
- **Cause**: `netlify-cli` in devDependencies pulled in platform-specific rollup binaries
- **Solution**: Removed `netlify-cli` from package.json
- **Alternative**: Use `npx netlify deploy` when needed

**Problem 2**: Duplicate symbol errors during linking
- **Cause**: Both `react-native-worklets` and `react-native-reanimated` provided WorkletsModule
- **Solution**: Removed `react-native-worklets` (reanimated v3.17.4 includes worklets)

### 3. Established Development Workflow ✅
- Created `DEVELOPMENT_SETUP.md` with complete documentation
- Updated `CLAUDE.md` to reference development setup
- Added session startup hook reminder
- Tested dev server connection to iPhone
- Confirmed app loads and sensors work

## Current Package State

### Removed Packages
```json
// REMOVED from package.json:
"netlify-cli": "^23.4.3"  // Removed from devDependencies
"react-native-worklets": "^0.6.1"  // Removed from dependencies
```

### Key Dependencies (Unchanged)
```json
"expo": "~53.0.20",
"react-native": "0.79.6",
"react": "19.0.0",
"react-native-reanimated": "~3.17.4",
"@shopify/react-native-skia": "v2.0.0-next.4"
```

## Daily Development Workflow

**To start working on the app:**
1. Start dev server: `npx expo start`
2. Open custom FlatFinder app on iPhone
3. App auto-connects to dev server
4. Make changes, test with real sensors

**Requirements:**
- iPhone and computer on same WiFi
- Custom FlatFinder app installed on iPhone (already done)
- Dev server running

## When to Rebuild Custom Development Client

**Only rebuild if:**
- Adding new native dependencies
- Upgrading Expo SDK version
- App gets deleted from iPhone

**Build command:**
```bash
npx eas build --profile development --platform ios
```

## EAS Build Configuration

**File**: `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "node": "22.11.0",
      "env": {
        "NPM_CONFIG_LEGACY_PEER_DEPS": "true"
      }
    }
  }
}
```

## Apple Developer Info

- **Account**: ronb1964@me.com
- **Team**: Ron Brand (GCBZMB7YJG)
- **Bundle ID**: com.flatfinder.rvleveling
- **Distribution**: Ad Hoc (internal testing)
- **Provisioning**: Active, expires Oct 2026
- **Registered Device**: iPhone (UDID: 00008120-001A650634E8C01E)

## Testing Strategy

### ✅ PRIMARY: Custom Development Client
- Real sensors work (accelerometer, gyroscope)
- Accurate mobile layout
- Hot reload enabled
- All SDK 53 features available

### ⚠️ BACKUP: Netlify (Limited)
- NO sensors - leveling doesn't work
- Different layout than mobile
- Only for UI demos/screenshots
- URL: https://flatfinder-app.netlify.app (old URL, may be deprecated)

## Files Modified Today

- `package.json` - Removed netlify-cli and react-native-worklets
- `eas.json` - Configured development build settings
- `DEVELOPMENT_SETUP.md` - Created comprehensive setup guide
- `CLAUDE.md` - Updated session startup protocol
- `SESSION_STATE.md` - This file
- `.claude/hooks/session-start.sh` - Created session reminder hook

## Git Status

**Branch**: `ui-revamp-modern`

**Uncommitted changes:**
- package.json (removed problematic packages)
- eas.json (build configuration)
- New documentation files
- Various component updates from recent work

**Next steps for git:**
- Consider committing the working state after testing
- Document the custom dev client setup in commit message

## Known Issues

### RESOLVED ✅
- ~~Expo Go incompatibility with SDK 53~~ → Fixed with custom development client
- ~~Android rollup platform errors~~ → Fixed by removing netlify-cli
- ~~Duplicate WorkletsModule symbols~~ → Fixed by removing react-native-worklets

### CURRENT ISSUES TO ADDRESS
1. **Calibration screen layouts** - Need complete redesign for proper iOS display
   - Components don't fit properly on iOS screens
   - Rotation detection/prompts need verification
   - Will use iOS Simulator on MacBook Pro to fix these issues
2. **App name change** - Updating all "LevelMate" references to "FlatFinder" (name was taken)

## Important Reminders

1. **Always start dev server** before opening app on iPhone
2. **Custom app is built** - no need to rebuild unless adding native deps
3. **Sensors work now** - can properly test leveling features
4. **Same WiFi required** for iPhone to connect to dev server
5. **Netlify is backup only** - no sensors on web

## Next Session Checklist

When starting next session **on MacBook Pro**:
1. Install Cursor on MacBook Pro (https://cursor.sh)
2. Open project from Dropbox: `~/Dropbox/projects/FlatFinder`
3. Read `DEVELOPMENT_SETUP.md` and `CALIBRATION_LAYOUT_ISSUES.md`
4. Start Expo with iOS Simulator: `npx expo start --ios`
5. Navigate to calibration screens to see layout issues
6. Fix calibration screen layouts for proper iOS display

## Workflow Change
**Previous**: Developed on Linux (Nobara 42) → tested on Netlify web (limited)
**Current**: Developing on MacBook Pro → testing with iOS Simulator + iPhone with custom dev client
**Why**: iOS Simulator gives accurate mobile UI/UX, much better than web approximation

---

**Last Updated**: 2025-10-24
**Status**: ✅ Ready to move to MacBook Pro for calibration UI fixes
**Next Focus**: Calibration screen layouts + rotation handling on iOS
