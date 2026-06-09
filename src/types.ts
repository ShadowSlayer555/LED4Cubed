export interface LEDFrame {
  id: string;
  time: number;
  leds: boolean[];
}

export interface AppState {
  frames: LEDFrame[];
  currentLeds: boolean[];
  currentTime: number;
  visiblePlanes: boolean[];
  isPlaying: boolean;
  maxTime: number;

  toggleLed: (index: number) => void;
  setVisiblePlane: (planeIndex: number, visible: boolean) => void;
  toggleVisiblePlane: (planeIndex: number) => void;
  setCurrentTime: (time: number) => void;
  addKeyframe: () => void;
  removeKeyframe: (id: string) => void;
  updateKeyframeTime: (id: string, newTime: number) => void;
  setIsPlaying: (playing: boolean) => void;
  importProject: (frames: LEDFrame[]) => void;
  clearProject: () => void;
}
