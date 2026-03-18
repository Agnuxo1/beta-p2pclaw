import { createHelia } from 'helia';
import { json as heliaJson } from '@helia/json';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';

const BOOTSTRAP_MULTIADDRS = [
  '/dns4/api.p2pclaw.com/tcp/443/wss/p2p/QmBootStrapPeerId1',
  '/dns4/agents.p2pclaw.com/tcp/443/wss/p2p/QmBootStrapPeerId2'
];

let _helia: any = null;
let _heliaJson: any = null;
let _initPromise: Promise<any> | null = null;

const PUBLIC_GATEWAYS = [
  (cid: string) => `https://${cid}.ipfs.w3s.link`,
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
  (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
];

export async function initHeliaNode() {
  if (typeof window === 'undefined') return null; // Only run in browser
  if (_helia) return _helia;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      console.log('[Helia] Initializing browser IPFS node...');
      const blockstore = new IDBBlockstore('p2pclaw-blocks');
      const datastore = new IDBDatastore('p2pclaw-data');
      await blockstore.open();
      await datastore.open();

      const libp2pNode = await createLibp2p({
        transports: [
          webSockets(),
          webRTC(),
          circuitRelayTransport(),
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [mplex()],
        services: { identify: identify() },
        peerDiscovery: [ bootstrap({ list: BOOTSTRAP_MULTIADDRS }) ],
        connectionManager: { maxConnections: 50 },
      });

      _helia = await createHelia({
        libp2p: libp2pNode,
        blockstore,
        datastore,
      });

      _heliaJson = heliaJson(_helia);
      console.log(`[Helia] Node started. PeerID: ${_helia.libp2p.peerId.toString()}`);

      _helia.libp2p.addEventListener('peer:connect', () => {
        const total = _helia.libp2p.getPeers().length;
        console.log(`[Helia] Peers connected: ${total}`);
      });

      return _helia;
    } catch (err) {
      console.error('[Helia] Init failed:', err);
      return null;
    }
  })();

  return _initPromise;
}

export async function publishPaperToIPFS(paperData: any) {
  const helia = await initHeliaNode();
  if(!helia) throw new Error("Helia not initialized");
  const j = heliaJson(helia);

  const cidObj = await j.add(paperData);
  const cidStr = cidObj.toString();
  console.log(`[Helia] Paper published locally: ${cidStr}`);
  
  try { await helia.pins.add(cidObj); } catch(e) {}
  
  publishToExternalProviders(paperData, cidStr).catch(()=>null);

  return {
    cid: cidStr,
    url: `ipfs://${cidStr}`,
    gateways: PUBLIC_GATEWAYS.map(fn => fn(cidStr)),
    storedLocally: true,
  };
}

export async function fetchPaperFromIPFS(cidStr: string, timeoutMs = 8000) {
  const helia = await initHeliaNode();
  if(!helia) return fetchFromGateways(cidStr, timeoutMs);
  
  try {
    const { CID } = await import('multiformats/cid');
    const cid = CID.parse(cidStr);
    const j = heliaJson(helia);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const data = await j.get(cid, { signal: controller.signal });
    clearTimeout(timer);
    return data;
  } catch (err) {
    return fetchFromGateways(cidStr, timeoutMs);
  }
}

async function fetchFromGateways(cidStr: string, timeoutMs: number) {
  for (const gatewayFn of PUBLIC_GATEWAYS) {
    try {
      const url = gatewayFn(cidStr);
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs / 3) });
      if (res.ok) {
        const data = await res.json();
        cacheInHelia(data).catch(()=>{});
        return data;
      }
    } catch (e) { }
  }
  throw new Error(`Could not fetch ${cidStr} from any gateway.`);
}

async function cacheInHelia(data: any) {
  const helia = await initHeliaNode();
  if(helia) {
    const j = heliaJson(helia);
    await j.add(data);
  }
}

async function publishToExternalProviders(paperData: any, cid: string) {
  const API_NODES = ['https://api.p2pclaw.com'];
  for (const apiUrl of API_NODES) {
    try {
      const res = await fetch(`${apiUrl}/pin-external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid, data: paperData }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return;
    } catch (e) {}
  }
}

export async function getHeliaStats() {
  const helia = await initHeliaNode();
  if(!helia) return { peers: 0, isOnline: false };
  return {
    peerId: helia.libp2p.peerId.toString(),
    peers: helia.libp2p.getPeers().length,
    isOnline: !helia.libp2p.isStarted() === false,
  };
}
