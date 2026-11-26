import { useEffect } from 'react';
import { Row } from '../components/Row';
import { requestCards, useCardEntry } from '../lib/cards';
import { TYPES, uniqueById, useReleases, useTitleList } from '../lib/catalog';
import { formatDate, isoDate, truncate } from '../lib/format';
import { useOpenTitle } from '../lib/nav';
import type { Release } from '../api/types';
import { InfoIcon } from '../components/Icons';
import { useApp } from '../store/AppState';

export function NewPopularPage() {
  const { settings } = useApp();
  const releases = useReleases();
  const popularTv = useTitleList({ types: TYPES.tv, sort_by: 'popularity_desc', limit: 30 });
  const popularMovies = useTitleList({ types: TYPES.movie, sort_by: 'popularity_desc', limit: 30 });
  const everyone = useTitleList({ types: TYPES.all, sort_by: 'popularity_desc', limit: 30 });
  // Same request as the home page's Free to Watch row, so it is shared from cache.
  const free = useTitleList({ types: TYPES.all, source_types: 'free', regions: settings.region, sort_by: 'popularity_desc', limit: 20 });
  const today = isoDate(new Date());

  const all = releases.data ?? [];
  const newThisWeek = uniqueById(all.filter((r) => r.source_release_date <= today).sort((a, b) => b.source_release_date.localeCompare(a.source_release_date)));
  const upcoming = uniqueById(all.filter((r) => r.source_release_date > today).sort((a, b) => a.source_release_date.localeCompare(b.source_release_date)));
  const caption = (list: Release[]) => Object.fromEntries(list.map((r) => [r.id, `${r.source_name} · ${formatDate(r.source_release_date)}`]));

  return (
    <div className="page page--padded">
      <h1 className="page-title">New &amp; Popular</h1>
      <div className="rows rows--flush">
        <Row
          title="New on Streaming"
          items={newThisWeek.map((r) => ({ id: r.id, title: r.title, type: r.type, poster: r.poster_url }))}
          loading={releases.loading}
          variant="poster"
          captions={caption(newThisWeek)}
        />
        <Row title="Everyone's Watching" items={everyone.data} loading={everyone.loading} />
        <Row title="Free to Watch" items={free.data} loading={free.loading} href="/explore?free=1" badge="Free" />
        <Row title="Top 10 TV Shows Today" items={popularTv.data?.slice(0, 10)} loading={popularTv.loading} variant="poster" ranked />
        <Row title="Top 10 Movies Today" items={popularMovies.data?.slice(0, 10)} loading={popularMovies.loading} variant="poster" ranked />
      </div>

      <section className="coming-soon">
        <h2 className="row-title">Coming Soon</h2>
        {releases.loading && <div className="skeleton-line" />}
        {releases.data && !upcoming.length && <p className="muted">No announced releases in the next 30 days.</p>}
        <ol className="coming-list">
          {upcoming.slice(0, 40).map((r) => (
            <ComingSoonItem key={`${r.id}-${r.source_id}`} release={r} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function ComingSoonItem({ release }: { release: Release }) {
  const entry = useCardEntry(release.id);
  const openTitle = useOpenTitle();
  const card = entry?.card;
  const [y, m, d] = release.source_release_date.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // Coming-soon titles are few, so load their details for the backdrop and summary.
  useEffect(() => {
    requestCards([release.id]);
  }, [release.id]);

  return (
    <li className="coming">
      <div className="coming-date" aria-label={date.toDateString()}>
        <span>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
        <strong>{date.getDate()}</strong>
      </div>
      <button type="button" className="coming-card" onClick={() => openTitle(release.id)}>
        <span className="coming-art">
          {card?.backdrop || release.poster_url ? (
            <img src={card?.backdrop || release.poster_url!} alt="" loading="lazy" className={card?.backdrop ? undefined : 'is-fallback'} />
          ) : (
            <span className="card-fallback" />
          )}
        </span>
        <span className="coming-text">
          <span className="coming-when">
            Coming {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} on {release.source_name}
            {release.is_original ? <span className="pill">Original</span> : null}
          </span>
          <strong className="coming-title">
            {release.title}
            {release.season_number ? <span className="muted"> · Season {release.season_number}</span> : null}
          </strong>
          <span className="coming-overview">{truncate(card?.plot_overview, 220)}</span>
          {!!card?.genre_names?.length && <span className="genre-dots-inline">{card.genre_names.slice(0, 3).join(' · ')}</span>}
        </span>
        <span className="coming-info"><InfoIcon size={22} /> Info</span>
      </button>
    </li>
  );
}
