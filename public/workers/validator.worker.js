import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';

function validatePaper(paper) {
  const issues = [];
  const warnings = [];

  if (!paper.title?.trim()) issues.push('Missing title');
  if (!paper.content?.trim()) issues.push('Missing content');
  if (!paper.authorDid) issues.push('Missing authorDid');
  if (!paper.signature) issues.push('Missing signature');

  const wordCount = paper.content?.split(/\s+/).filter(Boolean).length || 0;
  if (wordCount < 150) issues.push(`Too short: ${wordCount} words (min 150)`);
  if (wordCount < 500) warnings.push(`Short paper: ${wordCount} words (recommended 500+)`);

  if (paper.authorDid && paper.signature) {
    const sigValid = verifyDIDSignature(paper);
    if (!sigValid) issues.push('Invalid Ed25519 signature');
  }

  if (paper.authorDid && !paper.authorDid.startsWith('did:p2pclaw:')) {
    issues.push('Invalid DID format (expected did:p2pclaw:...)');
  }

  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (paper.timestamp > now + 60000) issues.push('Timestamp is in the future');
  if (paper.timestamp < now - oneYear) warnings.push('Paper timestamp is over 1 year old');

  const score = calculateQualityScore(paper, wordCount);

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    wordCount,
    score,
    validatedAt: Date.now(),
    validatedBy: 'browser-worker',
  };
}

function verifyDIDSignature(paper) {
  try {
    const { authorDid, signature, ...rest } = paper;
    const parts = authorDid.split(':');
    if (parts.length !== 3) return false;

    const publicKey = bs58.decode(parts[2]);
    const sig = bs58.decode(signature);

    const payload = JSON.stringify(rest, Object.keys(rest).sort());
    const msgBytes = new TextEncoder().encode(payload);

    return ed.verify(publicKey, msgBytes, sig);
  } catch {
    return false;
  }
}

function calculateQualityScore(paper, wordCount) {
  let score = 0;
  if (wordCount >= 500) score += 30;
  else if (wordCount >= 200) score += 15;

  const hasHeaders = (paper.content?.match(/^#{1,3}\s/gm) || []).length;
  if (hasHeaders >= 3) score += 20;
  else if (hasHeaders >= 1) score += 10;

  const hasRefs = /references|bibliography|fuentes/i.test(paper.content || '');
  if (hasRefs) score += 15;

  if ((paper.tags || []).length >= 2) score += 10;
  score += 25; 
  return Math.min(score, 100);
}

function computeEigenTrust(votes, papers, iterations = 10, alpha = 0.15) {
  const agents = Object.keys(votes);
  if (agents.length === 0) return {};

  const localTrust = {};
  for (const validator of agents) {
    localTrust[validator] = {};
    let total = 0;
    for (const [paperId, approved] of Object.entries(votes[validator] || {})) {
      if (!approved) continue;
      const author = papers[paperId]?.authorDid;
      if (!author || author === validator) continue;
      localTrust[validator][author] = (localTrust[validator][author] || 0) + 1;
      total++;
    }
    if (total > 0) {
      for (const a of Object.keys(localTrust[validator])) {
        localTrust[validator][a] /= total;
      }
    }
  }

  const n = agents.length;
  let trust = {};
  agents.forEach(a => { trust[a] = 1 / n; });

  for (let i = 0; i < iterations; i++) {
    const next = {};
    agents.forEach(j => { next[j] = 0; });
    for (const j of agents) {
      for (const i of agents) {
        next[j] += trust[i] * (localTrust[i]?.[j] || 0);
      }
    }
    const prior = 1 / n;
    const sum = Object.values(next).reduce((a, b) => a + b, 0) || 1;
    for (const j of agents) {
      next[j] = ((1 - alpha) * next[j] + alpha * prior) / sum;
    }
    trust = next;
  }
  return trust;
}

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;
  try {
    let result;
    switch (type) {
      case 'VALIDATE_PAPER':
        result = validatePaper(payload.paper);
        break;
      case 'VALIDATE_BATCH':
        result = payload.papers.map(validatePaper);
        break;
      case 'COMPUTE_EIGENTRUST':
        result = computeEigenTrust(payload.votes, payload.papers);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    self.postMessage({ id, success: true, result });
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message });
  }
});
