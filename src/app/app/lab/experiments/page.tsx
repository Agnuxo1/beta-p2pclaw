"use client";

import { useState } from "react";
import { Beaker, Play, FileCode2, TestTube, FileSearch, ArrowRight } from "lucide-react";

export default function ExperimentsPage() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    { title: "Hypothesis Formulation", icon: <FileSearch className="w-5 h-5" /> },
    { title: "Algorithmic Drafting", icon: <FileCode2 className="w-5 h-5" /> },
    { title: "Sandbox Execution", icon: <TestTube className="w-5 h-5" /> },
    { title: "Manuscript Synthesis", icon: <Beaker className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
            <Beaker className="w-5 h-5 text-[#ff4e1a]" /> The AI Scientist v2
          </h2>
          <p className="text-[#9a9490] font-mono text-xs mt-2 max-w-3xl">
            End-to-End autonomous generation suite. Agents formulate hypotheses, design physics/ML experiments, execute sandbox code, and automatically synthesize peer-reviewed standard manuscripts.
          </p>
        </div>
        <button 
          onClick={() => setActiveStep(0)}
          className="px-4 py-2 bg-[#ff4e1a] text-black font-mono text-xs font-bold rounded-lg hover:bg-[#ff4e1a]/80 transition-colors flex items-center gap-2"
        >
          <Play className="w-4 h-4" /> RESTART PIPELINE
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between p-6 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4 shrink-0">
            <div className={`flex items-center gap-3 ${i <= activeStep ? 'text-[#ff4e1a]' : 'text-[#52504e]'} transition-colors`}>
              <div className={`p-3 rounded-full border ${i <= activeStep ? 'border-[#ff4e1a] bg-[#ff4e1a]/10' : 'border-[#2c2c30] bg-[#0c0c0d]'}`}>
                {s.icon}
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#9a9490]">Phase {i + 1}</p>
                <p className="font-mono text-sm font-semibold">{s.title}</p>
              </div>
            </div>
            {i < steps.length - 1 && <ArrowRight className={`w-5 h-5 mx-4 ${i < activeStep ? 'text-[#ff4e1a]' : 'text-[#2c2c30]'}`} />}
          </div>
        ))}
      </div>

      {/* Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        
        {/* Left: Configuration */}
        <div className="col-span-1 border border-[#2c2c30] rounded-xl bg-[#0c0c0d] flex flex-col">
          <div className="p-4 border-b border-[#2c2c30] bg-[#1a1a1c]">
            <h3 className="font-mono text-xs font-bold text-[#f5f0eb]">Research Parameters</h3>
          </div>
          <div className="p-4 flex-1 space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Target Domain</label>
              <select className="w-full bg-[#1a1a1c] border border-[#2c2c30] text-[#f5f0eb] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#ff4e1a]">
                <option>Machine Learning (PyTorch)</option>
                <option>Computational Fluid Dynamics</option>
                <option>Quantum Cryptography</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Base Dataset / Environment</label>
              <input type="text" defaultValue="huggingface/mnist" className="w-full bg-[#1a1a1c] border border-[#2c2c30] text-[#4caf82] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#ff4e1a]" />
            </div>
            <div className="pt-4">
              <button 
                onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
                className="w-full py-3 bg-[#1a1a1c] border border-[#ff4e1a]/50 text-[#ff4e1a] font-mono text-xs font-bold rounded-lg hover:bg-[#ff4e1a]/10 transition-colors"
              >
                PROCEED TO NEXT PHASE
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Terminal / Editor */}
        <div className="col-span-2 border border-[#2c2c30] rounded-xl bg-[#0c0c0d] flex flex-col overflow-hidden relative">
          <div className="p-2 border-b border-[#2c2c30] bg-[#1a1a1c] flex items-center justify-between">
            <div className="flex gap-2 px-2">
              <div className="w-3 h-3 rounded-full bg-[#ff4e1a] opacity-50"></div>
              <div className="w-3 h-3 rounded-full bg-[#4caf82] opacity-50"></div>
              <div className="w-3 h-3 rounded-full bg-[#52504e]"></div>
            </div>
            <span className="font-mono text-[10px] text-[#9a9490]">execution_sandbox.py</span>
          </div>
          
          <div className="flex-1 p-4 font-mono text-xs text-[#f5f0eb] whitespace-pre overflow-y-auto leading-loose">
<span className="text-[#52504e]">1</span> <span className="text-[#ff4e1a]">import</span> torch
<span className="text-[#52504e]">2</span> <span className="text-[#ff4e1a]">import</span> torch.nn <span className="text-[#ff4e1a]">as</span> nn
<span className="text-[#52504e]">3</span> 
<span className="text-[#52504e]">4</span> <span className="text-[#9a9490]"># Agent-generated hypothesis model</span>
<span className="text-[#52504e]">5</span> <span className="text-[#ff4e1a]">class</span> NonEuclideanNet(nn.Module):
<span className="text-[#52504e]">6</span>     <span className="text-[#ff4e1a]">def</span> __init__(self):
<span className="text-[#52504e]">7</span>         <span className="text-[#ff4e1a]">super</span>().__init__()
<span className="text-[#52504e]">8</span>         self.manifold_layer = nn.Linear(784, 256)
<span className="text-[#52504e]">9</span> 
<span className="text-[#52504e]">10</span> <span className="text-[#52504e] italic">_  Waiting for computational allocation...</span>
          </div>

          {/* Absolute Status Bar at bottom of code editor */}
          <div className="absolute bottom-0 w-full bg-[#4caf82] text-black px-4 py-1 font-mono text-[10px] font-bold flex justify-between">
            <span>READY</span>
            <span>UTF-8 // Python 3.11</span>
          </div>
        </div>

      </div>
    </div>
  );
}
