const BASE_URL = 'https://api.watchmode.com/v1';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Endpoints the browser may reach through the proxy, and the query params each accepts. */
const ROUTES = [
  { pattern: /^\/(genres|regions|networks)$/, ttl: 7 * DAY, params: [] },
  { pattern: /^\/sources$/, ttl: 7 * DAY, params: ['regions', 'types'] },
  {
    pattern: /^\/list-titles$/,
    ttl: 12 * HOUR,
    params: [
      'types', 'regions', 'source_types', 'source_ids', 'genres', 'network_ids', 'languages',
      'release_date_start', 'release_date_end', 'user_rating_low', 'user_rating_high',
      'critic_score_low', 'critic_score_high', 'person_id', 'sort_by', 'page', 'limit',
    ],
  },
  { pattern: /^\/releases$/, ttl: 6 * HOUR, params: ['start_date', 'end_date', 'limit'] },
  { pattern: /^\/autocomplete-search$/, ttl: 3 * DAY, params: ['search_value', 'search_type'] },
  { pattern: /^\/search$/, ttl: 3 * DAY, params: ['search_field', 'search_value', 'types'] },
  { pattern: /^\/title\/[^/]+\/details$/, ttl: 3 * DAY, params: ['append_to_response', 'language', 'regions'] },
  { pattern: /^\/title\/[^/]+\/sources$/, ttl: 1 * DAY, params: ['regions'] },
  { pattern: /^\/title\/[^/]+\/(seasons|cast-crew)$/, ttl: 3 * DAY, params: ['language'] },
  {
    pattern: /^\/title\/[^/]+\/episodes$/,
    ttl: 1 * DAY,
    params: ['regions', 'season', 'episode', 'include_sources', 'limit', 'offset', 'episode_language'],
  },
  { pattern: /^\/person\/\d+$/, ttl: 7 * DAY, params: ['language'] },
];

const TITLE_ID = /^(\d{1,10}|tt\d{5,10}|(movie|tv)-\d{1,10})$/;

export class UpstreamError extends Error {
  constructor(status, body) {
    super(body?.statusMessage || body?.errorMessage || body?.message || `Watchmode responded with ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Finds the route for a Watchmode path, or returns null when it is not allowed. */
export function matchRoute(pathname) {
  const titleMatch = pathname.match(/^\/title\/([^/]+)\//);
  if (titleMatch && !TITLE_ID.test(titleMatch[1])) return null;
  return ROUTES.find((r) => r.pattern.test(pathname)) ?? null;
}

/** Keeps only the params a route accepts and sorts them so equal requests share a cache key. */
export function canonicalQuery(route, query) {
  const out = new URLSearchParams();
  for (const name of [...route.params].sort()) {
    const value = query[name];
    if (value === undefined || value === null || value === '') continue;
    const str = String(Array.isArray(value) ? value[0] : value).slice(0, 200);
    out.set(name, str);
  }
  return out.toString();
}

/**
 * Token bucket so bursts (opening a title fires several requests) go out at
 * once, while sustained traffic stays under Watchmode's per-minute limit.
 */
function createLimiter({ perMinute, burst, concurrency }) {
  let tokens = burst;
  let active = 0;
  let last = Date.now();
  const queue = [];

  function refill() {
    const now = Date.now();
    tokens = Math.min(burst, tokens + ((now - last) / 60000) * perMinute);
    last = now;
  }

  function pump() {
    refill();
    while (queue.length && active < concurrency && tokens >= 1) {
      tokens -= 1;
      active++;
      const { task, resolve, reject } = queue.shift();
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          pump();
        });
    }
    if (queue.length && tokens < 1) {
      const wait = Math.ceil(((1 - tokens) / perMinute) * 60000);
      setTimeout(pump, wait).unref?.();
    }
  }

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      pump();
    });
}

export function createWatchmodeClient({ apiKey, cache, ttlScale = 1 }) {
  const limiter = createLimiter({ perMinute: 100, burst: 12, concurrency: 6 });
  const inflight = new Map();
  const quota = { quota: null, quotaUsed: null, updatedAt: null };

  async function fetchUpstream(pathname, qs) {
    const url = `${BASE_URL}${pathname}/${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const q = res.headers.get('x-account-quota');
    const used = res.headers.get('x-account-quota-used');
    if (q !== null && used !== null) {
      quota.quota = Number(q);
      quota.quotaUsed = Number(used);
      quota.updatedAt = new Date().toISOString();
    }
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { statusMessage: text.slice(0, 300) };
    }
    if (!res.ok || (body && body.success === false)) {
      throw new UpstreamError(res.ok ? body.statusCode || 502 : res.status, body);
    }
    return body;
  }

  /**
   * Fetches a Watchmode path through the cache. Returns { body, cache } where
   * cache is HIT, MISS or STALE (served from an expired entry after an error).
   */
  async function get(pathname, query = {}) {
    const route = matchRoute(pathname);
    if (!route) throw new UpstreamError(404, { statusMessage: `Endpoint not available: ${pathname}` });
    const qs = canonicalQuery(route, query);
    const key = `${pathname}?${qs}`;
    const hit = cache.get(key);
    if (hit?.fresh) return { body: hit.value, cache: 'HIT' };

    if (!inflight.has(key)) {
      const promise = limiter(() => fetchUpstream(pathname, qs))
        .then((body) => {
          cache.set(key, body, route.ttl * ttlScale);
          return { body, cache: 'MISS' };
        })
        .catch((err) => {
          if (hit) {
            console.warn(`[watchmode] ${err.message}; serving stale ${key}`);
            return { body: hit.value, cache: 'STALE' };
          }
          throw err;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, promise);
    }
    return inflight.get(key);
  }

  async function status() {
    // /status is free (0 credits), so it is never cached.
    const body = await fetchUpstream('/status', '');
    quota.quota = body.quota;
    quota.quotaUsed = body.quotaUsed;
    quota.updatedAt = new Date().toISOString();
    return { ...quota };
  }

  return { get, status, lastQuota: () => ({ ...quota }) };
}
