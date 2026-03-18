"use client";

import { useState, useEffect } from "react";

const API_BASE = 'https://api-production-ff1b.up.railway.app';

interface PipelineStep {
  id: number;
  name: string;
  tool: string;
  input: string;
  output: string;
  cmd: string;
  status: string;
}

interface SavedPipeline {
  id: number;
  name: string;
  steps: number;
  status: string;
  created_at: string;
  steps_data: PipelineStep[];
}

interface Version {
  pipeline: string;
  metrics: string;
  notes: string;
  hash: string;
  date: string;
}

interface SweepParam {
  name: string;
  min: string;
  max: string;
}

export default function ClassicWorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'pipelines' | 'versioning' | 'sweep'>('builder');
  
  // Builder state
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  
  // Global state
  const [savedPipelines, setSavedPipelines] = useState<SavedPipeline[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Submit states
  const [runStatus, setRunStatus] = useState({ msg: "Add at least one step, then save or run.", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DVC state
  const [vcPipeline, setVcPipeline] = useState("");
  const [vcMetrics, setVcMetrics] = useState("");
  const [vcNotes, setVcNotes] = useState("");
  const [vcStatus, setVcStatus] = useState("");

  // Sweep state
  const [sweepParams, setSweepParams] = useState<SweepParam[]>([{ name: '', min: '', max: '' }]);
  const [sweepStrategy, setSweepStrategy] = useState("grid");
  const [sweepTrials, setSweepTrials] = useState("20");
  const [sweepPipeline, setSweepPipeline] = useState("");
  const [sweepStatus, setSweepStatus] = useState({ msg: "Configure parameters and select a pipeline, then submit.", type: "" });

  useEffect(() => {
    setIsClient(true);
    try {
      setSavedPipelines(JSON.parse(localStorage.getItem('p2pclaw_pipelines') || '[]'));
      setVersions(JSON.parse(localStorage.getItem('p2pclaw_versions') || '[]'));
    } catch(e) {}
  }, []);

  const saveToStorage = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  };

  // ---------------- BUILDER ----------------
  const addStep = () => {
    const step: PipelineStep = { id: Date.now(), name: 'Step ' + (pipeline.length + 1), tool: '', input: '', output: '', cmd: '', status: 'draft' };
    setPipeline(p => [...p, step]);
    setSelectedStepId(step.id);
  };

  const currentStep = pipeline.find(s => s.id === selectedStepId);

  const updateCurrentStep = (updates: Partial<PipelineStep>) => {
    if (!selectedStepId) return;
    setPipeline(p => p.map(s => s.id === selectedStepId ? { ...s, ...updates } : s));
  };

  const removeStep = () => {
    if (!selectedStepId) return;
    setPipeline(p => p.filter(s => s.id !== selectedStepId));
    setSelectedStepId(null);
  };

  const clearPipeline = () => {
    if (pipeline.length > 0 && !window.confirm('Clear all steps?')) return;
    setPipeline([]);
    setSelectedStepId(null);
  };

  const getDagPreview = () => {
    if (!pipeline.length) return '# Pipeline definition will appear here.\n# Add steps using the canvas above.';
    let yaml = '# P2PCLAW Pipeline\n# Generated ' + new Date().toISOString().slice(0, 10) + '\n\npipeline:\n';
    pipeline.forEach((step, i) => {
      yaml += `  step_${i + 1}:\n`;
      yaml += `    name: "${step.name}"\n`;
      if (step.tool) yaml += `    tool: ${step.tool}\n`;
      if (step.input) yaml += `    input: ${step.input}\n`;
      if (step.output) yaml += `    output: ${step.output}\n`;
      if (step.cmd) yaml += `    cmd: "${step.cmd}"\n`;
      if (i > 0) yaml += `    depends: step_${i}\n`;
    });
    yaml += '\nswarm:\n  submit: true\n  relay: https://p2pclaw-relay-production.up.railway.app/gun\n';
    return yaml;
  };

  const exportDAG = () => {
    const content = getDagPreview();
    const blob = new Blob([content], { type: 'text/yaml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'p2pclaw-pipeline.yaml';
    a.click();
  };

  const savePipeline = () => {
    if (!pipeline.length) { alert('Add at least one step.'); return; }
    const name = window.prompt('Pipeline name:', 'My Pipeline ' + (savedPipelines.length + 1));
    if (!name) return;
    const record: SavedPipeline = { id: Date.now(), name, steps: pipeline.length, status: 'draft', created_at: new Date().toISOString(), steps_data: JSON.parse(JSON.stringify(pipeline)) };
    const nextList = [record, ...savedPipelines];
    setSavedPipelines(nextList);
    saveToStorage('p2pclaw_pipelines', nextList);
    setRunStatus({ msg: 'Pipeline "' + name + '" saved.', type: 'ok' });
  };

  const runPipeline = async () => {
    if (!pipeline.length) { alert('Add at least one step.'); return; }
    const payload = { type: 'pipeline', source: 'lab-workflows-ui', steps: pipeline.map(s => ({ name: s.name, tool: s.tool, input: s.input, output: s.output, cmd: s.cmd })), submitted_at: new Date().toISOString() };
    setRunStatus({ msg: 'Submitting pipeline to swarm...', type: '' });
    setIsSubmitting(true);
    try {
      const r = await fetch(API_BASE + '/swarm/compute/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) { setRunStatus({ msg: 'Pipeline submitted \u2014 Task: ' + (d.task_id || d.id || 'ok'), type: 'ok' }); }
      else throw new Error(d.error || 'API error');
    } catch (e: any) { setRunStatus({ msg: 'Error: ' + e.message, type: 'err' }); }
    setIsSubmitting(false);
  };

  // ---------------- PIPELINES ----------------
  const loadPipeline = (p: SavedPipeline) => {
    setPipeline(JSON.parse(JSON.stringify(p.steps_data)));
    setSelectedStepId(null);
    setActiveTab('builder');
  };

  const clonePipeline = (p: SavedPipeline) => {
    const clone = { ...p, id: Date.now(), name: p.name + ' (copy)', created_at: new Date().toISOString() };
    const nextList = [clone, ...savedPipelines];
    setSavedPipelines(nextList);
    saveToStorage('p2pclaw_pipelines', nextList);
  };

  const deletePipeline = (id: number) => {
    if (!window.confirm('Delete this pipeline?')) return;
    const nextList = savedPipelines.filter(x => x.id !== id);
    setSavedPipelines(nextList);
    saveToStorage('p2pclaw_pipelines', nextList);
  };

  // ---------------- VERSIONING ----------------
  const commitVersion = () => {
    if (!vcPipeline.trim()) { setVcStatus('err: Pipeline name required.'); return; }
    const version: Version = {
      pipeline: vcPipeline.trim(), metrics: vcMetrics.trim(), notes: vcNotes.trim(),
      hash: Math.random().toString(36).slice(2, 10), date: new Date().toISOString()
    };
    const nextList = [version, ...versions];
    setVersions(nextList);
    saveToStorage('p2pclaw_versions', nextList);
    setVcStatus('ok: Version committed: v' + nextList.length);
    setVcPipeline(""); setVcMetrics(""); setVcNotes("");
  };

  // ---------------- SWEEP ----------------
  const addSweepRow = () => setSweepParams(p => [...p, { name: '', min: '', max: '' }]);
  const removeSweepRow = (idx: number) => setSweepParams(p => p.filter((_, i) => i !== idx));

  const getSweepPreview = () => {
    const valid = sweepParams.filter(p => p.name);
    let yaml = `sweep:\n  strategy: ${sweepStrategy}\n  max_trials: ${sweepTrials}\n  parameters:\n`;
    valid.forEach(p => { yaml += `    ${p.name}:\n      min: ${p.min || 0}\n      max: ${p.max || 1}\n`; });
    yaml += `  objectives:\n    - metric: loss\n      direction: minimize\n`;
    return yaml;
  };

  const submitSweep = async () => {
    const valid = sweepParams.filter(p => p.name);
    if (!valid.length) { setSweepStatus({ msg: 'Add at least one parameter.', type: 'err' }); return; }
    const payload = { type: 'parameter_sweep', source: 'lab-workflows-ui', sweep: { strategy: sweepStrategy, max_trials: +sweepTrials, parameters: valid }, submitted_at: new Date().toISOString() };
    setSweepStatus({ msg: 'Submitting sweep to swarm...', type: '' });
    setIsSubmitting(true);
    try {
      const r = await fetch(API_BASE + '/swarm/compute/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) { setSweepStatus({ msg: 'Sweep submitted \u2014 Task: ' + (d.task_id || d.id || 'ok'), type: 'ok' }); }
      else throw new Error(d.error || 'API error');
    } catch (e: any) { setSweepStatus({ msg: 'Error: ' + e.message, type: 'err' }); }
    setIsSubmitting(false);
  };

  const relTime = (ts: string) => {
    if (!ts) return '—';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return diff + 's ago'; if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago'; return Math.floor(diff/86400) + 'd ago';
  };

  if (!isClient) return <div className="p-8 text-center font-mono text-xs text-[#52504e]">Loading Workflows...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-mono text-base font-bold text-[#f5f0eb] mb-1">Workflow Management</h1>
          <p className="text-xs text-[#9a9490]">P2PCLAW / Lab / Workflows</p>
        </div>
        <div className="flex gap-2.5">
          <a href="/app/lab/classic-simulation" className="px-4 py-2 bg-[#1a1a1c] border border-[#2c2c30] text-[#9a9490] hover:bg-[#222226] hover:text-[#f5f0eb] font-mono text-[11px] font-bold rounded-lg transition-colors flex items-center">Simulation</a>
          <button onClick={runPipeline} disabled={isSubmitting} className="px-4 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:opacity-50 text-white font-mono text-[11px] font-bold rounded-lg transition-colors">Run Pipeline</button>
        </div>
      </div>

      <div className="flex border-b border-[#2c2c30] mb-8 bg-[#121214] rounded-t-xl overflow-hidden">
        {['builder', 'pipelines', 'versioning', 'sweep'].map((t, i) => {
          const labels = ['Pipeline Builder', 'My Pipelines', 'DVC Versioning', 'Parameter Sweep'];
          return (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 px-5 py-3 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors ${activeTab === t ? 'border-[#ff4e1a] text-[#ff4e1a] bg-[#ff4e1a]/5' : 'border-transparent text-[#52504e] hover:text-[#9a9490]'}`}>
              {labels[i]}
            </button>
          );
        })}
      </div>

      {activeTab === 'builder' && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Pipeline Canvas</div>
            <div className="text-xs text-[#52504e]">Build a multi-step compute pipeline</div>
          </div>
          
          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-7 min-h-[240px] mb-6 overflow-x-auto flex items-center shadow-inner">
            <div className="flex items-center min-w-max">
              {!pipeline.length ? (
                <div className="text-center w-full px-8 text-[13px] text-[#52504e]">No steps. Click "+ Add Step" to begin.</div>
              ) : (
                <>
                  {pipeline.map((step, i) => (
                    <div key={step.id} className="flex items-center">
                      {i > 0 && <span className="font-mono text-xl text-[#52504e] px-3 shrink-0">→</span>}
                      <div 
                        onClick={() => setSelectedStepId(step.id)}
                        className={`bg-[#121214] border rounded-lg p-3.5 min-w-[140px] cursor-pointer transition-colors shadow-sm
                          ${selectedStepId === step.id ? 'border-[#ff4e1a] bg-[#ff4e1a]/10' : 'border-[#2c2c30] hover:border-[#ff4e1a]/50'}`}
                      >
                        <div className="font-mono text-[9px] text-[#52504e] mb-1">{String(i + 1).padStart(2, '0')}</div>
                        <div className="font-mono text-xs font-bold text-[#f5f0eb] mb-1">{step.name}</div>
                        <div className="text-[11px] text-[#9a9490] mb-2">{step.tool || 'No tool'}</div>
                        <div className={`font-mono text-[9px] flex items-center gap-1.5 ${step.status === 'running' ? 'text-[#fbbf24]' : step.status==='done' ? 'text-[#4ade80]' : 'text-[#52504e]'}`}>
                          ○ {step.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  <span className="font-mono text-xl text-[#52504e] px-3 shrink-0"></span>
                  <button onClick={addStep} className="w-10 h-10 border border-dashed border-[#52504e] rounded-lg flex items-center justify-center text-[#52504e] hover:border-[#ff4e1a] hover:text-[#ff4e1a] transition-colors shrink-0 text-lg">+</button>
                </>
              )}
            </div>
          </div>

          {currentStep && (
            <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-top-4">
              <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#52504e] mb-5">Configure Selected Step</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Step Name</label>
                  <input type="text" value={currentStep.name} onChange={e=>updateCurrentStep({name:e.target.value})} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Tool</label>
                  <select value={currentStep.tool} onChange={e=>updateCurrentStep({tool:e.target.value})} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]">
                    <option value="">— Select tool —</option>
                    <optgroup label="Data"><option value="dvc pull">DVC Pull</option><option value="dvc push">DVC Push</option><option value="ipfs get">IPFS Get</option></optgroup>
                    <optgroup label="Compute"><option value="lammps">LAMMPS</option><option value="gromacs">GROMACS</option><option value="qiskit">Qiskit</option><option value="pytorch">PyTorch</option><option value="jax">JAX</option><option value="rdkit">RDKit</option><option value="blast">BLAST+</option></optgroup>
                    <optgroup label="Analysis"><option value="python">Python script</option><option value="r">R script</option><option value="julia">Julia script</option></optgroup>
                    <optgroup label="Output"><option value="paraview">ParaView render</option><option value="plotly">Plotly export</option><option value="publish-paper">Publish to La Rueda</option></optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Input</label>
                  <input type="text" value={currentStep.input} onChange={e=>updateCurrentStep({input:e.target.value})} placeholder="IPFS CID, file path, or previous step loop" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Output</label>
                  <input type="text" value={currentStep.output} onChange={e=>updateCurrentStep({output:e.target.value})} placeholder="Output file name or IPFS namespace" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                </div>
              </div>
              <div className="mb-5">
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Command / Script</label>
                <textarea rows={2} value={currentStep.cmd} onChange={e=>updateCurrentStep({cmd:e.target.value})} placeholder="e.g., lammps -in simulation.in -var T 300" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] resize-y" />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button onClick={removeStep} className="px-3 py-2 border border-[#2c2c30] text-[#f87171] hover:bg-[#f87171]/10 font-mono text-[11px] font-bold rounded-lg transition-colors">Remove Step</button>
                <button onClick={()=>setSelectedStepId(null)} className="px-3 py-2 bg-[#121214] border border-[#2c2c30] text-[#9a9490] hover:text-[#f5f0eb] hover:bg-[#222226] font-mono text-[11px] font-bold rounded-lg transition-colors">Close</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <button onClick={addStep} className="px-4 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#9a9490] hover:text-[#f5f0eb] hover:bg-[#222226] font-mono text-[11px] font-bold rounded-lg transition-colors">+ Add Step</button>
            <button onClick={clearPipeline} className="px-4 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#f87171] hover:bg-[#f87171]/10 font-mono text-[11px] font-bold rounded-lg transition-colors">Clear</button>
            <div className="flex-1"></div>
            <button onClick={exportDAG} className="px-4 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#9a9490] hover:text-[#f5f0eb] hover:bg-[#222226] font-mono text-[11px] font-bold rounded-lg transition-colors">Export DAG (YAML)</button>
            <button onClick={savePipeline} className="px-4 py-2 bg-[#ff4e1a] text-white hover:bg-[#ff7020] font-mono text-[11px] font-bold rounded-lg transition-colors">Save Pipeline</button>
          </div>

          <div className="flex items-baseline gap-3 mb-4 mt-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Pipeline Config Preview</div>
            <div className="text-xs text-[#52504e]">Snakemake-compatible YAML export</div>
          </div>
          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-5 font-mono text-[11px] text-[#34d399] leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto mb-8">
            {getDagPreview()}
          </div>

          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-4.5 flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="text-sm font-bold text-[#f5f0eb]">Pipeline ready</div>
              <div className={`font-mono text-[11px] mt-0.5 ${runStatus.type==='ok'?'text-[#4ade80]':runStatus.type==='err'?'text-[#f87171]':'text-[#9a9490]'}`}>{runStatus.msg}</div>
            </div>
            <button onClick={savePipeline} className="px-3.5 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#9a9490] hover:bg-[#222226] hover:text-[#f5f0eb] font-mono text-[11px] font-bold rounded-lg transition-colors">Save</button>
            <button onClick={runPipeline} disabled={isSubmitting} className="px-4 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:opacity-50 text-white font-mono text-[11px] font-bold rounded-lg transition-colors">{isSubmitting ? 'Running...' : 'Run on Swarm'}</button>
          </div>
        </div>
      )}

      {activeTab === 'pipelines' && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Saved Pipelines</div>
            <div className="text-xs text-[#52504e]">Manage and re-run your compute pipelines</div>
          </div>
          <div className="space-y-2.5">
            {!savedPipelines.length ? (
              <div className="text-center py-10 text-[13px] text-[#52504e] border border-dashed border-[#2c2c30] rounded-xl">No saved pipelines. Build one in the Pipeline Builder tab.</div>
            ) : savedPipelines.map(p => {
              const sc = p.status === 'running' ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20' : 
                         p.status === 'done' ? 'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20' : 
                         p.status === 'draft' ? 'bg-[#94a3b8]/10 text-[#94a3b8] border border-[#94a3b8]/20' : 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20';
              return (
                <div key={p.id} className="bg-[#1a1a1c] border border-[#2c2c30] rounded-lg p-4 flex flex-wrap lg:grid lg:grid-cols-[1fr_80px_60px_60px_40px] gap-3 items-center hover:border-[#ff4e1a]/30 transition-colors">
                  <div className="w-full lg:w-auto">
                    <div className="text-[13px] font-bold text-[#f5f0eb]">{p.name}</div>
                    <div className="font-mono text-[10px] text-[#52504e] mt-0.5">{p.steps} steps • {relTime(p.created_at)}</div>
                  </div>
                  <div><span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase ${sc}`}>{p.status || 'draft'}</span></div>
                  <button onClick={()=>loadPipeline(p)} className="px-3 flex-1 lg:flex-none justify-center py-1.5 border border-[#2c2c30] bg-[#121214] text-[#9a9490] hover:text-[#f5f0eb] font-mono text-[10px] font-bold rounded transition-colors">Load</button>
                  <button onClick={()=>clonePipeline(p)} className="px-3 flex-1 lg:flex-none justify-center py-1.5 border border-[#2c2c30] bg-[#121214] text-[#9a9490] hover:text-[#f5f0eb] font-mono text-[10px] font-bold rounded transition-colors">Clone</button>
                  <button onClick={()=>deletePipeline(p.id)} className="px-2 py-1.5 text-[#52504e] hover:text-[#f87171] hover:bg-[#f87171]/10 rounded transition-colors font-mono ml-auto">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'versioning' && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Experiment Versions</div>
            <div className="text-xs text-[#52504e]">DVC-style tracked experiment runs</div>
          </div>
          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-hidden overflow-x-auto mb-6">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#52504e] bg-[#121214] border-b border-[#2c2c30]">
                <tr>
                  <th className="px-3.5 py-2.5 font-normal">Version</th>
                  <th className="px-3.5 py-2.5 font-normal">Pipeline</th>
                  <th className="px-3.5 py-2.5 font-normal">Commit Hash</th>
                  <th className="px-3.5 py-2.5 font-normal">Metrics</th>
                  <th className="px-3.5 py-2.5 font-normal">Status</th>
                  <th className="px-3.5 py-2.5 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {!versions.length ? (
                  <tr><td colSpan={6} className="text-center py-7 text-[#52504e]">No versions committed yet.</td></tr>
                ) : versions.map((v, i) => (
                  <tr key={i} className="border-b border-[#2c2c30]/50 hover:bg-[#ff4e1a]/5 last:border-b-0 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#9a9490]">v{versions.length - i}</td>
                    <td className="px-3.5 py-2.5 text-[#f5f0eb]">{v.pipeline}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#52504e]">{v.hash}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#34d399] truncate max-w-[200px]">{v.metrics ? v.metrics.slice(0, 40) : '—'}</td>
                    <td className="px-3.5 py-2.5"><span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20">COMMITTED</span></td>
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#52504e]">{relTime(v.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Commit New Version</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Pipeline Name</label>
              <input type="text" value={vcPipeline} onChange={e=>setVcPipeline(e.target.value)} placeholder="e.g., protein-folding-v2" className="w-full bg-[#1A1A1C] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
            </div>
            <div>
              <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Metrics JSON</label>
              <input type="text" value={vcMetrics} onChange={e=>setVcMetrics(e.target.value)} placeholder='{"rmsd":0.42,"energy":-1234.5}' className="w-full bg-[#1A1A1C] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Notes</label>
            <textarea rows={2} value={vcNotes} onChange={e=>setVcNotes(e.target.value)} placeholder="Describe changes from previous version..." className="w-full bg-[#1A1A1C] border border-[#2c2c30] rounded-md px-3 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] resize-y" />
          </div>
          <div className="flex justify-end mb-2">
            <button onClick={commitVersion} className="px-4 py-2 bg-[#ff4e1a] text-white hover:bg-[#ff7020] font-mono text-[11px] font-bold rounded-lg transition-colors">Commit Version</button>
          </div>
          {vcStatus && <div className={`font-mono text-[11px] text-right ${vcStatus.startsWith('ok')?'text-[#4ade80]':'text-[#f87171]'}`}>{vcStatus.replace(/^(ok|err):\s*/,'')}</div>}
        </div>
      )}

      {activeTab === 'sweep' && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Parameter Sweep</div>
            <div className="text-xs text-[#52504e]">Define parameter ranges for grid or random search</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-5">
              <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#52504e] mb-4">Parameter Ranges</div>
              <div className="space-y-2.5 mb-2">
                {sweepParams.map((p, i) => (
                  <div key={i} className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Parameter</label>
                      <input type="text" value={p.name} onChange={e=>{setSweepParams(s=>s.map((x,idx)=>idx===i?{...x,name:e.target.value}:x));}} placeholder="e.g. temperature" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                    </div>
                    <div className="w-20">
                      <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Min</label>
                      <input type="number" value={p.min} onChange={e=>{setSweepParams(s=>s.map((x,idx)=>idx===i?{...x,min:e.target.value}:x));}} placeholder="0" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                    </div>
                    <div className="w-20">
                      <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Max</label>
                      <input type="number" value={p.max} onChange={e=>{setSweepParams(s=>s.map((x,idx)=>idx===i?{...x,max:e.target.value}:x));}} placeholder="100" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                    </div>
                    <button onClick={()=>removeSweepRow(i)} className="p-1.5 text-[#52504e] hover:text-[#f87171] hover:bg-[#f87171]/10 rounded font-mono transition-colors">✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addSweepRow} className="text-[#ff4e1a] hover:text-[#ff7020] font-mono text-[11px] font-bold inline-flex items-center gap-1.5 py-1 mb-5">+ Add parameter</button>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Strategy</label>
                  <select value={sweepStrategy} onChange={e=>setSweepStrategy(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]">
                    <option value="grid">Grid search</option><option value="random">Random search</option><option value="tpe">TPE (Optuna)</option><option value="asha">ASHA (Ray Tune)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Max Trials</label>
                  <input type="number" value={sweepTrials} onChange={e=>setSweepTrials(e.target.value)} min={1} max={500} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-5">
              <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#52504e] mb-4">Optimization Target</div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2">
                  <div className="font-mono text-[11px] font-bold text-[#f5f0eb] flex-1">loss</div>
                  <div className="font-mono text-[10px] text-[#52504e]">minimize</div>
                  <div className="font-mono text-[11px] font-bold text-[#34d399] w-8 text-right">—</div>
                </div>
                <div className="flex items-center gap-2 bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2">
                  <div className="font-mono text-[11px] font-bold text-[#f5f0eb] flex-1">accuracy</div>
                  <div className="font-mono text-[10px] text-[#52504e]">maximize</div>
                  <div className="font-mono text-[11px] font-bold text-[#34d399] w-8 text-right">—</div>
                </div>
                <div className="flex items-center gap-2 bg-[#121214] border border-[#2c2c30] rounded-md px-3 py-2">
                  <div className="font-mono text-[11px] font-bold text-[#f5f0eb] flex-1">runtime</div>
                  <div className="font-mono text-[10px] text-[#52504e]">minimize</div>
                  <div className="font-mono text-[11px] font-bold text-[#34d399] w-8 text-right">—</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1">Pipeline to Sweep</label>
                <select value={sweepPipeline} onChange={e=>setSweepPipeline(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2 py-1.5 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a]">
                  <option value="">— Select pipeline —</option>
                  {savedPipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5 mt-2">Sweep Config Preview (YAML)</div>
              <div className="bg-[#121214] border border-[#2c2c30] rounded-md p-3 font-mono text-[10px] text-[#34d399] leading-relaxed whitespace-pre overflow-x-auto max-h-[140px]">
                {getSweepPreview()}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-4.5 flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="text-sm font-bold text-[#f5f0eb]">Sweep Configuration</div>
              <div className={`font-mono text-[11px] mt-0.5 ${sweepStatus.type==='ok'?'text-[#4ade80]':sweepStatus.type==='err'?'text-[#f87171]':'text-[#9a9490]'}`}>{sweepStatus.msg}</div>
            </div>
            <button onClick={submitSweep} disabled={isSubmitting} className="px-4 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:opacity-50 text-white font-mono text-[11px] font-bold rounded-lg transition-colors">{isSubmitting ? 'Submitting...' : 'Submit Sweep'}</button>
          </div>
        </div>
      )}

    </div>
  );
}
