# Scroll Chevron — Design Spec

**Date:** 2026-03-18
**Version:** v1.0.2
**Status:** Approved

---

## Overview

A softly pulsing translucent chevron displayed at the bottom of any scrollable screen to signal to the user that more content exists below. Disappears automatically when the user reaches the bottom. Pure visual — cannot be tapped.

---

## Component Architecture

### `ScrollViewWithChevron`

**File:** `src/components/ScrollViewWithChevron.tsx`

A drop-in wrapper around React Native's `ScrollView`. Accepts all standard `ScrollView` props via spread. Adds chevron overlay internally with no changes required to the screen's existing scroll logic.

**Internal logic:**

- `onLayout` → measures visible container height
- `onContentSizeChange` → measures total content height
- `onScroll` → tracks scroll position (Y offset)
- Derives: `isAtBottom = scrollY + containerHeight >= contentHeight - 20px threshold`
- Shows chevron when: `contentHeight > containerHeight AND !isAtBottom`
- `pointerEvents="none"` on chevron — cannot be accidentally tapped

---

## Visual Specs

### SVG Chevron

- Width: 42, Height: 42
- ViewBox: `0 0 24 24`
- Path: `m6 9 6 6 6-6`
- Stroke-width: 2.5
- Stroke-linecap: round
- Fill: none

### Dark Mode (approved)

- Stroke: `white`
- Filter: `blur(1px) drop-shadow(0 0 7px rgba(255,255,255,0.55)) drop-shadow(0 0 14px rgba(255,255,255,0.25))`
- Implemented via SVG `<filter>` with `<feGaussianBlur>` (CSS filter not supported in RN)

### Light Mode (approved 2026-03-18)

- Stroke: `#1e3c78` (dark navy)
- Filter: `blur(1px) drop-shadow(0 0 10px rgba(30,60,120,0.55)) drop-shadow(0 0 22px rgba(30,60,120,0.3)) drop-shadow(0 0 4px rgba(30,60,120,0.6))`
- Same SVG filter approach

### Animation — identical in both modes

- **Breathe:** 60% → 8% opacity, 2.4s cycle, ease-in-out, looping
- Implementation: Reanimated `withRepeat(withSequence(withTiming(0.08, ...), withTiming(0.60, ...)))`
- **Disappear on scroll:** 0.6s fade to 0 opacity when `isAtBottom` becomes true
- **Reappear:** instant (or fast fade) when user scrolls back up

### Positioning

- Absolutely positioned inside the `ScrollViewWithChevron` container
- Bottom: 12px from the bottom of the scroll container
- Centered horizontally
- Z-index above scroll content

---

## Rollout — Target Screens

All 6 screens get `ScrollViewWithChevron` replacing their current `ScrollView`:

| Priority | File                               | Reason                                                                            |
| -------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1        | `app/(tabs)/index.tsx`             | Most critical — block requirements hidden below fold                              |
| 2        | `app/(tabs)/settings.tsx`          | Multiple sections, overflows on small phones                                      |
| 3        | `app/(tabs)/profiles.tsx`          | Grows as user adds vehicles                                                       |
| 4        | `app/calibration.tsx`              | Two-card layout overflows on small phones (landing screen only, not wizard modal) |
| 5        | `app/onboarding.tsx`               | Multi-step wizard with form fields                                                |
| 6        | `src/components/ProfileEditor.tsx` | Known display issues on phone                                                     |

**Excluded:** `CalibrationWizard.tsx` modal — no ScrollView, intentionally scroll-free.

---

## Platform Support

- **iOS & Android:** Fully supported. SVG `<filter>` + `<feGaussianBlur>` works on both via `react-native-svg` (already installed). Reanimated works on both. No platform-specific code required.
- **Future screens:** Any new scrollable screen should use `ScrollViewWithChevron` instead of plain `ScrollView` as the default going forward.

---

## Dependencies

- `react-native-svg` — already installed (used by `BubbleLevel.tsx`)
- `react-native-reanimated` — already installed
- `src/theme.ts` — for reading current color scheme (dark/light)

---

## What It Is NOT

- Not a button — `pointerEvents="none"` enforced
- Not a progress indicator — purely scroll affordance
- Not animated vertically — breathe is opacity only, no movement
