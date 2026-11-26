import type { CacheLike } from '../../shared/watchmode';

// On the phone there is no server cache, so Watchmode responses are kept in
// IndexedDB. Entries are loaded into memory at startup because the shared
// Watchmode client reads the cache synchronously.

const DB_NAME = 'streammovies';
const STORE = 'watchmode';
const STALE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 5000;

interface Row {
  key: string;
  value: unknown;
  exp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface DeviceCache extends CacheLike {
  clear(): Promise<void>;
}

export async function openDeviceCache(): Promise<DeviceCache> {
  const map = new Map<string, Row>();
  let db: IDBDatabase | null = null;
  let hits = 0;
  let misses = 0;
  const pendingWrites = new Map<string, Row>();
  const pendingDeletes = new Set<string>();
  let timer: number | null = null;

  try {
    db = await openDb();
    const rows = await new Promise<Row[]>((resolve, reject) => {
      const req = db!.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as Row[]);
      req.onerror = () => reject(req.error);
    });
    const now = Date.now();
    for (const row of rows.sort((a, b) => a.exp - b.exp)) {
      if (row.exp + STALE_GRACE_MS > now) map.set(row.key, row);
      else pendingDeletes.add(row.key);
    }
  } catch (err) {
    console.warn('[cache] IndexedDB unavailable, caching in memory only', err);
    db = null;
  }

  const flush = () => {
    timer = null;
    if (!db || (!pendingWrites.size && !pendingDeletes.size)) return;
    try {
      const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
      pendingWrites.forEach((row) => store.put(row));
      pendingDeletes.forEach((key) => store.delete(key));
    } catch (err) {
      console.warn('[cache] write failed', err);
    }
    pendingWrites.clear();
    pendingDeletes.clear();
  };
  const schedule = () => {
    if (timer === null) timer = window.setTimeout(flush, 1000);
  };
  if (pendingDeletes.size) schedule();

  return {
    get(key) {
      const row = map.get(key);
      if (!row) {
        misses++;
        return undefined;
      }
      const fresh = row.exp > Date.now();
      if (fresh) hits++;
      else misses++;
      return { value: row.value, fresh };
    },
    set(key, value, ttlMs) {
      const row = { key, value, exp: Date.now() + ttlMs };
      map.delete(key);
      map.set(key, row);
      pendingWrites.set(key, row);
      pendingDeletes.delete(key);
      while (map.size > MAX_ENTRIES) {
        const oldest = map.keys().next().value as string;
        map.delete(oldest);
        pendingWrites.delete(oldest);
        pendingDeletes.add(oldest);
      }
      schedule();
    },
    stats: () => ({ entries: map.size, hits, misses }),
    async clear() {
      map.clear();
      pendingWrites.clear();
      pendingDeletes.clear();
      if (!db) return;
      await new Promise<void>((resolve) => {
        const tx = db!.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    },
  };
}
