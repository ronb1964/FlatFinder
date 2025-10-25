# Manual Test Checklist: Leveling UX (Task 0002)

## Prerequisites
- FlatFinder app deployed to Netlify: https://flatfinder-app.netlify.app
- Physical smartphone with motion sensors
- Vehicle profile configured with block inventory

## Test Environment Setup
**Vehicle Profile Settings for Testing:**
- Profile Name: "Test Trailer" or "Test RV"
- Block Inventory:
  - 4× 0.75" blocks
  - 4× 1.0" blocks
  - 4× 1.5" blocks
  - 2× 2.0" blocks

## Test Cases

### Test 1: Basic Block Display (Trailer)
**Setup:**
- Use trailer profile
- Place phone on a slight slope (1-3° pitch or roll)

**Expected Results:**
- ✅ Hitch card shows "Raise" or "Lower" with arrow and measurement
- ✅ Wheel cards show "+N blocks" in large, bold text
- ✅ Block counts are summed (not shown as "2×1.0" blocks")
- ✅ Text is easily readable in outdoor lighting
- ✅ Cards fit on screen without horizontal scrolling

### Test 2: Basic Block Display (RV/Motorhome)
**Setup:**
- Use RV/motorhome profile (4 wheels)
- Place phone on a slight slope (1-3° pitch or roll)

**Expected Results:**
- ✅ All 4 wheel cards display properly in 2×2 grid
- ✅ Block counts shown as "+N blocks" format
- ✅ Layout fits narrow devices (test on 320px width if possible)
- ✅ Bubble level displays in center of grid

### Test 3: Hitch Raise/Lower Indication
**Setup:**
- Use trailer profile
- Tilt phone forward (nose down) - hitch should need to RAISE
- Tilt phone backward (nose up) - hitch should need to LOWER

**Expected Results:**
- ✅ Forward tilt → Hitch shows "Raise X in" with ↑ arrow
- ✅ Backward tilt → Hitch shows "Lower X in" with ↓ arrow
- ✅ Measurement displayed in large, readable text
- ✅ Blue color (#3b82f6) used for hitch instructions
- ✅ Arrow direction matches action needed

**Sign Validation:**
- When nose points down → tongue is UP → hitch needs to RAISE (positive liftInches)
- When nose points up → tongue is DOWN → hitch needs to LOWER (negative liftInches)

### Test 4: Level State Display
**Setup:**
- Place phone on perfectly flat surface
- Wait for readings to stabilize

**Expected Results:**
- ✅ All cards show "✓ Good" in green
- ✅ Green borders around all position cards
- ✅ No block counts shown when level
- ✅ Hitch shows "✓ Good" (no raise/lower instruction)
- ✅ Bubble level indicator shows centered/level

### Test 5: "No Blocks Fit" Warning
**Setup:**
- Create profile with ONLY small blocks (4× 0.75" blocks)
- Place phone on steep slope (>5° pitch or roll)

**Expected Results:**
- ✅ Positions that exceed block capacity show "No blocks fit" in red
- ✅ Red badge is prominent and easily visible
- ✅ Warning card at top explains the issue
- ✅ Alternatives section shows helpful suggestions

### Test 6: Max Stack Exceeded Warning
**Setup:**
- Create profile with minimal blocks (2× 1.0" blocks total)
- Place phone on moderate slope (3-4°)

**Expected Results:**
- ✅ Warning card displays at top of screen
- ✅ Title: "Cannot Level with Current Setup"
- ✅ Specific warnings listed with bullet points
- ✅ "Try these alternatives" section visible:
  - Move to a different, flatter spot
  - Add larger block sizes to your profile
  - Use a combination of multiple stacks
  - Re-measure after adjusting position
- ✅ Red color theme (#ef4444) for all warning text

### Test 7: Back Button Navigation
**Setup:**
- Navigate to Block Instructions screen

**Expected Results:**
- ✅ Back button is prominently visible in top-left
- ✅ Button shows arrow icon + "Back" text
- ✅ Button has visible background (not transparent)
- ✅ Tapping back returns to main Level screen
- ✅ Button is easily tappable (size $4, good touch target)

### Test 8: Narrow Device Layout
**Setup:**
- Test on smallest available device (or narrow browser window)
- Minimum target: 320px width

**Expected Results:**
- ✅ Wheel cards (140px wide) fit side-by-side with spacing
- ✅ No horizontal scrolling required
- ✅ Text remains readable (no overflow or truncation)
- ✅ Hitch card fits properly in trailer layout
- ✅ Warning card text wraps properly

### Test 9: Mixed Block Sizes
**Setup:**
- Use profile with multiple block sizes
- Create scenario needing: 1× 2.0" + 1× 1.0" + 1× 0.75" = 3.75" stack

**Expected Results:**
- ✅ Card shows "+3 blocks" (sum of all blocks)
- ✅ Detailed instructions section lists individual block sizes
- ✅ Total stack height shown in blue card at bottom
- ✅ All listed blocks match configured inventory

### Test 10: Real-World Scenario (Trailer)
**Setup:**
- Use actual trailer profile with realistic dimensions
- Place phone on actual uneven surface
- Configure realistic block set (standard Camco/BAL blocks)

**Expected Results:**
- ✅ Hitch direction matches physical reality
- ✅ Wheel block counts seem reasonable for visible slope
- ✅ Following instructions actually levels the trailer
- ✅ Instructions remain visible while outside RV
- ✅ UI remains responsive during sensor updates

## Edge Cases to Verify

### Extreme Slopes (>8°)
- ✅ Warning displays for unsafe slopes
- ✅ App doesn't crash or freeze
- ✅ Alternatives section provides useful guidance

### Zero Blocks Configured
- ✅ All cards show "Setup blocks in profile" in blue
- ✅ No "No blocks fit" errors (different from insufficient blocks)
- ✅ User can still see required lift heights

### Single Block Type
- ✅ App calculates stacks using only available size
- ✅ Warnings shown if single size insufficient
- ✅ Block count accuracy maintained

## Performance Checks

- ✅ Sensor updates smooth (no lag or jitter)
- ✅ Card rendering performance acceptable
- ✅ Warning calculations don't delay UI
- ✅ Back navigation is instant

## Visual Consistency Checks

- ✅ Follows COLOR_PALETTE.md standards
- ✅ Glassmorphism effects consistent across cards
- ✅ Text sizes follow hierarchy (labels=$3, counts=$5, "Good"=$4)
- ✅ Semantic colors used correctly:
  - Green (#22c55e) for success/level
  - Red (#ef4444) for warnings/errors
  - Blue (#3b82f6) for info/hitch instructions
- ✅ Background gradient animates smoothly

## Sign-Off
- [ ] All test cases passing
- [ ] Edge cases handled gracefully
- [ ] Performance acceptable
- [ ] Visual design consistent
- [ ] Ready for production use

**Tested by:** _______________
**Date:** _______________
**Device:** _______________
**Notes:** _______________
