import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  StyleSheet,
} from 'react-native';
import { Trash2, Plus } from 'lucide-react-native';
import { TrailerIcon, MotorhomeIcon, VanIcon } from './icons/VehicleIcons';
import { GlassButton } from './ui/GlassButton';
import { GlassCard } from './ui/GlassCard';
import { useAppStore } from '../state/appStore';
import { BlockInventory } from '../lib/rvLevelingMath';
import { convertToInches, convertForDisplay } from '../lib/units';
import { THEME } from '../theme';

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
    iconSize: 28,
  },
  {
    id: 'motorhome',
    name: 'Motorhome/RV',
    Icon: MotorhomeIcon,
    iconSize: 28,
  },
  {
    id: 'van',
    name: 'Van/Camper Van',
    Icon: VanIcon,
    iconSize: 28,
  },
];

export function ProfileEditor({ profile, onSave, onCancel, isVisible }: ProfileEditorProps) {
  const { settings } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);

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

  const canSave = name.trim().length > 0;

  const sortedHeights = Object.keys(blockQuantities)
    .map((h) => parseFloat(h))
    .sort((a, b) => a - b);

  const totalBlocks = Object.values(blockQuantities).reduce((sum, qty) => sum + qty, 0);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Vehicle Name Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vehicle Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter vehicle name"
                    placeholderTextColor="#737373"
                    selectTextOnFocus={true}
                  />
                </View>
              </GlassCard>

              {/* Vehicle Type Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vehicle Type</Text>
                  <View style={styles.vehicleTypeRow}>
                    {VEHICLE_TYPES.map((vt) => {
                      const isSelected = vehicleType === vt.id;
                      const VehicleIcon = vt.Icon;
                      return (
                        <TouchableOpacity
                          key={vt.id}
                          style={[
                            styles.vehicleTypeOption,
                            isSelected && styles.vehicleTypeOptionSelected,
                          ]}
                          onPress={() => setVehicleType(vt.id as 'trailer' | 'motorhome' | 'van')}
                        >
                          <View style={styles.vehicleTypeIconWrapper}>
                            <VehicleIcon
                              size={vt.iconSize}
                              color={isSelected ? THEME.colors.primary : '#a3a3a3'}
                            />
                          </View>
                          <Text
                            style={[
                              styles.vehicleTypeLabel,
                              isSelected && styles.vehicleTypeLabelSelected,
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
                  <Text style={styles.sectionTitle}>Measurements</Text>

                  {/* Wheelbase - only for motorhomes/vans */}
                  {vehicleType !== 'trailer' && (
                    <View style={styles.measurementRow}>
                      <Text style={styles.measurementLabel}>Wheelbase ({unitLabel})</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={String(
                          convertForDisplay(wheelbaseInches, settings.measurementUnits)
                        )}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setWheelbaseInches(convertToInches(value, settings.measurementUnits));
                        }}
                        keyboardType="decimal-pad"
                        placeholder="240"
                        placeholderTextColor="#737373"
                        selectTextOnFocus={true}
                      />
                      <Text style={styles.measurementHint}>
                        Distance between front and rear axles
                      </Text>
                    </View>
                  )}

                  {/* Hitch Offset - only for trailers (first for trailers) */}
                  {vehicleType === 'trailer' && (
                    <View style={styles.measurementRow}>
                      <Text style={styles.measurementLabel}>Hitch Offset ({unitLabel})</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={String(
                          convertForDisplay(hitchOffsetInches, settings.measurementUnits)
                        )}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setHitchOffsetInches(convertToInches(value, settings.measurementUnits));
                        }}
                        keyboardType="decimal-pad"
                        placeholder="120"
                        placeholderTextColor="#737373"
                        selectTextOnFocus={true}
                      />
                      <Text style={styles.measurementHint}>
                        Distance from rear axle center to hitch ball
                      </Text>
                    </View>
                  )}

                  {/* Track Width - always shown (second for all vehicle types) */}
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Track Width ({unitLabel})</Text>
                    <TextInput
                      style={styles.measurementInput}
                      value={String(convertForDisplay(trackWidthInches, settings.measurementUnits))}
                      onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        setTrackWidthInches(convertToInches(value, settings.measurementUnits));
                      }}
                      keyboardType="decimal-pad"
                      placeholder="96"
                      placeholderTextColor="#737373"
                      selectTextOnFocus={true}
                    />
                    <Text style={styles.measurementHint}>
                      Distance between left and right wheels
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Block Inventory Section */}
              <GlassCard>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Leveling Blocks</Text>

                  <View style={styles.switchRow}>
                    <Switch
                      value={hasLevelingBlocks}
                      onValueChange={setHasLevelingBlocks}
                      trackColor={{ false: '#555', true: THEME.colors.primary }}
                      thumbColor="#fff"
                    />
                    <Text style={styles.switchLabel}>
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
                                style={[styles.blockItem, hasBlocks && styles.blockItemActive]}
                              >
                                <TouchableOpacity
                                  style={styles.deleteBlockButton}
                                  onPress={() => deleteBlockSize(height)}
                                  activeOpacity={0.6}
                                >
                                  <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                                <Text style={styles.blockHeight}>{formatHeight(height)}</Text>
                                <View style={styles.quantityControls}>
                                  <TouchableOpacity
                                    style={[
                                      styles.quantityButton,
                                      quantity === 0 && styles.quantityButtonDisabled,
                                    ]}
                                    onPress={() => updateBlockQuantity(height, -1)}
                                    disabled={quantity === 0}
                                    activeOpacity={0.6}
                                    delayPressIn={0}
                                  >
                                    <Text style={styles.quantityButtonText}>−</Text>
                                  </TouchableOpacity>
                                  <Text
                                    style={[
                                      styles.quantityValue,
                                      hasBlocks && styles.quantityValueActive,
                                    ]}
                                  >
                                    {quantity}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => updateBlockQuantity(height, 1)}
                                    activeOpacity={0.6}
                                    delayPressIn={0}
                                  >
                                    <Text style={styles.quantityButtonText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.noBlocksText}>
                          No block sizes added. Tap below to add some.
                        </Text>
                      )}

                      {totalBlocks > 0 && (
                        <View style={styles.totalBlocksCard}>
                          <Text style={styles.totalBlocksText}>
                            Total: {totalBlocks} block{totalBlocks !== 1 ? 's' : ''} (
                            {sortedHeights.length} size{sortedHeights.length !== 1 ? 's' : ''})
                          </Text>
                        </View>
                      )}

                      {/* Add Block Size */}
                      {!showAddBlockInput ? (
                        <TouchableOpacity
                          style={styles.addBlockButton}
                          onPress={() => setShowAddBlockInput(true)}
                        >
                          <Plus size={18} color={THEME.colors.primary} />
                          <Text style={styles.addBlockButtonText}>Add Block Size</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.addBlockInputContainer}>
                          <View style={styles.addBlockInputGroup}>
                            <Text style={styles.addBlockLabel}>
                              Height ({settings.measurementUnits === 'metric' ? 'cm' : 'inches'}):
                            </Text>
                            <View style={styles.addBlockInputRow}>
                              <TextInput
                                style={styles.addBlockInput}
                                placeholder="e.g., 2"
                                placeholderTextColor="#737373"
                                keyboardType="decimal-pad"
                                value={newBlockHeight}
                                onChangeText={setNewBlockHeight}
                                autoFocus
                                selectTextOnFocus={true}
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
                                variant="danger"
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
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <GlassButton variant="danger" size="md" onPress={onCancel} style={styles.footerButton}>
              Cancel
            </GlassButton>
            <GlassButton
              variant={canSave ? 'success' : 'ghost'}
              size="md"
              disabled={!canSave}
              onPress={handleSave}
              style={styles.footerButton}
            >
              Save Changes
            </GlassButton>
          </View>
        </View>
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
    maxHeight: '90%',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlockInputGroup: {
    gap: 10,
  },
  addBlockLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  addBlockInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addBlockInput: {
    flex: 1,
    maxWidth: 120,
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
