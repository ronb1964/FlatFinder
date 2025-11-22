import { create } from 'zustand';

interface DebugState {
  isDebugMode: boolean;
  mockPitch: number;
  mockRoll: number;
  setDebugMode: (enabled: boolean) => void;
  setMockPitch: (pitch: number) => void;
  setMockRoll: (roll: number) => void;
  resetMockValues: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  isDebugMode: false,
  mockPitch: 0,
  mockRoll: 0,
  setDebugMode: (enabled) => set({ isDebugMode: enabled }),
  setMockPitch: (pitch) => set({ mockPitch: pitch }),
  setMockRoll: (roll) => set({ mockRoll: roll }),
  resetMockValues: () => set({ mockPitch: 0, mockRoll: 0 }),
}));
