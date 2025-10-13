# PRD: Calibration Rotation & Robustness (FlatFinder)

## Problem
During 3×90° calibration, users rotate the phone while reading on-screen instructions. With OS orientation locked, text/buttons may appear rotated, clipped, or misplaced. We need readable UI at each pose and reliable sampling with a persistent zero-offset (“camera bump”) correction so the phone resting on a countertop yields accurate level.

## Users & Constraints
- Camper/RV/trailer owners leveling **offline** (no internet).
- Large type, high contrast, minimal copy, big tap targets.
- Keep app size small; avoid heavy libraries.

## Goals (V1)
1. **Readable calibration UI**: content appears upright for poses 0°, 90°, 180° (optionally 270°).
2. **Stable readings**: short sampling window with simple filtering; retry when motion is detected.
3. **Zero-offset storage**: capture persistent bias after poses (camera bump / typical surface).
4. **Quick validation**: post-calibration check shows near 0.0°/0.0° within tolerance (e.g., ±0.3°).

## Non-Goals (V1)
- Marketing/release work.
- Cloud sync or online voice models.
- Full tablet optimization beyond basic max-width.

## Functional Requirements
- OS orientation remains locked (e.g., portrait).
- A **content rotation** wrapper counter-rotates the UI for each pose so text stays upright.
- Pose stepper: Reading 1/3 → Rotate CW 90° → Reading 2/3 → Rotate CW 90° → Reading 3/3 (→ optional 4/4).
- Sampling: collect ~0.8–1.5s accelerometer/attitude, filter (median/low-pass), average.
- Motion guard: if variance > threshold, show “Hold steady” and retry *that* reading only.
- Zero-offset capture after final pose; persist and apply at runtime.
- Validation tile: shows corrected pitch/roll with ✅ if within tolerance.

## UX Requirements
- Large text (≥18sp), big primary button, minimal copy.
- Safe-area padding; avoid absolute positioning; `maxWidth: 480–520`.
- Progress indicator “1/3, 2/3, 3/3”; rotation hint (“Rotate 90° clockwise”).

## Technical Notes
- Axis/sign normalization in one adapter.
- Persist calibration matrix/offset securely.
- Keep assets small; no embedded voice packs.

## Acceptance Criteria
- Three readings complete without overflow/clipping; text upright for each pose.
- Repeated calibrations on a stable surface yield Δ ≤ 0.3–0.4° for pitch/roll.
- Validation tile displays near zero after calibration on a flat surface.
