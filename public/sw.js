const CACHE_NAME = 'p2pclaw-v3';
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing P2PCLAW background node v3...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] P2PCLAW node active');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== CACHE_NAME+'-api' && k !== CACHE_NAME+'-ipfs').map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (isIPFSRequest(url)) {
    event.respondWith(handleIPFSRequest(event.request, url));
    return;
  }
  
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Next.js handles its own assets, we only intercept explicitly for fallback
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    return cached || new Response('Offline', { status: 503 });
  }));
});

async function handleIPFSRequest(request, url) {
  const cache = await caches.open(CACHE_NAME + '-ipfs');
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Content not available offline', url: url.href }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleAPIRequest(request) {
  const cache = await caches.open(CACHE_NAME + '-api');
  try {
    const response = await fetch(request.clone());
    if (request.method === 'GET' && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Network unavailable', cached: false }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

let activeClients = new Set();
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  if (type === 'CLIENT_ACTIVE') activeClients.add(event.source.id);
  if (type === 'CLIENT_INACTIVE') activeClients.delete(event.source.id);
  
  if (type === 'CACHE_PAPER') {
    const { cid, paper } = data;
    caches.open(CACHE_NAME + '-ipfs').then(cache => {
      const response = new Response(JSON.stringify(paper), { headers: { 'Content-Type': 'application/json' } });
      [
        `https://ipfs.io/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://${cid}.ipfs.w3s.link`,
      ].forEach(url => cache.put(url, response.clone()));
    });
  }
});

function isIPFSRequest(url) {
  return url.hostname.includes('ipfs.io') || url.hostname.includes('cloudflare-ipfs') || url.hostname.includes('.ipfs.');
}

function isAPIRequest(url) {
  return url.hostname.includes('api.p2pclaw.com');
}
