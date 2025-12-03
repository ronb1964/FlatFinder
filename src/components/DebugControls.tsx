import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useDebugStore } from '../state/debugStore';
import { X, Sliders } from 'lucide-react-native';

// Declare global __DEV__ for TypeScript if needed
declare const __DEV__: boolean;

export function DebugControls() {
  const {
    isDebugMode,
    mockPitch,
    mockRoll,
    mockHeading,
    setDebugMode,
    setMockPitch,
    setMockRoll,
    setMockHeading,
    resetMockValues,
  } = useDebugStore();

  // Local state for smooth slider interaction
  const [localPitch, setLocalPitch] = useState(mockPitch);
  const [localRoll, setLocalRoll] = useState(mockRoll);
  const [localHeading, setLocalHeading] = useState(mockHeading);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync local state when store values change externally (e.g., reset button)
  useEffect(() => {
    setLocalPitch(mockPitch);
  }, [mockPitch]);

  useEffect(() => {
    setLocalRoll(mockRoll);
  }, [mockRoll]);

  useEffect(() => {
    setLocalHeading(mockHeading);
  }, [mockHeading]);

  // Only show in development or on web
  if (!__DEV__ && Platform.OS !== 'web') return null;

  const openModal = () => {
    setDebugMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating DBG Button - always visible */}
      <TouchableOpacity style={styles.floatingButton} onPress={openModal}>
        <Text style={styles.floatingButtonText}>DBG</Text>
      </TouchableOpacity>

      {/* Modal with Debug Controls */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Sliders size={20} color="#3b82f6" />
                  <Text style={styles.headerTitle}>Virtual Device</Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <X size={24} color="#a3a3a3" />
                </TouchableOpacity>
              </View>

              {/* Simulate Sensors Toggle */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Simulate Sensors</Text>
                <Switch
                  value={isDebugMode}
                  onValueChange={setDebugMode}
                  trackColor={{ false: '#333', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Info text */}
              <Text style={styles.infoText}>
                Use these sliders to simulate phone sensor values for testing.
              </Text>

              {/* Pitch Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Pitch</Text>
                  <Text style={styles.sliderValue}>{localPitch.toFixed(1)}°</Text>
                </View>
                <Text style={styles.sliderHint}>Nose Up/Down</Text>
                <Slider
                  style={styles.slider}
                  value={localPitch}
                  onValueChange={(val) => {
                    setLocalPitch(val);
                    setMockPitch(val);
                  }}
                  minimumValue={-15}
                  maximumValue={15}
                  step={0.5}
                  minimumTrackTintColor="#ef4444"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#fff"
                />
                <View style={styles.sliderRange}>
                  <Text style={styles.rangeText}>-15°</Text>
                  <Text style={styles.rangeText}>0°</Text>
                  <Text style={styles.rangeText}>+15°</Text>
                </View>
              </View>

              {/* Roll Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Roll</Text>
                  <Text style={styles.sliderValue}>{localRoll.toFixed(1)}°</Text>
                </View>
                <Text style={styles.sliderHint}>Left/Right Tilt</Text>
                <Slider
                  style={styles.slider}
                  value={localRoll}
                  onValueChange={(val) => {
                    setLocalRoll(val);
                    setMockRoll(val);
                  }}
                  minimumValue={-15}
                  maximumValue={15}
                  step={0.5}
                  minimumTrackTintColor="#3b82f6"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#fff"
                />
                <View style={styles.sliderRange}>
                  <Text style={styles.rangeText}>-15°</Text>
                  <Text style={styles.rangeText}>0°</Text>
                  <Text style={styles.rangeText}>+15°</Text>
                </View>
              </View>

              {/* Heading Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Heading</Text>
                  <Text style={styles.sliderValue}>{localHeading.toFixed(0)}°</Text>
                </View>
                <Text style={styles.sliderHint}>Compass Direction</Text>
                <Slider
                  style={styles.slider}
                  value={localHeading}
                  onValueChange={(val) => {
                    setLocalHeading(val);
                    setMockHeading(val);
                  }}
                  minimumValue={0}
                  maximumValue={359}
                  step={1}
                  minimumTrackTintColor="#22c55e"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#fff"
                />
                <View style={styles.sliderRange}>
                  <Text style={styles.rangeText}>N 0°</Text>
                  <Text style={styles.rangeText}>S 180°</Text>
                  <Text style={styles.rangeText}>N 359°</Text>
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity style={styles.resetButton} onPress={resetMockValues}>
                <Text style={styles.resetButtonText}>Reset to Level (0°)</Text>
              </TouchableOpacity>

              {/* Current Values Display */}
              <View style={styles.currentValues}>
                <Text style={styles.currentValuesTitle}>Current Simulated Values</Text>
                <View style={styles.valuesRow}>
                  <View style={styles.valueBox}>
                    <Text style={[styles.valueBoxNumber, { color: '#ef4444' }]}>
                      {localPitch.toFixed(1)}°
                    </Text>
                    <Text style={styles.valueBoxLabel}>Pitch</Text>
                  </View>
                  <View style={styles.valueBox}>
                    <Text style={[styles.valueBoxNumber, { color: '#3b82f6' }]}>
                      {localRoll.toFixed(1)}°
                    </Text>
                    <Text style={styles.valueBoxLabel}>Roll</Text>
                  </View>
                  <View style={styles.valueBox}>
                    <Text style={[styles.valueBoxNumber, { color: '#22c55e' }]}>
                      {localHeading.toFixed(0)}°
                    </Text>
                    <Text style={styles.valueBoxLabel}>Heading</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    left: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: '55%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fafafa',
  },
  closeButton: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
  },
  infoText: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fafafa',
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fafafa',
  },
  sliderHint: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  rangeText: {
    fontSize: 11,
    color: '#525252',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  currentValues: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
  },
  currentValuesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737373',
    textAlign: 'center',
    marginBottom: 10,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  valueBox: {
    alignItems: 'center',
  },
  valueBoxNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  valueBoxLabel: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },
});
