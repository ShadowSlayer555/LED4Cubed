/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cube3D } from './components/Cube3D';
import { Timeline } from './components/Timeline';
import { CodeExport } from './components/CodeExport';
import { AIGenerator } from './components/AIGenerator';
import { useAppStore } from './store';
import { Download, Upload, Trash, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'code' | 'ai'>('editor');
  const { frames, importProject, clearProject, visiblePlanes, toggleVisiblePlane } = useAppStore();

  const handleSaveProject = () => {
    const data = JSON.stringify(frames, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'led-cube-animation.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedFrames = JSON.parse(e.target?.result as string);
        if (Array.isArray(loadedFrames)) {
          importProject(loadedFrames);
        }
      } catch (err) {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="flex flex-col h-screen min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800">
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
          Cube Animator
        </h1>
        
        <div className="flex bg-neutral-800 p-1 rounded-md">
          <button
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === 'editor' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === 'code' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code Export
          </button>
          <button
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'ai' ? 'bg-purple-600/50 text-purple-200' : 'text-neutral-400 hover:text-purple-400'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={14} />
            AI Generator
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 rounded cursor-pointer transition-colors">
            <Upload size={16} />
            <span>Load</span>
            <input type="file" accept=".json" className="hidden" onChange={handleLoadProject} />
          </label>
          <button
            onClick={handleSaveProject}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
          >
            <Download size={16} />
            <span>Save</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all frames and start over?')) {
                clearProject();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-900/50 hover:bg-red-800/80 text-red-100 rounded transition-colors"
          >
            <Trash size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-h-[calc(100vh-60px)] p-4 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="flex flex-col h-full gap-4">
            <div className="flex-1 relative flex gap-4 min-h-0">
              {/* 3D Viewport */}
              <div className="flex-1 rounded-lg border border-neutral-800 overflow-hidden relative flex">
                <Cube3D />
                
                {/* Tips Box Overlay */}
                <div className="absolute bottom-4 left-4 w-64 bg-black/80 backdrop-blur-md border border-neutral-700 rounded p-4 text-sm text-neutral-300 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2 text-white font-medium">
                    <Info size={16} className="text-blue-400" />
                    <span>Controls</span>
                  </div>
                  <ul className="space-y-1 ml-4 list-disc marker:text-neutral-500">
                    <li>Left click + Drag to rotate</li>
                    <li>Scroll to zoom</li>
                    <li>Click LEDs to toggle state</li>
                    <li>Press <kbd className="bg-neutral-800 px-1 rounded text-white text-xs">1</kbd> <kbd className="bg-neutral-800 px-1 rounded text-white text-xs">2</kbd> <kbd className="bg-neutral-800 px-1 rounded text-white text-xs">3</kbd> <kbd className="bg-neutral-800 px-1 rounded text-white text-xs">4</kbd> to toggle plane visibility</li>
                  </ul>
                </div>

                {/* Layer Toggles on the Right */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2">
                  {[4, 3, 2, 1].map((num) => {
                    const planeIndex = num - 1;
                    const isVisible = visiblePlanes[planeIndex];
                    return (
                      <button
                        key={num}
                        onClick={() => toggleVisiblePlane(planeIndex)}
                        className={`w-10 h-10 flex items-center justify-center rounded font-bold transition-colors ${
                          isVisible 
                            ? 'bg-blue-600 text-white hover:bg-blue-500' 
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700 hover:bg-neutral-700 hover:text-neutral-300'
                        }`}
                        title={`Toggle Layer ${num} visibility`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="shrink-0">
              <Timeline />
            </div>
          </div>
        ) : activeTab === 'code' ? (
          <CodeExport />
        ) : (
          <AIGenerator />
        )}
      </main>
    </div>
  );
}

