let _swRegistration: ServiceWorkerRegistration | null = null;

export async function initServiceWorker() {
  if (typeof window === 'undefined') return null; // Only run in browser
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported in this browser');
    return null;
  }

  try {
    _swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Registered. State:', _swRegistration.active?.state);

    if (_swRegistration.active) {
      _swRegistration.active.postMessage({ type: 'CLIENT_ACTIVE' });
    }

    window.addEventListener('beforeunload', () => {
      _swRegistration?.active?.postMessage({ type: 'CLIENT_INACTIVE' });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      if (type === 'NEW_PAPER') {
        window.dispatchEvent(new CustomEvent('p2pclaw:new-paper', { detail: data }));
      }
    });

    return _swRegistration;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

export function cachepaperInSW(cid: string, paper: any) {
  if (!_swRegistration?.active) return;
  _swRegistration.active.postMessage({
    type: 'CACHE_PAPER',
    data: { cid, paper },
  });
}

export async function checkForUpdate() {
  if (!_swRegistration) return false;
  await _swRegistration.update();
  return !!_swRegistration.waiting;
}
