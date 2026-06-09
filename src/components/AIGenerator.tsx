import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Sparkles, Key, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// We ask the LLM to provide instructions for lit leds by coordinates (x, y, z) or indices.
// To make it easy, we will use index (0 to 63) or x,y,z where index = plane * 16 + row * 4 + col
// plane is Y, row is Z, col is X.
// Let's ask the AI for a list of frames, each with a time and a list of active LED indices (0-63).
// We'll map that back to the boolean array.

const aiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    frames: {
      type: Type.ARRAY,
      description: "List of keyframes for the animation, starting from time 0.",
      items: {
        type: Type.OBJECT,
        properties: {
          time: {
            type: Type.INTEGER,
            description: "Time of the keyframe in 100ms units. E.g., 0, 10, 20."
          },
          litLeds: {
            type: Type.ARRAY,
            description: "List of LED indices (0 to 63) that are turned ON in this frame. Index = plane * 16 + row * 4 + col. Plane is Y (0 bottom to 3 top), Row is Z (0 front to 3 back), Col is X (0 left to 3 right).",
            items: {
              type: Type.INTEGER
            }
          }
        },
        required: ["time", "litLeds"]
      }
    }
  },
  required: ["frames"]
};

export function AIGenerator() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [prompt, setPrompt] = useState('A simple rain effect falling from top to bottom.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const { importProject } = useAppStore();

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please provide a Gemini API Key first.');
      return;
    }
    setError('');
    setIsGenerating(true);

    try {
      localStorage.setItem('gemini_api_key', apiKey);
      
      const ai = new GoogleGenAI({ apiKey });
      
      const aiPrompt = `Generate a 4x4x4 LED cube animation matching this description: "${prompt}"
      The animation should be around 10 to 30 frames. Keep it smooth.
      Each frame requires a time and an array of lit LED indices.
      Index formula: index = plane * 16 + row * 4 + col.
      (plane=0 is bottom, plane=3 is top. col=0 is left, col=3 is right. row=0 is front, row=3 is back).
      Return ONLY valid JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: aiSchema,
          temperature: 0.7,
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);
      
      if (data.frames && Array.isArray(data.frames)) {
        const newFrames = data.frames.map((f: any) => {
          const leds = Array(64).fill(false);
          if (Array.isArray(f.litLeds)) {
            f.litLeds.forEach((index: number) => {
              if (index >= 0 && index < 64) leds[index] = true;
            });
          }
          return {
            id: Math.random().toString(36).substring(2, 9),
            time: Number(f.time) || 0,
            leds
          };
        });
        
        importProject(newFrames);
        setPrompt(''); // clear prompt on success
      } else {
        setError("Invalid format received from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the animation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-white overflow-y-auto">
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Sparkles className="text-purple-400" size={20} />
        AI Animation Generator
      </h2>
      
      <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-md p-3 mb-6 flex gap-3 text-sm text-yellow-200">
        <AlertTriangle className="shrink-0 text-yellow-500" size={20} />
        <div>
          <p className="font-semibold text-yellow-400 mb-1">Client-Side API Key Warning</p>
          <p>
            Your API key is stored locally in your browser and is used directly from the client.
            This is only recommended for personal/local tools since the key corresponds directly to your Google account or billing. 
            Do not share this project publicly with your API key hardcoded!
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1 flex items-center gap-2">
            <Key size={14} />
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          <p className="text-xs text-neutral-500 mt-1">Get one from Google AI Studio. Stored locally in your browser.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1">
            Animation Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A rotating hollow box"
            rows={4}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Animation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
