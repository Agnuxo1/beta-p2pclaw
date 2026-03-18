"use client";

import { Activity, Play, Settings2, Download } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#4caf82]" /> Physics & Compute Simulator
          </h2>
          <p className="text-[#9a9490] font-mono text-xs mt-2 max-w-2xl">
            NVIDIA Omniverse / SimScale inspired interface. Allocate WebRTC cluster nodes to execute deterministic physics simulations and fluid dynamics models parameterized by your local Agents.
          </p>
        </div>
        <button className="px-4 py-2 bg-[#4caf82] text-[#0c0c0d] font-mono text-xs font-bold rounded-lg hover:bg-[#4caf82]/80 transition-colors flex items-center gap-2">
          <Play className="w-4 h-4" /> DISPATCH SIMULATION
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Settings */}
        <div className="col-span-1 lg:col-span-1 space-y-4">
          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-4">
            <h3 className="font-mono text-xs text-[#f5f0eb] font-bold flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-[#ff4e1a]" /> Topology Settings
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Engine Core</label>
                <select className="w-full bg-[#0c0c0d] border border-[#2c2c30] text-[#f5f0eb] font-mono text-xs p-2 rounded focus:border-[#4caf82] focus:outline-none">
                  <option>STELLARAI Plasma (Beta)</option>
                  <option>Omniverse USD Rigid-Body</option>
                  <option>SimScale OpenFOAM</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Resolution (Mesh)</label>
                <input type="range" min="1" max="100" defaultValue="50" className="w-full accent-[#4caf82]" />
                <div className="flex justify-between text-[10px] text-[#52504e] font-mono">
                  <span>Coarse</span>
                  <span>Ultra-Fine</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Timesteps (dt)</label>
                <input type="number" defaultValue="10000" className="w-full bg-[#0c0c0d] border border-[#2c2c30] text-[#f5f0eb] font-mono text-xs p-2 rounded focus:border-[#4caf82] focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Viewport */}
        <div className="col-span-1 lg:col-span-3">
          <div className="border border-[#2c2c30] rounded-xl bg-[#0c0c0d] overflow-hidden aspect-video relative flex items-center justify-center">
            {/* Fake 3D wireframe background using CSS grid */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4caf82 1px, transparent 1px), linear-gradient(90deg, #4caf82 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="z-10 text-center">
              <p className="font-mono text-[#52504e] text-sm mb-4">No scene loaded. Awaiting mathematical payload.</p>
              <button className="px-4 py-2 border border-[#4caf82]/50 text-[#4caf82] font-mono text-xs rounded hover:bg-[#4caf82]/10 transition-colors">
                IMPORT .USD / .OBJ
              </button>
            </div>

            {/* Overlay indicators */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-[#9a9490] space-y-1">
              <p>FPS: <span className="text-[#4caf82]">0.0</span></p>
              <p>Vertices: <span className="text-[#f5f0eb]">0</span></p>
              <p>Sim Time: <span className="text-[#f5f0eb]">0.00ms</span></p>
            </div>
            <div className="absolute bottom-4 right-4">
              <button className="p-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#9a9490] hover:text-[#f5f0eb] transition-colors rounded">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
