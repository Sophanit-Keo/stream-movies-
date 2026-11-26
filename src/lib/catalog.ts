import { api, type ListTitlesParams } from '../api/client';
import type { Genre, ListTitle, Release, Source } from '../api/types';
import { seedCards } from './cards';
import { addDays, isoDate } from './format';
import { useQuery } from './useQuery';

export const TYPES = {
  all: 'movie,tv_series,tv_miniseries',
  movie: 'movie',
  tv: 'tv_series,tv_miniseries',
} as const;
export type Kind = keyof typeof TYPES;

export function useGenres() {
  return useQuery<Genre[]>('genres', api.genres);
}

export function useSources(region: string) {
  return useQuery<Source[]>(`sources:${region}`, () => api.sources(region));
}

/** Finds a genre by trying names in order, since the exact wording varies. */
export function findGenre(genres: Genre[] | undefined, ...names: string[]) {
  if (!genres) return undefined;
  for (const name of names) {
    const g = genres.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (g) return g;
  }
  return undefined;
}

/** Big subscription services, matched by name so ids don't have to be hard-coded. */
const FEATURED_SERVICES = [
  ['netflix'],
  ['prime video', 'amazon prime', 'amazon prime video'],
  ['disney+', 'disney plus'],
  ['max', 'hbo max'],
  ['hulu'],
  ['appletv+', 'apple tv+', 'apple tv plus'],
  ['peacock', 'peacock premium'],
  ['paramount+', 'paramount plus'],
];

export function featuredServices(sources: Source[] | undefined, max = 8): Source[] {
  if (!sources) return [];
  const subs = sources.filter((s) => s.type === 'sub' && s.logo_100px);
  const picked: Source[] = [];
  for (const names of FEATURED_SERVICES) {
    const s = subs.find((x) => names.includes(x.name.toLowerCase()));
    if (s && !picked.includes(s)) picked.push(s);
  }
  for (const s of subs) {
    if (picked.length >= max) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked.slice(0, max);
}

export function listKey(params: ListTitlesParams) {
  return `list:${JSON.stringify(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').sort())}`;
}

/** Fetches a list and seeds titles into the card store so cards can show names right away. */
export async function fetchList(params: ListTitlesParams): Promise<ListTitle[]> {
  const res = await api.listTitles(params);
  seedCards(res.titles.map((t) => ({ id: t.id, title: t.title, type: t.type, year: t.year })));
  return res.titles;
}

export function useTitleList(params: ListTitlesParams | null) {
  return useQuery<ListTitle[]>(params ? listKey(params) : null, () => fetchList(params!));
}

/** Releases from two weeks back to a month ahead: one call covers "new" and "coming soon". */
export function releaseWindow() {
  const now = new Date();
  return { start_date: isoDate(addDays(now, -14)), end_date: isoDate(addDays(now, 30)) };
}

export async function fetchReleases(): Promise<Release[]> {
  const res = await api.releases({ ...releaseWindow(), limit: 250 });
  const releases = res.releases ?? [];
  seedCards(releases.map((r) => ({ id: r.id, title: r.title, type: r.type, poster: r.poster_url, posterMedium: r.poster_url })));
  return releases;
}

export function useReleases(enabled = true) {
  const w = releaseWindow();
  return useQuery<Release[]>(enabled ? `releases:${w.start_date}:${w.end_date}` : null, fetchReleases);
}

/** Drops repeat entries (the same show can appear once per service or season). */
export function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}
