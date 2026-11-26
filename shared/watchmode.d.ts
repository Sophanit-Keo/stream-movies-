export interface CacheLike {
  get(key: string): { value: unknown; fresh: boolean } | undefined;
  set(key: string, value: unknown, ttlMs: number): void;
  stats(): { entries: number; hits: number; misses: number };
}

export class UpstreamError extends Error {
  constructor(status: number, body: unknown);
  status: number;
  body: unknown;
}

export interface Quota {
  quota: number | null;
  quotaUsed: number | null;
  updatedAt: string | null;
}

export interface WatchmodeClient {
  get(pathname: string, query?: Record<string, unknown>): Promise<{ body: unknown; cache: 'HIT' | 'MISS' | 'STALE' }>;
  status(): Promise<Quota>;
  lastQuota(): Quota;
}

export function createWatchmodeClient(opts: { apiKey: string; cache: CacheLike; ttlScale?: number }): WatchmodeClient;
export function matchRoute(pathname: string): { ttl: number; params: string[] } | null;
export const CARD_FIELDS: string[];
export function loadCards(
  ids: (string | number)[],
  getDetails: (id: string | number) => Promise<unknown>,
): Promise<{ cards: Record<string, unknown>[]; failed: number[]; rateLimited: boolean }>;
