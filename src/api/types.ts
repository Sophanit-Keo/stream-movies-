export type TitleType = 'movie' | 'tv_series' | 'tv_special' | 'tv_miniseries' | 'short_film' | 'tv_movie';
export type SourceKind = 'sub' | 'rent' | 'buy' | 'free' | 'tve';

export interface AppConfig {
  demo: boolean;
  region: string;
}

export interface ApiStatus {
  demo: boolean;
  quota: number | null;
  quotaUsed: number | null;
  error?: string;
  cache: { entries: number; hits: number; misses: number };
}

export interface Genre {
  id: number;
  name: string;
  tmdb_id: number;
}

export interface Source {
  id: number;
  name: string;
  type: 'sub' | 'purchase' | 'free' | 'tve';
  logo_100px: string | null;
  regions: string[];
}

export interface Region {
  country: string;
  name: string;
  flag?: string;
  plan_enabled?: boolean;
}

export interface ListTitle {
  id: number;
  title: string;
  year: number | null;
  type: TitleType;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  popularity_percentile?: number | null;
}

export interface ListTitlesResponse {
  titles: ListTitle[];
  page: number;
  total_results: number;
  total_pages: number;
}

export interface Release {
  id: number;
  title: string;
  type: TitleType;
  season_number: number | null;
  poster_url: string | null;
  source_release_date: string;
  source_id: number;
  source_name: string;
  is_original: 0 | 1;
}

export interface TitleDetails {
  id: number;
  title: string;
  original_title?: string;
  plot_overview: string | null;
  type: TitleType;
  runtime_minutes: number | null;
  year: number | null;
  end_year: number | null;
  release_date: string | null;
  genres: number[];
  genre_names: string[];
  user_rating: number | null;
  critic_score: number | null;
  us_rating: string | null;
  poster: string | null;
  posterMedium: string | null;
  posterLarge: string | null;
  backdrop: string | null;
  original_language?: string | null;
  similar_titles: number[] | null;
  network_names: string[] | null;
  popularity_percentile: number | null;
  trailer: string | null;
  trailer_thumbnail: string | null;
}

export interface TitleSource {
  source_id: number;
  name: string;
  type: SourceKind;
  region: string;
  web_url: string | null;
  ios_url?: string | null;
  android_url?: string | null;
  format: string | null;
  price: number | null;
  seasons: number | null;
  episodes: number | null;
}

export interface Season {
  id: number;
  poster_url: string | null;
  name: string;
  overview: string | null;
  number: number;
  air_date: string | null;
  episode_count: number | null;
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  thumbnail_url: string | null;
  release_date: string | null;
  runtime_minutes: number | null;
  overview: string | null;
  sources?: TitleSource[];
}

export interface CastMember {
  person_id: number;
  type: 'Cast' | 'Crew';
  full_name: string;
  role: string | null;
  episode_count: number | null;
  order: number | null;
}

export interface AutocompleteResult {
  name: string;
  relevance: number;
  type: TitleType | null;
  id: number;
  year: number | null;
  result_type: 'title' | 'person';
  image_url: string | null;
}

export interface Person {
  id: number;
  full_name: string;
  main_profession: string | null;
  secondary_profession: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  place_of_birth: string | null;
  known_for: number[] | null;
  biography?: string | null;
  headshot_url?: string | null;
}

/** The subset of title details used to draw a card. */
export interface Card {
  id: number;
  title: string;
  type?: TitleType | null;
  year?: number | null;
  end_year?: number | null;
  runtime_minutes?: number | null;
  genre_names?: string[] | null;
  user_rating?: number | null;
  critic_score?: number | null;
  us_rating?: string | null;
  poster?: string | null;
  posterMedium?: string | null;
  backdrop?: string | null;
  trailer?: string | null;
  plot_overview?: string | null;
  popularity_percentile?: number | null;
}

export interface CardsResponse {
  cards: Card[];
  failed: number[];
  rateLimited: boolean;
}
