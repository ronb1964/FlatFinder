# Calibration & Leveling Routine Plan

## Goals & Overall Sequence

- **Goal 1**: Make calibration mathematically correct and easy to understand for a novice, with two clear modes:
- **Quick Calibration** on a known level reference to remove camera bump/sensor bias.
- **In-RV Multi-Step Calibration** when the only reference is the camper itself, separating device bias from vehicle slope.
- **Goal 2**: Use the calibrated pitch/roll to compute a **practical leveling plan**: which wheel(s) need how much lift, and how to build that from the user’s block inventory (or just heights if they have no blocks).
- **Sequence**: (1) finalize calibration design & math → (2) integrate into main level screen → (3) refine leveling math/UI using calibrated readings.

Key files involved:

- Calibration UI & flow: [app/calibration.tsx](/home/ron/Projects/FlatFinder/app/calibration.tsx), [src/components/CalibrationWizard.tsx](/home/ron/Projects/FlatFinder/src/components/CalibrationWizard.tsx)
- Calibration math & types: [src/lib/calibration.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.ts), [src/lib/levelingMath.ts](/home/ron/Projects/FlatFinder/src/lib/levelingMath.ts)
- Leveling math & blocks: [src/lib/rvLevelingMath.ts](/home/ron/Projects/FlatFinder/src/lib/rvLevelingMath.ts)
- Level usage & UI: [app/(tabs)/index.tsx](/home/ron/Projects/FlatFinder/app/(tabs)/index.tsx), [src/components/LevelingAssistant.tsx](/home/ron/Projects/FlatFinder/src/components/LevelingAssistant.tsx)
- Sensors & state: [src/hooks/useDeviceAttitude.ts](/home/ron/Projects/FlatFinder/src/hooks/useDeviceAttitude.ts), [src/sensors/attitudeAdapter.ts](/home/ron/Projects/FlatFinder/src/sensors/attitudeAdapter.ts), [src/lib/coordinateSystem.ts](/home/ron/Projects/FlatFinder/src/lib/coordinateSystem.ts), [src/state/appStore.ts](/home/ron/Projects/FlatFinder/src/state/appStore.ts)

## Phase 1: Calibration Design & Implementation

### 1.1 Clarify the calibration data model

- **Separate concerns logically**:
- **Device calibration (camera bump / sensor bias)**: the offset between what the phone reads when placed on a truly level surface vs 0°/0°.
- **Vehicle slope at campsite**: the actual pitch/roll of the RV relative to level, used to compute block heights.
- **Data strategy**:
- Keep using the existing `Calibration` type in [src/lib/levelingMath.ts](/home/ron/Projects/FlatFinder/src/lib/levelingMath.ts) for offsets that are subtracted from raw readings.
- Optionally introduce a clearer distinction in state, e.g. `deviceCalibration` vs `siteBaseline`, either by:
- Extending `VehicleProfile` in [src/state/appStore.ts](/home/ron/Projects/FlatFinder/src/state/appStore.ts), or
- Storing a composite calibration object and documenting how each part is used.

### 1.2 Quick Calibration (known-level reference) behavior

- **Intended behavior** (you described):
- User places phone on a trusted level surface (bench, countertop with a real bubble level), even though it rests on the camera bump.
- Tap **Quick Calibrate**; the app records the current `pitchDeg`/`rollDeg` as the device’s bias.
- From then on, that bias is always subtracted so this orientation reads `0°/0°`.
- **Implementation details**:
- Confirm that `calculateCalibrationOffsets` in [src/lib/calibration.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.ts) is used **only** for this known-level quick calibration case.
- Ensure `applyCalibration` (wrapping `applyCalibratedValues`) is applied consistently wherever pitch/roll are displayed or used (main level screen, Leveling Assistant).
- Update UI copy in [app/(tabs)/index.tsx](/home/ron/Projects/FlatFinder/app/(tabs)/index.tsx) to explicitly say:
- “Use Quick Calibrate only on a truly level reference surface to teach the app your phone’s camera bump.”
- Optionally add a one-time helper dialog or tooltip the first time the user taps Quick Calibrate.

### 1.3 In-RV Multi-Step Calibration (no known level reference)

- **Objective**:
- When the rig is on an unknown slope at a campsite, user places the phone on a flat interior surface and follows a 3-or-4 step routine spinning the phone.
- From multiple orientations, solve for:
- The **device bias** that rotates with the phone (camera bump / how it sits on the surface), and
- The **rig’s fixed tilt relative to level** (same regardless of how the phone is rotated).
- **Math approach (high level)**:
- Model each reading as: `measured_tilt = vehicle_tilt + rotated_device_bias`.
- Use three orientations (e.g. 0°, 90°, 180° yaw around vertical) to build a small linear system that solves for:
- `vehicle_tilt` (pitch/roll vector in rig coordinates), and
- `device_bias` (pitch/roll vector in phone coordinates when "visually flat").
- Implement a dedicated solver function in [src/lib/calibration.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.ts), e.g. `solveDeviceAndVehicleTilt(readingsWithOrientation)`.
- **Wizard changes in [src/components/CalibrationWizard.tsx](/home/ron/Projects/FlatFinder/src/components/CalibrationWizard.tsx)**:
- Extend `CalibrationReading` concept to include the **device yaw/orientation step** (0°, 90°, 180°) so math knows which rotation was used.
- Replace the current simple `calculateAverageCalibration` call with the new solver.
- Decide what to store after solving:
- Update persistent **device calibration offsets** (if quick calibration hasn’t been done, or refine them).
- Use **vehicle_tilt** as the true rig tilt for the current spot; do **not** zero it out—pass it to the leveling math.
- Fix UX text:
- Make the steps clearly "1/4, 2/4, 3/4, 4/4" (or streamline to 3 steps) and explain in plain English:
- Step 1: “Place phone flat with TOP pointing to the front of the RV.”
- Step 2/3/4: “Rotate the phone as shown and capture readings so we can separate phone bump from rig slope.”
- **Quality feedback**:
- Use `assessCalibrationQuality` from [src/lib/calibration.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.ts) to grade the readings.
- If quality is "poor" or confidence too low, show a friendly message and offer a **Retry** button instead of silently accepting a bad calibration.

### 1.4 Integration with main level screen and state

- **Main Level Screen ([app/(tabs)/index.tsx](/home/ron/Projects/FlatFinder/app/(tabs)/index.tsx))**:
- Ensure it always uses **device-calibrated** pitch/roll for display and for safety warnings.
- Keep Quick Calibrate as "known level" device calibration only.
- Consider adding a separate (optional) "Set This Campsite as Level" action if you later want a per-spot baseline, but keep that separate from true device calibration.
- **State storage ([src/state/appStore.ts](/home/ron/Projects/FlatFinder/src/state/appStore.ts))**:
- Decide whether device calibration should be per-profile (simpler, already in place) or global across profiles.
- Migrate any existing profiles’ calibration values if we change schema, similar to the existing migration logic in `loadProfiles`.

### 1.5 Testing and validation for calibration

- **Unit tests** in [src/lib/calibration.test.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.test.ts):
- Add synthetic cases where we choose a known `vehicle_tilt` and `device_bias`, simulate readings at 0°/90°/180° orientations, and verify the solver recovers both within a small error (e.g. 0.05°).
- Test edge cases: nearly level rig, high slope, slightly noisy readings, missing one orientation.
- **Manual tests**:
- Known-level bench with Quick Calibrate: confirm phone reads ~0°/0° in various positions matching expectations.
- Simple sloped board (e.g. known 2° angle) to sanity-check wizard outputs for vehicle tilt.

## Phase 2: Leveling Solution from Calibrated Tilt

### 2.1 Confirm and refine leveling geometry

- **Review existing math** in [src/lib/rvLevelingMath.ts](/home/ron/Projects/FlatFinder/src/lib/rvLevelingMath.ts):
- `RVLevelingCalculator.calculateLiftRequirements` already computes required lift per wheel (front_left, front_right, rear_left, rear_right, and hitch for trailers) using `tan(angle) * distance`.
- Confirm the sign conventions align with [src/lib/coordinateSystem.ts](/home/ron/Projects/FlatFinder/src/lib/coordinateSystem.ts) (+pitch nose up, +roll right side up).
- Ensure the normalization step that shifts lifts so that at least **one wheel has zero lift** (we can only add blocks) is preserved.

### 2.2 Use calibrated readings to drive leveling

- **Input to leveling**:
- From Phase 1, we’ll have accurate **vehicle tilt relative to true level** in degrees (pitchDegrees, rollDegrees).
- Feed that directly into `RVLevelingCalculator.createLevelingPlan` as `LevelingMeasurement`, along with:
- Geometry from the active profile: `wheelbaseInches`, `trackWidthInches`, `hitchOffsetInches`.
- Block inventory from the profile.
- **Block inventory behavior**:
- If `blockInventory` is non-empty, use `calculateOptimalBlocks` per wheel/jack point.
- If `blockInventory` is empty (user has no blocks), skip stacking and just show the **required lift height** at each wheel/jack.

### 2.3 UI for leveling instructions

- **Leveling Assistant ([src/components/LevelingAssistant.tsx](/home/ron/Projects/FlatFinder/src/components/LevelingAssistant.tsx))**:
- For each wheel/jack with `liftInches > 0.001`:
- If blocks are available and a stack is achievable within tolerance:
- Display something like: “Front Left: 2 × 2" + 1 × 1" (total 5")”.
- If blocks are insufficient or not available:
- Show: “Front Left: raise wheel by 5" (no block plan available).”
- Make clear that one wheel will have **0 blocks** (reference wheel), and other lifts are relative to that.
- **Trailer specifics**:
- For trailers, ensure instructions include **side-to-side wheel lifts** and **tongue jack/hitch adjustment**:
- Side-to-side blocks under left/right wheels.
- Guidance like “Then adjust tongue jack by X" up/down to finish fore-aft leveling.”

### 2.4 Edge cases and safety

- **Safe slope limits**:
- Keep or refine the `maxSafeSlope` threshold in `createLevelingPlan` (currently 6°) and warnings for dangerous slopes.
- Mirror these warnings in the UI (e.g., “This site may be too steep to safely level”).
- **Insufficient blocks**:
- If `isLevelable` is false, clearly state that with summary text and which wheel/jack is the limiting factor.

### 2.5 Testing for leveling

- **Unit tests** (e.g., in a new `rvLevelingMath.test.ts` or existing tests):
- Simple symmetric cases (only roll, only pitch) where expected lifts are easy to reason about.
- Trailer scenarios with known geometry where you can predict which side/wheel should get blocks and approximate height.
- **Manual flows**:
- Walk through a full scenario: create profile with blocks → calibrate → move to a “fake slope” setup → verify the plan matches what you’d expect on a real RV.

## High-Level Implementation Todos

- **calibration-math**: Design and implement the multi-orientation solver to separate device bias from vehicle tilt in [src/lib/calibration.ts](/home/ron/Projects/FlatFinder/src/lib/calibration.ts), and wire it into `CalibrationWizard`.
- **calibration-ux**: Refine the calibration screens ([app/calibration.tsx](/home/ron/Projects/FlatFinder/app/calibration.tsx), [src/components/CalibrationWizard.tsx](/home/ron/Projects/FlatFinder/src/components/CalibrationWizard.tsx), Quick Calibrate button text) to clearly explain Quick vs in-RV calibration and surface calibration quality.
- **leveling-integration**: Ensure Level screen and Leveling Assistant consistently use calibrated vehicle tilt, and that `RVLevelingCalculator` outputs are shown as clear, per-wheel or per-hitch block instructions (or raw heights when no blocks exist).
- **tests-and-validation**: Expand unit tests for calibration and leveling math, and do a couple of manual “bench” scenarios (flat surface + simple slopes) to validate behavior end-to-end.
