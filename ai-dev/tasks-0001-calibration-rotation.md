# Tasks: 0001 — Calibration Rotation & Robustness

> Process these with the **ai-dev-tasks** “process task list” loop. Do ONE task at a time. Mark done only after tests pass.

## 1. Content Rotation Wrapper
- Create `RotatingViewport` that accepts `angleDeg` in {0,90,180,270} and counter-rotates its children so text stays upright.
- Center with flex, safe-area padding, `maxWidth: 480–520`.

**DoD**
- Works at 0/90/180 (and 270 if used). No absolute positioning required.

## 2. Wire Pose → Angle in Calibration Wizard
- Add a pose state (0→1→2 → optional 3).
- Wrap calibration content in `RotatingViewport` using map: 0→0°, 1→90°, 2→180° (3→270°).
- Keep OS orientation lock.

**DoD**
- Advancing the pose rotates **content** correctly; no clipping/overflow on small phones.

## 3. Sampling Window + Filter
- Implement ~1s sampling per reading.
- Apply median or simple low-pass and average.
- Keep this in one module (unit-testable).

**DoD**
- Deterministic results on repeated static readings; unit tests for filter function.

## 4. Motion Variance Guard
- Compute short-term variance; if above threshold, show “Hold steady” and retry only that reading.
- Allow two retries, then offer to restart calibration.

**DoD**
- Moving device during reading triggers retry; stable device proceeds.

## 5. Zero-Offset Capture & Persist
- After final pose, prompt to place phone flat on typical surface; capture persistent zero offsets (pitch/roll).
- Store offsets and expose helpers to apply at runtime.

**DoD**
- Offsets saved and applied on next app launch.

## 6. Validation Tile
- Show corrected pitch/roll with ✅ if within ±0.3°, else ⚠️ with “Re-measure” button.

**DoD**
- On a desk, shows near 0/0 and ✅.

## 7. Manual Test Checklist
- Create `/ai-dev/tests/0001-checklist.md` with 6–8 steps (device steady, rotate poses, variance test, validation).

**DoD**
- Checklist exists and is usable by a non-developer.
