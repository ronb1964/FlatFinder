# Scroll Chevron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pulsing scroll-affordance chevron to all scrollable screens in FlatFinder v1.0.2.

**Architecture:** Build one `ScrollViewWithChevron` wrapper component, then swap it in for the plain `ScrollView` on 6 target screens. The component handles all detection and animation internally — consuming screens need no scroll logic changes.

**Tech Stack:** react-native-svg (already installed), react-native-reanimated (already installed), React Native `forwardRef`, `useColorScheme`

**Spec:** `docs/superpowers/specs/2026-03-18-scroll-chevron-design.md`

---

## File Map

| Action     | File                                       | What changes                                                                         |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Create** | `src/components/ScrollViewWithChevron.tsx` | New wrapper component                                                                |
| **Modify** | `app/(tabs)/index.tsx`                     | Swap `ScrollView` → `ScrollViewWithChevron`                                          |
| **Modify** | `app/(tabs)/settings.tsx`                  | Swap `ScrollView` → `ScrollViewWithChevron`                                          |
| **Modify** | `app/(tabs)/profiles.tsx`                  | Swap `ScrollView` → `ScrollViewWithChevron`                                          |
| **Modify** | `app/calibration.tsx`                      | Swap `ScrollView` → `ScrollViewWithChevron`                                          |
| **Modify** | `app/onboarding.tsx`                       | Swap `ScrollView` → `ScrollViewWithChevron` (has `scrollViewRef` — use `forwardRef`) |
| **Modify** | `src/components/ProfileEditor.tsx`         | Swap `ScrollView` → `ScrollViewWithChevron` (has `scrollViewRef` — use `forwardRef`) |
| **Modify** | `CLAUDE.md`                                | Lock in approved light mode chevron spec                                             |

---

## Task 1: Create `ScrollViewWithChevron` component

**Files:**

- Create: `src/components/ScrollViewWithChevron.tsx`

> **Note on testing:** This is a pure UI/animation component dependent on native layout events (`onLayout`, `onContentSizeChange`, `onScroll`). There is no existing component test infrastructure in this project (existing tests cover pure math functions). Verification is done manually via the dev server after implementation.

- [ ] **Step 1: Create the file**

Create `src/components/ScrollViewWithChevron.tsx` with the following complete implementation:

```tsx
import React, { forwardRef, useRef, useState, useCallback, useEffect } from 'react';
import { ScrollView, View, StyleSheet, useColorScheme } from 'react-native';
import type { ScrollViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

// How close to the bottom (in px) before the chevron hides
const BOTTOM_THRESHOLD = 20;

// Dark mode: white glow. Light mode: dark navy glow.
const DARK_STROKE = 'white';
const LIGHT_STROKE = '#1e3c78';

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

function ChevronSVG({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? DARK_STROKE : LIGHT_STROKE;
  // feGaussianBlur stdDeviation 0.5 ≈ CSS blur(1px)
  // Two blur passes create the layered diffuse glow matching the approved spec
  return (
    <Svg width={42} height={42} viewBox="0 0 24 24">
      <Defs>
        <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur1" />
          <FeGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
          <FeMerge>
            <FeMergeNode in="blur2" />
            <FeMergeNode in="blur1" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <Path
        d="M6 9 L12 15 L18 9"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
      />
    </Svg>
  );
}

const ScrollViewWithChevron = forwardRef<ScrollView, Props>(
  (
    { children, onScroll, onLayout, onContentSizeChange, style, contentContainerStyle, ...props },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme !== 'light';

    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    // Derived: should chevron be shown?
    const hasOverflow = contentHeight > containerHeight + BOTTOM_THRESHOLD;
    const isAtBottom = scrollY + containerHeight >= contentHeight - BOTTOM_THRESHOLD;
    const showChevron = hasOverflow && !isAtBottom;

    // Animated values
    const breatheOpacity = useSharedValue(0.6);
    const visibilityOpacity = useSharedValue(0);

    // Start/stop breathe animation based on visibility
    useEffect(() => {
      if (showChevron) {
        // Fade in chevron container
        visibilityOpacity.value = withTiming(1, { duration: 300 });
        // Start breathe loop: 0.60 → 0.08 → 0.60, 2.4s cycle
        breatheOpacity.value = withRepeat(
          withSequence(
            withTiming(0.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite
          false
        );
      } else {
        // Fade out over 0.6s, then stop breathe
        visibilityOpacity.value = withTiming(0, { duration: 600 });
        cancelAnimation(breatheOpacity);
        breatheOpacity.value = 0.6; // reset for next appearance
      }
    }, [showChevron]);

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
      opacity: breatheOpacity.value * visibilityOpacity.value,
    }));

    const handleLayout = useCallback(
      (e: Parameters<NonNullable<ScrollViewProps['onLayout']>>[0]) => {
        setContainerHeight(e.nativeEvent.layout.height);
        onLayout?.(e);
      },
      [onLayout]
    );

    const handleContentSizeChange = useCallback(
      (w: number, h: number) => {
        setContentHeight(h);
        onContentSizeChange?.(w, h);
      },
      [onContentSizeChange]
    );

    const handleScroll = useCallback(
      (e: Parameters<NonNullable<ScrollViewProps['onScroll']>>[0]) => {
        setScrollY(e.nativeEvent.contentOffset.y);
        onScroll?.(e);
      },
      [onScroll]
    );

    return (
      <View style={[styles.container, style]}>
        <ScrollView
          ref={ref}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={contentContainerStyle}
          {...props}
        >
          {children}
        </ScrollView>

        {/* Chevron overlay — pointer-events none so it cannot be tapped */}
        <Animated.View style={[styles.chevronContainer, chevronAnimatedStyle]} pointerEvents="none">
          <ChevronSVG isDark={isDark} />
        </Animated.View>
      </View>
    );
  }
);

ScrollViewWithChevron.displayName = 'ScrollViewWithChevron';

export default ScrollViewWithChevron;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  chevronContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors. Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/components/ScrollViewWithChevron.tsx
git commit -m "feat: add ScrollViewWithChevron component with breathe animation"
```

---

## Task 2: Apply to Home screen (highest priority)

**Files:**

- Modify: `app/(tabs)/index.tsx` (ScrollView is at line ~497)

- [ ] **Step 1: Swap the import**

In `app/(tabs)/index.tsx`, find the line:

```tsx
import { ..., ScrollView, ... } from 'react-native';
```

Remove `ScrollView` from this import. Add below the other local imports:

```tsx
import ScrollViewWithChevron from '../../src/components/ScrollViewWithChevron';
```

- [ ] **Step 2: Replace the JSX tag**

Find `<ScrollView` (around line 497) and its closing `</ScrollView>` (around line 1067). Replace both tags:

```tsx
// Before
<ScrollView
  ...existing props...
>

// After
<ScrollViewWithChevron
  ...existing props...
>
```

And closing tag: `</ScrollViewWithChevron>`

Keep all existing props (`contentContainerStyle`, etc.) exactly as-is.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Visual check in dev server**

```bash
npx expo start --clear
```

Open browser at `http://localhost:8081`. Scroll the home screen — chevron should pulse at bottom, disappear when you reach the end.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: add scroll chevron to home/leveling screen"
```

---

## Task 3: Apply to Settings, Profiles, and Calibration screens

**Files:**

- Modify: `app/(tabs)/settings.tsx` (ScrollView at line 76)
- Modify: `app/(tabs)/profiles.tsx` (ScrollView at line 201)
- Modify: `app/calibration.tsx` (ScrollView at line 104)

These three screens have simple `<ScrollView>` with no refs or keyboard handling — straightforward swaps.

- [ ] **Step 1: Update settings.tsx**

Remove `ScrollView` from react-native import. Add:

```tsx
import ScrollViewWithChevron from '../../src/components/ScrollViewWithChevron';
```

Replace `<ScrollView` / `</ScrollView>` tags (line 76 / line 533) with `<ScrollViewWithChevron` / `</ScrollViewWithChevron>`. Keep all existing props.

- [ ] **Step 2: Update profiles.tsx**

Same process. ScrollView at line 201, closes at line 336. Import path: `../../src/components/ScrollViewWithChevron`.

- [ ] **Step 3: Update calibration.tsx**

Same process. ScrollView at line 104, closes at line 162. Import path: `../src/components/ScrollViewWithChevron`.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/settings.tsx app/(tabs)/profiles.tsx app/calibration.tsx
git commit -m "feat: add scroll chevron to settings, profiles, and calibration screens"
```

---

## Task 4: Apply to Onboarding screen

**Files:**

- Modify: `app/onboarding.tsx`

> **⚠ Extra care required:** This screen has a `KeyboardAvoidingView` wrapping the `ScrollView`, plus a `scrollViewRef = useRef<ScrollView>()`. The `ScrollViewWithChevron` uses `forwardRef` so the ref passes through correctly. Do NOT touch the `KeyboardAvoidingView` — only swap the inner `ScrollView`.

- [ ] **Step 1: Swap the import**

In `app/onboarding.tsx`, remove `ScrollView` from the react-native import. Add:

```tsx
import ScrollViewWithChevron from '../src/components/ScrollViewWithChevron';
```

- [ ] **Step 2: Replace JSX tags**

Find the `<ScrollView` at line 1506 and its closing tag at line 1514. Replace:

```tsx
// Before
<ScrollView
  ref={scrollViewRef}
  ...existing props...
>

// After
<ScrollViewWithChevron
  ref={scrollViewRef}
  ...existing props...
>
```

Closing: `</ScrollViewWithChevron>`. Leave `<KeyboardAvoidingView>` completely untouched.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: add scroll chevron to onboarding screen"
```

---

## Task 5: Apply to ProfileEditor

**Files:**

- Modify: `src/components/ProfileEditor.tsx`

> **⚠ Extra care required:** Same pattern as onboarding — has `KeyboardAvoidingView` + `scrollViewRef`. Only swap the inner `ScrollView`.

- [ ] **Step 1: Swap the import**

Remove `ScrollView` from react-native import. Add:

```tsx
import ScrollViewWithChevron from './ScrollViewWithChevron';
```

- [ ] **Step 2: Replace JSX tags**

Find `<ScrollView` at line 242 and closing `</ScrollView>` at line 657. Replace both with `<ScrollViewWithChevron` / `</ScrollViewWithChevron>`. Pass `ref={scrollViewRef}` through. Keep all existing props. Leave `<KeyboardAvoidingView>` untouched.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProfileEditor.tsx
git commit -m "feat: add scroll chevron to ProfileEditor"
```

---

## Task 6: Update CLAUDE.md with approved light mode spec

**Files:**

- Modify: `CLAUDE.md`

The light mode chevron spec was approved during brainstorming but is not yet reflected in CLAUDE.md's locked specs section.

- [ ] **Step 1: Add light mode spec to CLAUDE.md**

In `CLAUDE.md`, find the scroll chevron section under "Future Features / Iteration Ideas". Add the light mode spec below the existing dark mode spec block:

```markdown
- **Light mode chevron spec (approved 2026-03-18):**
  - Stroke: `#1e3c78` (dark navy)
  - `filter: blur(1px) drop-shadow(0 0 10px rgba(30,60,120,0.55)) drop-shadow(0 0 22px rgba(30,60,120,0.3)) drop-shadow(0 0 4px rgba(30,60,120,0.6))`
  - Same breathe animation (60% → 8%, 2.4s cycle)
  - SVG `feGaussianBlur` implementation (same as dark mode)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: lock in approved light mode chevron spec in CLAUDE.md"
```

---

## Final Verification

- [ ] Run TypeScript check one last time across the whole project:

```bash
npx tsc --noEmit
```

- [ ] Run Expo bundle check for iOS:

```bash
npx expo export --platform ios
```

Expected: clean bundle, 0 errors.

- [ ] Run Expo bundle check for Android:

```bash
npx expo export --platform android
```

Expected: clean bundle, 0 errors.

- [ ] Manual device check (Expo Go): scroll each of the 6 screens, verify:
  - Chevron pulses at bottom when content overflows
  - Chevron disappears (0.6s fade) when scrolled to bottom
  - Chevron does NOT appear on calibration wizard rotating screens
  - Light mode: chevron shows dark navy with soft glow
  - Dark mode: chevron shows white with soft glow
