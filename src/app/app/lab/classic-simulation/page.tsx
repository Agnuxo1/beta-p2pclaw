"use client";

import { useState, useEffect, useMemo } from "react";

const API_BASE = 'https://api-production-ff1b.up.railway.app';

interface Tool {
  id: string;
  name: string;
  desc: string;
  cat: string;
}

interface Domain {
  id: string;
  num: string;
  name: string;
  color: string;
  desc: string;
  tools: Tool[];
}

const DOMAINS: Domain[] = [
  { id:'physics', num:'01', name:'Physics & Cosmology', color:'#60a5fa', desc:'N-body, quantum circuits, MD, field theory.',
    tools:[
      {id:'lammps',name:'LAMMPS',desc:'Molecular dynamics. Classical & reactive force fields.',cat:'MD'},
      {id:'qiskit',name:'Qiskit',desc:'Quantum circuit simulation. VQE, QAOA, noise models.',cat:'QC'},
      {id:'gromacs',name:'GROMACS',desc:'High-performance MD for biomolecular systems.',cat:'MD'},
      {id:'fenics',name:'FEniCS',desc:'Finite element PDE solver. Elasticity, fluids.',cat:'FEA'},
      {id:'openmm',name:'OpenMM',desc:'GPU-accelerated MD. Alchemical transformations.',cat:'MD'},
      {id:'astropy',name:'yt + Astropy',desc:'Astrophysical simulation analysis. SPH, AMR.',cat:'Astro'},
    ]},
  { id:'robotics', num:'02', name:'Robotics & Control', color:'#a78bfa', desc:'ROS2, RL environments, path optimisation.',
    tools:[
      {id:'ros2',name:'ROS2 + Nav2',desc:'Robot OS 2. Navigation stack, SLAM.',cat:'Nav'},
      {id:'pybullet',name:'PyBullet',desc:'Physics for robotics. Rigid body dynamics.',cat:'Sim'},
      {id:'gymnasium',name:'Gymnasium',desc:'RL environments. MuJoCo, Atari, Box2D.',cat:'RL'},
      {id:'mujoco',name:'MuJoCo',desc:'Contact-rich manipulation. Dexterous tasks.',cat:'Sim'},
      {id:'isaacgym',name:'Isaac Gym',desc:'GPU-parallel RL training at scale.',cat:'RL'},
      {id:'ortools',name:'OR-Tools',desc:'Route planning, scheduling, constraint sat.',cat:'Opt'},
    ]},
  { id:'chemistry', num:'03', name:'Chemistry & Materials', color:'#4ade80', desc:'Drug screening, DFT, protein folding.',
    tools:[
      {id:'rdkit',name:'RDKit',desc:'Cheminformatics. Virtual screening, fingerprints.',cat:'Chem'},
      {id:'psi4',name:'Psi4',desc:'Quantum chemistry. DFT, MP2, CCSD(T).',cat:'QC'},
      {id:'orca',name:'ORCA',desc:'General QC. Relativistic, multireference.',cat:'QC'},
      {id:'openbabel',name:'OpenBabel',desc:'110+ format conversion, descriptor calc.',cat:'Conv'},
      {id:'alphafold',name:'AlphaFold2',desc:'Protein structure prediction from sequence.',cat:'Bio'},
      {id:'cp2k',name:'CP2K',desc:'DFT, tight-binding, periodic boundary.',cat:'DFT'},
    ]},
  { id:'biology', num:'04', name:'Biology & Genomics', color:'#fbbf24', desc:'Gene expression, phylogenetics, multi-omics.',
    tools:[
      {id:'bioconductor',name:'Bioconductor',desc:'R packages. DE analysis, scRNA-seq.',cat:'Omics'},
      {id:'blast',name:'BLAST+',desc:'Sequence alignment. Local search tool.',cat:'Seq'},
      {id:'star',name:'STAR Aligner',desc:'Splice-aware RNA-seq mapping.',cat:'RNA'},
      {id:'deseq2',name:'DESeq2',desc:'Differential gene expression. Neg-binomial.',cat:'RNA'},
      {id:'cellranger',name:'Cell Ranger',desc:'Single-cell RNA-seq. Barcode, UMI.',cat:'scRNA'},
      {id:'beast2',name:'BEAST2',desc:'Bayesian phylogenetics. Molecular clock.',cat:'Phylo'},
    ]},
  { id:'ai', num:'05', name:'AI / Machine Learning', color:'#ff4e1a', desc:'Distributed training, HPO, NAS, federated.',
    tools:[
      {id:'pytorch',name:'PyTorch + Ray',desc:'Distributed training. FSDP, pipeline.',cat:'DL'},
      {id:'jax',name:'JAX + Flax',desc:'Functional ML. XLA, auto-diff.',cat:'DL'},
      {id:'optuna',name:'Optuna',desc:'Hyperparameter optimisation. TPE, pruning.',cat:'HPO'},
      {id:'deepspeed',name:'DeepSpeed',desc:'LLM training. ZeRO, offloading.',cat:'LLM'},
      {id:'flower',name:'Flower FL',desc:'Federated learning. Privacy-preserving.',cat:'Fed'},
      {id:'nasbench',name:'NAS Bench',desc:'Neural architecture search. Differentiable.',cat:'NAS'},
    ]},
  { id:'visualization', num:'06', name:'Data Visualization', color:'#f472b6', desc:'3D rendering, interactive plots, geospatial.',
    tools:[
      {id:'paraview',name:'ParaView',desc:'Scientific viz. Volume rendering, streamlines.',cat:'3D'},
      {id:'plotly',name:'Plotly Dash',desc:'Interactive dashboards. Charts, maps.',cat:'Plot'},
      {id:'vtk',name:'VTK',desc:'Contours, vector fields, surface extraction.',cat:'3D'},
      {id:'networkx',name:'NetworkX',desc:'Graph analysis. Community detection.',cat:'Graph'},
      {id:'keplergl',name:'Kepler.gl',desc:'Geospatial. Heatmaps, H3 aggregation.',cat:'Geo'},
      {id:'blender',name:'Blender Py',desc:'Scientific 3D rendering. Molecules, proteins.',cat:'3D'},
    ]},
  { id:'workflows', num:'07', name:'Workflow Management', color:'#34d399', desc:'Pipeline automation, versioning, sweeps.',
    tools:[
      {id:'snakemake',name:'Snakemake',desc:'Rule-based DAGs. Cluster, container.',cat:'WF'},
      {id:'nextflow',name:'Nextflow',desc:'DSL2 pipelines. Cloud-native execution.',cat:'WF'},
      {id:'dvc',name:'DVC',desc:'Data versioning. Experiment tracking.',cat:'Ver'},
      {id:'airflow',name:'Airflow',desc:'DAG scheduling. Monitoring, retries.',cat:'Orch'},
      {id:'prefect',name:'Prefect',desc:'Async tasks. Observability, deployments.',cat:'Orch'},
      {id:'cwl',name:'CWL / WDL',desc:'Portable bioinformatics pipelines.',cat:'Std'},
    ]},
  { id:'decentralized', num:'08', name:'Decentralized Science', color:'#e879f9', desc:'Bacalhau, IPFS pipelines, on-chain attestation.',
    tools:[
      {id:'bacalhau',name:'Bacalhau',desc:'Compute over IPFS data. Docker/WASM jobs.',cat:'P2P'},
      {id:'libp2p',name:'IPFS + libp2p',desc:'Content-addressed storage. Pubsub, DHT.',cat:'P2P'},
      {id:'gunjs',name:'Gun.js RAD',desc:'Distributed graph DB. Real-time, offline-first.',cat:'DB'},
      {id:'ceramic',name:'Ceramic',desc:'Decentralized data streams. Self-sovereign ID.',cat:'DID'},
      {id:'atproto',name:'AT Protocol',desc:'Open distributed social/data protocol.',cat:'Fed'},
      {id:'ocean',name:'Ocean Protocol',desc:'Data marketplace. Compute-to-data, privacy ML.',cat:'Market'},
    ]},
];

interface Task {
  id?: string;
  task_id?: string;
  status: string;
  title?: string;
  tool_name?: string;
  tool?: string;
  domain?: string;
  resources?: any;
  cpu?: string | number;
  gpu?: string;
  created_at?: string;
  completed_at?: string;
  updated_at?: string;
}

const simRelTime = (ts: string) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return diff + 's ago'; if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago'; return Math.floor(diff/86400) + 'd ago';
};

const syntaxHL = (obj: any) => {
  const json = JSON.stringify(obj, null, 2);
  const parts = json.split(/("[\w_-]+"\s*:|:\s*".*?"|:\s*\d[\d.]*)/g);
  return (
    <pre className="m-0 font-mono text-[11px] text-[#9a9490] whitespace-pre-wrap break-all leading-relaxed">
      {parts.map((part, i) => {
        if (part.match(/^"[\w_-]+"\s*:$/)) {
          return <span key={i} className="text-[#60a5fa]">{part}</span>;
        } else if (part.match(/^:\s*".*?"$/)) {
          const colon = part.slice(0, part.indexOf('"'));
          const str = part.slice(part.indexOf('"'));
          return <span key={i}>{colon}<span className="text-[#4ade80]">{str}</span></span>;
        } else if (part.match(/^:\s*\d[\d.]*$/)) {
          const colon = part.slice(0, part.search(/\d/));
          const num = part.slice(part.search(/\d/));
          return <span key={i}>{colon}<span className="text-[#fbbf24]">{num}</span></span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </pre>
  );
};

export default function ClassicSimulationPage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  
  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [cpu, setCpu] = useState("4");
  const [gpu, setGpu] = useState("none");
  const [duration, setDuration] = useState("1h");
  const [replications, setReplications] = useState("1");
  const [customParams, setCustomParams] = useState("");
  
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  const [submitStatus, setSubmitStatus] = useState({ msg: "Select a domain and tool, then fill the job title.", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const payload = useMemo(() => {
    let custom = {};
    try { custom = JSON.parse(customParams || '{}'); } catch(e) {}
    return {
      type: 'simulation', source: 'lab-simulation-ui',
      domain: selectedDomain?.id || '', tool: selectedTool?.id || '', tool_name: selectedTool?.name || '',
      title: title,
      hypothesis: hypothesis,
      resources: { cpu: +cpu, gpu, duration, replications: +replications },
      params: custom, submitted_at: new Date().toISOString()
    };
  }, [selectedDomain, selectedTool, title, hypothesis, cpu, gpu, duration, replications, customParams]);

  const loadTasks = async () => {
    try {
      const r = await fetch(API_BASE + '/swarm/compute/tasks');
      const d = await r.json();
      const tasks = Array.isArray(d) ? d : (d.tasks || []);
      setActiveTasks(tasks.filter((t:any) => t.status === 'running' || t.status === 'pending' || t.status === 'queued'));
      setDoneTasks(tasks.filter((t:any) => t.status === 'done' || t.status === 'completed' || t.status === 'failed').slice(0, 10));
    } catch(e) {
      // failed to load
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    // Parse URL for ?domain=...
    const d = new URLSearchParams(window.location.search).get('domain');
    if (d) {
      const dom = DOMAINS.find(x => x.id === d);
      if (dom) setSelectedDomain(dom);
    }
    loadTasks();
    const intv = setInterval(loadTasks, 30000);
    return () => clearInterval(intv);
  }, []);

  const handleDomainSelect = (d: Domain) => {
    setSelectedDomain(d);
    setSelectedTool(null);
    setSubmitStatus({ msg: `${d.name} \u2014 select a tool`, type: '' });
  };

  const handleToolSelect = (t: Tool) => {
    setSelectedTool(t);
    setSubmitStatus({ msg: `Fill in simulation title and submit to the compute swarm.`, type: '' });
  };

  const submitSimulation = async () => {
    if (!selectedDomain || !selectedTool) { setSubmitStatus({ msg: 'Select a domain and tool first.', type: 'err' }); return; }
    if (!title.trim()) { setSubmitStatus({ msg: 'Please provide a simulation title.', type: 'err' }); return; }
    
    setIsSubmitting(true);
    setSubmitStatus({ msg: 'Submitting to swarm...', type: '' });
    try {
      const r = await fetch(API_BASE + '/swarm/compute/task', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) {
        setSubmitStatus({ msg: 'Submitted \u2014 Task ID: ' + (d.task_id || d.id || 'received'), type: 'ok' });
        setTimeout(loadTasks, 2000);
      } else throw new Error(d.error || d.message || 'API error ' + r.status);
    } catch(e: any) { setSubmitStatus({ msg: 'Error: ' + e.message, type: 'err' }); }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedDomain(null);
    setSelectedTool(null);
    setTitle("");
    setHypothesis("");
    setCustomParams("");
    setSubmitStatus({ msg: "Select a domain and tool, then fill the job title.", type: "" });
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-mono text-base font-bold text-[#f5f0eb] mb-1">Simulation Launcher</h1>
          <p className="text-xs text-[#9a9490]">P2PCLAW / Lab / Simulation</p>
        </div>
        <div className="flex gap-2.5">
          <a href="/app/lab/classic-workflows" className="px-4 py-2 bg-[#1a1a1c] border border-[#2c2c30] text-[#9a9490] hover:bg-[#222226] hover:text-[#f5f0eb] font-mono text-[11px] font-bold rounded-lg transition-colors flex items-center">Workflows</a>
          <button onClick={submitSimulation} disabled={isSubmitting} className="px-4 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:opacity-50 text-white font-mono text-[11px] font-bold rounded-lg transition-colors">Submit to Swarm</button>
        </div>
      </div>

      {/* Step 1 */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#ff4e1a]/15 text-[#ff4e1a] border border-[#ff4e1a]/25">Step 1</span>
        <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Select Domain</div>
        <div className="text-xs text-[#52504e]">Choose a scientific discipline</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {DOMAINS.map(d => (
          <div 
            key={d.id} 
            onClick={() => handleDomainSelect(d)}
            className={`bg-[#1a1a1c] border-[2px] rounded-xl p-4 cursor-pointer transition-all relative
              ${selectedDomain?.id === d.id ? `bg-[#ff4e1a]/5` : 'border-[#2c2c30] hover:bg-[#222226]'}`}
            style={selectedDomain?.id === d.id ? { borderColor: d.color } : {}}
            onMouseEnter={(e) => { if(selectedDomain?.id !== d.id) e.currentTarget.style.borderColor = d.color; }}
            onMouseLeave={(e) => { if(selectedDomain?.id !== d.id) e.currentTarget.style.borderColor = '#2c2c30'; }}
          >
            {selectedDomain?.id === d.id && <div className="absolute top-2.5 right-3 font-mono text-[11px]" style={{ color: d.color }}>✓</div>}
            <div className="font-mono text-[9px] text-[#52504e] mb-1.5">{d.num}</div>
            <div className="font-mono text-xs font-bold mb-1" style={{ color: d.color }}>{d.name}</div>
            <div className="text-[11px] text-[#9a9490] leading-snug">{d.desc}</div>
          </div>
        ))}
      </div>

      <hr className="border-t border-[#2c2c30] mb-7" />

      {/* Step 2 */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#ff4e1a]/15 text-[#ff4e1a] border border-[#ff4e1a]/25">Step 2</span>
        <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Configure Simulation</div>
        <div className="text-xs text-[#52504e]">{selectedDomain ? `${selectedDomain.name} \u2014 select a tool` : 'Select a domain first'}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-6 mb-7 items-start">
        {/* Tool picker */}
        <div>
          <div className="font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-3">Available Tools</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {!selectedDomain ? (
              <div className="col-span-full text-center p-5 text-xs text-[#52504e]">Select a domain to see tools.</div>
            ) : selectedDomain.tools.map(t => (
              <div 
                key={t.id}
                onClick={() => handleToolSelect(t)}
                className={`bg-[#121214] border rounded-lg p-3 cursor-pointer transition-all
                  ${selectedTool?.id === t.id ? 'border-[#ff4e1a] bg-[#ff4e1a]/15' : 'border-[#2c2c30] hover:border-[#ff4e1a]'}`}
              >
                <div className="font-mono text-[11px] font-bold text-[#f5f0eb] mb-1">{t.name}</div>
                <div className="text-[11px] text-[#9a9490] leading-snug mb-2">{t.desc}</div>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#ff4e1a]/10 text-[#52504e] border border-[#2c2c30] inline-block">{t.cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Config Panel */}
        <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-[#2c2c30] font-mono text-[10px] font-bold tracking-wider uppercase text-[#52504e] bg-[#121214]">Job Configuration</div>
          <div className="p-4.5 space-y-3.5">
            <div>
              <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Simulation Title</label>
              <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Quantum circuit depth sweep" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Hypothesis</label>
              <input type="text" value={hypothesis} onChange={e=>setHypothesis(e.target.value)} placeholder="e.g., Depth > 10 improves expressibility" className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">CPU Cores</label>
                <select value={cpu} onChange={e=>setCpu(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors">
                  <option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="8">8</option><option value="16">16</option><option value="32">32</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">GPU</label>
                <select value={gpu} onChange={e=>setGpu(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors">
                  <option value="none">None</option><option value="T4">T4</option><option value="A10G">A10G</option><option value="A100">A100</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <div>
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Duration</label>
                <select value={duration} onChange={e=>setDuration(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors">
                  <option value="30m">30 min</option><option value="1h">1 hour</option><option value="4h">4 hours</option><option value="12h">12 hours</option><option value="24h">24 hours</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Replications</label>
                <select value={replications} onChange={e=>setReplications(e.target.value)} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors">
                  <option value="1">1</option><option value="2">2</option><option value="3">3 (consensus)</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Custom Params (JSON)</label>
              <textarea value={customParams} onChange={e=>setCustomParams(e.target.value)} placeholder='{"steps":1000,"temperature":300}' rows={2} className="w-full bg-[#121214] border border-[#2c2c30] rounded-md px-2.5 py-2 font-mono text-xs text-[#f5f0eb] outline-none focus:border-[#ff4e1a] transition-colors resize-y" />
            </div>
            
            <div className="mt-4 pt-1">
              <div className="font-mono text-[9px] font-bold tracking-widest uppercase text-[#52504e] mb-1.5">Payload Preview</div>
              <div className="bg-[#121214] border border-[#2c2c30] rounded-md p-3.5 max-h-[180px] overflow-y-auto">
                {selectedDomain && selectedTool ? syntaxHL(payload) : <span className="font-mono text-[11px] text-[#52504e]">Select domain and tool to preview payload.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-4.5 flex items-center gap-4 mb-8">
        <div className="flex-1">
          <div className="text-sm font-bold text-[#f5f0eb]">{selectedDomain && selectedTool ? `${selectedDomain.name} / ${selectedTool.name}` : 'Ready to configure'}</div>
          <div className={`font-mono text-[11px] mt-0.5 ${submitStatus.type === 'ok' ? 'text-[#4ade80]' : submitStatus.type === 'err' ? 'text-[#f87171]' : 'text-[#9a9490]'}`}>
            {submitStatus.msg}
          </div>
        </div>
        <button onClick={resetForm} className="px-3.5 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#9a9490] hover:bg-[#222226] hover:text-[#f5f0eb] font-mono text-[11px] font-bold rounded-lg transition-colors">Reset</button>
        <button onClick={submitSimulation} disabled={isSubmitting} className="px-4 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:opacity-50 text-white font-mono text-[11px] font-bold rounded-lg transition-colors">
          {isSubmitting ? 'Submitting...' : 'Submit to Swarm'}
        </button>
      </div>

      <hr className="border-t border-[#2c2c30] mb-7" />

      {/* Active Simulations Desktop/Mobile tables */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Active Simulations</div>
          <div className="text-xs text-[#52504e]">Live compute jobs on the swarm</div>
        </div>
        
        <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#52504e] bg-[#121214] border-b border-[#2c2c30]">
              <tr>
                <th className="px-3.5 py-2.5 font-normal">Task ID</th>
                <th className="px-3.5 py-2.5 font-normal">Title / Tool</th>
                <th className="px-3.5 py-2.5 font-normal">Domain</th>
                <th className="px-3.5 py-2.5 font-normal">CPU</th>
                <th className="px-3.5 py-2.5 font-normal">GPU</th>
                <th className="px-3.5 py-2.5 font-normal">Status</th>
                <th className="px-3.5 py-2.5 font-normal">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTasks ? (
                <tr><td colSpan={7} className="text-center py-7 text-[#52504e]">Loading...</td></tr>
              ) : activeTasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-7 text-[#52504e]">No jobs found.</td></tr>
              ) : activeTasks.map(t => {
                const id = (t.id || t.task_id || '—').toString().slice(0,10);
                const titleStr = t.title || t.tool_name || t.tool || '—';
                const sc = t.status === 'running' ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20' : 
                          t.status === 'pending' || t.status === 'queued' ? 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20' : 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20';
                return (
                  <tr key={t.id || t.task_id} className="border-b border-[#2c2c30]/50 hover:bg-[#ff4e1a]/5 last:border-b-0 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#52504e]">{id}</td>
                    <td className="px-3.5 py-2.5 text-[#9a9490]">{titleStr}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#9a9490]">{t.domain || '—'}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#52504e]">{t.resources?.cpu || t.cpu || '—'}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#52504e]">{t.resources?.gpu || t.gpu || 'none'}</td>
                    <td className="px-3.5 py-2.5"><span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase ${sc}`}>{t.status}</span></td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#52504e]">{simRelTime(t.created_at || '')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Completed */}
      <div>
        <div className="flex items-baseline gap-3 mb-4">
          <div className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#9a9490]">Recent Completed</div>
          <div className="text-xs text-[#52504e]">Finished or failed jobs</div>
        </div>
        
        <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#52504e] bg-[#121214] border-b border-[#2c2c30]">
              <tr>
                <th className="px-3.5 py-2.5 font-normal">Task ID</th>
                <th className="px-3.5 py-2.5 font-normal">Title / Tool</th>
                <th className="px-3.5 py-2.5 font-normal">Domain</th>
                <th className="px-3.5 py-2.5 font-normal">Duration</th>
                <th className="px-3.5 py-2.5 font-normal">Status</th>
                <th className="px-3.5 py-2.5 font-normal">Completed</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTasks ? (
                <tr><td colSpan={6} className="text-center py-7 text-[#52504e]">Loading...</td></tr>
              ) : doneTasks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-7 text-[#52504e]">No jobs found.</td></tr>
              ) : doneTasks.map(t => {
                const id = (t.id || t.task_id || '—').toString().slice(0,10);
                const titleStr = t.title || t.tool_name || t.tool || '—';
                const sc = t.status === 'done' || t.status === 'completed' ? 'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20' : 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20';
                return (
                  <tr key={t.id || t.task_id} className="border-b border-[#2c2c30]/50 hover:bg-[#ff4e1a]/5 last:border-b-0 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-[10px] text-[#52504e]">{id}</td>
                    <td className="px-3.5 py-2.5 text-[#9a9490]">{titleStr}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#9a9490]">{t.domain || '—'}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#52504e]">{t.resources?.duration || '—'}</td>
                    <td className="px-3.5 py-2.5"><span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase ${sc}`}>{t.status}</span></td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#52504e]">{simRelTime(t.completed_at || t.updated_at || '')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
