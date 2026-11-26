import type {
  ApiStatus, AppConfig, AutocompleteResult, CardsResponse, CastMember, Episode, Genre, ListTitlesResponse, Person,
  Region, Release, Season, Source, TitleDetails, TitleSource,
} from './types';

import { ApiError, transport, type Params } from './transport';

export { ApiError, initTransport } from './transport';

type ErrorListener = (err: ApiError) => void;
const errorListeners = new Set<ErrorListener>();

/** Lets the app show one banner for quota and key problems instead of every widget handling them. */
export function onApiError(fn: ErrorListener) {
  errorListeners.add(fn);
  return () => {
    errorListeners.delete(fn);
  };
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(0, (err as Error)?.message || 'Request failed');
    if (apiErr.status === 401 || apiErr.status === 429) errorListeners.forEach((l) => l(apiErr));
    throw apiErr;
  }
}

const wm = <T>(path: string, params?: Params) => call(() => transport().wm<T>(path, params));

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
  config: () => call<AppConfig>(() => transport().config()),
  status: () => call<ApiStatus>(() => transport().status()),
  cards: (ids: number[]) => call<CardsResponse>(() => transport().cards(ids)),
  clearCache: () => transport().clearCache?.(),

  genres: () => wm<Genre[]>('/genres'),
  regions: () => wm<Region[]>('/regions'),
  sources: (regions: string) => wm<Source[]>('/sources', { regions }),
  listTitles: (params: ListTitlesParams) => wm<ListTitlesResponse>('/list-titles', params as unknown as Params),
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
