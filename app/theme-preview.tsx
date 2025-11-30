import { View, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

// Palette 1: Deep Blue + Teal (current)
const palette1 = {
  name: 'Deep Blue + Teal',
  background: '#0c1929',
  foreground: '#f1f5f9',
  card: '#0f2744',
  cardForeground: '#f1f5f9',
  primary: '#14b8a6',
  primaryForeground: '#0c1929',
  secondary: '#1e3a5f',
  secondaryForeground: '#f1f5f9',
  muted: '#1e3a5f',
  mutedForeground: '#94a3b8',
  accent: '#14b8a6',
  destructive: '#ef4444',
  border: '#1e3a5f',
  levelPerfect: '#10b981',
  levelNear: '#eab308',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 2: Midnight Purple + Violet
const palette2 = {
  name: 'Midnight + Violet',
  background: '#0f0d1a',
  foreground: '#f5f3ff',
  card: '#1a1625',
  cardForeground: '#f5f3ff',
  primary: '#a78bfa',
  primaryForeground: '#0f0d1a',
  secondary: '#2d2640',
  secondaryForeground: '#f5f3ff',
  muted: '#2d2640',
  mutedForeground: '#a1a1aa',
  accent: '#c084fc',
  destructive: '#f87171',
  border: '#3d3655',
  levelPerfect: '#4ade80',
  levelNear: '#facc15',
  levelWarning: '#fb923c',
  levelDanger: '#f87171',
};

// Palette 3: Charcoal + Electric Blue
const palette3 = {
  name: 'Charcoal + Electric',
  background: '#111111',
  foreground: '#fafafa',
  card: '#1a1a1a',
  cardForeground: '#fafafa',
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  secondary: '#262626',
  secondaryForeground: '#fafafa',
  muted: '#262626',
  mutedForeground: '#a3a3a3',
  accent: '#60a5fa',
  destructive: '#ef4444',
  border: '#333333',
  levelPerfect: '#22c55e',
  levelNear: '#eab308',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 4: Deep Sea + Coral
const palette4 = {
  name: 'Deep Sea + Coral',
  background: '#0a1520',
  foreground: '#f0f9ff',
  card: '#0f1f2e',
  cardForeground: '#f0f9ff',
  primary: '#f97316',
  primaryForeground: '#ffffff',
  secondary: '#1e3a4c',
  secondaryForeground: '#f0f9ff',
  muted: '#1e3a4c',
  mutedForeground: '#7dd3fc',
  accent: '#fb923c',
  destructive: '#dc2626',
  border: '#2a4a5e',
  levelPerfect: '#34d399',
  levelNear: '#fbbf24',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 5: Obsidian + Emerald (Premium/Luxury feel)
const palette5 = {
  name: 'Obsidian + Emerald',
  background: '#09090b',
  foreground: '#fafafa',
  card: '#18181b',
  cardForeground: '#fafafa',
  primary: '#10b981',
  primaryForeground: '#ffffff',
  secondary: '#27272a',
  secondaryForeground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  accent: '#34d399',
  destructive: '#ef4444',
  border: '#3f3f46',
  levelPerfect: '#10b981',
  levelNear: '#fbbf24',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 6: Slate + Rose (Soft modern)
const palette6 = {
  name: 'Slate + Rose',
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#1e293b',
  cardForeground: '#f8fafc',
  primary: '#f43f5e',
  primaryForeground: '#ffffff',
  secondary: '#334155',
  secondaryForeground: '#f8fafc',
  muted: '#334155',
  mutedForeground: '#94a3b8',
  accent: '#fb7185',
  destructive: '#dc2626',
  border: '#475569',
  levelPerfect: '#22c55e',
  levelNear: '#facc15',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 7: Noir + Gold (Luxury/Premium)
const palette7 = {
  name: 'Noir + Gold',
  background: '#0a0a0a',
  foreground: '#fafaf9',
  card: '#171717',
  cardForeground: '#fafaf9',
  primary: '#eab308',
  primaryForeground: '#0a0a0a',
  secondary: '#262626',
  secondaryForeground: '#fafaf9',
  muted: '#262626',
  mutedForeground: '#a3a3a3',
  accent: '#facc15',
  destructive: '#ef4444',
  border: '#404040',
  levelPerfect: '#22c55e',
  levelNear: '#eab308',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

// Palette 8: Carbon + Cyan (Futuristic/Tech)
const palette8 = {
  name: 'Carbon + Cyan',
  background: '#030712',
  foreground: '#f9fafb',
  card: '#111827',
  cardForeground: '#f9fafb',
  primary: '#06b6d4',
  primaryForeground: '#030712',
  secondary: '#1f2937',
  secondaryForeground: '#f9fafb',
  muted: '#1f2937',
  mutedForeground: '#9ca3af',
  accent: '#22d3ee',
  destructive: '#ef4444',
  border: '#374151',
  levelPerfect: '#10b981',
  levelNear: '#fbbf24',
  levelWarning: '#f97316',
  levelDanger: '#ef4444',
};

const palettes = [palette1, palette2, palette3, palette4, palette5, palette6, palette7, palette8];

export default function ThemePreview() {
  const [paletteIndex, setPaletteIndex] = useState(0);
  const colors = palettes[paletteIndex];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Palette Selector */}
        <View style={styles.selectorRow}>
          {palettes.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => setPaletteIndex(i)}
              style={[
                styles.selectorButton,
                {
                  backgroundColor: paletteIndex === i ? p.primary : p.card,
                  borderColor: p.primary,
                  borderWidth: paletteIndex === i ? 0 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: paletteIndex === i ? p.primaryForeground : p.foreground,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {i + 1}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Theme Preview</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Palette {paletteIndex + 1}: {colors.name}
          </Text>
        </View>

        {/* Color Swatches */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Color Palette</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>Primary colors and accents</Text>

          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.primary }]}>
              <Text style={[styles.swatchText, { color: colors.primaryForeground }]}>Primary</Text>
            </View>
            <View style={[styles.swatch, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.swatchText, { color: colors.secondaryForeground }]}>Secondary</Text>
            </View>
          </View>
          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.accent }]}>
              <Text style={[styles.swatchText, { color: colors.primaryForeground }]}>Accent</Text>
            </View>
            <View style={[styles.swatch, { backgroundColor: colors.muted }]}>
              <Text style={[styles.swatchText, { color: colors.mutedForeground }]}>Muted</Text>
            </View>
          </View>
          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.swatchText, { color: '#fff' }]}>Destructive</Text>
            </View>
            <View style={[styles.swatch, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.swatchText, { color: colors.cardForeground }]}>Card</Text>
            </View>
          </View>
        </View>

        {/* Level Status Colors */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Level Status Colors</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>For indicating leveling state</Text>

          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.levelPerfect }]}>
              <Text style={[styles.swatchText, { color: '#fff', fontWeight: 'bold' }]}>Perfect</Text>
            </View>
            <View style={[styles.swatch, { backgroundColor: colors.levelNear }]}>
              <Text style={[styles.swatchText, { color: '#000', fontWeight: 'bold' }]}>Near</Text>
            </View>
          </View>
          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.levelWarning }]}>
              <Text style={[styles.swatchText, { color: '#fff', fontWeight: 'bold' }]}>Warning</Text>
            </View>
            <View style={[styles.swatch, { backgroundColor: colors.levelDanger }]}>
              <Text style={[styles.swatchText, { color: '#fff', fontWeight: 'bold' }]}>Danger</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Buttons</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>Various button styles</Text>

          <Pressable style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Primary Button</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.buttonText, { color: colors.secondaryForeground }]}>Secondary Button</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Outline Button</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: colors.destructive }]}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Destructive Button</Text>
          </Pressable>
        </View>

        {/* Typography */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Typography</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>Text styles and sizes</Text>

          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.foreground }}>Heading 1</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.foreground }}>Heading 2</Text>
          <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground }}>Heading 3</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.foreground }}>Heading 4</Text>
          <Text style={{ fontSize: 18, color: colors.foreground }}>Large Body Text</Text>
          <Text style={{ fontSize: 16, color: colors.foreground }}>Regular Body Text</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Small / Muted Text</Text>
        </View>

        {/* Sample Level Display */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Sample Level Display</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>How the level screen could look</Text>

          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.levelPerfect }}>Perfect Level</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.levelCard, { backgroundColor: colors.secondary + '80' }]}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Pitch</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.levelPerfect }}>+0.0°</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Level</Text>
            </View>
            <View style={[styles.levelCard, { backgroundColor: colors.secondary + '80' }]}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Roll</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.levelPerfect }}>+0.0°</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Level</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Pressable style={[styles.smallButton, { backgroundColor: colors.secondary }]}>
              <Text style={{ color: colors.secondaryForeground, fontWeight: '600' }}>Quick Set</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Calibrate</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 16,
  },
  selectorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  swatch: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    fontWeight: '600',
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  levelCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  smallButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
