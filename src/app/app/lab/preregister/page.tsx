"use client";

import { useState, useEffect } from "react";
import { Copy, FileText, CheckCircle2, AlertTriangle, Info, PlayCircle, ShieldCheck } from "lucide-react";

interface Preregistration {
  preregId: string;
  timestamp: string;
  sha256: string;
  research_question: string;
  hypothesis: string;
  primary_metric: string;
  success_threshold: string;
  failure_threshold: string;
  null_zone: string;
  methodology: string;
  planned_analysis: string;
  planned_replications: string;
  known_limitations: string;
  base_seed: string;
  tool: string;
  hardware: string;
  dataset: string;
  code_ref: string;
}

export default function PreregisterPage() {
  const [registry, setRegistry] = useState<Preregistration[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedData, setLockedData] = useState<Preregistration | null>(null);

  // Form State
  const [rq, setRq] = useState("");
  const [hypo, setHypo] = useState("");
  const [metric, setMetric] = useState("");
  const [successThresh, setSuccessThresh] = useState("");
  const [failureThresh, setFailureThresh] = useState("");
  const [method, setMethod] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [replications, setReplications] = useState("");
  const [seed, setSeed] = useState("42");
  const [limitations, setLimitations] = useState("");
  
  // Optional
  const [tool, setTool] = useState("");
  const [hardware, setHardware] = useState("");
  const [dataset, setDataset] = useState("");
  const [codeRef, setCodeRef] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("p2pclaw-preregs");
    if (saved) {
      try {
        setRegistry(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const nullZoneText = () => {
    const s = parseFloat(successThresh);
    const f = parseFloat(failureThresh);
    if (!isNaN(s) && !isNaN(f)) {
      if (f >= s) return { text: "⚠ Failure threshold must be strictly less than success", valid: false };
      return { text: `[${f}, ${s}) — result in this range = INCONCLUSIVE`, valid: true };
    }
    return { text: "Set both thresholds to calculate null zone", valid: false };
  };

  const nz = nullZoneText();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateId = () => {
    const d = new Date();
    const dt = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const hex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return `PREREG-${dt}-${hex}`;
  };

  const computeHash = async (str: string) => {
    const buf = new TextEncoder().encode(str);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (rq.length < 20) return setErrorMsg("Research question is too short (min 20 chars).");
    if (!hypo.trim()) return setErrorMsg("Hypothesis is required.");
    if (!metric) return setErrorMsg("Primary metric is required.");
    if (!successThresh || !failureThresh || parseFloat(failureThresh) >= parseFloat(successThresh)) {
      return setErrorMsg("Valid success and failure thresholds are required.");
    }
    if (method.length < 200) return setErrorMsg(`Methodology must be ≥200 characters.`);
    if (!analysis.trim()) return setErrorMsg("Analysis plan is required.");
    const reps = parseInt(replications);
    if (isNaN(reps) || reps < 3) return setErrorMsg("Planned replications must be ≥ 3.");
    if (limitations.length < 30) return setErrorMsg("Limitations are too brief.");

    const payload = {
      preregId: generateId(),
      timestamp: new Date().toISOString(),
      research_question: rq.trim(),
      hypothesis: hypo.trim(),
      primary_metric: metric,
      success_threshold: successThresh,
      failure_threshold: failureThresh,
      null_zone: `[${failureThresh}, ${successThresh})`,
      methodology: method.trim(),
      planned_analysis: analysis.trim(),
      planned_replications: replications.trim(),
      base_seed: seed.trim(),
      known_limitations: limitations.trim(),
      tool: tool.trim(),
      hardware: hardware.trim(),
      dataset: dataset.trim(),
      code_ref: codeRef.trim()
    };

    const hash = await computeHash(JSON.stringify(payload));
    const finalData = { ...payload, sha256: hash };

    const newRegistry = [finalData, ...registry];
    setRegistry(newRegistry);
    localStorage.setItem("p2pclaw-preregs", JSON.stringify(newRegistry));
    
    setLockedData(finalData);
    setIsLocked(true);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearForm = () => {
    if (confirm("Clear all form fields?")) {
      setRq(""); setHypo(""); setMetric(""); setSuccessThresh(""); setFailureThresh("");
      setMethod(""); setAnalysis(""); setReplications(""); setLimitations("");
      setTool(""); setHardware(""); setDataset(""); setCodeRef("");
      setSeed("42");
      setIsLocked(false);
      setLockedData(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* LEFT PANEL: Form */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-mono font-bold text-[#f5f0eb] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ff4e1a]" /> Pre-Registration [R2C1]
            </h2>
            <p className="text-[#9a9490] font-mono text-xs mt-2">
              THE IMMUTABLE GATE: Lock your hypothesis and methodology before data collection.
            </p>
          </div>
          <button onClick={clearForm} className="px-4 py-2 border border-[#2c2c30] bg-[#1a1a1c] text-[#f5f0eb] font-mono text-xs rounded hover:bg-[#2c2c30] transition-colors">
            Clear Form
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 border border-[#ff4e1a]/50 bg-[#ff4e1a]/10 rounded-lg text-[#ff4e1a] font-mono text-xs">
            {errorMsg}
          </div>
        )}

        {isLocked && lockedData ? (
          <div className="mb-8 p-6 border border-[#4caf82]/30 bg-[#4caf82]/10 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-[#4caf82] font-mono font-bold mb-2">
              <CheckCircle2 className="w-5 h-5" /> Pre-Registration Locked Successfully
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-[#4caf82]/20 pb-2">
                <span className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Pre-Reg ID</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-[#4caf82]">{lockedData.preregId}</span>
                  <button onClick={() => handleCopy(lockedData.preregId)} className="p-1 hover:text-[#4caf82] text-[#9a9490] transition-colors"><Copy className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-[#4caf82]/20 pb-2">
                <span className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">SHA-256 Payload Hash</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#9a9490] max-w-[300px] truncate" title={lockedData.sha256}>{lockedData.sha256}</span>
                  <button onClick={() => handleCopy(lockedData.sha256)} className="p-1 hover:text-[#4caf82] text-[#9a9490] transition-colors"><Copy className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            <p className="font-mono text-[10px] text-[#4caf82] mt-4">
              All form fields are now disabled. Editing this record would invalidate the cryptographic hash.
            </p>
            <div className="pt-4 flex gap-4">
              <button onClick={() => { setIsLocked(false); setLockedData(null); }} className="px-4 py-2 bg-[#1a1a1c] border border-[#2c2c30] rounded font-mono text-xs hover:border-[#4caf82] transition-colors">
                Start New Pre-Registration
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 border border-[#ff4e1a]/30 bg-[#ff4e1a]/5 rounded-lg text-[#ff4e1a] font-mono text-xs flex gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p><strong>PRE-REGISTRATION IS IMMUTABLE.</strong> Fields marked with * cannot be modified after submission. Changing the hypothesis after data collection constitutes scientific misconduct under RULE-01.</p>
          </div>
        )}

        <div className={`space-y-6 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Section A */}
          <div className="p-6 border border-[#2c2c30] bg-[#1a1a1c] rounded-xl space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#ff4e1a] uppercase tracking-widest border-b border-[#2c2c30] pb-2">A — Research Identity</h3>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Research Question <span className="text-[#ff4e1a]">*</span></label>
              <input value={rq} onChange={e => setRq(e.target.value)} type="text" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none" placeholder="Does method X outperform Y on benchmark Z?" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Hypothesis <span className="text-[#ff4e1a]">*</span></label>
              <textarea value={hypo} onChange={e => setHypo(e.target.value)} rows={2} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none resize-y" placeholder="If we apply X, then metric will exceed..." />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Primary Metric <span className="text-[#ff4e1a]">*</span></label>
              <select value={metric} onChange={e => setMetric(e.target.value)} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none">
                <option value="">Select metric...</option>
                <option value="accuracy_pct">accuracy_pct</option>
                <option value="f1">f1 score</option>
                <option value="pass@1">pass@1</option>
                <option value="custom">custom / other</option>
              </select>
            </div>
          </div>

          {/* Section B */}
          <div className="p-6 border border-[#2c2c30] bg-[#1a1a1c] rounded-xl space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#ff4e1a] uppercase tracking-widest border-b border-[#2c2c30] pb-2">B — Quantitative Gates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Success Threshold (≥) <span className="text-[#ff4e1a]">*</span></label>
                <input value={successThresh} onChange={e => setSuccessThresh(e.target.value)} type="number" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none" placeholder="85" />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Failure Threshold (&lt;) <span className="text-[#ff4e1a]">*</span></label>
                <input value={failureThresh} onChange={e => setFailureThresh(e.target.value)} type="number" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none" placeholder="60" />
              </div>
            </div>
            <div className="mt-4 p-3 border border-[#fbbf24]/30 bg-[#fbbf24]/5 rounded-lg">
              <div className="font-mono text-[10px] text-[#fbbf24] uppercase mb-1">Null Zone (Auto-Calculated)</div>
              <div className="font-mono text-xs text-[#9a9490]">{nz.text}</div>
            </div>
          </div>

          {/* Section C */}
          <div className="p-6 border border-[#2c2c30] bg-[#1a1a1c] rounded-xl space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#ff4e1a] uppercase tracking-widest border-b border-[#2c2c30] pb-2">C — Methodology</h3>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Methodology Narrative <span className="text-[#ff4e1a]">*</span></label>
              <textarea value={method} onChange={e => setMethod(e.target.value)} rows={4} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none" placeholder="Describe data splits, hyperparams, training loops..." />
              <div className={`font-mono text-[10px] ${method.length >= 200 ? 'text-[#4caf82]' : 'text-[#9a9490]'}`}>{method.length} / 200 chars minimum</div>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Planned Analysis <span className="text-[#ff4e1a]">*</span></label>
              <input value={analysis} onChange={e => setAnalysis(e.target.value)} type="text" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans" placeholder="Paired t-test, Cohen's d..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Planned Replications <span className="text-[#ff4e1a]">*</span></label>
                <input value={replications} onChange={e => setReplications(e.target.value)} type="number" min="3" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans" placeholder="5" />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Base Seed</label>
                <input value={seed} onChange={e => setSeed(e.target.value)} type="number" className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#9a9490] uppercase tracking-wider">Known Limitations <span className="text-[#ff4e1a]">*</span></label>
              <textarea value={limitations} onChange={e => setLimitations(e.target.value)} rows={2} className="w-full bg-[#0c0c0d] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] font-sans focus:border-[#ff4e1a] outline-none" placeholder="Dataset scope, compute boundaries..." />
            </div>
          </div>

          {!isLocked && (
            <div className="flex justify-end p-4 border border-[#2c2c30] bg-[#0c0c0d] rounded-xl sticky bottom-4 z-10 shadow-xl shadow-black">
              <button onClick={handleSubmit} className="px-6 py-3 bg-[#ff4e1a] hover:bg-[#ff7020] text-black font-mono font-bold text-xs rounded transition-colors flex items-center gap-2">
                <ShieldCheck className="w-4 h-4"/>
                LOCK PRE-REGISTRATION
              </button>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL: Registry */}
      <div className="w-80 lg:w-[400px] border-l border-[#2c2c30] bg-[#1a1a1c] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2c2c30] flex justify-between items-center">
          <h3 className="font-mono text-sm font-bold text-[#f5f0eb]">Registry</h3>
          <span className="bg-[#2c2c30] px-2 py-0.5 rounded-full text-[10px] font-mono">{registry.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {registry.length === 0 ? (
            <div className="text-center p-8 text-[#52504e] font-mono text-xs">
              No pre-registrations logged. Submit a form to create the first immutable record.
            </div>
          ) : (
            registry.map((r) => (
              <div key={r.preregId} className="p-3 bg-[#0c0c0d] border border-[#2c2c30] hover:border-[#4caf82] transition-colors rounded-lg group cursor-default">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-[10px] font-bold text-[#4caf82]">{r.preregId}</div>
                  <div className="bg-[#4caf82]/10 text-[#4caf82] text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#4caf82]/30">LOCKED</div>
                </div>
                <div className="text-xs text-[#f5f0eb] font-sans line-clamp-2 mb-2 leading-relaxed" title={r.research_question}>
                  {r.research_question}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#2c2c30] font-mono text-[9px] text-[#52504e]">
                  <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                  <span>{r.primary_metric}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
