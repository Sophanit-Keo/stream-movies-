import { Capacitor } from '@capacitor/core';
import { createDirectTransport } from './direct';
import type { ApiStatus, AppConfig, CardsResponse } from './types';

import { ApiError, type Params } from './errors';

export { ApiError, type Params } from './errors';

/** How the app reaches Watchmode: through our Node server, or directly from the device. */
export interface Transport {
  config(): Promise<AppConfig>;
  status(): Promise<ApiStatus>;
  cards(ids: number[]): Promise<CardsResponse>;
  wm<T>(path: string, params?: Params): Promise<T>;
  /** Direct mode only: forget cached responses. */
  clearCache?(): Promise<void>;
}

function query(params?: Params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/** Talks to the Node server in /server. `base` is empty when the page is served by that server. */
export function httpTransport(base: string): Transport {
  async function get<T>(path: string, params?: Params): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${base}/api${path}${query(params)}`);
    } catch {
      throw new ApiError(0, base ? `Couldn't reach the server at ${base}` : 'Network error: is the API server running?');
    }
    let text = await res.text();
    // Demo images are served by the server; make their paths absolute when it is remote.
    if (base) text = text.split('"/api/demo/img/').join(`"${base}/api/demo/img/`);
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      const message = (body as { error?: string } | null)?.error || res.statusText || `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }
    return body as T;
  }
  return {
    config: async () => ({ mode: 'server', ...(await get<AppConfig>('/config')) }),
    status: () => get<ApiStatus>('/status'),
    cards: (ids) => get<CardsResponse>('/cards', { ids: ids.join(',') }),
    wm: (path, params) => get(`/wm${path}`, params),
  };
}

let current: Transport | null = null;

export function transport(): Transport {
  if (!current) throw new Error('API transport used before initTransport()');
  return current;
}

/**
 * Picks the transport once at startup. The web build uses the Node server.
 * The Android app calls Watchmode directly unless VITE_API_BASE_URL points it
 * at a deployed server. VITE_API_MODE=direct forces direct mode in a browser.
 */
export async function initTransport() {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '');
  const native = Capacitor.isNativePlatform();
  const direct = import.meta.env.VITE_API_MODE === 'direct' || (native && !base);
  if (direct) {
    current = await createDirectTransport();
  } else {
    current = httpTransport(native ? base! : base ?? '');
  }
}
