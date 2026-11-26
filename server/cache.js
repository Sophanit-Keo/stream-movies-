import fs from 'node:fs';
import path from 'node:path';

// Entries stay on disk this long after they expire, so they can still be
// served when Watchmode is unreachable or the monthly quota runs out.
const STALE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * A small TTL cache that persists to a JSON file. Every Watchmode call costs
 * credits, so keeping responses across restarts matters more than speed here.
 */
export class PersistentCache {
  constructor({ file, maxEntries = 8000 }) {
    this.file = file;
    this.maxEntries = maxEntries;
    this.map = new Map();
    this.saveTimer = null;
    this.hits = 0;
    this.misses = 0;
    this.load();
  }

  load() {
    if (!this.file) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      const now = Date.now();
      for (const [key, entry] of raw) {
        if (entry && entry.exp + STALE_GRACE_MS > now) this.map.set(key, entry);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('[cache] could not read cache file:', err.message);
    }
  }

  /** Returns { value, fresh } or undefined. Stale entries are returned with fresh=false. */
  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    const fresh = entry.exp > Date.now();
    if (fresh) this.hits++;
    else this.misses++;
    return { value: entry.value, fresh };
  }

  set(key, value, ttlMs) {
    this.map.delete(key);
    this.map.set(key, { value, exp: Date.now() + ttlMs });
    while (this.map.size > this.maxEntries) {
      this.map.delete(this.map.keys().next().value);
    }
    this.scheduleSave();
  }

  scheduleSave() {
    if (!this.file || this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.save();
    }, 2000);
    this.saveTimer.unref?.();
  }

  save() {
    if (!this.file) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify([...this.map.entries()]));
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.warn('[cache] could not write cache file:', err.message);
    }
  }

  stats() {
    return { entries: this.map.size, hits: this.hits, misses: this.misses };
  }
}
