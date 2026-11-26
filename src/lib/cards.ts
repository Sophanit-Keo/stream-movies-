import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { api } from '../api/client';
import type { Card } from '../api/types';

// Lists from Watchmode carry only ids and titles. Artwork and ratings need a
// details call (1 credit each), so cards are filled in lazily: a card asks
// for its data when it scrolls into view, and requests are batched.

interface Entry {
  card: Card;
  /** True once full details have been loaded (not just a title or poster). */
  full: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorAt?: number;
}

// A title that failed to load (rate limit, network) may be retried after this long.
const RETRY_AFTER_MS = 60000;

const entries = new Map<number, Entry>();
const listeners = new Map<number, Set<() => void>>();
const pending = new Set<number>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function notify(id: number) {
  listeners.get(id)?.forEach((fn) => fn());
}

function setEntry(id: number, entry: Entry) {
  entries.set(id, entry);
  notify(id);
}

/** Adds partial data we already have (titles from lists, posters from releases or search). */
export function seedCards(cards: Card[]) {
  for (const c of cards) {
    const prev = entries.get(c.id);
    if (prev?.full) continue;
    const merged: Card = { ...prev?.card, ...stripEmpty(c) } as Card;
    setEntry(c.id, { card: merged, full: false, status: prev?.status ?? 'idle' });
  }
}

function stripEmpty(c: Card): Partial<Card> {
  const out: Partial<Card> = {};
  for (const [k, v] of Object.entries(c)) if (v !== null && v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v;
  return out;
}

/** Stores a complete title (for example from a details call made elsewhere). */
export function setFullCard(card: Card) {
  const prev = entries.get(card.id);
  setEntry(card.id, { card: { ...prev?.card, ...stripEmpty(card) } as Card, full: true, status: 'ready' });
}

async function flush() {
  flushTimer = null;
  const ids = [...pending];
  pending.clear();
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    try {
      const res = await api.cards(chunk);
      for (const card of res.cards) {
        const prev = entries.get(card.id);
        setEntry(card.id, { card: { ...prev?.card, ...stripEmpty(card) } as Card, full: true, status: 'ready' });
      }
      for (const id of res.failed) markFailed(id);
    } catch {
      chunk.forEach(markFailed);
    }
  }
}

function markFailed(id: number) {
  const prev = entries.get(id);
  setEntry(id, { card: prev?.card ?? { id, title: '' }, full: false, status: 'error', errorAt: Date.now() });
}

/** Queues full details for these titles. Already loaded or loading ids are skipped. */
export function requestCards(ids: number[]) {
  let added = false;
  for (const id of ids) {
    const e = entries.get(id);
    if (e?.full || e?.status === 'loading') continue;
    if (e?.status === 'error' && Date.now() - (e.errorAt ?? 0) < RETRY_AFTER_MS) continue;
    setEntry(id, { card: e?.card ?? { id, title: '' }, full: false, status: 'loading' });
    pending.add(id);
    added = true;
  }
  if (added && !flushTimer) flushTimer = setTimeout(flush, 40);
}

export function getCard(id: number): Card | undefined {
  return entries.get(id)?.card;
}

function subscribe(id: number, fn: () => void) {
  let set = listeners.get(id);
  if (!set) listeners.set(id, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
  };
}

/** Reads a card from the store and re-renders when it changes. */
export function useCardEntry(id: number) {
  const sub = useCallback((fn: () => void) => subscribe(id, fn), [id]);
  const snap = useCallback(() => entries.get(id), [id]);
  return useSyncExternalStore(sub, snap, snap);
}

// One IntersectionObserver for every card on the page.
const observerCallbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | null = null;
function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (item.isIntersecting) {
            observerCallbacks.get(item.target)?.();
            observer!.unobserve(item.target);
          }
        }
      },
      { rootMargin: '200px 0px' },
    );
  }
  return observer;
}

/** Becomes true the first time the element is (nearly) visible. */
export function useInView<T extends Element>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = getObserver();
    observerCallbacks.set(el, () => setInView(true));
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [inView]);
  return [ref, inView];
}

/** Like useInView but with a custom margin, for loading whole rows before they are reached. */
export function useNearView<T extends Element>(rootMargin = '600px 0px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const obs = new IntersectionObserver((items) => {
      if (items.some((i) => i.isIntersecting)) {
        setNear(true);
        obs.disconnect();
      }
    }, { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [near, rootMargin]);
  return [ref, near];
}
