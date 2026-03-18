import Gun from 'gun';
import 'gun/sea';
import 'gun/axe';

const BOOTSTRAP_WS = [
  'wss://app.p2pclaw.com/gun',
  'wss://agents.p2pclaw.com/gun',
  'wss://api.p2pclaw.com/gun'
];

let _gun: any = null;
let _nodeStats = {
  peersConnected: 0,
  dataServed: 0,
  dataReceived: 0,
  cacheHits: 0,
};

export function initGunNode() {
  if (typeof window === 'undefined') return null; // Avoid SSR
  if (_gun) return _gun;

  _gun = Gun({
    peers: BOOTSTRAP_WS,
    localStorage: true,
    radisk: true,
    multicast: false,
    axe: true,
  });

  _gun.on('out', (msg: any) => {
    try { _nodeStats.dataServed += JSON.stringify(msg).length; } catch(e){}
  });

  _gun.on('in', (msg: any) => {
    try { _nodeStats.dataReceived += JSON.stringify(msg).length; } catch(e){}
  });

  return _gun;
}

export function getGun() {
  if (!_gun) return initGunNode();
  return _gun;
}

export function getDB() {
  const gun = getGun();
  if(!gun) return null;
  return {
    papers:     gun.get('p2pclaw').get('papers'),
    mempool:    gun.get('p2pclaw').get('mempool'),
    agents:     gun.get('p2pclaw').get('agents'),
    votes:      gun.get('p2pclaw').get('votes'),
    dids:       gun.get('p2pclaw').get('dids'),
    trust:      gun.get('p2pclaw').get('trust'),
    briefing:   gun.get('p2pclaw').get('briefing'),
  };
}

export function getNodeStats() {
  const gun = getGun();
  if(!gun) return _nodeStats;
  const peers = Object.keys(gun._.opt.peers || {}).length;
  return {
    ..._nodeStats,
    peersConnected: peers,
    isContributing: _nodeStats.dataServed > 0,
  };
}

export function gunGet(node: any, timeoutMs = 3000): Promise<any> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    node.once((data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

export function gunCollect(node: any, timeoutMs = 2500): Promise<any[]> {
  return new Promise((resolve) => {
    const items = new Map();
    node.map().once((item: any, key: string) => {
      if (item && key && !key.startsWith('_')) {
        items.set(key, item);
      }
    });
    setTimeout(() => resolve([...items.values()]), timeoutMs);
  });
}

export function gunSubscribe(node: any, callback: (item: any, key: string) => void) {
  node.map().on((item: any, key: string) => {
    if (item && key && !key.startsWith('_')) {
      callback(item, key);
    }
  });
  return () => node.map().off();
}
