"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Plus, Menu } from "lucide-react";
import Gun from "gun";

interface Session {
  id: string;
  title: string;
  messages: Message[];
  created: number;
}

interface Message {
  role: "user" | "system";
  text: string;
  toolLabel?: string;
  ts?: number;
}

interface Agent {
  id: string;
  last_seen: number;
}

const GATEWAYS = [
  'https://api-production-ff1b.up.railway.app',
];
const INTENT = {
  literature:/search|papers?|articles?|literature|find|publi|review|cite|citation/i,
  experiment:/experiment|hypothesis|design|protocol|method|trial|variable/i,
  draft:/draft|write|paper|report|manuscript|publish/i,
  corpus:/corpus|our papers?|what.*(know|have)|synthesise|synthesize|summarise|summarize/i,
  swarm:/swarm|agents?|ask the|help me|need.*help|collaborate/i,
};
let API_BASE: string | null = null;
let gunInstance: any = null;
try { gunInstance = Gun(['https://gun-manhattan.herokuapp.com/gun']); } catch(e) {}

const simpleMarkdown = (text: string) => {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#ff4e1a;text-decoration:underline;">$1</a>');
  return `<p>${html}</p>`;
};

export default function ClassicChatPage() {
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentDraftContent, setCurrentDraftContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resolveGateway();
    const id = localStorage.getItem('p2pclaw-agent-id');
    if (!id) {
      setJoinModalOpen(true);
    } else {
      setAgentId(id);
      setAgentName(localStorage.getItem('p2pclaw-agent-name') || 'Researcher');
      initChat();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sessions, currentSession, isThinking]);

  const resolveGateway = async () => {
    for (const gw of GATEWAYS) {
      try { const r = await fetch(gw + '/health', { signal: AbortSignal.timeout(3500) }); if (r.ok) { API_BASE = gw; return; } } catch {}
    }
    API_BASE = GATEWAYS[0];
  };

  const initChat = () => {
    try {
      const raw = localStorage.getItem('p2pclaw-sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSessions(parsed);
        const keys = Object.keys(parsed);
        if (keys.length > 0) setCurrentSession(keys[keys.length - 1]);
        else newSession();
      } else newSession();
    } catch {}

    if (gunInstance) {
      const cut = Date.now() - 5 * 60 * 1000;
      gunInstance.get('agents').map().on((data: any, id: string) => {
        if (!data || !id) return;
        setAgents(prev => ({ ...prev, [id]: { ...data, id } }));
      });
    }
  };

  const saveSessions = (nextS: Record<string, Session>) => {
    localStorage.setItem('p2pclaw-sessions', JSON.stringify(nextS));
    setSessions(nextS);
  };

  const newSession = () => {
    const id = 's-' + Date.now().toString(36);
    const nextS = { ...sessions, [id]: { id, title: 'Session ' + new Date().toLocaleTimeString(), messages: [], created: Date.now() } };
    setCurrentSession(id);
    saveSessions(nextS);
  };

  const joinLab = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim() || "researcher";
    const disc = fd.get("discipline") as string;
    const newId = 'human-' + name.toLowerCase().replace(/[^a-z0-9-]/g,'') + '-' + Date.now().toString(36).slice(-4);
    
    localStorage.setItem('p2pclaw-agent-id', newId);
    localStorage.setItem('p2pclaw-agent-name', name);
    localStorage.setItem('p2pclaw-discipline', disc);
    
    setAgentId(newId);
    setAgentName(name);
    setJoinModalOpen(false);
    initChat();
    
    if (API_BASE) {
      fetch(`${API_BASE}/quick-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: newId, name, type: 'human', discipline: disc })
      }).catch(()=>{});
    }
  };

  const addMsg = (role: "user" | "system", text: string, toolLabel = "") => {
    if (!currentSession) return;
    setSessions(prev => {
      const sess = prev[currentSession];
      if (!sess) return prev;
      const nextSess = { ...sess, messages: [...sess.messages, { role, text, toolLabel, ts: Date.now() }] };
      const next = { ...prev, [currentSession]: nextSess };
      localStorage.setItem('p2pclaw-sessions', JSON.stringify(next));
      return next;
    });
  };

  const toggleTool = (t: string) => {
    setActiveTool(prev => prev === t ? null : t);
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    if (!currentSession) newSession();
    
    addMsg("user", text);
    setIsThinking(true);
    
    let tool = activeTool;
    if (!tool) {
      tool = 'swarm';
      for (const [k, p] of Object.entries(INTENT)) {
        if (p.test(text)) { tool = k; break; }
      }
    }

    if (!API_BASE) await resolveGateway();
    
    try {
      if (tool === 'literature') await doLiterature(text);
      else if (tool === 'experiment') await doExperiment(text);
      else if (tool === 'draft') await doDraft(text);
      else if (tool === 'corpus') await doCorpus(text);
      else await doSwarm(text);
    } catch(e: any) {
      addMsg('system', `Error: ${e.message}. Please try again.`);
    } finally {
      setIsThinking(false);
    }
  };

  const doLiterature = async (q: string) => {
    // Mock simulation for brevity, matches original HTML behaviour but skips external API if not connected
    const r = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(q)}&select=title,author,URL,abstract&rows=4`).catch(()=>null);
    if (!r || !r.ok) {
      addMsg('system', `No papers found dynamically for **"${q}"** right now. Try different keywords.`, 'Literature Search');
      return;
    }
    const d = await r.json();
    const results = d.message?.items || [];
    if (!results.length) {
      addMsg('system', `No papers found.`, 'Literature Search');
      return;
    }
    let html = `<div><div class="font-mono text-[9px] uppercase tracking-widest text-[#ff9a30] mb-2">Literature Search — ${results.length} results</div>`;
    results.forEach((p:any) => {
      html += `<div class="bg-[#121214] border border-[#2c2c30] rounded p-3 mb-2">
        <div class="text-xs font-bold text-[#f5f0eb]"><a href="${p.URL||'#'}" target="_blank" style="color:inherit">${p.title?.[0]||'Untitled'}</a></div>
        <div class="font-mono text-[10px] text-[#52504e] mt-1">${(p.author||[]).map((a:any)=>a.family).join(', ')}</div>
      </div>`;
    });
    html += '</div>';
    addMsg('system', html, 'Literature Search');
  };

  const doExperiment = async (desc: string) => {
    const id = 'exp-' + Date.now().toString(36);
    const exp = {
      id, agentId, title: desc.slice(0, 60), state: 'HYPOTHESIS', hypothesis: desc, background: '', methodology: '',
      variables: JSON.stringify([{type:'independent',name:'',values:'',unit:''},{type:'dependent',name:'',values:'',unit:''}]),
      results: '', conclusions: '', discipline: localStorage.getItem('p2pclaw-discipline') || 'Other',
      created_at: Date.now(), updated_at: Date.now()
    };
    try {
      const r = localStorage.getItem('p2pclaw-experiments');
      const e = r ? JSON.parse(r) : {};
      e[id] = exp;
      localStorage.setItem('p2pclaw-experiments', JSON.stringify(e));
      if (gunInstance) gunInstance.get('experiments').get(id).put(exp);
    } catch {}
    
    addMsg('system', `**Experiment created in Lab Notebook**\n\nTitle: ${exp.title}\n\nYour hypothesis has been saved. The experiment is in **HYPOTHESIS** state. Open the Lab Notebook to fill in variables.`, 'New Experiment');
    setTitle('Exp: ' + desc.slice(0, 30));
  };

  const doDraft = async (desc: string) => {
    const draft = `# ${desc.slice(0,80)}\n\n**Date:** ${new Date().toISOString().slice(0,10)}\n**Author:** ${agentId}\n**Discipline:** ${localStorage.getItem('p2pclaw-discipline')||'Research'}\n\n## Abstract\n\nThis paper presents ${desc}.\n\n## 1. Introduction\n\n${desc}\n\n## 2. Methodology\n\nOur approach consists of...\n\n## 3. Results\n\nExperimental results demonstrate...\n\n## References\n\n[1] Generated via P2PCLAW Research Chat`;
    setCurrentDraftContent(draft);
    setDraftModalOpen(true);
    addMsg('system', 'Draft generated. The editor is open — copy the Markdown or publish directly to the corpus.', 'Paper Draft');
    setTitle('Draft: ' + desc.slice(0, 30));
  };

  const doCorpus = async (q: string) => {
    if (!API_BASE) return;
    try {
      const r = await fetch(`${API_BASE}/semantic-search?q=${encodeURIComponent(q)}&limit=3`);
      if(!r.ok) throw new Error("Search failed");
      const d = await r.json();
      const results = d.results || d.papers || [];
      if (!results.length) {
        addMsg('system', `No results in the corpus for **"${q}"**.`, 'Corpus Search');
        return;
      }
      addMsg('system', `Found ${results.length} results in local nodes. *(Rendered text snippet)*`, 'Corpus Search');
    } catch(e:any) {
      addMsg('system', `Corpus search failed: ${e.message}`, 'Corpus Search');
    }
  };

  const doSwarm = async (msg: string) => {
    if (!API_BASE) { addMsg('system', 'Message broadcast to local Gun mesh. Responders offline.', 'Swarm'); return; }
    try {
      const r = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, agentId, type: 'human' })
      });
      const d = await r.json();
      addMsg('system', d.response || d.message || d.reply || 'Message broadcast.', 'Swarm');
    } catch {
      addMsg('system', 'Message broadcast to the swarm. Connected agents will process your request.', 'Swarm');
    }
  };

  const setTitle = (t: string) => {
    if (!currentSession) return;
    setSessions(prev => {
      const next = { ...prev };
      if (next[currentSession]) next[currentSession].title = t;
      localStorage.setItem('p2pclaw-sessions', JSON.stringify(next));
      return next;
    });
  };

  const activeAgents = Object.values(agents)
    .filter(a => a.last_seen > Date.now() - 300000)
    .sort((a,b) => b.last_seen - a.last_seen)
    .slice(0, 8);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0c0c0d] overflow-hidden -m-6 lg:-m-8">
      {/* Sidebar */}
      <div className="w-[220px] min-w-[220px] bg-[#121214] border-r border-[#2c2c30] flex flex-col pt-4 overflow-hidden">
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#52504e] px-4 opacity-60 mb-2">Sessions</div>
        <div className="px-3 pb-2">
          <button onClick={newSession} className="w-full flex justify-center items-center py-1.5 bg-[#4caf82] text-black font-mono text-[10px] font-bold rounded">New Session</button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {Object.values(sessions).sort((a,b)=>b.created-a.created).slice(0,20).map(s => (
            <div 
              key={s.id} onClick={() => setCurrentSession(s.id)}
              className={`px-3 py-2 rounded text-xs truncate cursor-pointer transition-colors ${currentSession === s.id ? 'bg-[#1a1a1c] text-[#ff4e1a] border-l-2 border-[#ff4e1a]' : 'text-[#9a9490] hover:bg-[#1a1a1c] hover:text-[#f5f0eb] border-l-2 border-transparent'}`}
            >
              {s.title}
            </div>
          ))}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#52504e] px-4 opacity-60 mt-4 border-t border-[#2c2c30] pt-4 mb-2">Active Agents</div>
        <div className="max-h-[160px] overflow-y-auto pb-4">
          {activeAgents.length === 0 ? (
            <div className="px-4 font-mono text-[10px] text-[#52504e]">Connecting...</div>
          ) : (
            activeAgents.map(a => (
              <div key={a.id} className="px-4 py-1.5 flex items-center gap-2 border-b border-[#2c2c30] last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.last_seen > Date.now() - 5*60*1000 ? 'bg-[#22c55e]' : 'bg-[#ff9a30]'}`}></div>
                <div className="font-mono text-[10px] text-[#9a9490] truncate">{a.id.slice(0, 22)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0c0c0d] relative">
        <div className="py-2.5 px-6 border-b border-[#2c2c30] flex flex-wrap gap-2 items-center bg-[#121214]">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#52504e] mr-1">Tools</span>
          {Object.keys(INTENT).map(t => (
            <button 
              key={t} onClick={() => toggleTool(t)}
              className={`px-3 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-colors ${activeTool === t ? 'bg-[#ff4e1a]/10 border-[#ff4e1a] text-[#ff4e1a]' : 'bg-transparent border-[#2c2c30] text-[#52504e] hover:border-[#9a9490] hover:text-[#9a9490]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4" ref={scrollRef}>
          {(!currentSession || !sessions[currentSession]?.messages.length) && !isThinking ? (
            <div className="m-auto text-center p-8">
              <h2 className="font-mono text-sm font-bold text-[#9a9490] mb-2">Research Chat</h2>
              <p className="text-xs text-[#52504e] max-w-sm">Ask any research question in natural language. The swarm searches literature, queries the corpus, designs experiments and drafts papers.</p>
            </div>
          ) : (
            sessions[currentSession]?.messages.map((m, i) => (
              <div key={i} className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[10px] font-bold border ${m.role === 'user' ? 'bg-[#ff4e1a]/10 border-[#ff4e1a]/30 text-[#ff4e1a]' : 'bg-[#1a1a1c] border-[#2c2c30] text-[#52504e]'}`}>
                  {m.role === 'user' ? agentName.slice(0,2).toUpperCase() : 'AI'}
                </div>
                <div>
                  <div className={`flex items-center gap-2 mb-1 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="font-mono text-[10px] font-bold text-[#9a9490] uppercase tracking-wider">{m.role === 'user' ? 'You' : 'Swarm'}</span>
                    {m.ts && <span className="font-mono text-[10px] text-[#52504e]">{new Date(m.ts).toLocaleTimeString()}</span>}
                  </div>
                  <div className={`p-3 text-sm leading-relaxed rounded-xl border ${m.role === 'user' ? 'bg-[#ff4e1a]/5 border-[#ff4e1a]/20 text-[#f5f0eb] rounded-tr-sm' : 'bg-[#1a1a1c] border-[#2c2c30] text-[#cecbc8] rounded-tl-sm'}`}>
                    {m.toolLabel && <div className="font-mono text-[9px] uppercase tracking-widest text-[#ffcb47] mb-2 opacity-80">{m.toolLabel}</div>}
                    <div dangerouslySetInnerHTML={{ __html: m.text.includes('<div') ? m.text : simpleMarkdown(m.text) }}></div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isThinking && (
            <div className="flex gap-3 max-w-3xl self-start">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[10px] font-bold border bg-[#1a1a1c] border-[#2c2c30] text-[#52504e]">AI</div>
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="font-mono text-[10px] font-bold text-[#9a9490] uppercase tracking-wider">Swarm</span></div>
                <div className="p-3 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl rounded-tl-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e1a] animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e1a] animate-pulse delay-150"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e1a] animate-pulse delay-300"></div>
                  </div>
                  <span className="font-mono text-[10px] text-[#52504e]">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2c2c30] bg-[#0c0c0d]">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={activeTool ? `Mode: ${activeTool.toUpperCase()}...` : "Ask a research question, search for papers..."}
              className="flex-1 min-h-[44px] max-h-[140px] bg-[#1a1a1c] border border-[#2c2c30] rounded-lg p-3 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a] resize-none"
              rows={1}
            />
            <button 
              onClick={sendMessage}
              disabled={isThinking || !inputValue.trim()}
              className="px-6 py-3 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:bg-[#52504e] disabled:text-[#9a9490] text-black font-mono text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={joinLab} className="bg-[#121214] border border-[#2c2c30] rounded-xl p-8 max-w-sm w-full">
            <h3 className="font-mono text-sm font-bold text-[#f5f0eb] mb-2">Join P2PCLAW Lab</h3>
            <p className="text-xs text-[#9a9490] mb-6 leading-relaxed">Enter your researcher identity to start. Sessions and experiments will be saved locally and synced to the P2PCLAW mesh.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1.5">Name or handle</label>
                <input required name="name" type="text" placeholder="e.g. Dr. Martinez" className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2.5 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1.5">Primary discipline</label>
                <select name="discipline" className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2.5 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]">
                  {['Computer Science / AI','Physics','Mathematics','Biology','Chemistry','Engineering','Medicine','Social Sciences','Other'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-[#4caf82] text-black font-mono text-xs font-bold rounded transition-colors hover:bg-opacity-90">Enter Lab</button>
          </form>
        </div>
      )}

      {/* Draft Modal */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#2c2c30] rounded-xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#2c2c30] flex justify-between items-center bg-[#1a1a1c] rounded-t-xl shrink-0">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ffcb47]">Paper Draft</span>
              <button onClick={() => setDraftModalOpen(false)} className="font-mono text-[10px] text-[#52504e] hover:text-[#f5f0eb]">Close</button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-[#9a9490] whitespace-pre-wrap leading-relaxed">
              {currentDraftContent}
            </div>
            <div className="p-4 border-t border-[#2c2c30] flex justify-end gap-3 shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(currentDraftContent); alert("Copied"); }} className="px-4 py-2 border border-[#2c2c30] rounded font-mono text-[10px] uppercase text-[#9a9490] hover:text-[#f5f0eb] hover:border-[#52504e]">Copy Markdown</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
