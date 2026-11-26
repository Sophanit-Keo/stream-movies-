import { createWatchmodeClient, loadCards, matchRoute, UpstreamError } from '../../shared/watchmode.js';
import { openDeviceCache } from './idbCache';
import { ApiError, type Params } from './errors';
import type { Transport } from './transport';
import type { ApiStatus, AppConfig, CardsResponse } from './types';

// Direct mode: the device calls Watchmode itself with the user's own key,
// which is entered in the app and kept in this device's storage only.

const SETTINGS_KEY = 'sm.direct';
const DEFAULT_REGION = 'US';

export interface DirectSettings {
  apiKey?: string;
  demo?: boolean;
}

export function loadDirectSettings(): DirectSettings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as DirectSettings;
  } catch {
    return {};
  }
}

export function saveDirectSettings(settings: DirectSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage blocked */
  }
}

/** Checks a key with Watchmode's free /status call. Returns null when valid, or an error message. */
export async function verifyApiKey(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.watchmode.com/v1/status/', { headers: { 'X-API-Key': apiKey } });
    if (res.ok) return null;
    const body = await res.json().catch(() => null);
    return body?.errorMessage || body?.statusMessage || `Watchmode responded with ${res.status}`;
  } catch {
    return "Couldn't reach Watchmode. Check your internet connection.";
  }
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof UpstreamError) return new ApiError(err.status, err.message);
  const e = err as { name?: string; message?: string };
  if (e?.name === 'TimeoutError') return new ApiError(504, 'Watchmode took too long to respond');
  if (e?.name === 'TypeError') return new ApiError(0, "Couldn't reach Watchmode. Check your internet connection.");
  return new ApiError(502, e?.message || 'Request failed');
}

const stringParams = (params?: Params) =>
  Object.fromEntries(
    Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );

async function demoTransport(): Promise<Transport> {
  const demo = await import('../../shared/demo.js');
  demo.setDemoImageUrl((kind, id) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demo.demoImage(kind, id))}`);
  const wm = async <T,>(path: string, params?: Params): Promise<T> => {
    if (!matchRoute(path)) throw new ApiError(404, `Endpoint not available: ${path}`);
    const { status, body } = demo.demoRequest(path, stringParams(params), DEFAULT_REGION);
    if (status !== 200) throw new ApiError(status, (body as { statusMessage?: string })?.statusMessage || 'Not found');
    return body as T;
  };
  return {
    config: async () => ({ demo: true, region: DEFAULT_REGION, mode: 'direct' }),
    status: async (): Promise<ApiStatus> => ({ demo: true, quota: null, quotaUsed: null, cache: { entries: 0, hits: 0, misses: 0 } }),
    cards: async (ids) => (await loadCards(ids, (id) => wm(`/title/${id}/details`))) as unknown as CardsResponse,
    wm,
  };
}

export async function createDirectTransport(): Promise<Transport> {
  const settings = loadDirectSettings();
  if (settings.demo) return demoTransport();

  if (!settings.apiKey) {
    const needsKey = async () => {
      throw new ApiError(401, 'No Watchmode API key set');
    };
    return {
      config: async (): Promise<AppConfig> => ({ demo: false, region: DEFAULT_REGION, mode: 'direct', needsSetup: true }),
      status: needsKey,
      cards: needsKey,
      wm: needsKey,
    };
  }

  const cache = await openDeviceCache();
  const client = createWatchmodeClient({ apiKey: settings.apiKey, cache });
  const wm = async <T,>(path: string, params?: Params): Promise<T> => {
    try {
      return (await client.get(path, stringParams(params))).body as T;
    } catch (err) {
      throw toApiError(err);
    }
  };

  return {
    config: async () => ({ demo: false, region: DEFAULT_REGION, mode: 'direct' }),
    async status(): Promise<ApiStatus> {
      try {
        const q = await client.status();
        return { demo: false, quota: q.quota, quotaUsed: q.quotaUsed, cache: cache.stats() };
      } catch (err) {
        const q = client.lastQuota();
        return { demo: false, quota: q.quota, quotaUsed: q.quotaUsed, error: toApiError(err).message, cache: cache.stats() };
      }
    },
    async cards(ids) {
      try {
        return (await loadCards(ids, (id) => wm(`/title/${id}/details`))) as unknown as CardsResponse;
      } catch (err) {
        throw toApiError(err);
      }
    },
    wm,
    clearCache: () => cache.clear(),
  };
}
