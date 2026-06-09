import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Settings2, Info } from 'lucide-react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';

export function Timeline() {
  const {
    frames,
    currentTime,
    maxTime,
    setCurrentTime,
    addKeyframe,
    removeKeyframe,
    updateKeyframeTime,
    isPlaying,
    setIsPlaying,
    interpolate, setInterpolate,
    loopMode, setLoopMode,
    pingPong, setPingPong,
    repetitions, setRepetitions,
    setMaxTime,
  } = useAppStore();

  const trackRef = useRef<HTMLDivElement>(null);
  const playheadInterval = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingKeyframe, setDraggingKeyframe] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  
  const [localMaxTime, setLocalMaxTime] = useState(maxTime.toString());
  const [localReps, setLocalReps] = useState(repetitions.toString());

  useEffect(() => setLocalMaxTime(maxTime.toString()), [maxTime]);
  useEffect(() => setLocalReps(repetitions.toString()), [repetitions]);

  const playDirRef = useRef<number>(1);

  // Auto-playback logic
  useEffect(() => {
    if (isPlaying) {
      playheadInterval.current = window.setInterval(() => {
        useAppStore.setState((state) => {
          let nextTime = state.currentTime + playDirRef.current;
          let newPlaying = true;
          let newDir = playDirRef.current;

          if (nextTime > state.maxTime) {
            if (state.loopMode) {
              if (state.pingPong) {
                newDir = -1;
                nextTime = state.maxTime - 1;
              } else {
                nextTime = 0;
              }
            } else {
              nextTime = state.maxTime;
              newPlaying = false; 
            }
          } else if (nextTime < 0) {
            if (state.loopMode && state.pingPong) {
              newDir = 1;
              nextTime = 1;
            } else {
              nextTime = 0;
              newPlaying = false;
            }
          }
          
          playDirRef.current = newDir;
          if (!newPlaying) {
             state.setIsPlaying(false);
          } else {
             state.setCurrentTime(nextTime);
          }
          return {};
        });
      }, 100); // 100ms per "tick", mimicking PLANETIME
    } else {
      if (playheadInterval.current) clearInterval(playheadInterval.current);
    }
    return () => {
      if (playheadInterval.current) clearInterval(playheadInterval.current);
    };
  }, [isPlaying]);

  const handleTrackInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = Math.round(pct * maxTime);
    setCurrentTime(newTime);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleTrackInteraction(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingKeyframe && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = Math.round(pct * maxTime);
      updateKeyframeTime(draggingKeyframe, newTime);
      setCurrentTime(newTime);
    } else if (isDragging) {
      handleTrackInteraction(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const toggleInfo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenInfo(openInfo === id ? null : id);
  };

  const sortedFrames = [...frames].sort((a, b) => a.time - b.time);
  const currentFrame = frames.find((f) => f.time === currentTime);

  return (
    <div className="flex flex-col bg-neutral-800 text-white rounded-lg p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded hover:bg-neutral-700 text-white transition-colors"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            onClick={addKeyframe}
          >
            <Plus size={16} />
            <span>{currentFrame ? 'Update Keyframe' : 'Add Keyframe'}</span>
          </button>

          {currentFrame && (
            <button
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition-colors"
              onClick={() => removeKeyframe(currentFrame.id)}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}

          <button
            className={cn("p-2 rounded transition-colors ml-2", showSettings ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white")}
            onClick={() => setShowSettings(!showSettings)}
            title="Animation Settings"
          >
            <Settings2 size={18} />
          </button>
        </div>

        <div className="text-sm font-mono bg-neutral-900 px-3 py-1 rounded">
          Time: <span className="text-blue-400">{currentTime}</span> / {maxTime}
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-neutral-900 rounded-lg border border-neutral-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm relative">
          <div>
            <label className="flex items-center gap-1 text-neutral-400 mb-1 text-xs">
              Total Time (Max)
              <button aria-label="info" onClick={(e) => toggleInfo('maxTime', e)}><Info size={12} className="text-neutral-500 hover:text-blue-400" /></button>
            </label>
            <input 
              type="number" 
              min={10} 
              value={localMaxTime} 
              onChange={e => setLocalMaxTime(e.target.value)}
              onBlur={() => {
                const val = parseInt(localMaxTime, 10);
                if (!isNaN(val)) setMaxTime(val);
                else setLocalMaxTime(maxTime.toString());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(localMaxTime, 10);
                  if (!isNaN(val)) setMaxTime(val);
                }
              }}
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
            />
            {openInfo === 'maxTime' && <div className="mt-1 text-[10px] text-blue-300 leading-tight">The maximum duration of the timeline. The animation will loop or stop depending on the settings below.</div>}
          </div>
          <div className="flex flex-col justify-center mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="loopToggle" 
                checked={loopMode} 
                onChange={e => setLoopMode(e.target.checked)} 
                className="rounded bg-neutral-800 border-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900" 
              />
              <label htmlFor="loopToggle" className="cursor-pointer flex items-center gap-1">
                Loop Animation
                <button aria-label="info" onClick={(e) => toggleInfo('loop', e)}><Info size={12} className="text-neutral-500 hover:text-blue-400" /></button>
              </label>
            </div>
            {openInfo === 'loop' && <div className="mt-1 text-[10px] text-blue-300 leading-tight">Replays continuously in a loop when exported.</div>}
          </div>
          {loopMode ? (
            <div className="flex flex-col justify-center mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-yellow-500">
                <input 
                  type="checkbox" 
                  id="pingPong" 
                  checked={pingPong} 
                  onChange={e => setPingPong(e.target.checked)} 
                  className="rounded bg-neutral-800 border-neutral-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900" 
                />
                <label htmlFor="pingPong" className="cursor-pointer flex items-center gap-1">
                  Ping-Pong (Reverse)
                  <button aria-label="info" onClick={(e) => toggleInfo('pingpong', e)}><Info size={12} className="text-neutral-500 hover:text-blue-400" /></button>
                </label>
              </div>
              {openInfo === 'pingpong' && <div className="mt-1 text-[10px] text-yellow-300 leading-tight">Plays forward, then reverses backwards back to the start each loop.</div>}
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-1 text-neutral-400 mb-1 text-xs">
                Repetitions
                <button aria-label="info" onClick={(e) => toggleInfo('repetitions', e)}><Info size={12} className="text-neutral-500 hover:text-blue-400" /></button>
              </label>
              <input 
                type="number" 
                min={1} 
                value={localReps} 
                onChange={e => setLocalReps(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localReps, 10);
                  if (!isNaN(val)) setRepetitions(val);
                  else setLocalReps(repetitions.toString());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(localReps, 10);
                    if (!isNaN(val)) setRepetitions(val);
                  }
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
              />
              {openInfo === 'repetitions' && <div className="mt-1 text-[10px] text-blue-300 leading-tight">How many times the animation should play before the code exits/halts.</div>}
            </div>
          )}
          <div className="flex flex-col justify-center mt-4 md:mt-0 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="interpolate" 
                checked={interpolate} 
                onChange={e => setInterpolate(e.target.checked)} 
                className="rounded bg-neutral-800 border-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900" 
              />
              <label htmlFor="interpolate" className="cursor-pointer flex items-center gap-1 text-purple-400">
                Interpolate Movement
                <button aria-label="info" onClick={(e) => toggleInfo('interpolate', e)}><Info size={12} className="text-purple-400 hover:text-blue-400" /></button>
              </label>
            </div>
            {openInfo === 'interpolate' && <div className="mt-1 text-[10px] text-purple-300 leading-tight">Automatically generates smooth transition frames between keyframes based on LED distances.</div>}
          </div>
        </div>
      )}

      <div className="flex-1 relative mt-4 h-12 select-none">
        {/* Timeline Track */}
        <div 
          ref={trackRef}
          className="absolute inset-x-0 top-1/2 -mt-4 h-8 bg-neutral-900 rounded cursor-pointer border border-neutral-700"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Ticks marks */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 bottom-0 border-l border-neutral-800 pointer-events-none"
              style={{ left: `${(i / 10) * 100}%` }}
            />
          ))}

          {/* Keyframes Markers */}
          {sortedFrames.map((frame) => {
            const pct = (frame.time / maxTime) * 100;
            return (
              <div
                key={frame.id}
                className="absolute top-1/2 -mt-3 w-3 h-6 bg-yellow-500 rounded-sm hover:scale-125 transition-transform cursor-grab active:cursor-grabbing z-20"
                style={{ left: `calc(${pct}% - 6px)` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDraggingKeyframe(frame.id);
                  setCurrentTime(frame.time);
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setDraggingKeyframe(null);
                  (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  removeKeyframe(frame.id);
                }}
                title="Drag to move, double-click or use Delete button"
              />
            );
          })}

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none transition-all duration-75"
            style={{ left: `${(currentTime / maxTime) * 100}%` }}
          >
            <div className="absolute -top-2 left-1/2 -ml-1.5 w-3 h-3 rotate-45 bg-red-500" />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-neutral-500 mt-2">
        Click/drag on track to set time. Drag keyframes (yellow) to change their time.
      </div>
    </div>
  );
}
