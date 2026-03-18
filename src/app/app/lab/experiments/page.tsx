"use client";

import { useState } from "react";
import { Beaker, Play, FileCode2, TestTube, FileSearch, ArrowRight, Terminal } from "lucide-react";

export default function ExperimentsPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState({
    hypothesis: "",
    code: "",
    sandbox: "",
    manuscript: "",
  });

  const runPipeline = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput({
      hypothesis: "",
      code: "",
      sandbox: "",
      manuscript: "",
    });
    
    try {
      // Phase 1: Hypothesis
      setActiveStep(1);
      const hRes = await fetch('/api/lab/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'hypothesis', topic })
      });
      const hData = await hRes.json();
      setOutput(prev => ({ ...prev, hypothesis: hData.result }));

      // Phase 2: Code
      setActiveStep(2);
      const cRes = await fetch('/api/lab/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'code', topic, context: hData.result })
      });
      const cData = await cRes.json();
      setOutput(prev => ({ ...prev, code: cData.result }));

      // Phase 3: Sandbox
      setActiveStep(3);
      const sRes = await fetch('/api/lab/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'sandbox', topic, context: cData.result })
      });
      const sData = await sRes.json();
      setOutput(prev => ({ ...prev, sandbox: sData.result }));

      // Phase 4: Manuscript
      setActiveStep(4);
      const mRes = await fetch('/api/lab/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'manuscript', topic, context: `Hypothesis: ${hData.result}\nResults: ${sData.result}` })
      });
      const mData = await mRes.json();
      setOutput(prev => ({ ...prev, manuscript: mData.result }));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Hypothesis Formulation", icon: <FileSearch className="w-5 h-5" /> },
    { title: "Algorithmic Drafting", icon: <FileCode2 className="w-5 h-5" /> },
    { title: "Sandbox Execution", icon: <TestTube className="w-5 h-5" /> },
    { title: "Manuscript Synthesis", icon: <Beaker className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
            <Beaker className="w-5 h-5 text-[#ff4e1a]" /> The AI Scientist v2
          </h2>
          <div className="flex gap-2 mt-4">
            <input 
              type="text" 
              placeholder="Enter research field (e.g. 'Neural Radiance Fields', 'P2P Consensus')..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 bg-black border border-[#2d2d2d] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#4caf82]/50 text-[#cecbc8]"
            />
            <button 
              onClick={runPipeline}
              disabled={loading || !topic}
              className={`px-4 py-2 font-mono text-sm font-bold flex items-center gap-2 rounded transition-all ${loading ? 'bg-[#52504e] cursor-not-allowed text-gray-400' : 'bg-[#4caf82] text-[#0c0c0d] hover:shadow-[0_0_15px_rgba(76,175,130,0.3)]'}`}
            >
              <Play className="w-4 h-4" />
              {loading ? "EXECUTING PIPELINE..." : "RUN EXPERIMENT"}
            </button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between p-6 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4 shrink-0">
            <div className={`flex items-center gap-3 ${i + 1 <= activeStep ? 'text-[#ff4e1a]' : 'text-[#52504e]'} transition-colors`}>
              <div className={`p-3 rounded-full border ${i + 1 <= activeStep ? 'border-[#ff4e1a] bg-[#ff4e1a]/10' : 'border-[#2c2c30] bg-[#0c0c0d]'}`}>
                {s.icon}
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#9a9490]">Phase {i + 1}</p>
                <p className="font-mono text-sm font-semibold">{s.title}</p>
              </div>
            </div>
            {i < steps.length - 1 && <ArrowRight className={`w-5 h-5 mx-4 ${i + 1 < activeStep ? 'text-[#ff4e1a]' : 'text-[#2c2c30]'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column info */}
        <div className="col-span-1 space-y-4">
          <div className="bg-[#0c0c0d] border border-[#2c2c30] rounded-xl p-4">
            <h3 className="font-mono text-xs font-bold text-[#ff4e1a] mb-2 uppercase tracking-wider">Protocol Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#52504e]">COMPUTE ALLOCATION</span>
                <span className={loading ? "text-[#4caf82]" : "text-[#52504e]"}>{loading ? "ACTIVE" : "IDLE"}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#52504e]">NETWORK MESH</span>
                <span className="text-[#4caf82]">ENCRYPTED</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0c0c0d] border border-[#2c2c30] rounded-xl p-4">
            <h3 className="font-mono text-xs font-bold text-[#f5f0eb] mb-2 uppercase tracking-wider">Instructions</h3>
            <p className="text-[10px] text-[#9a9490] leading-relaxed">
              1. Define your research scope.<br/>
              2. Agent cluster will formulate hypothesis.<br/>
              3. System drafts verification code.<br/>
              4. Synthesis of complete manuscript.
            </p>
          </div>
        </div>

        {/* Pipeline Output Area */}
        <div className="col-span-2 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl flex flex-col min-h-[500px]">
          <div className="p-3 border-b border-[#2c2c30] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ff4e1a]" />
              <h2 className="font-mono text-xs font-bold text-[#f5f0eb] uppercase tracking-widest">Autonomous Pipeline Output</h2>
            </div>
          </div>
          
          <div className="flex-1 p-6 font-mono text-sm text-[#cecbc8] whitespace-pre-wrap overflow-y-auto">
            {activeStep === 1 && (
              <div>
                <p className="text-[#4caf82] mb-4">[PHASE 1] HYPOTHESIS GENERATION</p>
                {output.hypothesis || (loading && "Calculating novel scientific pathways...")}
              </div>
            )}
            {activeStep === 2 && (
              <div>
                <p className="text-[#4caf82] mb-4">[PHASE 2] ALGORITHMIC CODE DRAFTING</p>
                {output.code || (loading && "Drafting Python verification suite...")}
              </div>
            )}
            {activeStep === 3 && (
              <div>
                <p className="text-[#4caf82] mb-4">[PHASE 3] VIRTUAL SANDBOX EXECUTION</p>
                {output.sandbox || (loading && "Simulating world state & collecting metrics...")}
              </div>
            )}
            {activeStep === 4 && (
              <div>
                <p className="text-[#4caf82] mb-4">[PHASE 4] FINAL MANUSCRIPT SYNTHESIS</p>
                {output.manuscript || (loading && "Compiling and formatting academic report...")}
              </div>
            )}
            {!loading && !output.hypothesis && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
                <Beaker className="w-12 h-12 mb-4" />
                <p className="text-xs uppercase tracking-widest font-bold">Waiting for protocol initiation...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
