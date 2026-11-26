import type {
  ApiStatus, AppConfig, AutocompleteResult, CardsResponse, CastMember, Episode, Genre, ListTitlesResponse, Person,
  Region, Release, Season, Source, TitleDetails, TitleSource,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

type ErrorListener = (err: ApiError) => void;
const errorListeners = new Set<ErrorListener>();

/** Lets the app show one banner for quota and key problems instead of every widget handling them. */
export function onApiError(fn: ErrorListener) {
  errorListeners.add(fn);
  return () => {
    errorListeners.delete(fn);
  };
}

async function get<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError(0, 'Network error: is the API server running?');
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* not JSON */
    }
    const err = new ApiError(res.status, message);
    if (res.status === 401 || res.status === 429) errorListeners.forEach((fn) => fn(err));
    throw err;
  }
  return res.json() as Promise<T>;
}

const wm = <T>(path: string, params?: Params) => get<T>(`/wm${path}`, params);

export interface ListTitlesParams {
  types?: string;
  regions?: string;
  source_types?: string;
  source_ids?: string | number;
  genres?: string | number;
  release_date_start?: string;
  release_date_end?: string;
  user_rating_low?: number;
  critic_score_low?: number;
  person_id?: number;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export const api = {
  config: () => get<AppConfig>('/config'),
  status: () => get<ApiStatus>('/status'),
  cards: (ids: number[]) => get<CardsResponse>('/cards', { ids: ids.join(',') }),

  genres: () => wm<Genre[]>('/genres'),
  regions: () => wm<Region[]>('/regions'),
  sources: (regions: string) => wm<Source[]>('/sources', { regions }),
  listTitles: (params: ListTitlesParams) => wm<ListTitlesResponse>('/list-titles', params as Params),
  releases: (params: { start_date?: string; end_date?: string; limit?: number } = {}) =>
    wm<{ releases: Release[] }>('/releases', params),
  autocomplete: (searchValue: string, searchType = 1) =>
    wm<{ results: AutocompleteResult[] }>('/autocomplete-search', { search_value: searchValue, search_type: searchType }),

  details: (id: number) => wm<TitleDetails>(`/title/${id}/details`),
  titleSources: (id: number, regions: string) => wm<TitleSource[]>(`/title/${id}/sources`, { regions }),
  seasons: (id: number) => wm<Season[]>(`/title/${id}/seasons`),
  episodes: (id: number, season: number, regions: string) =>
    wm<Episode[]>(`/title/${id}/episodes`, { season, regions }),
  castCrew: (id: number) => wm<CastMember[]>(`/title/${id}/cast-crew`),
  person: (id: number) => wm<Person>(`/person/${id}`),
};
