"use client";

import { useState } from "react";
import { Copy, Terminal, Send, Cpu, Activity } from "lucide-react";

interface Message {
  role: "system" | "user" | "agent";
  content: string;
  timestamp: string;
}

export default function ResearchChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "P2PCLAW Research Agent v2.3.0 initialized. Ready to execute algorithmic design, literature reviews, or data sweeps.",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      role: "agent",
      content: "I am ready. Please provide a research hypothesis or a target paper schema you want me to draft.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toLocaleTimeString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // API Payload configuration
    const apiMessages = newMessages.map(m => ({
      role: m.role === 'system' ? 'system' : (m.role === 'user' ? 'user' : 'assistant'),
      content: m.content
    }));

    try {
      const response = await fetch('/api/lab/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: "agent",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString(),
      }]);

    } catch (e) {
      setMessages(prev => [...prev, {
        role: "system",
        content: "[ERROR] Connection to Autonomous Compute Cluster failed.",
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto border border-[#2c2c30] rounded-xl overflow-hidden bg-[#0c0c0d]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2c2c30] bg-[#1a1a1c]">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#ff4e1a]" />
          <h2 className="font-mono font-bold text-sm text-[#f5f0eb]">Research Terminal (Novix Protocol)</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#4caf82] uppercase tracking-wider">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Agent: ACTIVE</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> IPFS: CLUSTER SYNCED</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="text-[10px] text-[#52504e] font-mono mb-1">{msg.role.toUpperCase()} • {msg.timestamp}</span>
            <div className={`p-3 rounded-lg max-w-[80%] font-mono text-sm leading-relaxed ${
              msg.role === "user" ? "bg-[#ff4e1a]/10 text-[#f5f0eb] border border-[#ff4e1a]/20" : 
              msg.role === "system" ? "bg-transparent text-[#9a9490] italic border-l-2 border-[#52504e] rounded-none py-1" :
              "bg-[#1a1a1c] text-[#4caf82] border border-[#2c2c30]"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#2c2c30] bg-[#1a1a1c]">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a research command or hypothesis..."
            className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded-lg pl-4 pr-12 py-3 text-sm font-mono text-[#f5f0eb] placeholder-[#52504e] focus:outline-none focus:border-[#ff4e1a] resize-none h-[52px]"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className={`absolute right-2 p-2 rounded transition-colors ${isLoading ? 'bg-[#52504e] cursor-not-allowed' : 'bg-[#ff4e1a] hover:bg-[#ff4e1a]/80 text-black'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#52504e] font-mono mt-2 text-center">Press Enter to send. Shift+Enter for newline. Agent compute runs locally in Web Workers.</p>
      </div>
    </div>
  );
}
