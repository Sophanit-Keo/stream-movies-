import { useEffect, useState } from 'react';

interface Entry {
  data?: unknown;
  error?: Error;
  errorAt?: number;
  promise?: Promise<unknown>;
}

// A failed request is retried by the next component that asks after this long.
const ERROR_RETRY_MS = 20000;

// Shared across components so two rows asking for the same list share one request.
const store = new Map<string, Entry>();

function run<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = store.get(key);
  if (existing?.promise) return existing.promise as Promise<T>;
  if (existing?.error && Date.now() - (existing.errorAt ?? 0) < ERROR_RETRY_MS) return Promise.reject(existing.error);
  const promise = fn().then(
    (data) => {
      store.set(key, { data });
      return data;
    },
    (error: Error) => {
      store.set(key, { error, errorAt: Date.now() });
      throw error;
    },
  );
  store.set(key, { promise });
  return promise;
}

export function prefetch<T>(key: string, fn: () => Promise<T>) {
  if (!store.has(key)) run(key, fn).catch(() => {});
}

export interface QueryState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/** Minimal cached data fetching. Pass key=null to wait (for example until a row scrolls into view). */
export function useQuery<T>(key: string | null, fn: () => Promise<T>): QueryState<T> {
  const read = (): QueryState<T> => {
    const entry = key ? store.get(key) : undefined;
    return {
      data: entry?.data as T | undefined,
      error: entry?.error,
      loading: !!key && !entry?.data && !entry?.error,
    };
  };
  const [state, setState] = useState<QueryState<T>>(read);

  useEffect(() => {
    if (!key) {
      setState({ data: undefined, error: undefined, loading: false });
      return;
    }
    let alive = true;
    const entry = store.get(key);
    const freshError = entry?.error && Date.now() - (entry.errorAt ?? 0) < ERROR_RETRY_MS;
    if (entry?.data !== undefined || freshError) {
      setState(read());
      return;
    }
    setState({ data: undefined, error: undefined, loading: true });
    run(key, fn).then(
      (data) => alive && setState({ data, error: undefined, loading: false }),
      (error: Error) => alive && setState({ data: undefined, error, loading: false }),
    );
    return () => {
      alive = false;
    };
    // fn is expected to change every render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
