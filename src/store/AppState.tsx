import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppConfig, Card } from '../api/types';

export interface Profile {
  id: string;
  name: string;
  color: string;
  kids: boolean;
}

/** Enough of a title to draw it without calling the API again. */
export interface Snapshot {
  id: number;
  title: string;
  type?: Card['type'];
  year?: number | null;
  poster?: string | null;
  backdrop?: string | null;
}

export interface HistoryItem extends Snapshot {
  at: number;
  played: boolean;
}

/** 2 = love, 1 = like, -1 = not for me */
export type Rating = 2 | 1 | -1;

interface ProfileData {
  myList: Snapshot[];
  history: HistoryItem[];
  ratings: Record<number, Rating>;
}

export interface Settings {
  region: string;
  autoplayPreviews: boolean;
}

export const PROFILE_COLORS = ['#e50914', '#2b7fff', '#f5b301', '#1db954', '#a855f7', '#ff6b9a', '#14b8a6'];

const KEYS = {
  profiles: 'sm.profiles',
  active: 'sm.activeProfile',
  settings: 'sm.settings',
  data: (id: string) => `sm.data.${id}`,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

const emptyData = (): ProfileData => ({ myList: [], history: [], ratings: {} });

export function snapshotOf(card: Card): Snapshot {
  return {
    id: card.id,
    title: card.title,
    type: card.type,
    year: card.year,
    poster: card.posterMedium || card.poster,
    backdrop: card.backdrop,
  };
}

interface AppState {
  config: AppConfig;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  profiles: Profile[];
  profile: Profile | null;
  selectProfile: (id: string | null) => void;
  saveProfile: (p: Omit<Profile, 'id'> & { id?: string }) => Profile;
  deleteProfile: (id: string) => void;

  myList: Snapshot[];
  inMyList: (id: number) => boolean;
  toggleMyList: (card: Card) => void;
  history: HistoryItem[];
  recordView: (card: Card, played: boolean) => void;
  ratings: Record<number, Rating>;
  rate: (id: number, rating: Rating | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    region: config.region,
    autoplayPreviews: true,
    ...load<Partial<Settings>>(KEYS.settings, {}),
  }));
  const [profiles, setProfiles] = useState<Profile[]>(() => load<Profile[]>(KEYS.profiles, []));
  const [activeId, setActiveId] = useState<string | null>(() => load<string | null>(KEYS.active, null));
  const profile = profiles.find((p) => p.id === activeId) ?? null;
  const [data, setData] = useState<ProfileData>(() => (activeId ? load(KEYS.data(activeId), emptyData()) : emptyData()));

  useEffect(() => {
    setData(profile ? { ...emptyData(), ...load<ProfileData>(KEYS.data(profile.id), emptyData()) } : emptyData());
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = useCallback(
    (fn: (d: ProfileData) => ProfileData) => {
      if (!profile) return;
      setData((prev) => {
        const next = fn(prev);
        save(KEYS.data(profile.id), next);
        return next;
      });
    },
    [profile],
  );

  const value = useMemo<AppState>(() => ({
    config,
    settings,
    updateSettings: (patch) =>
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        save(KEYS.settings, next);
        return next;
      }),

    profiles,
    profile,
    selectProfile: (id) => {
      setActiveId(id);
      save(KEYS.active, id);
    },
    saveProfile: (p) => {
      const saved: Profile = { ...p, id: p.id ?? Math.random().toString(36).slice(2, 10) };
      setProfiles((prev) => {
        const next = prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
        save(KEYS.profiles, next);
        return next;
      });
      return saved;
    },
    deleteProfile: (id) => {
      setProfiles((prev) => {
        const next = prev.filter((x) => x.id !== id);
        save(KEYS.profiles, next);
        return next;
      });
      try {
        localStorage.removeItem(KEYS.data(id));
      } catch {
        /* ignore */
      }
      if (activeId === id) {
        setActiveId(null);
        save(KEYS.active, null);
      }
    },

    myList: data.myList,
    inMyList: (id) => data.myList.some((x) => x.id === id),
    toggleMyList: (card) =>
      updateData((d) => ({
        ...d,
        myList: d.myList.some((x) => x.id === card.id)
          ? d.myList.filter((x) => x.id !== card.id)
          : [snapshotOf(card), ...d.myList],
      })),
    history: data.history,
    recordView: (card, played) =>
      updateData((d) => {
        const prev = d.history.find((h) => h.id === card.id);
        const item: HistoryItem = { ...snapshotOf(card), at: Date.now(), played: played || !!prev?.played };
        return { ...d, history: [item, ...d.history.filter((h) => h.id !== card.id)].slice(0, 60) };
      }),
    ratings: data.ratings,
    rate: (id, rating) =>
      updateData((d) => {
        const ratings = { ...d.ratings };
        if (rating === null) delete ratings[id];
        else ratings[id] = rating;
        return { ...d, ratings };
      }),
  }), [config, settings, profiles, profile, activeId, data, updateData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}
