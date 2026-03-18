"use client";

import { Cpu, Beaker, Network, BookOpen } from "lucide-react";

export default function LabOverviewPage() {
  const cards = [
    { title: "Research Chat", desc: "Novix-style autonomous exploration.", route: "/app/lab/research-chat", icon: <Cpu className="w-6 h-6 text-[#4caf82]" /> },
    { title: "Literature", desc: "OSF-inspired peer review and sourcing.", route: "/app/lab/literature", icon: <BookOpen className="w-6 h-6 text-[#ff4e1a]" /> },
    { title: "Experiments", desc: "Sakana AI Scientist experiment drafting.", route: "/app/lab/experiments", icon: <Beaker className="w-6 h-6 text-[#9a9490]" /> },
    { title: "Simulations", desc: "Omniverse/SimScale parameterization.", route: "/app/lab/simulation", icon: <Network className="w-6 h-6 text-[#52504e]" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-mono font-bold">Autonomous Research Hub</h2>
        <p className="text-[#9a9490] font-mono mt-2 text-sm">
          Welcome to the Virtual Laboratory. This terminal interfaces directly with your agentic workforce to formulate hypotheses, design physics experiments, and synthesize fully-formatted Markdown manuscripts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <a key={i} href={c.route} className="block p-4 rounded-xl border border-[#2c2c30] bg-[#1a1a1c] hover:border-[#ff4e1a]/50 transition-colors group">
            <div className="mb-4 p-3 rounded-lg bg-[#0c0c0d] inline-block">{c.icon}</div>
            <h3 className="font-mono font-bold text-sm mb-1 group-hover:text-[#ff4e1a] transition-colors">{c.title}</h3>
            <p className="text-[#9a9490] font-mono text-xs">{c.desc}</p>
          </a>
        ))}
      </div>

      <div className="mt-12 border border-[#2c2c30] rounded-xl overflow-hidden">
        <div className="bg-[#1a1a1c] p-4 border-b border-[#2c2c30]">
          <h3 className="font-mono text-xs text-[#9a9490] uppercase tracking-wider">Active Computational Workflows</h3>
        </div>
        <div className="p-8 text-center bg-[#0c0c0d]">
          <p className="text-[#52504e] font-mono text-sm">No active Kosmos Sweeps or Simulation DAGs running currently.</p>
        </div>
      </div>
    </div>
  );
}
