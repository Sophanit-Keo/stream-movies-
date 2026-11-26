import type { Card, TitleType } from '../api/types';

export const isTv = (type?: TitleType | null) =>
  type === 'tv_series' || type === 'tv_miniseries' || type === 'tv_special';

export const TYPE_LABEL: Record<TitleType, string> = {
  movie: 'Movie',
  tv_series: 'Series',
  tv_miniseries: 'Limited Series',
  tv_special: 'Special',
  tv_movie: 'TV Movie',
  short_film: 'Short',
};

export function runtime(minutes?: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** The "98% match" figure: Watchmode's audience score scaled to a percentage. */
export function matchScore(card?: Pick<Card, 'user_rating'> | null) {
  if (!card?.user_rating) return null;
  return Math.round(card.user_rating * 10);
}

export function yearRange(card: Pick<Card, 'year' | 'end_year' | 'type'>) {
  if (!card.year) return null;
  if (isTv(card.type) && card.end_year && card.end_year !== card.year) return `${card.year}–${card.end_year}`;
  return String(card.year);
}

/** Pulls a video id out of the YouTube URL formats Watchmode returns. */
export function youtubeId(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/\/(embed|shorts|v)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeEmbed(id: string, opts: { autoplay?: boolean; mute?: boolean; controls?: boolean; loop?: boolean } = {}) {
  const p = new URLSearchParams({
    autoplay: opts.autoplay ? '1' : '0',
    mute: opts.mute ? '1' : '0',
    controls: opts.controls === false ? '0' : '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    iv_load_policy: '3',
  });
  if (opts.loop) {
    p.set('loop', '1');
    p.set('playlist', id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

export const isHttpUrl = (url?: string | null): url is string => !!url && /^https?:\/\//i.test(url);

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, opts);
}

export function truncate(text: string | null | undefined, max: number) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max)).replace(/[,.;:]$/, '')}…`;
}

export function regionName(code: string) {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
