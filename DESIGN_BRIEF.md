# LevelMate — Design Brief

## Visual Style
- Minimalist dark UI with soft shadows and 2xl rounded corners
- One accent color (teal/lime/green) for primary actions & focus
- Glass-morphism effects with translucent cards
- Professional gradient backgrounds (navy/blue tones)
- High contrast colors for sunlight readability in outdoor use

## Tech Rules
- Use Tamagui tokens for consistent theming - no hard-coded colors/sizes
- React Native Reanimated for smooth animations and motion
- Every new UI component should have clear TypeScript interfaces
- Modular, composable components with proper JSDoc documentation

## UX Principles
- **Big, glanceable angle readouts** - primary focus on current pitch/roll values
- **Safe primary actions at bottom** - confirm destructive actions with modals
- **Step-by-step workflow** - clear progression through leveling process
- **A11y compliance**: 4.5:1 text contrast ratio, visible focus rings
- **Outdoor-friendly design** - readable in bright sunlight conditions

## Component Naming
- Components use PascalCase (e.g., `LevelGauge`, `StepCard`)
- Screens end with `Screen` (e.g., `TrailerModeScreen`, `HomeScreen`)
- Small, composable components with JSDoc for props
- Feature-based folder organization

## Color Palette (Current Implementation)
- **Background**: Dark gradient (#1a1a2e → #16213e → #0f172a)
- **Primary Accent**: Green (#22c55e) for level status and success
- **Secondary**: Blue (#3b82f6) for trailer mode and informational
- **Tertiary**: Purple (#a855f7) for van mode and secondary actions
- **Warning**: Red (#ef4444) for adjusting/unsafe status
- **Text**: White with varying opacities for hierarchy (#ffffff, #94a3b8, #64748b)

## Key Features
- Real-time sensor integration with device motion APIs
- Step-by-step leveling guidance with block recommendations
- Safety warnings for unsafe slopes (>6°)
- Vehicle profile management (track width, axle-to-hitch measurements)
- Calibration system with offset corrections
- Visual bubble level gauge with smooth animations