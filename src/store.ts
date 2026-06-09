import { create } from 'zustand';
import { AppState, LEDFrame } from './types';

const EMPTY_LEDS = Array(64).fill(false);

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAppStore = create<AppState>((set, get) => ({
  frames: [],
  currentLeds: [...EMPTY_LEDS],
  currentTime: 0,
  visiblePlanes: [true, true, true, true],
  isPlaying: false,
  maxTime: 100,

  toggleLed: (index: number) => {
    set((state) => {
      const newLeds = [...state.currentLeds];
      newLeds[index] = !newLeds[index];
      return { currentLeds: newLeds };
    });
  },

  setVisiblePlane: (planeIndex: number, visible: boolean) => {
    set((state) => {
      const newPlanes = [...state.visiblePlanes];
      newPlanes[planeIndex] = visible;
      return { visiblePlanes: newPlanes };
    });
  },

  toggleVisiblePlane: (planeIndex: number) => {
    set((state) => {
      const newPlanes = [...state.visiblePlanes];
      newPlanes[planeIndex] = !newPlanes[planeIndex];
      return { visiblePlanes: newPlanes };
    });
  },

  setCurrentTime: (time: number) => {
    const safeTime = Math.max(0, time);
    
    // Find if there is a frame at or before this time to show its state
    const { frames } = get();
    let displayLeds = [...get().currentLeds]; // default to current
    
    if (frames.length > 0) {
      // Find the closest frame before or equal to current time
      const sortedFrames = [...frames].sort((a, b) => a.time - b.time);
      let activeFrame = sortedFrames[0];
      for (const frame of sortedFrames) {
        if (frame.time <= safeTime) {
          activeFrame = frame;
        } else {
          break;
        }
      }
      
      if (activeFrame && activeFrame.time <= safeTime) {
        displayLeds = [...activeFrame.leds];
      }
    }

    set({ 
      currentTime: safeTime,
      currentLeds: displayLeds,
      maxTime: Math.max(get().maxTime, safeTime + 20)
    });
  },

  addKeyframe: () => {
    set((state) => {
      const existingFrameIndex = state.frames.findIndex((f) => f.time === state.currentTime);
      const newFrames = [...state.frames];
      
      if (existingFrameIndex >= 0) {
        // Update existing frame
        newFrames[existingFrameIndex] = {
          ...newFrames[existingFrameIndex],
          leds: [...state.currentLeds],
        };
      } else {
        // Add new frame
        newFrames.push({
          id: generateId(),
          time: state.currentTime,
          leds: [...state.currentLeds],
        });
      }
      return { frames: newFrames };
    });
  },

  removeKeyframe: (id: string) => {
    set((state) => ({
      frames: state.frames.filter((f) => f.id !== id),
    }));
  },

  updateKeyframeTime: (id: string, newTime: number) => {
    set((state) => ({
      frames: state.frames.map((f) => (f.id === id ? { ...f, time: Math.max(0, newTime) } : f)),
    }));
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  importProject: (importedFrames: LEDFrame[]) => {
    if (importedFrames.length === 0) return;
    const sorted = [...importedFrames].sort((a, b) => a.time - b.time);
    const maxTime = Math.max(100, sorted[sorted.length - 1].time + 20);
    set({
      frames: importedFrames,
      currentTime: 0,
      currentLeds: [...sorted[0].leds],
      maxTime,
    });
  },

  clearProject: () => {
    set({
      frames: [],
      currentLeds: [...EMPTY_LEDS],
      currentTime: 0,
    });
  },
}));
