# Manual Test Checklist: Calibration Rotation & Robustness

**Feature:** Pose-based rotation system with sampling, motion detection, and validation

**Tester Requirements:**
- Physical mobile device (iPhone or Android phone)
- Access to app via Netlify URL: https://levelmate-app-1755829802.netlify.app
- Flat surface (table, countertop, or RV floor)
- 5-10 minutes testing time

---

## Test 1: Device Steady - Basic Calibration Flow

**Goal:** Verify the calibration completes successfully when device is held steady.

**Steps:**
1. Open the app on your phone (use Netlify URL above)
2. Navigate to Settings tab
3. Tap "Start Calibration Wizard"
4. Read Step 1 instructions, tap "Next"
5. **Place phone FLAT on table, screen UP, top edge pointing forward**
6. **Keep phone completely still** - don't touch it
7. Tap "Take Reading 1" button
8. Wait for "⏱️ Collecting..." to finish (~1 second)
9. Phone should advance to Step 2

**Expected Results:**
- ✅ No motion warnings appear
- ✅ Console shows: "Stable: true"
- ✅ Progress bar advances to 50%
- ✅ Reading accepted immediately

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 2: Rotate Poses - UI Stays Readable

**Goal:** Verify UI rotates correctly so text stays upright during all 4 poses.

**Steps:**
1. Continue from Test 1 (after Reading 1 completes)
2. **Physically rotate phone 90° CLOCKWISE** (landscape, top edge now pointing right)
3. Observe: Does text rotate to stay upright?
4. Keep phone flat and still on table
5. Tap "Take Reading 2"
6. Wait for completion
7. **Rotate phone another 90° CLOCKWISE** (upside-down, top edge pointing backward)
8. Observe: Does text rotate to stay upright?
9. Tap "Take Final Reading"
10. Wait for completion

**Expected Results:**
- ✅ Text automatically counter-rotates at each pose (0°, 90°, 180°)
- ✅ Instructions always readable
- ✅ Cancel button always visible
- ✅ No content clipping or scrolling in landscape mode (Step 3)
- ✅ All 3 readings complete successfully

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 3: Variance Test - Motion Detection

**Goal:** Verify motion detection rejects unstable readings.

**Steps:**
1. Restart calibration wizard (tap Cancel, then Start again)
2. Complete Step 1 normally with phone flat and still
3. At Step 2 (Reading 1), **INTENTIONALLY SHAKE the phone** while pressing "Take Reading 1"
4. Keep shaking during the 1-second collection period

**Expected Results:**
- ⚠️ Red warning card appears: "Device Movement Detected"
- ⚠️ Message shows: "Please hold your device perfectly still. Retry 1/2"
- ⚠️ Console shows high variance (>0.05°²)
- ✅ "Retry Reading" button appears
- ✅ Reading is NOT accepted

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 4: Retry Logic - 2 Attempts Maximum

**Goal:** Verify retry system works correctly.

**Steps:**
1. Continue from Test 3 (motion warning showing)
2. Tap "Retry Reading" button
3. **Again, SHAKE the phone** during collection
4. Observe: warning should now show "Retry 2/2"
5. Tap "Retry Reading" again
6. **SHAKE phone a third time**

**Expected Results:**
- ✅ First retry increments counter: "Retry 1/2"
- ✅ Second retry increments counter: "Retry 2/2"
- ✅ Third failed attempt shows: "Max retries reached. Device too unstable"
- ✅ "Restart Calibration" button appears (replaces "Retry Reading")
- ✅ Tapping "Restart Calibration" resets to Step 1

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 5: Successful Completion - All Features

**Goal:** Complete full calibration flow and verify all completion features.

**Steps:**
1. Restart calibration wizard
2. **Hold phone perfectly still for ALL 3 readings**
3. Place phone flat on table
4. Complete all 3 poses/readings without moving phone
5. Observe completion screen

**Expected Results:**
- ✅ "Calibration Complete!" with green checkmark appears
- ✅ Quality indicator shows (e.g., "Quality: excellent (100%)")
- ✅ **Validation tile** appears with:
  - ✅ Green checkmark icon
  - ✅ "Validation Passed" text
  - ✅ Current readings displayed: "Pitch: X.XX°, Roll: X.XX°"
  - ✅ Both values within ±0.3° (should show green if on level desk)
- ✅ Green "Continue" button at bottom
- ✅ Console shows: "=== CALIBRATION DEBUG ===" with offset values
- ✅ No errors in console

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 6: Validation Warning - Unlevel Surface

**Goal:** Verify validation tile shows warning when surface isn't level.

**Steps:**
1. Complete calibration on a **tilted book or angled surface** (intentionally unlevel)
2. Observe validation tile on completion screen

**Expected Results:**
- ⚠️ Red alert icon appears
- ⚠️ "Validation Warning" text
- ⚠️ Readings show values outside ±0.3° (red text)
- ⚠️ Message: "Readings are outside ±0.3° tolerance..."
- ✅ Red "Re-measure" button appears
- ✅ Tapping "Re-measure" restarts calibration

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 7: Landscape Mode - No Scrolling

**Goal:** Verify Step 3 (landscape) doesn't require scrolling.

**Steps:**
1. Start new calibration
2. Complete Reading 1
3. Rotate phone to landscape (90° clockwise)
4. Observe Step 3 of 4 screen
5. Check if all content is visible WITHOUT scrolling

**Expected Results:**
- ✅ Two-column layout: Instructions (left) + Animation (right)
- ✅ Cancel button visible at top
- ✅ Progress bar visible
- ✅ Both instruction boxes fully visible
- ✅ "Take Reading 2" button visible at bottom
- ✅ NO scrolling required
- ✅ No content cut off or hidden

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Test 8: Persistence - Saved Across Sessions

**Goal:** Verify calibration persists after closing and reopening app.

**Steps:**
1. Complete full calibration successfully
2. Tap "Continue" to save and close wizard
3. Note the calibration offset values from console
4. **Close the app completely** (swipe away from app switcher)
5. **Reopen the app** from home screen
6. Check console logs on startup

**Expected Results:**
- ✅ Console shows: "Zero offset loaded: {pitchOffset: X, rollOffset: X}"
- ✅ Offset values match what was saved in Step 3
- ✅ No errors about missing calibration
- ✅ App loads normally with calibration applied

**Actual Result:** ____________________

**Status:** ☐ Pass  ☐ Fail

---

## Summary

**Tests Passed:** ___ / 8

**Tests Failed:** ___ / 8

**Overall Status:** ☐ All Pass  ☐ Some Failures  ☐ Blocked

---

## Notes / Issues Found

_Record any bugs, unexpected behavior, or suggestions here:_

1. _____________________________________________

2. _____________________________________________

3. _____________________________________________

---

## Tester Information

**Name:** ____________________

**Date:** ____________________

**Device:** ____________________ (e.g., iPhone 14, Pixel 7)

**OS Version:** ____________________ (e.g., iOS 17.2, Android 14)

**App Version:** 0.2.0

**Tested Via:** ☐ Netlify Web  ☐ Native App  ☐ Expo Go
