"use client";

import { Activity, GitMerge, FileJson, PlayCircle } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#ff4e1a]" /> DAG Workflows
          </h2>
          <p className="text-[#9a9490] font-mono text-xs mt-2 max-w-2xl">
            Kosmos-style parallel sweeps. Construct Directed Acyclic Graphs (DAG) linking literature mining, sandbox execution, and manuscript peer review in a continuous agentic loop.
          </p>
        </div>
        <button className="px-4 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#f5f0eb] font-mono text-xs font-bold rounded-lg hover:border-[#ff4e1a] transition-colors flex items-center gap-2">
          <FileJson className="w-4 h-4" /> EXPORT JSON
        </button>
      </div>

      <div className="h-[600px] border border-[#2c2c30] rounded-xl bg-[#0c0c0d] relative overflow-hidden flex">
        {/* Placeholder Nodes representing a Workflow Graph */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#f5f0eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="flex-1 p-8 relative z-10">
          
          <div className="absolute top-20 left-20 w-48 p-3 border border-[#ff4e1a] bg-[#ff4e1a]/10 rounded-lg backdrop-blur-md">
            <h4 className="font-mono font-bold text-[10px] text-[#ff4e1a] mb-1 uppercase tracking-wider">Node A: Genesis</h4>
            <p className="font-mono text-xs text-[#f5f0eb]">Hypothesis Gen</p>
          </div>

          <svg className="absolute top-24 left-[272px] w-32 h-20" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 10 L 100 80" stroke="#52504e" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
          </svg>

          <div className="absolute top-40 left-80 w-48 p-3 border border-[#4caf82] bg-[#4caf82]/10 rounded-lg backdrop-blur-md">
            <h4 className="font-mono font-bold text-[10px] text-[#4caf82] mb-1 uppercase tracking-wider">Node B: Execution</h4>
            <p className="font-mono text-xs text-[#f5f0eb]">Compute Sandbox</p>
          </div>

          <svg className="absolute top-[180px] left-[512px] w-40 h-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 10 L 120 10" stroke="#52504e" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
          </svg>

          <div className="absolute top-40 left-[620px] w-48 p-3 border border-[#9a9490] bg-[#1a1a1c] rounded-lg backdrop-blur-md">
            <h4 className="font-mono font-bold text-[10px] text-[#9a9490] mb-1 uppercase tracking-wider">Node C: Synthesis</h4>
            <p className="font-mono text-xs text-[#f5f0eb]">Manuscript LaTeX</p>
          </div>

        </div>

        {/* Right Sidebar Inspector */}
        <div className="w-80 border-l border-[#2c2c30] bg-[#1a1a1c] p-4 flex flex-col z-20">
          <h3 className="font-mono text-sm font-bold text-[#f5f0eb] mb-4 border-b border-[#2c2c30] pb-2">Inspector</h3>
          
          <div className="space-y-4 flex-1">
            <div>
              <p className="font-mono text-[10px] text-[#52504e] uppercase tracking-wider">Selected Node</p>
              <p className="font-mono text-xs text-[#4caf82] font-bold">Node B: Execution</p>
            </div>
            
            <div className="p-3 bg-[#0c0c0d] border border-[#2c2c30] rounded text-xs font-mono text-[#9a9490]">
              <p className="text-[#f5f0eb] mb-2 font-bold">Configuration</p>
              <p>Type: Python Sandbox</p>
              <p>Timeout: 7200s</p>
              <p>Retries: 3</p>
            </div>
          </div>

          <button className="w-full py-3 mt-4 bg-[#ff4e1a] text-black font-mono text-xs font-bold rounded hover:bg-[#ff4e1a]/80 transition-colors flex items-center justify-center gap-2">
            <PlayCircle className="w-4 h-4" /> START WORKFLOW
          </button>
        </div>
      </div>
    </div>
  );
}
