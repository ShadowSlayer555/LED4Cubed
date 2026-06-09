import { create } from 'zustand';
import { AppState, LEDFrame } from './types';
import { interpolateLeds } from './lib/interpolation';

const EMPTY_LEDS = Array(64).fill(false);

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAppStore = create<AppState>((set, get) => ({
  frames: [],
  currentLeds: [...EMPTY_LEDS],
  currentTime: 0,
  visiblePlanes: [true, true, true, true],
  isPlaying: false,
  maxTime: 100,

  interpolate: false,
  loopMode: true,
  pingPong: false,
  repetitions: 1,

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
    const safeTime = Math.max(0, Math.min(time, get().maxTime));
    
    // Find if there is a frame at or before this time to show its state
    const { frames, interpolate } = get();
    let displayLeds = [...get().currentLeds]; // default to current
    
    if (frames.length > 0) {
      // Find the closest frame before or equal to current time
      const sortedFrames = [...frames].sort((a, b) => a.time - b.time);
      let activeFrame = sortedFrames[0];
      let nextFrame = sortedFrames[sortedFrames.length - 1];

      for (let i = 0; i < sortedFrames.length; i++) {
        const frame = sortedFrames[i];
        if (frame.time <= safeTime) {
          activeFrame = frame;
        }
        if (frame.time >= safeTime) {
          nextFrame = frame;
          break;
        }
      }
      
      if (interpolate && activeFrame.time !== nextFrame.time && safeTime >= activeFrame.time && safeTime <= nextFrame.time) {
        const t = (safeTime - activeFrame.time) / (nextFrame.time - activeFrame.time);
        displayLeds = interpolateLeds(activeFrame.leds, nextFrame.leds, t);
      } else if (activeFrame && activeFrame.time <= safeTime) {
         displayLeds = [...activeFrame.leds];
      }
    }

    set({ 
      currentTime: safeTime,
      currentLeds: displayLeds,
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
      frames: state.frames.map((f) => (f.id === id ? { ...f, time: Math.max(0, Math.min(newTime, state.maxTime)) } : f)),
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

  setInterpolate: (val: boolean) => set({ interpolate: val }),
  setMaxTime: (val: number) => set((state) => {
    const safeMax = Math.max(10, val);
    return { maxTime: safeMax, currentTime: Math.min(state.currentTime, safeMax) };
  }),
  setLoopMode: (val: boolean) => set({ loopMode: val }),
  setPingPong: (val: boolean) => set({ pingPong: val }),
  setRepetitions: (val: number) => set({ repetitions: Math.max(1, val) }),
}));
