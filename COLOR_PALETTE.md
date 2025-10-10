# FlatFinder Color Palette & Design System

## Overview
This document defines the official color palette and design patterns for FlatFinder. All UI components should adhere to these standards to maintain visual consistency.

---

## Core Color Palette

### Background Gradients

#### Level Screen
```typescript
colors: [
  '#0f0f1e',  // Deep dark blue
  '#1a1a2e',  // Midnight blue
  '#16213e',  // Dark navy
  '#0f172a',  // Slate dark
]
```
- **Usage**: Main leveling screen background
- **Animation**: 10 second smooth fade
- **Purpose**: Professional, calming atmosphere for precision work

#### Profiles Screen
```typescript
colors: [
  '#1a1625',  // Dark purple
  '#1e1b2e',  // Deep violet
  '#1a1a2e',  // Midnight
]
```
- **Usage**: Vehicle profiles management screen
- **Animation**: 12 second gentle pulse
- **Purpose**: Warmer, more personal feel for user's vehicles

#### Settings Screen
```typescript
colors: [
  '#0f1419',  // Very dark
  '#1a1f2e',  // Dark blue-grey
  '#16213e',  // Navy
]
```
- **Usage**: Settings and configuration screen
- **Animation**: Static (no animation for stability)
- **Purpose**: Clean, focused environment for settings

#### Leveling Assistant
```typescript
colors: [
  '#1a1a2e',  // Midnight blue
  '#16213e',  // Dark navy
  '#0f172a',  // Slate dark
]
```
- **Usage**: Block instructions and leveling guidance
- **Animation**: 8 second smooth fade
- **Purpose**: Focused, instructional atmosphere

---

## Semantic Colors

### Success / Level State
- **Primary**: `#22c55e` (Green 500)
- **Light**: `#4ade80` (Green 400)
- **Dark**: `#16a34a` (Green 600)
- **Usage**:
  - Level status indicators
  - Active profile badges
  - Completed calibration
  - Block recommendations that fit
  - "Good" position indicators

#### Glassmorphic Variants
```typescript
backgroundColor: 'rgba(16, 185, 129, 0.2)'   // Light green tint
borderColor: 'rgba(34, 197, 94, 0.5)'        // Green border
borderColor: 'rgba(34, 197, 94, 0.6)'        // Stronger green (active)
```

### Warning / Error State
- **Primary**: `#ef4444` (Red 500)
- **Light**: `#f87171` (Red 400)
- **Dark**: `#dc2626` (Red 600)
- **Usage**:
  - Not level warnings
  - Safety alerts (>8° slope)
  - Missing profile indicators
  - Block shortage warnings
  - Deletion confirmations

#### Glassmorphic Variants
```typescript
backgroundColor: 'rgba(239, 68, 68, 0.1)'    // Light red tint
borderColor: 'rgba(239, 68, 68, 0.3)'        // Red border
backgroundColor: 'rgba(239, 68, 68, 0.9)'    // Strong red (safety warning)
```

### Info / Guidance State
- **Primary**: `#3b82f6` (Blue 500)
- **Light**: `#60a5fa` (Blue 400)
- **Dark**: `#2563eb` (Blue 600)
- **Usage**:
  - Informational cards
  - Help text backgrounds
  - Block setup prompts
  - Tutorial hints
  - Measurement displays

#### Glassmorphic Variants
```typescript
backgroundColor: 'rgba(59, 130, 246, 0.1)'   // Light blue tint
borderColor: 'rgba(59, 130, 246, 0.3)'       // Blue border
backgroundColor: 'rgba(59, 130, 246, 0.2)'   // Button backgrounds
borderColor: 'rgba(59, 130, 246, 0.4)'       // Button borders
```

### Primary / Accent State
- **Primary**: `#6366f1` (Indigo 500)
- **Light**: `#818cf8` (Indigo 400)
- **Dark**: `#4f46e5` (Indigo 600)
- **Purple Variant**: `#8b5cf6` (Purple 500)
- **Usage**:
  - Primary action buttons
  - Active selections
  - Progress indicators
  - Wizard modal borders
  - Night mode icons

#### Glassmorphic Variants
```typescript
backgroundColor: 'rgba(99, 102, 241, 0.2)'   // Light indigo tint
borderColor: 'rgba(99, 102, 241, 0.4)'       // Indigo border
shadowColor: 'rgba(99, 102, 241, 0.3)'       // Indigo glow
```

### Warning / Caution State
- **Primary**: `#f59e0b` (Amber 500)
- **Light**: `#fbbf24` (Amber 400)
- **Dark**: `#d97706` (Amber 600)
- **Orange Variant**: `#f97316` (Orange 500)
- **Usage**:
  - Keep awake toggle
  - Leveling assistant button
  - Sun/day mode icons
  - Calibration prompts

#### Glassmorphic Variants
```typescript
backgroundColor: 'rgba(251, 191, 36, 0.1)'   // Light amber tint
borderColor: 'rgba(251, 191, 36, 0.3)'       // Amber border
```

---

## Glassmorphism Standards

### Glass Card Opacity Levels
```typescript
'light':   'rgba(255, 255, 255, 0.1)'   // Subtle glass effect
'medium':  'rgba(255, 255, 255, 0.15)'  // Standard glass (default)
'strong':  'rgba(255, 255, 255, 0.2)'   // Pronounced glass effect
```

### Standard Glass Card Pattern
```typescript
<GlassCard
  backgroundColor="rgba(255, 255, 255, 0.05)"  // Very subtle tint
  borderColor="rgba(255, 255, 255, 0.2)"       // White border
  borderWidth={2}
  blurIntensity={10}                           // Standard blur
/>
```

### Active/Selected Glass Card Pattern
```typescript
<GlassCard
  backgroundColor="rgba(16, 185, 129, 0.15)"   // Green tint
  borderColor="rgba(34, 197, 94, 0.6)"         // Strong green border
  borderWidth={2}
  blurIntensity={12}                           // Slightly more blur
  shadowColor="#10b981"                        // Green glow
/>
```

### Modal/Overlay Glass Pattern
```typescript
<GlassCard
  backgroundColor="rgba(15, 23, 42, 0.95)"     // Near-opaque dark
  borderColor="rgba(99, 102, 241, 0.4)"        // Indigo border
  borderWidth={2}
  blurIntensity={20}                           // Heavy blur
  shadowColor="rgba(99, 102, 241, 0.3)"        // Indigo glow
/>
```

---

## Gradient Button Patterns

### Primary Gradient
```typescript
colors: ['#6366f1', '#8b5cf6']  // Indigo to Purple
```
- **Usage**: Main actions, "Add Vehicle", primary navigation

### Success Gradient
```typescript
colors: ['#10b981', '#22c55e']  // Emerald to Green
```
- **Usage**: Calibration success, "Calibrating..." state

### Warning Gradient
```typescript
colors: ['#f59e0b', '#f97316']  // Amber to Orange
```
- **Usage**: "Leveling Assistant" button, attention-grabbing actions

### Info Gradient
```typescript
colors: ['#3b82f6', '#60a5fa']  // Blue 500 to Blue 400
```
- **Usage**: "Calibration" button, informational actions

### Danger Gradient
```typescript
colors: ['#ef4444', '#dc2626']  // Red 500 to Red 600
```
- **Usage**: Delete actions, destructive operations

---

## Text Colors

### Primary Text
- **On dark backgrounds**: `white` or `rgba(255, 255, 255, 1)`
- **Secondary text**: `rgba(255, 255, 255, 0.7)` (70% opacity)
- **Tertiary text**: `rgba(255, 255, 255, 0.6)` (60% opacity)
- **Disabled text**: `rgba(255, 255, 255, 0.5)` (50% opacity)

### Color-Coded Text
- **Success text**: `#22c55e`
- **Error text**: `#ef4444`
- **Warning text**: `#f59e0b`
- **Info text**: `#3b82f6`
- **Primary text**: `#6366f1`

### Tamagui Theme Tokens
- **Standard color**: `$color` (theme-aware)
- **Pressed color**: `$colorPress` (theme-aware)
- **Gray scale**: `$gray11` (light gray text)

---

## Border & Shadow Patterns

### Standard Borders
```typescript
borderWidth: 1              // Subtle borders
borderWidth: 2              // Standard borders (cards, buttons)
borderRadius: '$4'          // Small radius (buttons)
borderRadius: '$5'          // Medium radius (cards)
borderRadius: '$6'          // Large radius (modals, prominent cards)
```

### Shadow Patterns

#### Subtle Shadow (Cards)
```typescript
shadowColor: 'rgba(0, 0, 0, 0.3)'
shadowOffset: { width: 0, height: 6 }
shadowOpacity: 0.3
shadowRadius: 12
```

#### Medium Shadow (Active Elements)
```typescript
shadowColor: '#10b981'  // Colored glow for active/success
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.3
shadowRadius: 16
```

#### Strong Shadow (Modals)
```typescript
shadowColor: 'rgba(99, 102, 241, 0.3)'
shadowOffset: { width: 0, height: 12 }
shadowOpacity: 0.4
shadowRadius: 24
```

---

## Bubble Level Specific Colors

### Gradients (SVG)
```typescript
// Green (Level State)
bubbleGreenGradient: ['#4ade80', '#22c55e', '#16a34a']

// Red (Not Level State)
bubbleRedGradient: ['#f87171', '#ef4444', '#dc2626']

// Glass Ring
glassGradient: [
  'rgba(100, 100, 120, 0.3)',
  'rgba(40, 40, 60, 0.4)',
  'rgba(20, 20, 30, 0.6)'
]

// Level Glow
levelGlow: ['rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0)']
```

### Precision Rings
```typescript
outerRing: 'rgba(139, 92, 246, 0.3)'   // Purple
middleRing: 'rgba(59, 130, 246, 0.3)'   // Blue
innerRing: 'rgba(34, 197, 94, 0.3)'     // Green
```

---

## Animation Standards

### Timing Functions
```typescript
bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s'
smooth: 'cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
quick:  'cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
lazy:   'cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
spring: 'cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s'
```

### Press Effects
```typescript
pressStyle: { scale: 0.95 }  // Buttons
pressStyle: { scale: 0.98 }  // Cards/large touch targets
```

### Gradient Animations
- **Fast**: 8 seconds (Leveling Assistant)
- **Medium**: 10 seconds (Level Screen)
- **Slow**: 12 seconds (Profiles Screen)
- **Static**: No animation (Settings Screen)

---

## Usage Guidelines

### DO ✅
- Use semantic colors (success/warning/info/danger) based on state, not arbitrary colors
- Maintain consistent blur intensities (10-12px for cards, 20px for modals)
- Use glassmorphic effects for all card-based components
- Apply colored shadows to match the semantic state (green for success, red for errors)
- Use gradient buttons for primary actions
- Maintain the 2-color gradient pattern for consistency

### DON'T ❌
- Don't introduce new arbitrary colors without updating this document
- Don't use solid backgrounds where glassmorphism is appropriate
- Don't mix blur intensities randomly (stick to 8, 10, 12, 15, 20)
- Don't use shadows without considering the semantic color
- Don't create single-color buttons for primary actions
- Don't use emojis unless explicitly requested by user

---

## Future Considerations

### Potential Additions
- **Teal accent**: For differentiation in complex screens
- **Yellow warning**: For non-critical but important notices
- **Dark mode toggle**: Light theme color palette (if needed)

### Accessibility Notes
- All text colors maintain WCAG AA contrast ratios against dark backgrounds
- Color is never the sole indicator of state (icons and text labels supplement)
- Blur effects are progressive enhancements (content readable without them)

---

## Component Reference

### Where Each Color Appears

#### Green (#22c55e)
- Active profile indicators
- "Level!" status cards
- Calibration success messages
- Block fit confirmations
- "✓ Good" position badges

#### Red (#ef4444)
- "Not Level" warnings
- Safety alerts (>8° slope)
- No profile selected
- Delete confirmation buttons
- "No blocks fit" warnings

#### Blue (#3b82f6)
- "Setup blocks in profile" prompts
- Audio feedback toggle
- Info cards and help text
- Total stack height displays

#### Indigo (#6366f1)
- Night mode toggle
- Primary action buttons
- Wizard modal borders
- Progress indicators

#### Amber/Orange (#f59e0b / #f97316)
- Keep awake toggle
- Leveling Assistant button
- Sun/day mode icon

---

**Last Updated**: 2025-10-09
**Version**: 1.0 (Initial UI Revamp)

_This document should be updated whenever new colors or patterns are introduced to the design system._
