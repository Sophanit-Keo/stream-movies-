import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type ListTitlesParams } from '../api/client';
import type { ListTitle } from '../api/types';
import { TitleGrid } from '../components/TitleGrid';
import { seedCards } from '../lib/cards';
import { featuredServices, listKey, TYPES, useGenres, useSources, type Kind } from '../lib/catalog';
import { regionName } from '../lib/format';
import { useApp } from '../store/AppState';

const SORTS = [
  { value: 'popularity_desc', label: 'Most popular' },
  { value: 'relevance_desc', label: 'Suggestions for you' },
  { value: 'release_date_desc', label: 'Release date' },
  { value: 'title_asc', label: 'A–Z' },
  { value: 'title_desc', label: 'Z–A' },
];

const PAGE_SIZE = 40;
const pageCache = new Map<string, { titles: ListTitle[]; totalPages: number; total: number }>();

/** Grid of titles filtered by service, genre and type, with infinite scroll. */
export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const { settings, profile } = useApp();
  const { data: genres } = useGenres();
  const { data: sources } = useSources(settings.region);

  const kind = (['movie', 'tv'].includes(params.get('type') ?? '') ? params.get('type') : 'all') as Kind;
  const genre = params.get('genre') ?? '';
  const service = params.get('service') ?? '';
  const sort = params.get('sort') ?? 'popularity_desc';

  const query: ListTitlesParams = useMemo(
    () => ({
      types: TYPES[kind],
      genres: genre || undefined,
      source_ids: service || undefined,
      regions: service ? settings.region : undefined,
      sort_by: sort,
      limit: PAGE_SIZE,
    }),
    [kind, genre, service, sort, settings.region],
  );
  const baseKey = listKey(query);

  const [pages, setPages] = useState<ListTitle[][]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const currentKey = useRef(baseKey);

  const loadPage = async (page: number, key: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `${key}:${page}`;
      let res = pageCache.get(cacheKey);
      if (!res) {
        const r = await api.listTitles({ ...query, page });
        res = { titles: r.titles, totalPages: r.total_pages, total: r.total_results };
        pageCache.set(cacheKey, res);
      }
      if (key !== currentKey.current) return;
      seedCards(res.titles.map((t) => ({ id: t.id, title: t.title, type: t.type, year: t.year })));
      setPages((prev) => {
        const next = [...prev];
        next[page - 1] = res!.titles;
        return next;
      });
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      if (key === currentKey.current) setError((e as Error).message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    currentKey.current = baseKey;
    loadingRef.current = false;
    setPages([]);
    setTotal(null);
    setTotalPages(1);
    loadPage(1, baseKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey]);

  const items = pages.flat();
  const hasMore = pages.length > 0 && pages.length < totalPages && !error;

  const setParam = (name: string, value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });

  const serviceOptions = useMemo(() => {
    const featured = featuredServices(sources, 12);
    const rest = (sources ?? []).filter((s) => (s.type === 'sub' || s.type === 'free') && !featured.includes(s)).sort((a, b) => a.name.localeCompare(b.name));
    return [...featured, ...rest];
  }, [sources]);

  const selectedService = sources?.find((s) => String(s.id) === service);
  const selectedGenre = genres?.find((g) => String(g.id) === genre);
  const heading = [selectedService?.name, selectedGenre?.name, kind === 'movie' ? 'Movies' : kind === 'tv' ? 'TV Shows' : null]
    .filter(Boolean)
    .join(' · ') || 'Browse All';

  return (
    <div className="page page--padded">
      <div className="explore-head">
        {selectedService?.logo_100px && <img src={selectedService.logo_100px} alt="" className="explore-logo" />}
        <div>
          <h1 className="page-title">{heading}</h1>
          {total !== null && (
            <p className="muted">
              {total.toLocaleString()} titles{selectedService ? ` in ${regionName(settings.region)}` : ''}
              {profile?.kids ? ' · titles for older viewers are hidden' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="filters">
        <div className="segmented" role="group" aria-label="Type">
          {(['all', 'movie', 'tv'] as Kind[]).map((k) => (
            <button key={k} type="button" className={kind === k ? 'is-active' : undefined} onClick={() => setParam('type', k === 'all' ? '' : k)}>
              {k === 'all' ? 'All' : k === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
        <select className="select" value={service} onChange={(e) => setParam('service', e.target.value)} aria-label="Streaming service">
          <option value="">All services</option>
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select className="select" value={genre} onChange={(e) => setParam('genre', e.target.value)} aria-label="Genre">
          <option value="">All genres</option>
          {(genres ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select className="select" value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Sort by">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {!service && serviceOptions.length > 0 && (
        <div className="service-chips">
          {serviceOptions.slice(0, 10).map((s) => (
            <button key={s.id} type="button" className="service-tile service-tile--sm" title={s.name} onClick={() => setParam('service', String(s.id))}>
              {s.logo_100px ? <img src={s.logo_100px} alt={s.name} /> : <span>{s.name}</span>}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error-text">Couldn't load titles: {error}</p>}
      {!loading && !error && total === 0 && <div className="empty"><p>No titles match these filters.</p></div>}
      <TitleGrid
        items={items}
        loading={loading}
        onEndReached={hasMore ? () => !loading && loadPage(pages.length + 1, baseKey) : undefined}
      />
    </div>
  );
}
