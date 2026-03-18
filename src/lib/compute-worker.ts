let _worker: Worker | null = null;
let _pendingTasks = new Map<number, { resolve: Function, reject: Function }>();
let _taskCounter = 0;

function getWorker() {
  if (typeof window === 'undefined') return null; // Only run in browser
  if (!_worker) {
    _worker = new Worker('/workers/validator.worker.js', { type: 'module' });

    _worker.addEventListener('message', (event) => {
      const { id, success, result, error } = event.data;
      const pending = _pendingTasks.get(id);
      if (!pending) return;

      _pendingTasks.delete(id);
      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error));
      }
    });

    _worker.addEventListener('error', (err) => {
      console.error('[Worker] Error:', err);
    });
  }
  return _worker;
}

function dispatch(type: string, payload: any, timeoutMs = 10000): Promise<any> {
  const id = ++_taskCounter;
  const worker = getWorker();
  
  if (!worker) return Promise.reject(new Error("No worker available on server"));

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      _pendingTasks.delete(id);
      reject(new Error(`Worker task ${type} timed out`));
    }, timeoutMs);

    _pendingTasks.set(id, {
      resolve: (r: any) => { clearTimeout(timer); resolve(r); },
      reject: (e: any) => { clearTimeout(timer); reject(e); },
    });

    worker.postMessage({ id, type, payload });
  });
}

export const validatePaper = (paper: any) =>
  dispatch('VALIDATE_PAPER', { paper });

export const validateBatch = (papers: any[]) =>
  dispatch('VALIDATE_BATCH', { papers }, 30000);

export const computeEigenTrust = (votes: any, papers: any) =>
  dispatch('COMPUTE_EIGENTRUST', { votes, papers }, 15000);
