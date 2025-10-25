# FlatFinder Development Setup & Workflow

## Current Development Environment Status

### ✅ WORKING SETUP (as of 2025-10-23)

**The app is currently on Expo SDK 53 (bleeding edge) with a custom development client.**

### Why We Need a Custom Development Client

- **Problem**: Expo Go from the App Store only supports stable SDK versions (currently SDK 52)
- **Solution**: We built a custom development client that includes SDK 53 support
- **Result**: Full access to device sensors and SDK 53 features on iPhone

---

## Development Workflow

### Starting Development (Daily Workflow)

**Every time you want to work on the app:**

1. **Start the dev server on your computer:**
   ```bash
   cd /home/ron/Dropbox/projects/FlatFinder
   npx expo start
   ```

2. **Open the custom FlatFinder app on your iPhone** (the one with the custom build)

3. **The app will automatically connect** to the dev server (or scan the QR code if needed)

4. **Make changes and test** - the app hot-reloads when you save files

**Requirements:**
- iPhone and computer must be on the same WiFi network
- Dev server must be running on your computer
- Custom FlatFinder app must be installed on iPhone

---

## Package Configuration

### Key Package Removals (Fixed Build Issues)

1. **Removed `netlify-cli`** from `devDependencies`
   - **Why**: Was pulling in Android-specific rollup binaries that broke iOS builds
   - **Alternative**: Use `npx netlify deploy` when needed for web deployment

2. **Removed `react-native-worklets`** from `dependencies`
   - **Why**: Caused duplicate symbol conflicts with `react-native-reanimated`
   - **Reason**: `react-native-reanimated` v3.17.4 already includes worklets support

### Current Package Versions

```json
{
  "expo": "~53.0.20",
  "react-native": "0.79.6",
  "react": "19.0.0",
  "react-native-reanimated": "~3.17.4",
  "react-native-screens": "~4.11.1",
  "@shopify/react-native-skia": "v2.0.0-next.4"
}
```

---

## Custom Development Client Setup

### When You Need to Rebuild the Custom App

**You only need to rebuild if:**
- You add new native dependencies
- You upgrade Expo SDK version
- The app gets deleted from your iPhone

### How to Rebuild the Custom Development Client

1. **Make sure you're logged into Expo:**
   ```bash
   npx expo whoami
   # Should show: ronb1964
   ```

2. **Start the build:**
   ```bash
   npx eas build --profile development --platform ios
   ```

3. **Wait 15-20 minutes** for the build to complete on Expo's servers

4. **Install on iPhone:**
   - You'll get a download link or QR code
   - Open on your iPhone and install
   - May need to trust the developer certificate in Settings

### Apple Developer Account Info

- **Account**: ronb1964@me.com
- **Team**: Ron Brand (GCBZMB7YJG)
- **Bundle ID**: com.flatfinder.rvleveling
- **Provisioning**: Ad Hoc distribution (already configured)

---

## EAS Build Configuration

### `eas.json` Settings

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

**Key settings:**
- `developmentClient: true` - Builds custom development client (not production)
- `distribution: internal` - Ad Hoc distribution for testing
- `NPM_CONFIG_LEGACY_PEER_DEPS: true` - Handles peer dependency conflicts

---

## Testing Strategy

### ✅ PRIMARY: Custom Development Client on iPhone

**This is your main testing method now:**
- ✅ Real device sensors work (accelerometer, gyroscope)
- ✅ Accurate mobile layout and safe areas
- ✅ Hot reload support
- ✅ True representation of production app
- ✅ All SDK 53 features available

**Workflow:**
1. Start dev server: `npx expo start`
2. Open custom FlatFinder app on iPhone
3. Test features with real sensors
4. Make changes, app reloads automatically

### ⚠️ BACKUP: Netlify Web Deployment (Limited Use)

**Only use for:**
- Sharing UI demos
- Basic navigation testing
- Screenshots for documentation

**Limitations:**
- ⚠️ NO motion sensors - leveling features don't work
- ⚠️ Different layout than mobile
- ⚠️ No safe area considerations

**Deploy commands (if needed):**
```bash
npx expo export
npx netlify deploy --dir=dist --prod
```

**URL**: https://flatfinder-app.netlify.app

---

## Troubleshooting

### App Won't Connect to Dev Server

**Check:**
1. Is the dev server running? (`npx expo start`)
2. Are iPhone and computer on the same WiFi?
3. Try scanning the QR code again
4. Shake iPhone to open dev menu, look for manual server entry

### Build Fails with Duplicate Symbols

**Solution:**
- Make sure `react-native-worklets` is NOT in package.json
- Make sure `netlify-cli` is NOT in package.json
- Run `npm install` to update package-lock.json

### Build Fails with Platform Errors

**Solution:**
- Check that `eas.json` doesn't have invalid `npm` config
- Ensure `NPM_CONFIG_LEGACY_PEER_DEPS` is set in `env`

### Need to Start Fresh

**Reset everything:**
```bash
# Remove dependencies
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Clear Expo cache
npx expo start --clear
```

---

## Important Files to Check

When starting a session, check these files to understand current state:

1. **DEVELOPMENT_SETUP.md** (this file) - Development workflow
2. **CLAUDE.md** - Project overview and instructions
3. **SESSION_STATE.md** - Previous session notes
4. **package.json** - Current dependencies
5. **eas.json** - Build configuration

---

## Git Status

### Current Branch
`ui-revamp-modern`

### Modified Files (Not Committed)
- `.claude/settings.local.json`
- `package.json` (removed netlify-cli and react-native-worklets)
- `eas.json` (configured for development builds)
- Various component files with recent updates

### When to Commit
- After testing confirms everything works
- Before making major changes
- When reaching a stable milestone

---

## Quick Reference Commands

```bash
# Start development
npx expo start

# Build custom development client
npx eas build --profile development --platform ios

# Check Expo login
npx expo whoami

# Clear cache and restart
npx expo start --clear

# Deploy to Netlify (optional)
npx expo export
npx netlify deploy --dir=dist --prod

# Install dependencies
npm install

# Type check
npm run typecheck
```

---

## Key Takeaways

1. **Custom development client is required** for SDK 53 on iPhone
2. **Only rebuild when necessary** (new native deps, SDK upgrade, etc.)
3. **Dev server must run** every time you work on the app
4. **Real sensors work now** - test leveling features properly!
5. **Netlify is backup only** - no sensors on web
6. **Keep iPhone and computer on same WiFi** for connection

---

**Last Updated**: 2025-10-23
**Status**: ✅ Working - Custom development client successfully built and tested
