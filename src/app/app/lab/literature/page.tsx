"use client";

import { useState } from "react";
import { BookOpen, Search, Filter, HardDrive, RefreshCw } from "lucide-react";

export default function LiteraturePage() {
  const [sweepActive, setSweepActive] = useState(false);

  const mockPapers = [
    { title: "Quantum Multi-Agent Reinforcement Learning", cid: "QmX7...8y9A", source: "IPFS Network", refs: 142 },
    { title: "Fluid Dynamics in Non-Euclidean Spaces", cid: "QmZ3...9b2Z", source: "OSF Archive", refs: 89 },
    { title: "Autonomous Scientific Discovery Protocols", cid: "QmP1...4c1X", source: "ArXiv Mirror", refs: 312 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ff4e1a]" /> Literature Engine
          </h2>
          <p className="text-[#9a9490] font-mono text-xs mt-2 max-w-2xl">
            OSF-inspired automated semantic sweeping. Agents can trigger deep reads across 1,500+ decentralized papers instantly, extracting hypotheses and citations into the mempool.
          </p>
        </div>
        <button 
          onClick={() => setSweepActive(!sweepActive)}
          className={`px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold rounded-lg transition-colors border ${
            sweepActive ? "bg-[#ff4e1a]/20 text-[#ff4e1a] border-[#ff4e1a]/50" : "bg-[#4caf82] text-[#0c0c0d] border-transparent hover:bg-[#4caf82]/90"
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${sweepActive ? 'animate-spin' : ''}`} />
          {sweepActive ? "HALT DEEP SWEEP" : "INITIATE DEEP SWEEP"}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#52504e]" />
          <input 
            type="text" 
            placeholder="Search academic corpus (CID, title, Author DID)..." 
            className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#f5f0eb] focus:border-[#ff4e1a] focus:outline-none transition-colors"
          />
        </div>
        <button className="px-4 py-2 border border-[#2c2c30] rounded-lg bg-[#1a1a1c] flex items-center gap-2 text-[#9a9490] hover:text-[#f5f0eb] hover:border-[#52504e] transition-colors">
          <Filter className="w-4 h-4" /> <span className="font-mono text-sm">Filters</span>
        </button>
      </div>

      {sweepActive && (
        <div className="p-4 border border-[#ff4e1a]/30 bg-[#ff4e1a]/5 rounded-lg">
          <p className="font-mono text-xs text-[#ff4e1a] mb-2 font-bold animate-pulse">SWEEP IN PROGRESS...</p>
          <div className="font-mono text-[10px] text-[#9a9490] space-y-1">
            <p>&gt; Connecting to Helia IPFS Bootstrap...</p>
            <p>&gt; Syncing blocks: 1,402 / 1,500</p>
            <p>&gt; Analyzing semantic graphs across citations...</p>
          </div>
        </div>
      )}

      <div className="border border-[#2c2c30] rounded-xl overflow-hidden bg-[#0c0c0d]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#2c2c30] bg-[#1a1a1c] font-mono text-xs text-[#52504e] font-semibold tracking-wider uppercase">
          <div className="col-span-6">Manuscript Title</div>
          <div className="col-span-3">IPFS CID</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-1 text-right">Refs</div>
        </div>
        <div className="divide-y divide-[#2c2c30]">
          {mockPapers.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1a1a1c]/50 transition-colors">
              <div className="col-span-6 font-mono text-sm text-[#f5f0eb]">{p.title}</div>
              <div className="col-span-3 font-mono text-xs text-[#ff4e1a] break-all">{p.cid}</div>
              <div className="col-span-2 flex items-center gap-2 text-[10px] font-mono text-[#9a9490]">
                <HardDrive className="w-3 h-3 text-[#52504e]" /> {p.source}
              </div>
              <div className="col-span-1 text-right font-mono text-xs text-[#4caf82]">{p.refs}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
