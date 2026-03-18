import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  type ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ScrollViewWithChevron from './ScrollViewWithChevron';
import { Trash2, Plus } from 'lucide-react-native';
import { TrailerIcon, MotorhomeIcon, VanIcon } from './icons/VehicleIcons';
import { GlassButton } from './ui/GlassButton';
import { GlassCard } from './ui/GlassCard';
import { GlassToggle } from './ui/GlassToggle';
import { useAppStore } from '../state/appStore';
import { BlockInventory } from '../lib/rvLevelingMath';
import { convertToInches, convertForDisplay } from '../lib/units';
import { THEME } from '../theme';
import { useTheme } from '../hooks/useTheme';

interface ProfileEditorProps {
  profile: {
    id: string;
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  };
  onSave: (updatedProfile: {
    name: string;
    type: 'trailer' | 'motorhome' | 'van';
    wheelbaseInches: number;
    trackWidthInches: number;
    hitchOffsetInches?: number;
    blockInventory: BlockInventory[];
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const VEHICLE_TYPES = [
  {
    id: 'trailer',
    name: 'Travel Trailer',
    Icon: TrailerIcon,
    iconSize: 32, // Slightly larger to match visual weight
  },
  {
    id: 'motorhome',
    name: 'Motor Home',
    Icon: MotorhomeIcon,
    iconSize: 40, // Larger to match visual size of other icons
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    Icon: VanIcon,
    iconSize: 28,
  },
];

export function ProfileEditor({ profile, onSave, onCancel, isVisible }: ProfileEditorProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const { settings, isProfileNameTaken } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);

  // Theme-aware colors
  const screenColors = {
    // Overlay and modal
    overlayBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    modalBg: theme.colors.background,
    modalBorder: theme.colors.border,
    // Text colors
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    danger: '#ef4444',
    // Input backgrounds
    inputBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(100, 130, 180, 0.12)',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 180, 0.35)',
    placeholder: isDark ? '#737373' : '#9ca3af',
    // Vehicle type option
    optionBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 215, 235, 0.5)',
    optionBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 170, 0.3)',
    optionSelectedBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)',
    optionSelectedBorder: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)',
    iconColor: isDark ? '#a3a3a3' : '#64748b',
    // Block item
    blockItemBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 215, 235, 0.5)',
    blockItemBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 170, 0.3)',
    blockItemActiveBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
    blockItemActiveBorder: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)',
    // Quantity buttons
    quantityBtnBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(200, 215, 235, 0.6)',
    quantityBtnBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 130, 170, 0.4)',
    // Total blocks card
    totalCardBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
    totalCardBorder: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)',
    // Add block button
    addBtnBg: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
    addBtnBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)',
    addInputBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
    addInputBorder: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)',
    addInputFieldBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(100, 130, 180, 0.12)',
    addInputFieldBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 130, 180, 0.35)',
  };

  // Initialize state from profile
  const [name, setName] = useState(profile.name);
  const [vehicleType, setVehicleType] = useState(profile.type);
  const [wheelbaseInches, setWheelbaseInches] = useState(profile.wheelbaseInches);
  const [trackWidthInches, setTrackWidthInches] = useState(profile.trackWidthInches);
  const [hitchOffsetInches, setHitchOffsetInches] = useState(profile.hitchOffsetInches || 120);

  // Convert block inventory array to quantities object
  const initialBlockQuantities: Record<number, number> = {};
  profile.blockInventory.forEach((block) => {
    initialBlockQuantities[block.thickness] = block.quantity;
  });
  const [blockQuantities, setBlockQuantities] = useState(initialBlockQuantities);
  const [hasLevelingBlocks, setHasLevelingBlocks] = useState(profile.blockInventory.length > 0);

  // For adding new block sizes
  const [showAddBlockInput, setShowAddBlockInput] = useState(false);
  const [newBlockHeight, setNewBlockHeight] = useState('');

  const unitLabel = settings.measurementUnits === 'metric' ? 'cm' : 'inches';

  // Check if name is taken (exclude current profile when editing)
  const isEditingSameName = name.trim().toLowerCase() === profile.name.trim().toLowerCase();
  const vehicleNameTaken =
    name.trim() && !isEditingSameName && isProfileNameTaken(name, profile.id);

  const updateBlockQuantity = useCallback((height: number, delta: number) => {
    setBlockQuantities((prev) => {
      const currentQty = prev[height] || 0;
      const newQty = Math.max(0, Math.min(20, currentQty + delta));
      return { ...prev, [height]: newQty };
    });
  }, []);

  const deleteBlockSize = useCallback((height: number) => {
    setBlockQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[height];
      return newQuantities;
    });
  }, []);

  const addBlockSize = useCallback(() => {
    const heightStr = newBlockHeight.trim();
    if (!heightStr) return;

    let heightInches = parseFloat(heightStr);
    if (isNaN(heightInches) || heightInches <= 0) return;

    if (settings.measurementUnits === 'metric') {
      heightInches = heightInches / 2.54;
    }

    heightInches = Math.round(heightInches * 10) / 10;

    if (blockQuantities[heightInches] !== undefined) return;

    setBlockQuantities((prev) => ({
      ...prev,
      [heightInches]: 4,
    }));
    setShowAddBlockInput(false);
    setNewBlockHeight('');
  }, [newBlockHeight, settings.measurementUnits, blockQuantities]);

  const formatHeight = (inches: number) => {
    if (settings.measurementUnits === 'metric') {
      const cm = Math.round(inches * 2.54);
      return `${cm} cm`;
    }
    if (inches === 0.5) return '½"';
    if (inches === 1.5) return '1½"';
    if (inches === 2.5) return '2½"';
    if (inches === 3.5) return '3½"';
    if (Number.isInteger(inches)) return `${inches}"`;
    return `${inches}"`;
  };

  const handleSave = () => {
    // Convert blockQuantities back to BlockInventory array
    const blockInventory: BlockInventory[] = hasLevelingBlocks
      ? Object.entries(blockQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([height, quantity]) => ({
            thickness: parseFloat(height),
            quantity,
          }))
          .sort((a, b) => b.thickness - a.thickness)
      : [];

    onSave({
      name,
      type: vehicleType,
      wheelbaseInches,
      trackWidthInches,
      hitchOffsetInches: vehicleType === 'trailer' ? hitchOffsetInches : undefined,
      blockInventory,
    });
  };

  const canSave = name.trim().length > 0 && !vehicleNameTaken;

  const sortedHeights = Object.keys(blockQuantities)
    .map((h) => parseFloat(h))
    .sort((a, b) => a - b);

  const totalBlocks = Object.values(blockQuantities).reduce((sum, qty) => sum + qty, 0);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: screenColors.overlayBg }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[
            styles.modalContainer,
            { backgroundColor: screenColors.modalBg, borderColor: screenColors.modalBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: screenColors.modalBorder }]}>
            <Text style={[styles.headerTitle, { color: screenColors.text }]}>Edit Profile</Text>
          </View>

          {/* Scrollable Content */}
          <ScrollViewWithChevron
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.content}>
              {/* Vehicle Name Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: screenColors.text }]}>
                    Vehicle Name
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: screenColors.inputBg,
                        borderColor: vehicleNameTaken ? '#ef4444' : screenColors.inputBorder,
                        color: screenColors.text,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter vehicle name"
                    placeholderTextColor={screenColors.placeholder}
                    selectTextOnFocus={true}
                  />
                  {vehicleNameTaken && (
                    <Text style={styles.errorText}>A vehicle with this name already exists</Text>
                  )}
                </View>
              </GlassCard>

              {/* Vehicle Type Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: screenColors.text }]}>
                    Vehicle Type
                  </Text>
                  <View style={styles.vehicleTypeRow}>
                    {VEHICLE_TYPES.map((vt) => {
                      const isSelected = vehicleType === vt.id;
                      const VehicleIcon = vt.Icon;
                      return (
                        <TouchableOpacity
                          key={vt.id}
                          style={[
                            styles.vehicleTypeOption,
                            {
                              backgroundColor: screenColors.optionBg,
                              borderColor: screenColors.optionBorder,
                            },
                            isSelected && {
                              backgroundColor: screenColors.optionSelectedBg,
                              borderColor: screenColors.optionSelectedBorder,
                            },
                          ]}
                          onPress={() => setVehicleType(vt.id as 'trailer' | 'motorhome' | 'van')}
                        >
                          <View style={styles.vehicleTypeIconWrapper}>
                            <VehicleIcon
                              size={vt.iconSize}
                              color={isSelected ? screenColors.primary : screenColors.iconColor}
                            />
                          </View>
                          <Text
                            style={[
                              styles.vehicleTypeLabel,
                              { color: screenColors.textSecondary },
                              isSelected && { color: screenColors.primary, fontWeight: '600' },
                            ]}
                          >
                            {vt.name.split('/')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </GlassCard>

              {/* Measurements Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: screenColors.text }]}>
                    Measurements
                  </Text>

                  {/* Wheelbase - only for motorhomes/vans */}
                  {vehicleType !== 'trailer' && (
                    <View style={styles.measurementRow}>
                      <Text
                        style={[styles.measurementLabel, { color: screenColors.textSecondary }]}
                      >
                        Wheelbase ({unitLabel})
                      </Text>
                      <TextInput
                        style={[
                          styles.measurementInput,
                          {
                            backgroundColor: screenColors.inputBg,
                            borderColor: screenColors.inputBorder,
                            color: screenColors.text,
                          },
                        ]}
                        value={String(
                          convertForDisplay(wheelbaseInches, settings.measurementUnits)
                        )}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setWheelbaseInches(convertToInches(value, settings.measurementUnits));
                        }}
                        keyboardType="decimal-pad"
                        placeholder="240"
                        placeholderTextColor={screenColors.placeholder}
                        selectTextOnFocus={true}
                      />
                      <Text style={[styles.measurementHint, { color: screenColors.textMuted }]}>
                        Distance between front and rear axles
                      </Text>
                    </View>
                  )}

                  {/* Hitch Offset - only for trailers (first for trailers) */}
                  {vehicleType === 'trailer' && (
                    <View style={styles.measurementRow}>
                      <Text
                        style={[styles.measurementLabel, { color: screenColors.textSecondary }]}
                      >
                        Hitch Offset ({unitLabel})
                      </Text>
                      <TextInput
                        style={[
                          styles.measurementInput,
                          {
                            backgroundColor: screenColors.inputBg,
                            borderColor: screenColors.inputBorder,
                            color: screenColors.text,
                          },
                        ]}
                        value={String(
                          convertForDisplay(hitchOffsetInches, settings.measurementUnits)
                        )}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setHitchOffsetInches(convertToInches(value, settings.measurementUnits));
                        }}
                        keyboardType="decimal-pad"
                        placeholder="120"
                        placeholderTextColor={screenColors.placeholder}
                        selectTextOnFocus={true}
                      />
                      <Text style={[styles.measurementHint, { color: screenColors.textMuted }]}>
                        Distance from rear axle center to hitch ball
                      </Text>
                    </View>
                  )}

                  {/* Track Width - always shown (second for all vehicle types) */}
                  <View style={styles.measurementRow}>
                    <Text style={[styles.measurementLabel, { color: screenColors.textSecondary }]}>
                      Track Width ({unitLabel})
                    </Text>
                    <TextInput
                      style={[
                        styles.measurementInput,
                        {
                          backgroundColor: screenColors.inputBg,
                          borderColor: screenColors.inputBorder,
                          color: screenColors.text,
                        },
                      ]}
                      value={String(convertForDisplay(trackWidthInches, settings.measurementUnits))}
                      onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        setTrackWidthInches(convertToInches(value, settings.measurementUnits));
                      }}
                      keyboardType="decimal-pad"
                      placeholder="96"
                      placeholderTextColor={screenColors.placeholder}
                      selectTextOnFocus={true}
                    />
                    <Text style={[styles.measurementHint, { color: screenColors.textMuted }]}>
                      Distance between left and right wheels
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Block Inventory Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: screenColors.text }]}>
                    Leveling Blocks
                  </Text>

                  <View style={styles.switchRow}>
                    <GlassToggle value={hasLevelingBlocks} onValueChange={setHasLevelingBlocks} />
                    <Text style={[styles.switchLabel, { color: screenColors.text }]}>
                      {hasLevelingBlocks
                        ? 'I have leveling blocks'
                        : "I don't have leveling blocks"}
                    </Text>
                  </View>

                  {hasLevelingBlocks && (
                    <View style={styles.blocksSection}>
                      {sortedHeights.length > 0 ? (
                        <View style={styles.blocksList}>
                          {sortedHeights.map((height) => {
                            const quantity = blockQuantities[height] || 0;
                            const hasBlocks = quantity > 0;

                            return (
                              <View
                                key={height}
                                style={[
                                  styles.blockItem,
                                  {
                                    backgroundColor: screenColors.blockItemBg,
                                    borderColor: screenColors.blockItemBorder,
                                  },
                                  hasBlocks && {
                                    backgroundColor: screenColors.blockItemActiveBg,
                                    borderColor: screenColors.blockItemActiveBorder,
                                  },
                                ]}
                              >
                                <TouchableOpacity
                                  style={styles.deleteBlockButton}
                                  onPress={() => deleteBlockSize(height)}
                                  activeOpacity={0.6}
                                >
                                  <Trash2 size={16} color={screenColors.danger} />
                                </TouchableOpacity>
                                <Text style={[styles.blockHeight, { color: screenColors.text }]}>
                                  {formatHeight(height)}
                                </Text>
                                <View style={styles.quantityControls}>
                                  <TouchableOpacity
                                    style={[
                                      styles.quantityButton,
                                      {
                                        backgroundColor: screenColors.quantityBtnBg,
                                        borderColor: screenColors.quantityBtnBorder,
                                      },
                                      quantity === 0 && styles.quantityButtonDisabled,
                                    ]}
                                    onPress={() => updateBlockQuantity(height, -1)}
                                    disabled={quantity === 0}
                                    activeOpacity={0.6}
                                    delayPressIn={0}
                                  >
                                    <Text
                                      style={[
                                        styles.quantityButtonText,
                                        { color: screenColors.text },
                                      ]}
                                    >
                                      −
                                    </Text>
                                  </TouchableOpacity>
                                  <Text
                                    style={[
                                      styles.quantityValue,
                                      { color: screenColors.textSecondary },
                                      hasBlocks && { color: screenColors.success },
                                    ]}
                                  >
                                    {quantity}
                                  </Text>
                                  <TouchableOpacity
                                    style={[
                                      styles.quantityButton,
                                      {
                                        backgroundColor: screenColors.quantityBtnBg,
                                        borderColor: screenColors.quantityBtnBorder,
                                      },
                                    ]}
                                    onPress={() => updateBlockQuantity(height, 1)}
                                    activeOpacity={0.6}
                                    delayPressIn={0}
                                  >
                                    <Text
                                      style={[
                                        styles.quantityButtonText,
                                        { color: screenColors.text },
                                      ]}
                                    >
                                      +
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={[styles.noBlocksText, { color: screenColors.textMuted }]}>
                          No block sizes added. Tap below to add some.
                        </Text>
                      )}

                      {totalBlocks > 0 && (
                        <View
                          style={[
                            styles.totalBlocksCard,
                            {
                              backgroundColor: screenColors.totalCardBg,
                              borderColor: screenColors.totalCardBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.totalBlocksText, { color: screenColors.success }]}>
                            Total: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} (
                            {sortedHeights.length} size{sortedHeights.length !== 1 ? 's' : ''})
                          </Text>
                        </View>
                      )}

                      {/* Add Block Size */}
                      {!showAddBlockInput ? (
                        <TouchableOpacity
                          style={[
                            styles.addBlockButton,
                            {
                              backgroundColor: screenColors.addBtnBg,
                              borderColor: screenColors.addBtnBorder,
                            },
                          ]}
                          onPress={() => {
                            setShowAddBlockInput(true);
                            // Scroll to bottom after input appears
                            globalThis.setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 150);
                          }}
                        >
                          <Plus size={18} color={screenColors.primary} />
                          <Text
                            style={[styles.addBlockButtonText, { color: screenColors.primary }]}
                          >
                            Add Block Size
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={[
                            styles.addBlockInputContainer,
                            {
                              backgroundColor: screenColors.addInputBg,
                              borderColor: screenColors.addInputBorder,
                            },
                          ]}
                        >
                          <View style={styles.addBlockInputGroup}>
                            <Text
                              style={[styles.addBlockLabel, { color: screenColors.textSecondary }]}
                            >
                              Height ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'}):
                            </Text>
                            <View style={styles.addBlockInputRow}>
                              <TextInput
                                style={[
                                  styles.addBlockInput,
                                  {
                                    backgroundColor: screenColors.addInputFieldBg,
                                    borderColor: screenColors.addInputFieldBorder,
                                    color: screenColors.text,
                                  },
                                ]}
                                placeholder="e.g., 2"
                                placeholderTextColor={screenColors.placeholder}
                                keyboardType="decimal-pad"
                                value={newBlockHeight}
                                onChangeText={setNewBlockHeight}
                                autoFocus
                                selectTextOnFocus={true}
                                onFocus={() => {
                                  // Scroll to bottom to ensure input is visible above keyboard
                                  globalThis.setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                  }, 100);
                                }}
                              />
                              <GlassButton
                                variant="primary"
                                size="sm"
                                onPress={addBlockSize}
                                style={styles.addBlockActionButton}
                              >
                                Add
                              </GlassButton>
                              <GlassButton
                                variant="default"
                                size="sm"
                                onPress={() => {
                                  setShowAddBlockInput(false);
                                  setNewBlockHeight('');
                                }}
                                style={styles.addBlockActionButton}
                              >
                                Cancel
                              </GlassButton>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </GlassCard>
            </View>
          </ScrollViewWithChevron>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: screenColors.modalBorder }]}>
            <GlassButton variant="default" size="md" onPress={onCancel} style={styles.footerButton}>
              Cancel
            </GlassButton>
            <GlassButton
              variant={canSave ? 'success' : 'ghost'}
              size="md"
              disabled={!canSave}
              onPress={handleSave}
              style={styles.footerButton}
            >
              Save
            </GlassButton>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    height: '85%',
    backgroundColor: THEME.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  textInput: {
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 6,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vehicleTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    gap: 6,
  },
  vehicleTypeIconWrapper: {
    height: 28, // Fixed height matching all icons
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleTypeOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  vehicleTypeLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  vehicleTypeLabelSelected: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  measurementLabel: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  measurementInput: {
    width: 100,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  measurementHint: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(163, 163, 163, 0.9)',
    marginLeft: 12,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: THEME.colors.text,
  },
  blocksSection: {
    gap: 12,
    marginTop: 8,
  },
  blocksList: {
    gap: 8,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blockItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  deleteBlockButton: {
    padding: 6,
    marginRight: 8,
  },
  blockHeight: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityButtonText: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textSecondary,
    minWidth: 28,
    textAlign: 'center',
  },
  quantityValueActive: {
    color: THEME.colors.success,
  },
  noBlocksText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  totalBlocksCard: {
    padding: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  totalBlocksText: {
    color: THEME.colors.success,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  addBlockButtonText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addBlockInputContainer: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  addBlockInputGroup: {
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  addBlockLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  addBlockInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addBlockInput: {
    width: 80,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: THEME.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  addBlockActionButton: {
    minWidth: 80,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  footerButton: {
    flex: 1,
  },
});
