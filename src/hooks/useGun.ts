import { useState, useEffect } from 'react';
import { getDB, gunCollect, gunSubscribe, getNodeStats } from '../lib/gun-p2p';

export function usePapers(options: { limit?: number, status?: string } = {}) {
  const { limit = 20, status = 'verified' } = options;
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    if(!db) { setLoading(false); return; }
    
    const seen = new Map();

    gunCollect(db.papers, 3000).then((items) => {
      const filtered = items
        .filter(p => p?.id && (!status || p.status === status))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      seen.clear();
      filtered.forEach(p => seen.set(p.id, p));
      setPapers(filtered);
      setLoading(false);
    });

    const unsub = gunSubscribe(db.papers, (paper) => {
      if (!paper?.id) return;
      seen.set(paper.id, paper);
      const updated = [...seen.values()]
        .filter(p => !status || p.status === status)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      setPapers(updated);
    });

    return unsub;
  }, [limit, status]);

  return { papers, loading };
}

export function useNodeStats() {
  const [stats, setStats] = useState(getNodeStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getNodeStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
