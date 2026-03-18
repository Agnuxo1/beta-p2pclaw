"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface PaperResult {
  id: string;
  source: "ss" | "oa" | "ax" | "corpus";
  title: string;
  authors: string;
  year: number | null;
  citations: number;
  isOpenAccess: boolean;
  pdfUrl?: string | null;
  abstract: string;
  url: string | null;
  score?: number;
}

const GATEWAYS = [
  'https://api-production-ff1b.up.railway.app',
];

let API_BASE: string | null = null;
const resolveGateway = async () => {
  for (const gw of GATEWAYS) {
    try { const r = await fetch(gw + '/health', { signal: AbortSignal.timeout(3500) }); if (r.ok) { API_BASE = gw; return; } } catch {}
  }
  API_BASE = GATEWAYS[0];
};

export default function ClassicLiteraturePage() {
  const [query, setQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [results, setResults] = useState<PaperResult[]>([]);
  const [allResults, setAllResults] = useState<PaperResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [activeSrc, setActiveSrc] = useState({ ss: true, oa: true, ax: true, corpus: true });
  const [activeYear, setActiveYear] = useState<string>("all");
  const [oaOnly, setOaOnly] = useState(false);
  const [sortMode, setSortMode] = useState("relevance");
  const [expandedAbs, setExpandedAbs] = useState<Record<number, boolean>>({});

  // Import Modal State
  const [importOpen, setImportOpen] = useState(false);
  const [impData, setImpData] = useState({ title: '', authors: '', year: '', abstract: '', url: '', keywords: '', discipline: 'Computer Science / AI' });
  const [isImporting, setIsImporting] = useState(false);

  // Counts
  const [counts, setCounts] = useState({ ss: 0, oa: 0, ax: 0, corpus: 0 });

  useEffect(() => {
    resolveGateway();
  }, []);

  const searchSemanticScholar = async (q: string): Promise<PaperResult[]> => {
    try {
      const u = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&fields=paperId,title,authors,year,citationCount,isOpenAccess,openAccessPdf,abstract&limit=12`;
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      return (d.data || []).map((p: any) => ({
        id: 'ss:' + p.paperId, source: 'ss',
        title: p.title || 'Untitled', authors: (p.authors || []).map((a: any) => a.name).join(', '),
        year: p.year, citations: p.citationCount || 0,
        isOpenAccess: p.isOpenAccess, pdfUrl: p.openAccessPdf?.url,
        abstract: p.abstract || '', url: `https://www.semanticscholar.org/paper/${p.paperId}`,
      }));
    } catch { return []; }
  };

  const searchOpenAlex = async (q: string): Promise<PaperResult[]> => {
    try {
      const u = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&select=id,title,authorships,publication_year,cited_by_count,open_access,abstract_inverted_index,doi&per-page=12&mailto=admin@p2pclaw.com`;
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      return (d.results || []).map((p: any) => {
        let abs = '';
        if (p.abstract_inverted_index) {
          try { abs = Object.entries(p.abstract_inverted_index).flatMap(([w, pos]: [string, any]) => pos.map((i: number) => [i, w])).sort(([a]: any, [b]: any) => a - b).map(([, w]: any) => w).join(' '); } catch {}
        }
        const doi = p.doi ? p.doi.replace('https://doi.org/', '') : null;
        return {
          id: 'oa:' + p.id, source: 'oa', title: p.title || 'Untitled',
          authors: (p.authorships || []).slice(0, 5).map((a: any) => a.author?.display_name).filter(Boolean).join(', '),
          year: p.publication_year, citations: p.cited_by_count || 0,
          isOpenAccess: p.open_access?.is_oa, pdfUrl: p.open_access?.oa_url,
          abstract: abs, url: doi ? `https://doi.org/${doi}` : null,
        };
      });
    } catch { return []; }
  };

  const searchArXiv = async (q: string): Promise<PaperResult[]> => {
    try {
      const base = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=12&sortBy=relevance`;
      let text = null;
      for (const proxy of ['https://corsproxy.io/?' + encodeURIComponent(base), 'https://api.allorigins.win/raw?url=' + encodeURIComponent(base)]) {
        try { const r = await fetch(proxy, { signal: AbortSignal.timeout(8000) }); if (r.ok) { text = await r.text(); break; } } catch {}
      }
      if (!text) return [];
      const doc = new DOMParser().parseFromString(text, 'text/xml');
      return Array.from(doc.querySelectorAll('entry')).map(e => {
        const idRaw = e.querySelector('id')?.textContent || '';
        return {
          id: 'ax:' + idRaw.split('/abs/')[1], source: 'ax',
          title: e.querySelector('title')?.textContent?.trim() || 'Untitled',
          authors: Array.from(e.querySelectorAll('author name')).map(a => a.textContent).join(', '),
          year: e.querySelector('published')?.textContent?.slice(0, 4) ? parseInt(e.querySelector('published')!.textContent!.slice(0, 4)) : null,
          citations: 0, isOpenAccess: true, pdfUrl: idRaw.replace('/abs/', '/pdf/'),
          abstract: e.querySelector('summary')?.textContent?.trim() || '', url: idRaw
        };
      });
    } catch { return []; }
  };

  const searchCorpus = async (q: string): Promise<PaperResult[]> => {
    if (!API_BASE) return [];
    try {
      const r = await fetch(`${API_BASE}/semantic-search?q=${encodeURIComponent(q)}&limit=8`, { signal: AbortSignal.timeout(6000) });
      const d = await r.json();
      return (d.results || d.papers || []).map((p: any) => ({
        id: 'corpus:' + (p.id || p.paperId), source: 'corpus',
        title: p.title || 'Untitled', authors: p.author || p.authors || '',
        year: p.year ? parseInt(p.year) : null, citations: 0, isOpenAccess: true,
        pdfUrl: p.url_html || p.ipfs_url, abstract: p.content ? p.content.slice(0, 400) : (p.abstract || ''),
        url: p.url_html || null, score: p.score,
      }));
    } catch { return []; }
  };

  const dedup = (arr: PaperResult[]) => {
    const seen = new Map();
    for (const p of arr) {
      const k = p.title.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!seen.has(k) || p.source === 'corpus') seen.set(k, p);
    }
    return Array.from(seen.values()) as PaperResult[];
  };

  const applyFiltersAndSort = (arr: PaperResult[], yr: string, oa: boolean, sort: string) => {
    let f = arr.filter(p => {
      if (yr !== 'all' && p.year && p.year < parseInt(yr)) return false;
      if (oa && !p.isOpenAccess) return false;
      return true;
    });
    if (sort === 'citations') f.sort((a, b) => (b.citations || 0) - (a.citations || 0));
    else if (sort === 'year') f.sort((a, b) => (b.year || 0) - (a.year || 0));
    return f;
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setCurrentQuery(q);
    setIsSearching(true);
    setHasSearched(true);
    setExpandedAbs({});
    
    if (!API_BASE) await resolveGateway();
    
    const tasks = [];
    const srcs = [];
    if (activeSrc.ss) { tasks.push(searchSemanticScholar(q)); srcs.push('ss'); }
    if (activeSrc.oa) { tasks.push(searchOpenAlex(q)); srcs.push('oa'); }
    if (activeSrc.ax) { tasks.push(searchArXiv(q)); srcs.push('ax'); }
    if (activeSrc.corpus) { tasks.push(searchCorpus(q)); srcs.push('corpus'); }
    
    const settled = await Promise.allSettled(tasks);
    let newCounts = { ss: 0, oa: 0, ax: 0, corpus: 0 };
    let combined: PaperResult[] = [];
    
    settled.forEach((res, i) => {
      const a = res.status === 'fulfilled' ? res.value : [];
      newCounts[srcs[i] as keyof typeof newCounts] = a.length;
      combined = combined.concat(a);
    });
    
    const unique = dedup(combined);
    setAllResults(unique);
    setCounts(newCounts);
    setResults(applyFiltersAndSort(unique, activeYear, oaOnly, sortMode));
    setIsSearching(false);
  };

  useEffect(() => {
    setResults(applyFiltersAndSort(allResults, activeYear, oaOnly, sortMode));
  }, [activeYear, oaOnly, sortMode, allResults]);

  const openImport = (p: PaperResult) => {
    setImpData({
      title: p.title || '',
      authors: p.authors || '',
      year: p.year?.toString() || '',
      abstract: p.abstract || '',
      url: p.url || p.pdfUrl || '',
      keywords: currentQuery,
      discipline: 'Computer Science / AI'
    });
    setImportOpen(true);
  };

  const publishImport = async () => {
    if (!API_BASE) await resolveGateway();
    const { title, abstract, authors, year, url, keywords, discipline } = impData;
    if (!title.trim() || !abstract.trim()) { alert('Title and abstract are required'); return; }
    if (abstract.trim().length < 80) { alert('Abstract too short (min 80 chars)'); return; }
    
    setIsImporting(true);
    const agentId = localStorage.getItem('p2pclaw-agent-id') || 'researcher-' + Date.now().toString(36);
    const content = `# ${title}\n\n**Authors:** ${authors || 'Unknown'}\n**Year:** ${year || 'N/A'}\n**Discipline:** ${discipline}\n**Source:** ${url || 'N/A'}\n**Keywords:** ${keywords || 'N/A'}\n\n## Abstract\n\n${abstract}`;
    
    try {
      const r = await fetch(`${API_BASE}/publish-paper`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, author: agentId, tags: keywords }),
        signal: AbortSignal.timeout(15000)
      });
      const d = await r.json();
      if (d.id || d.success || d.paper) {
        alert('Paper imported to corpus');
        setImportOpen(false);
      } else alert(d.error || 'Publish failed');
    } catch (e: any) { alert('Network error: ' + e.message); }
    finally { setIsImporting(false); }
  };

  const sendToChat = (p: PaperResult) => {
    // Navigate to classic-chat safely by setting localStorage for pre-fill, or just URL params
    const u = new URL(window.location.origin + '/app/lab/classic-chat');
    u.searchParams.set('ref_title', p.title.slice(0, 100));
    u.searchParams.set('ref_abstract', (p.abstract || '').slice(0, 300));
    window.location.href = u.toString();
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      
      {/* Search Panel */}
      <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-xl p-6 mb-6">
        <h1 className="font-mono text-base font-bold text-[#f5f0eb] mb-1">Literature Search</h1>
        <p className="text-xs text-[#9a9490] mb-5">Search across Semantic Scholar, OpenAlex and arXiv simultaneously. Import any paper to the P2PCLAW corpus.</p>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
            className="flex-1 bg-[#121214] border border-[#2c2c30] rounded-lg p-3 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]"
            placeholder="e.g. transformer attention mechanisms, quantum error correction..."
          />
          <button 
            onClick={runSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:bg-[#52504e] text-white font-mono text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex flex-wrap gap-5 items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#52504e]">Sources</span>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setActiveSrc(p => ({...p, ss: !p.ss}))} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${activeSrc.ss ? 'bg-[#5b8dee]/10 border-[#5b8dee]/60 text-[#5b8dee]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>Semantic Scholar</button>
              <button onClick={() => setActiveSrc(p => ({...p, oa: !p.oa}))} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${activeSrc.oa ? 'bg-[#ff9a30]/10 border-[#ff9a30]/50 text-[#ff9a30]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>OpenAlex</button>
              <button onClick={() => setActiveSrc(p => ({...p, ax: !p.ax}))} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${activeSrc.ax ? 'bg-[#ff4e1a]/15 border-[#ff4e1a]/40 text-[#ff4e1a]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>arXiv</button>
              <button onClick={() => setActiveSrc(p => ({...p, corpus: !p.corpus}))} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${activeSrc.corpus ? 'bg-[#ffcb47]/10 border-[#ffcb47]/40 text-[#ffcb47]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>Corpus</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#52504e]">Year</span>
            <div className="flex gap-1.5">
              {['all', '2024', '2022', '2020'].map(y => (
                <button key={y} onClick={() => setActiveYear(y)} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${activeYear === y ? 'bg-[#ff4e1a]/15 border-[#ff4e1a] text-[#ff4e1a]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>
                  {y === 'all' ? 'All' : y + '+'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#52504e]">Access</span>
            <button onClick={() => setOaOnly(!oaOnly)} className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded transition-colors border ${oaOnly ? 'bg-[#ff4e1a]/15 border-[#ff4e1a] text-[#ff4e1a]' : 'bg-transparent border-[#2c2c30] text-[#9a9490]'}`}>Open access only</button>
          </div>
        </div>
      </div>

      {hasSearched && !isSearching && (
        <div className="bg-[#1a1a1c] border border-[#2c2c30] rounded-lg p-3 mb-4 flex gap-5 font-mono text-xs items-center overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-[#5b8dee]"></span><span className="text-[#9a9490]">Semantic Scholar:</span><strong className="text-[#f5f0eb]">{counts.ss}</strong></div>
          <div className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-[#ff9a30]"></span><span className="text-[#9a9490]">OpenAlex:</span><strong className="text-[#f5f0eb]">{counts.oa}</strong></div>
          <div className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-[#ff4e1a]"></span><span className="text-[#9a9490]">arXiv:</span><strong className="text-[#f5f0eb]">{counts.ax}</strong></div>
          <div className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-[#ffcb47]"></span><span className="text-[#9a9490]">Corpus:</span><strong className="text-[#f5f0eb]">{counts.corpus}</strong></div>
          <div className="ml-auto shrink-0"><span className="text-[#9a9490]">Total:</span><strong className="text-[#f5f0eb] ml-1">{results.length}</strong></div>
        </div>
      )}

      {hasSearched && !isSearching && (
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-[11px] text-[#9a9490]">
            <strong className="text-[#f5f0eb]">{results.length}</strong> results for &ldquo;<strong className="text-[#f5f0eb]">{currentQuery}</strong>&rdquo;
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#52504e]">Sort</span>
            <select value={sortMode} onChange={e => setSortMode(e.target.value)} className="bg-[#1a1a1c] border border-[#2c2c30] rounded px-2 py-1 text-[#9a9490] font-mono text-[11px] outline-none focus:border-[#ff4e1a]">
              <option value="relevance">Relevance</option>
              <option value="citations">Citations</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>
      )}

      {isSearching ? (
        <div className="text-center py-20 bg-[#0c0c0d] border border-transparent">
          <Search className="w-6 h-6 text-[#ff4e1a] animate-spin mx-auto mb-4 opacity-50" />
          <div className="font-mono text-[11px] text-[#52504e]">Querying databases...</div>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-20 font-mono text-xs text-[#9a9490]">
          No results found for &ldquo;{currentQuery}&rdquo;.
          <div className="text-[10px] text-[#52504e] mt-2">Try broader keywords or enable more sources.</div>
        </div>
      ) : hasSearched ? (
        <div className="space-y-3">
          {results.map((p, i) => (
            <div key={p.id} className="bg-[#1a1a1c] border border-[#2c2c30] rounded-lg p-5 hover:border-[#ff4e1a]/30 transition-colors">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-widest uppercase border 
                  ${p.source==='ss'?'bg-[#5b8dee]/10 text-[#5b8dee] border-[#5b8dee]/30' : 
                    p.source==='oa'?'bg-[#ff9a30]/10 text-[#ff9a30] border-[#ff9a30]/30' : 
                    p.source==='ax'?'bg-[#ff4e1a]/15 text-[#ff4e1a] border-[#ff4e1a]/30' : 
                    'bg-[#ffcb47]/10 text-[#ffcb47] border-[#ffcb47]/30'}`}>
                  {p.source === 'ss' ? 'Semantic Scholar' : p.source === 'oa' ? 'OpenAlex' : p.source === 'ax' ? 'arXiv' : 'P2PCLAW Corpus'}
                </span>
                {p.isOpenAccess && <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/25">OPEN ACCESS</span>}
                {p.year && <span className="font-mono text-[10px] text-[#9a9490]">{p.year}</span>}
                {p.score && <span className="font-mono text-[10px] text-[#ff9a30]">score {p.score.toFixed(2)}</span>}
              </div>
              <h2 className="text-sm font-bold text-[#f5f0eb] leading-snug mb-1">
                {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#ff4e1a]">{p.title}</a> : p.title}
              </h2>
              <div className="text-xs text-[#9a9490] mb-2">{p.authors.length > 80 ? p.authors.slice(0, 80) + '...' : p.authors || 'Unknown'}</div>
              
              {p.abstract && (
                <div>
                  <div className={`text-xs text-[#9a9490] leading-relaxed mb-2 ${expandedAbs[i] ? '' : 'line-clamp-3'}`}>
                    {p.abstract}
                  </div>
                  <button onClick={() => setExpandedAbs(prev => ({...prev, [i]: !prev[i]}))} className="font-mono text-[10px] text-[#52504e] hover:text-[#ff4e1a] mb-2">
                    {expandedAbs[i] ? 'Hide abstract' : 'Show full abstract'}
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#2c2c30]">
                <div className="flex gap-4">
                  {p.citations > 0 && <span className="font-mono text-[10px] text-[#52504e]">{p.citations.toLocaleString()} citations</span>}
                  {p.pdfUrl && <span className="font-mono text-[10px] text-[#52504e]">PDF available</span>}
                </div>
                <div className="flex gap-1.5">
                  {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 border border-[#2c2c30] text-[#9a9490] hover:border-[#ff4e1a] hover:text-[#ff4e1a] font-mono text-[10px] font-bold rounded transition-colors">Open PDF</a>}
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 border border-[#2c2c30] text-[#9a9490] hover:border-[#ff4e1a] hover:text-[#ff4e1a] font-mono text-[10px] font-bold rounded transition-colors">View paper</a>}
                  {p.source !== 'corpus' ? (
                    <button onClick={() => openImport(p)} className="px-2.5 py-1 bg-[#ff4e1a] text-black hover:bg-[#ff7020] font-mono text-[10px] font-bold rounded transition-colors">Import to corpus</button>
                  ) : (
                    <span className="px-2.5 py-1 border border-[#ff4e1a] text-[#ff4e1a] font-mono text-[10px] font-bold rounded">In corpus</span>
                  )}
                  <button onClick={() => sendToChat(p)} className="px-2.5 py-1 border border-[#2c2c30] text-[#9a9490] hover:text-[#f5f0eb] font-mono text-[10px] font-bold rounded transition-colors">Send to chat</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 font-mono text-xs text-[#52504e]">
          Search across millions of scientific papers from three independent databases.<br/>
          <span className="text-[10px]">Try: "large language models", "protein folding", "black hole thermodynamics"</span>
        </div>
      )}

      {/* Import Modal Slide-in Overlay */}
      {importOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-[340px] bg-[#121214] border-l border-[#2c2c30] h-full flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-right">
            <div className="p-4 border-b border-[#2c2c30] flex justify-between items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5f0eb]">Import to Corpus</span>
              <button onClick={() => setImportOpen(false)} className="px-2 py-1 border border-[#2c2c30] text-[#9a9490] text-[10px] font-mono rounded hover:text-[#f5f0eb]">Close</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Title</label>
                <input type="text" value={impData.title} onChange={e=>setImpData(p=>({...p,title:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Authors</label>
                <input type="text" value={impData.authors} onChange={e=>setImpData(p=>({...p,authors:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="Author 1, Author 2" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Year</label>
                <input type="number" value={impData.year} onChange={e=>setImpData(p=>({...p,year:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Abstract</label>
                <textarea rows={5} value={impData.abstract} onChange={e=>setImpData(p=>({...p,abstract:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a] resize-y" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Source URL</label>
                <input type="url" value={impData.url} onChange={e=>setImpData(p=>({...p,url:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Keywords</label>
                <input type="text" value={impData.keywords} onChange={e=>setImpData(p=>({...p,keywords:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]" placeholder="keyword1, keyword2" />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#52504e] mb-1">Discipline</label>
                <select value={impData.discipline} onChange={e=>setImpData(p=>({...p,discipline:e.target.value}))} className="w-full bg-[#1a1a1c] border border-[#2c2c30] rounded p-2 text-sm text-[#f5f0eb] outline-none focus:border-[#ff4e1a]">
                  {['Computer Science / AI','Physics','Mathematics','Biology','Chemistry','Engineering','Medicine','Social Sciences','Other'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#2c2c30] flex gap-2 shrink-0">
              <button onClick={publishImport} disabled={isImporting} className="flex-1 py-2 bg-[#ff4e1a] hover:bg-[#ff7020] disabled:bg-[#52504e] text-black font-mono text-[10px] font-bold rounded transition-colors">{isImporting ? 'Publishing...' : 'Publish to Corpus'}</button>
              <button onClick={() => setImportOpen(false)} className="px-3 py-2 border border-[#2c2c30] text-[#9a9490] hover:text-[#f5f0eb] font-mono text-[10px] font-bold rounded transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
