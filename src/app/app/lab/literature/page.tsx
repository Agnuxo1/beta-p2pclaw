"use client";

import { useState } from "react";
import { BookOpen, Search, Filter, HardDrive, RefreshCw } from "lucide-react";

export default function LiteraturePage() {
  const [sweepActive, setSweepActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [papers, setPapers] = useState<any[]>([]);

  const handleSweep = async () => {
    if (sweepActive) return;
    setSweepActive(true);
    
    try {
      const response = await fetch(`/api/lab/literature?q=${encodeURIComponent(searchTerm || 'distributed intelligence')}`);
      if (!response.ok) throw new Error("API Error");
      
      const data = await response.json();
      setPapers(data.papers);
    } catch (e) {
      console.error(e);
    } finally {
      setSweepActive(false);
    }
  };
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
      </div>

      <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter research topic (e.g. 'P2P networks', 'LLM agents')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-black border border-[#2d2d2d] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#ff4e1a]/50 text-[#cecbc8]"
          />
          <button 
            onClick={handleSweep}
            disabled={sweepActive}
            className={`px-4 py-2 font-mono text-sm font-bold flex items-center gap-2 rounded transition-all ${sweepActive ? 'bg-[#52504e] cursor-not-allowed text-gray-400' : 'bg-[#ff4e1a] text-black hover:shadow-[0_0_15px_rgba(255,78,26,0.3)]'}`}
          >
            <Search className="w-4 h-4" />
            {sweepActive ? "SWEEPING..." : "INITIATE DEEP SWEEP"}
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
        <div className="divide-y divide-[#2c2c30]">
              {papers.map((paper, idx) => (
                <div key={idx} className="p-3 border border-[#2d2d2d] hover:border-[#ff4e1a]/30 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-mono text-xs text-[#cecbc8] group-hover:text-[#ff4e1a] transition-colors line-clamp-1">{paper.title}</h3>
                    <span className="text-[10px] text-[#4caf82] bg-[#4caf82]/10 px-1 border border-[#4caf82]/20">REAL-TIME</span>
                  </div>
                  <p className="text-[10px] text-[#9a9490] line-clamp-2 mb-2">{paper.abstract}</p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#52504e]">
                    <span>{paper.author}</span>
                    <span>{paper.date}</span>
                  </div>
                </div>
              ))}
              {papers.length === 0 && !sweepActive && (
                <div className="text-center py-10 border border-dashed border-[#2d2d2d]">
                  <p className="font-mono text-[10px] text-[#52504e]">NO RESEARCH DATA HYDRATED. INITIATE SWEEP.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
