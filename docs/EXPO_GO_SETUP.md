# Expo Go Setup - Testing on Physical Device

## Overview

Expo Go lets you test the app on your physical phone with real device sensors (accelerometer, gyroscope, compass). This is essential for testing the bubble level and calibration features.

## Prerequisites

1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Same network**: Your phone and development computer must be on the same WiFi network.

## Quick Start

### 1. Start the Dev Server

```bash
cd /home/ron/Projects/FlatFinder
npx expo start --clear
```

The terminal will display:

- A QR code
- A URL like `exp://192.168.x.x:8081`

### 2. Connect Your Phone

**Android:**

- Open Expo Go app
- Tap "Scan QR code"
- Scan the QR code in your terminal

**iOS:**

- Open your Camera app
- Point at the QR code
- Tap the notification to open in Expo Go

### 3. App Loads on Phone

The app should load and you can:

- Test the bubble level with real sensors
- Walk around with the phone to see pitch/roll change
- Test calibration on a known level surface

## Troubleshooting

### "Network request failed" or can't connect

1. **Check same network**: Phone and computer on same WiFi
2. **Firewall**: May need to allow port 8081
   ```bash
   sudo firewall-cmd --add-port=8081/tcp --permanent
   sudo firewall-cmd --reload
   ```
3. **Try tunnel mode**: If LAN doesn't work
   ```bash
   npx expo start --tunnel
   ```
   (Requires `@expo/ngrok` - will prompt to install)

### App crashes or white screen

1. Shake phone to open Expo dev menu
2. Tap "Reload" to refresh
3. Check terminal for error messages

### Sensors not working

- Device sensors only work on physical devices, not simulators
- Make sure app has permission to access motion sensors
- Some older devices may have limited sensor accuracy

## Development Workflow

### Hot Reload

- Changes to code automatically reload on phone
- No need to restart or rescan QR code

### Debug Menu

- **Shake phone** to open developer menu
- Options: Reload, Debug Remote JS, Performance Monitor

### Console Logs

- Logs appear in your terminal (where you ran `npx expo start`)
- Use `console.log()` in code to debug

## Network Modes

| Mode          | Command                      | Use When                           |
| ------------- | ---------------------------- | ---------------------------------- |
| LAN (default) | `npx expo start`             | Phone and computer on same network |
| Tunnel        | `npx expo start --tunnel`    | Different networks or LAN issues   |
| Localhost     | `npx expo start --localhost` | Emulator/simulator only            |

## Tips

1. **Keep terminal visible** - Shows helpful error messages
2. **Battery saver mode** - May throttle sensors, disable for testing
3. **Screen lock** - Set to "never" while testing to avoid interruptions
4. **Airplane mode** - Won't work, needs network connection to dev server

## Sensor Testing Checklist

Before testing calibration or leveling features:

- [ ] Phone is on same WiFi as dev computer
- [ ] App loads and shows bubble level
- [ ] Tilting phone moves the bubble (sensors working)
- [ ] Compass heading changes when rotating phone
- [ ] Debug controls are hidden (not using mock values)
