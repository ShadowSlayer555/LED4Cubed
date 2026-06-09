import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
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
    isPlaying,
    setIsPlaying,
  } = useAppStore();

  const trackRef = useRef<HTMLDivElement>(null);
  const playheadInterval = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-playback logic
  useEffect(() => {
    if (isPlaying) {
      playheadInterval.current = window.setInterval(() => {
        useAppStore.setState((state) => {
          let nextTime = state.currentTime + 1;
          if (nextTime > state.maxTime) {
            nextTime = 0; // Loop back to start
          }
          state.setCurrentTime(nextTime);
          return {}; // Must return an object to satisfy zustand, though we already updated via setCurrentTime inside
        });
      }, 100); // 100ms per "tick", mimicking PLANETIME
    } else {
      if (playheadInterval.current) {
        clearInterval(playheadInterval.current);
      }
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
    if (isDragging) {
      handleTrackInteraction(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const sortedFrames = [...frames].sort((a, b) => a.time - b.time);
  const hasFrameAtCurrent = frames.some((f) => f.time === currentTime);

  return (
    <div className="flex flex-col bg-neutral-800 text-white rounded-lg p-4 h-48 select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded hover:bg-neutral-700 text-white"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
            onClick={addKeyframe}
          >
            <Plus size={16} />
            <span>{hasFrameAtCurrent ? 'Update Keyframe' : 'Add Keyframe'}</span>
          </button>
        </div>

        <div className="text-sm font-mono bg-neutral-900 px-3 py-1 rounded">
          Time: <span className="text-blue-400">{currentTime}</span> / {maxTime}
        </div>
      </div>

      <div className="flex-1 relative mt-4">
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
              className="absolute top-0 bottom-0 border-l border-neutral-800"
              style={{ left: `${(i / 10) * 100}%` }}
            />
          ))}

          {/* Keyframes Markers */}
          {sortedFrames.map((frame) => {
            const pct = (frame.time / maxTime) * 100;
            return (
              <div
                key={frame.id}
                className="absolute top-1/2 -mt-3 w-3 h-6 bg-yellow-500 rounded-sm hover:scale-125 transition-transform"
                style={{ left: `calc(${pct}% - 6px)` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setCurrentTime(frame.time);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  removeKeyframe(frame.id);
                }}
                title="Double click to delete"
              />
            );
          })}

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${(currentTime / maxTime) * 100}%` }}
          >
            <div className="absolute -top-2 left-1/2 -ml-1.5 w-3 h-3 rotate-45 bg-red-500" />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-neutral-500 mt-2">
        Click/drag on track to set time. Double click keyframe (yellow) to delete.
      </div>
    </div>
  );
}
