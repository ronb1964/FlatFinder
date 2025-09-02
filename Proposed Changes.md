### Here’s a concise implementation task list (no changes will be made until you approve)

- Navigation: consolidate to expo-router
  - Remove `App.tsx`, move `HomeScreen`, `TrailerModeScreen`, `CalibrationScreen` into `app/` routes, keep `app/(tabs)/_layout.tsx`.
  - Acceptance: App runs only via expo-router; no duplicate screens or logic.

- Repo hygiene: ignore builds/artifacts
  - Remove `dist/` from repo; add to `.gitignore`. Unify `assets/` vs `src/assets/` to one location.
  - Acceptance: Clean git status; assets referenced from a single folder.

- Sensors: create platform-agnostic adapter
  - Implement `sensors/attitudeAdapter` using `expo-sensors` on native and `DeviceOrientationEvent` on web; expose `pitchDeg`, `rollDeg`, `isAvailable`, `isReliable`, `permissionStatus`, `errorMessage`.
  - Update `useDeviceAttitude` to use adapter; throttle to frame rate; configurable smoothing.
  - Acceptance: Works on web + native; reliability/permission flags are accurate.

- Coordinate system normalization
  - Add `normalizeAttitude()` to apply one consistent sign/axis convention.
  - Remove ad‑hoc inversions in `src/components/LevelingAssistant.tsx`, `src/screens/TrailerModeScreen.tsx`, `app/(tabs)/index.tsx`.
  - Acceptance: All UI and math use the same convention; no scattered negations.

- Calibration model standardization
  - Choose one shape (e.g., `{ pitchOffsetDegrees, rollOffsetDegrees }`); update `applyCalibration` and usages to a single public type.
  - Store calibration metadata (timestamp, method) in profile; add “Set current as level” quick action.
  - Acceptance: One calibration type across code; wizard and quick set both persist correctly.

- Math consolidation
  - Make `src/lib/rvLevelingMath.ts` the single source; merge/remove `src/lib/levelingMath.ts` and `src/features/level/math/levelingMath.ts`; update imports.
  - Document angle conventions in the module header.
  - Acceptance: Only one math module; all imports updated; behavior unchanged or improved.

- State/persistence hardening
  - Switch IDs to `uuid`; change `VehicleProfile.createdAt/updatedAt` to ISO strings or revive on load (and reflect in types).
  - Add `zod` schemas for `profiles`/`settings` + versioned migrations; debounce/batch `AsyncStorage` writes.
  - Acceptance: Schema-validated loads; safe migrations; types match runtime.

- Profiles/Settings UX completion
  - Ensure editing of `wheelbaseInches`, `trackWidthInches`, `hitchOffsetInches`, units, haptics/audio.
  - Acceptance: Changes persist and reflect immediately in leveling calculations.

- Sensor permission & status UI
  - Add UI for requesting permissions, showing availability/reliability, and guidance when blocked.
  - Acceptance: Clear, actionable states on web + native.

- Logging
  - Introduce lightweight logger with levels; gate debug logs with `__DEV__` and/or env.
  - Replace noisy `console.log` in hot paths.
  - Acceptance: Quiet production logs; optional verbose debug in development.

- TypeScript strictness
  - Enable `strict` in `tsconfig.json`; fix resulting type errors; tighten public types.
  - Acceptance: `tsc --noEmit` passes with strict mode.

- Tests: math, calibration, sensor normalization
  - Expand unit tests for edge cases (small/large angles, outliers, sign invariants); add integration tests from raw sensor -> normalized -> calibrated -> plan.
  - Acceptance: Jest passes locally; coverage meaningfully improved on math/calibration.

- Haptics/audio gating
  - Guard by platform and settings; no-op on web.
  - Acceptance: No runtime warnings on web; expected feedback on supported devices.

- CI
  - Add GitHub Actions to run `lint`, `typecheck`, and `test` on PRs.
  - Acceptance: CI green on main and PRs; fails on type or test regressions.

- Final verification
  - Build web (and native if configured); manual smoke test flows: permissions → level view → calibration → leveling plan.
  - Acceptance: App functions end-to-end without runtime errors.

Testing strategy (concise):
- Unit: math + calibration + normalization.
- Integration: sensor -> normalization -> calibration -> plan pipeline.
- UI smoke tests: permission prompts, profile edits, level screen responsiveness.
- Type + lint gates: strict `tsc` and ESLint must pass.
- CI enforces all of the above.

Confirm and I’ll proceed step‑by‑step, running tests and verifying after each major change. I will not commit anything until you approve the outcomes.