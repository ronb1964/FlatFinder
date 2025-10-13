# Tasks: 0002 — Leveling Outputs UX

## 1. Blocks Model Integration
- Read configured block sizes; expose function to enumerate achievable stack heights.
- Add tolerance (default 0.2°) and rounding rules.

**DoD**
- Unit tests cover rounding/tie-breakers.

## 2. Wheel Schematic UI
- Render schematic with per-wheel labels “+N blocks”.
- High-contrast, large text; fits narrow devices.

**DoD**
- Manual screenshots look clear on small phones.

## 3. Trailer Hitch Delta
- Compute inches up/down for tongue; show arrow + “Raise/Lower X in”.

**DoD**
- Manual tests validate sign/magnitude.

## 4. Edge Cases & Warnings
- If max stack exceeded → warning with alternatives (re-measure, different spot, edit block sizes).

**DoD**
- Warning path verified.

## 5. Manual Test Checklist
- Add `/ai-dev/tests/0002-checklist.md` with realistic slopes and block sets.

**DoD**
- Checklist exists and is easy to follow.
