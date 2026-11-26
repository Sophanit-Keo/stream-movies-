import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { AutocompleteResult } from '../api/types';
import { SearchIcon } from '../components/Icons';
import { TitleGrid } from '../components/TitleGrid';
import { seedCards } from '../lib/cards';
import { TYPES, useTitleList } from '../lib/catalog';
import { useQuery } from '../lib/useQuery';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { data, loading, error } = useQuery<AutocompleteResult[]>(q.length >= 2 ? `search:${q.toLowerCase()}` : null, async () => {
    const res = await api.autocomplete(q, 1);
    const results = res.results ?? [];
    seedCards(
      results
        .filter((r) => r.result_type === 'title')
        .map((r) => ({ id: r.id, title: r.name, type: r.type, year: r.year, poster: r.image_url, posterMedium: r.image_url })),
    );
    return results;
  });
  const popular = useTitleList(q.length < 2 ? { types: TYPES.all, sort_by: 'popularity_desc', limit: 30 } : null);

  const titles = (data ?? []).filter((r) => r.result_type === 'title');
  const people = (data ?? []).filter((r) => r.result_type === 'person');

  if (q.length < 2) {
    return (
      <div className="page page--padded">
        <PageSearchBox initial={q} />
        <h1 className="page-title page-title--sm">Popular Searches</h1>
        <TitleGrid items={popular.data ?? []} loading={popular.loading} />
      </div>
    );
  }

  return (
    <div className="page page--padded">
      <PageSearchBox initial={q} />
      {!!people.length && (
        <div className="search-people">
          <span className="muted">People:</span>
          {people.map((p) => (
            <Link key={p.id} to={`/person/${p.id}`} className="chip">
              {p.name}
            </Link>
          ))}
        </div>
      )}
      {error && <p className="error-text">Search failed: {error.message}</p>}
      {loading && <TitleGrid items={[]} loading variant="poster" />}
      {data && !titles.length && (
        <div className="empty">
          <p>Your search for “{q}” did not have any matches.</p>
          <p className="muted">Suggestions:</p>
          <ul className="muted">
            <li>Try different keywords</li>
            <li>Looking for a movie or TV show? Try its exact title</li>
            <li>Try an actor or director's name</li>
          </ul>
        </div>
      )}
      {!!titles.length && (
        <>
          <h1 className="page-title page-title--sm">
            Results for “{q}”
          </h1>
          <TitleGrid
            items={titles.map((t) => ({ id: t.id, title: t.name, type: t.type, year: t.year, poster: t.image_url }))}
            variant="poster"
            captions={Object.fromEntries(titles.map((t) => [t.id, [t.year, t.type === 'movie' ? 'Movie' : 'TV'].filter(Boolean).join(' · ')]))}
          />
        </>
      )}
    </div>
  );
}

/** Search field at the top of the page on phones, where the navbar has no search box. */
function PageSearchBox({ initial }: { initial: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const timer = useRef<number>();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 799px)').matches && !initial) input.current?.focus();
    // Only when the page first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-search">
      <SearchIcon size={20} />
      <input
        ref={input}
        type="search"
        enterKeyHint="search"
        placeholder="Search shows, movies, people"
        value={value}
        aria-label="Search titles and people"
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            const trimmed = next.trim();
            navigate(`/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`, { replace: true });
          }, 400);
        }}
      />
    </div>
  );
}
