"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Globe, Copy, CheckCircle2 } from "lucide-react";
import Gun from "gun";

interface Variable {
  type: "independent" | "dependent" | "control";
  name: string;
  values: string;
  unit: string;
}

interface Experiment {
  id: string;
  agentId: string;
  title: string;
  state: "HYPOTHESIS" | "DESIGNING" | "RUNNING" | "ANALYZING" | "PUBLISHED";
  hypothesis: string;
  background: string;
  methodology: string;
  variables: string; // JSON string of Variable[]
  results: string;
  conclusions: string;
  discipline: string;
  created_at: number;
  updated_at: number;
}

const STATES = ['HYPOTHESIS','DESIGNING','RUNNING','ANALYZING','PUBLISHED'];
const STATE_SHORT: Record<string, string> = { HYPOTHESIS:'01', DESIGNING:'02', RUNNING:'03', ANALYZING:'04', PUBLISHED:'05' };

let gunInstance: any = null;
try {
  // Use same relay as original HTML
  gunInstance = Gun(['https://gun-manhattan.herokuapp.com/gun']);
} catch(e) {}

export default function ClassicNotebookPage() {
  const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    let id = localStorage.getItem('p2pclaw-agent-id');
    if (!id) {
      id = 'researcher-' + Date.now().toString(36);
      localStorage.setItem('p2pclaw-agent-id', id);
    }
    setAgentId(id);

    try {
      const raw = localStorage.getItem('p2pclaw-experiments');
      if (raw) setExperiments(JSON.parse(raw));
    } catch {}

    if (gunInstance) {
      gunInstance.get('experiments').map().on((data: any, id: string) => {
        if (data && data.agentId === localStorage.getItem('p2pclaw-agent-id')) {
          setExperiments(prev => {
            const next = {...prev, [id]: {...prev[id], ...data, id}};
            localStorage.setItem('p2pclaw-experiments', JSON.stringify(next));
            return next;
          });
        }
      });
    }
  }, []);

  const saveLocal = (nextExps: Record<string, Experiment>) => {
    localStorage.setItem('p2pclaw-experiments', JSON.stringify(nextExps));
    setExperiments(nextExps);
  };

  const syncGun = (exp: Experiment) => {
    if (!gunInstance) return;
    try {
      gunInstance.get('experiments').get(exp.id).put({
        id: exp.id,
        agentId: exp.agentId,
        title: exp.title,
        state: exp.state,
        hypothesis: exp.hypothesis,
        background: exp.background,
        methodology: exp.methodology,
        variables: exp.variables,
        results: exp.results,
        conclusions: exp.conclusions,
        discipline: exp.discipline,
        created_at: exp.created_at,
        updated_at: exp.updated_at
      });
    } catch {}
  };

  const newExp = () => {
    const id = 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const now = Date.now();
    const exp: Experiment = {
      id,
      agentId,
      title: '',
      state: 'HYPOTHESIS',
      hypothesis: '',
      background: '',
      methodology: '',
      variables: JSON.stringify([
        { type: 'independent', name: '', values: '', unit: '' },
        { type: 'dependent', name: '', values: '', unit: '' },
        { type: 'control', name: '', values: '', unit: '' }
      ]),
      results: '',
      conclusions: '',
      discipline: 'Computer Science',
      created_at: now,
      updated_at: now
    };
    
    const nextExps = { ...experiments, [id]: exp };
    saveLocal(nextExps);
    setCurrentId(id);
  };

  const updateCurrentExp = (updates: Partial<Experiment>) => {
    if (!currentId) return;
    const exp = experiments[currentId];
    if (!exp) return;
    const nextExp = { ...exp, ...updates, updated_at: Date.now() };
    const nextExps = { ...experiments, [currentId]: nextExp };
    setExperiments(nextExps);
    // Debounce gun/local storage
    setTimeout(() => {
      saveLocal(nextExps);
      syncGun(nextExp);
    }, 500);
  };

  const deleteExp = (id: string) => {
    if (!confirm("Delete this experiment from local storage?")) return;
    const next = { ...experiments };
    delete next[id];
    saveLocal(next);
    if (currentId === id) setCurrentId(null);
  };

  const expList = Object.values(experiments)
    .filter(e => (stateFilter === 'all' || e.state === stateFilter))
    .filter(e => (!searchQuery || (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.hypothesis || '').toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => b.updated_at - a.updated_at);

  const curExp = currentId ? experiments[currentId] : null;

  const getVars = (): Variable[] => {
    if (!curExp) return [];
    try { return JSON.parse(curExp.variables || '[]'); } catch { return []; }
  };

  const updateVar = (idx: number, updates: Partial<Variable>) => {
    const vs = getVars();
    const nextVs = [...vs];
    nextVs[idx] = { ...nextVs[idx], ...updates };
    updateCurrentExp({ variables: JSON.stringify(nextVs) });
  };

  const removeVar = (idx: number) => {
    const vs = getVars();
    if (vs.length <= 1) return;
    vs.splice(idx, 1);
    updateCurrentExp({ variables: JSON.stringify(vs) });
  };

  const addVar = (type: Variable['type']) => {
    const vs = getVars();
    vs.push({ type, name: '', values: '', unit: '' });
    updateCurrentExp({ variables: JSON.stringify(vs) });
  };

  const getDraft = (e: Experiment) => {
    let vs: Variable[] = [];
    try { vs = JSON.parse(e.variables || '[]'); } catch {}
    const varSection = vs.length ? vs.map(v => `- **${v.type.charAt(0).toUpperCase() + v.type.slice(1)}:** ${v.name}${v.unit ? ` (${v.unit})` : ''}${v.values ? ` — ${v.values}` : ''}`).join('\n') : 'No variables defined.';
    
    return `# ${e.title || 'Untitled Experiment'}

**Date:** ${new Date().toISOString().slice(0, 10)}
**Researcher:** ${e.agentId || 'Unknown'}
**Discipline:** ${e.discipline || 'N/A'}
**Status:** ${e.state}

## Hypothesis

${e.hypothesis || '_Not stated._'}

## Background

${e.background || '_No background information._'}

## Variables

${varSection}

## Methodology

${e.methodology || '_No methodology defined._'}

## Results

${e.results || '_No results recorded._'}

## Conclusions

${e.conclusions || '_No conclusions yet._'}

---
*Published via P2PCLAW Lab Notebook — https://www.p2pclaw.com/lab/*`;
  };

  const copyDraft = () => {
    if (!curExp) return;
    navigator.clipboard.writeText(getDraft(curExp));
    alert("Draft copied to clipboard!");
  };

  const advanceState = () => {
    if (!curExp) return;
    const idx = STATES.indexOf(curExp.state);
    if (idx < STATES.length - 1) {
      updateCurrentExp({ state: STATES[idx + 1] as any });
    }
  };

  const jumpState = (s: string) => {
    if (!curExp) return;
    updateCurrentExp({ state: s as any });
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0c0c0d] overflow-hidden -m-6 lg:-m-8">
      {/* Notebook Sidebar */}
      <div className="w-[280px] min-w-[280px] bg-[#121214] border-r border-[#2c2c30] flex flex-col pt-4">
        <div className="px-4 pb-4 border-b border-[#2c2c30] space-y-3">
          <button onClick={newExp} className="w-full flex items-center justify-center gap-2 py-2 bg-[#ff4e1a] text-[#ffffff] hover:bg-[#ff7020] font-mono text-xs font-bold rounded">
            <Plus className="w-4 h-4" /> New Experiment
          </button>
          <div className="relative">
            <Search className="absolute left-2 top-1.5 w-4 h-4 text-[#52504e]" />
            <input 
              type="text" 
              placeholder="Search experiments..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded py-1.5 pl-8 pr-2 text-xs font-sans text-[#f5f0eb] focus:border-[#ff4e1a] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['all', ...STATES].map(st => (
              <button 
                key={st}
                onClick={() => setStateFilter(st)}
                className={`px-2 py-0.5 border rounded font-mono text-[9px] font-bold uppercase ${stateFilter === st ? 'border-[#ff4e1a] text-[#ff4e1a] bg-[#ff4e1a]/10' : 'border-[#2c2c30] text-[#9a9490] hover:border-[#52504e]'}`}
              >
                {st === 'all' ? 'All' : st.slice(0,6)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {expList.length === 0 ? (
            <div className="p-4 text-center font-mono text-[10px] text-[#52504e]">No experiments found.</div>
          ) : (
            expList.map(e => (
              <div 
                key={e.id} 
                onClick={() => setCurrentId(e.id)}
                className={`p-3 rounded border cursor-pointer group transition-colors ${currentId === e.id ? 'bg-[#1a1a1c] border-[#ff4e1a]' : 'border-transparent hover:bg-[#1a1a1c] hover:border-[#2c2c30]'}`}
              >
                <div className="font-sans text-xs font-bold text-[#f5f0eb] truncate mb-1">{e.title || 'Untitled Experiment'}</div>
                <div className="flex justify-between items-center">
                  <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase
                    ${e.state === 'HYPOTHESIS' ? 'text-[#ffcb47] border-[#ffcb47]/30 bg-[#ffcb47]/10' : 
                      e.state === 'DESIGNING' ? 'text-[#5b8dee] border-[#5b8dee]/30 bg-[#5b8dee]/10' :
                      e.state === 'RUNNING' ? 'text-[#ff9a30] border-[#ff9a30]/30 bg-[#ff9a30]/10' :
                      e.state === 'ANALYZING' ? 'text-[#ff4e1a] border-[#ff4e1a]/30 bg-[#ff4e1a]/10' :
                      'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10'}`}
                  >
                    {e.state}
                  </span>
                  <span className="font-mono text-[9px] text-[#52504e]">
                    {new Date(e.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Main */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
        {!curExp ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <h2 className="font-mono text-xl font-bold text-[#f5f0eb] mb-2">Classic Lab Notebook</h2>
            <p className="font-sans text-sm text-[#9a9490] max-w-sm">Track research experiments from initial hypothesis through to published results. Data syncs natively across the P2PCLAW Gun.js mesh.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#2c2c30] pb-4 mb-8">
              <input 
                type="text" 
                value={curExp.title}
                onChange={e => updateCurrentExp({ title: e.target.value })}
                placeholder="Experiment title..."
                className="flex-1 bg-transparent border-none text-xl font-mono font-bold text-[#f5f0eb] outline-none placeholder:text-[#52504e]"
              />
              <div className="flex gap-2 shrink-0">
                <button onClick={() => deleteExp(curExp.id)} className="px-3 py-1.5 border border-[#e63030] text-[#e63030] hover:bg-[#e63030] hover:text-white rounded font-mono text-xs transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3"/> Delete
                </button>
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 overflow-x-auto bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-4">
              {STATES.map((s, i) => {
                const isActive = curExp.state === s;
                const isPast = STATES.indexOf(curExp.state) > i;
                return (
                  <div key={s} className="flex items-center shrink-0">
                    <div onClick={() => jumpState(s)} className={`flex flex-col items-center gap-1 cursor-pointer transition-opacity ${isActive ? 'opacity-100' : isPast ? 'opacity-60 hover:opacity-100' : 'opacity-30 hover:opacity-100'}`}>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-[9px] font-bold transition-colors
                        ${isActive ? 'border-[#ff4e1a] text-[#ff4e1a] bg-[#ff4e1a]/10' : isPast ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10' : 'border-[#2c2c30] text-[#9a9490] bg-[#121214]'}`}>
                        {STATE_SHORT[s]}
                      </div>
                      <span className={`font-mono text-[8px] uppercase tracking-wider ${isActive ? 'text-[#ff4e1a]' : isPast ? 'text-[#22c55e]' : 'text-[#52504e]'}`}>
                        {s}
                      </span>
                    </div>
                    {i < STATES.length - 1 && <div className="w-6 border-t border-[#52504e] mx-2 opacity-30 mt-[-10px]"></div>}
                  </div>
                );
              })}
              {STATES.indexOf(curExp.state) < STATES.length - 1 && (
                <button onClick={advanceState} className="ml-auto px-4 py-1.5 bg-[#ff4e1a] hover:bg-[#ff7020] text-black font-mono font-bold text-xs rounded transition-colors hidden sm:block">
                  Advance State
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-[#9a9490]">Discipline</label>
                <select 
                  value={curExp.discipline} 
                  onChange={e => updateCurrentExp({ discipline: e.target.value })}
                  className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]"
                >
                  {['Computer Science','Physics','Mathematics','Biology','Chemistry','Engineering','Medicine','Social Sciences','Other'].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="p-4 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-[#9a9490]">Experiment ID</label>
                <div className="font-mono text-xs text-[#52504e] p-2 bg-[#0c0c0d] border border-transparent rounded">{curExp.id}</div>
              </div>
            </div>

            <div className="p-5 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-4">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ffcb47]">Hypothesis</h3>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490]">Research Question / Hypothesis</label>
                <textarea 
                  value={curExp.hypothesis} onChange={e => updateCurrentExp({ hypothesis: e.target.value })}
                  rows={3} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]"
                  placeholder="State your hypothesis clearly. e.g. If X increases then Y will decrease because..."
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490]">Background & Motivation</label>
                <textarea 
                  value={curExp.background} onChange={e => updateCurrentExp({ background: e.target.value })}
                  rows={2} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]"
                  placeholder="Why is this experiment important? What prior work supports it?"
                />
              </div>
            </div>

            <div className="p-5 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-4">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5b8dee]">Variables</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490] pb-2 border-b border-[#2c2c30] w-16">Type</th>
                      <th className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490] pb-2 border-b border-[#2c2c30]">Name</th>
                      <th className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490] pb-2 border-b border-[#2c2c30]">Values/Range</th>
                      <th className="font-mono text-[9px] uppercase tracking-wider text-[#9a9490] pb-2 border-b border-[#2c2c30] w-20">Unit</th>
                      <th className="border-b border-[#2c2c30] w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getVars().map((v, idx) => (
                      <tr key={idx} className="border-b border-[#2c2c30]/50 last:border-0">
                        <td className="py-2 pr-2">
                          <span className={`font-mono text-[8px] font-bold uppercase ${v.type==='independent'?'text-[#5b8dee]':v.type==='dependent'?'text-[#ff9a30]':'text-[#9a9490]'}`}>
                            {v.type.substring(0,3)}
                          </span>
                        </td>
                        <td className="py-2 pr-2"><input type="text" value={v.name} onChange={e=>updateVar(idx,{name:e.target.value})} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-1.5 text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Name" /></td>
                        <td className="py-2 pr-2"><input type="text" value={v.values} onChange={e=>updateVar(idx,{values:e.target.value})} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-1.5 text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Values" /></td>
                        <td className="py-2 pr-2"><input type="text" value={v.unit} onChange={e=>updateVar(idx,{unit:e.target.value})} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-1.5 text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Unit" /></td>
                        <td className="py-2"><button onClick={()=>removeVar(idx)} className="w-full p-1.5 border border-[#2c2c30] rounded hover:border-[#e63030] hover:text-[#e63030] text-[#52504e] font-mono text-xs">x</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>addVar('independent')} className="px-3 py-1.5 border border-dashed border-[#2c2c30] hover:border-[#5b8dee] hover:text-[#5b8dee] text-[#9a9490] font-mono text-[9px] uppercase tracking-wider rounded transition-colors">+ Independent</button>
                <button onClick={()=>addVar('dependent')} className="px-3 py-1.5 border border-dashed border-[#2c2c30] hover:border-[#ff9a30] hover:text-[#ff9a30] text-[#9a9490] font-mono text-[9px] uppercase tracking-wider rounded transition-colors">+ Dependent</button>
                <button onClick={()=>addVar('control')} className="px-3 py-1.5 border border-dashed border-[#2c2c30] hover:border-[#f5f0eb] hover:text-[#f5f0eb] text-[#9a9490] font-mono text-[9px] uppercase tracking-wider rounded transition-colors">+ Control</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-4">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff9a30]">Methodology</h3>
                <textarea value={curExp.methodology} onChange={e=>updateCurrentExp({methodology:e.target.value})} rows={6} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Describe the experimental protocol..." />
              </div>

              <div className="p-5 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-4">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff4e1a]">Results & Conclusions</h3>
                <textarea value={curExp.results} onChange={e=>updateCurrentExp({results:e.target.value})} rows={3} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a] mb-2" placeholder="Record observations... tip: use markdown tables" />
                <textarea value={curExp.conclusions} onChange={e=>updateCurrentExp({conclusions:e.target.value})} rows={2} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Was the hypothesis supported? Next steps?" />
              </div>
            </div>

            <div className="p-5 bg-[#1a1a1c] border border-[#2c2c30] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#22c55e]">Paper Draft Preview</h3>
                <button onClick={copyDraft} className="flex items-center gap-1 font-mono text-[9px] text-[#9a9490] hover:text-[#f5f0eb] px-2 py-1 border border-[#2c2c30] rounded"><Copy className="w-3 h-3"/> Copy Markdown</button>
              </div>
              <div className="p-4 bg-[#0c0c0d] border border-[#2c2c30] rounded-lg font-mono text-xs text-[#9a9490] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                {getDraft(curExp)}
              </div>
              <p className="font-mono text-[9px] text-[#52504e] mt-2">
                Note: In the Classic Lab Notebook, drafting relies on your manual markdown rather than the AI Scientist engine.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
