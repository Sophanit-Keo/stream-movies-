import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListTitlesParams } from '../api/client';
import type { Genre, Release, Source } from '../api/types';
import { useDetails } from '../components/DetailModal';
import { Hero } from '../components/Hero';
import { LazyRow, Row } from '../components/Row';
import { ServiceStrip } from '../components/ServiceStrip';
import type { CardItem } from '../components/TitleCard';
import {
  featuredServices, fetchList, findGenre, listKey, TYPES, uniqueById, useGenres, useReleases, useSources, useTitleList,
  type Kind,
} from '../lib/catalog';
import { formatDate, isoDate, isTv } from '../lib/format';
import { useApp } from '../store/AppState';

const GENRE_ROWS: { names: string[]; title: string }[] = [
  { names: ['Action', 'Action & Adventure'], title: 'Action & Adventure' },
  { names: ['Comedy'], title: 'Comedies' },
  { names: ['Science Fiction', 'Sci-Fi & Fantasy', 'Sci-Fi'], title: 'Sci-Fi' },
  { names: ['Thriller'], title: 'Thrillers' },
  { names: ['Horror'], title: 'Horror' },
  { names: ['Romance'], title: 'Romance' },
  { names: ['Crime'], title: 'Crime' },
  { names: ['Drama'], title: 'Dramas' },
  { names: ['Documentary'], title: 'Documentaries' },
  { names: ['Animation'], title: 'Animation' },
  { names: ['Anime'], title: 'Anime' },
];

const KIDS_GENRE_NAMES = [['Kids'], ['Family'], ['Animation']];

const KIND_LABEL: Record<Kind, string> = { all: '', movie: 'Movies', tv: 'TV Shows' };

function releasesFor(kind: Kind, releases: Release[] | undefined) {
  const today = isoDate(new Date());
  return uniqueById(
    (releases ?? [])
      .filter((r) => r.source_release_date <= today)
      .filter((r) => (kind === 'movie' ? r.type === 'movie' : kind === 'tv' ? isTv(r.type) : true))
      .sort((a, b) => b.source_release_date.localeCompare(a.source_release_date)),
  );
}

function toItems(releases: Release[]): CardItem[] {
  return releases.map((r) => ({ id: r.id, title: r.title, type: r.type, poster: r.poster_url }));
}

export function HomePage({ kind }: { kind: Kind }) {
  const { profile, settings, history, myList, ratings } = useApp();
  const navigate = useNavigate();
  const kids = !!profile?.kids;
  const types = TYPES[kind];
  const { data: genres } = useGenres();
  const { data: sources } = useSources(settings.region);
  const services = useMemo(() => featuredServices(sources), [sources]);

  const kidsGenreIds = useMemo(
    () => KIDS_GENRE_NAMES.map((names) => findGenre(genres, ...names)?.id).filter(Boolean).join(','),
    [genres],
  );
  const base: ListTitlesParams | null = kids ? (genres ? { types, genres: kidsGenreIds || undefined } : null) : { types };

  const popular = useTitleList(base ? { ...base, sort_by: 'popularity_desc', limit: 30 } : null);
  const popularMovies = useTitleList(!kids && kind === 'all' ? { types: TYPES.movie, sort_by: 'popularity_desc', limit: 30 } : null);
  const popularTv = useTitleList(!kids && kind === 'all' ? { types: TYPES.tv, sort_by: 'popularity_desc', limit: 30 } : null);
  const releases = useReleases();

  const heroIds = useMemo(() => (popular.data ?? []).map((t) => t.id), [popular.data]);
  const newReleases = releasesFor(kind, releases.data);
  const originals = newReleases.filter((r) => r.is_original);
  const today = isoDate(new Date());
  const comingSoon = uniqueById((releases.data ?? []).filter((r) => r.source_release_date > today));

  const continueWatching = history.filter((h) => h.played).filter((h) => (kind === 'movie' ? h.type === 'movie' : kind === 'tv' ? isTv(h.type) : true));
  const seedTitle = useMemo(() => {
    const loved = history.find((h) => (ratings[h.id] ?? 0) > 0);
    return loved ?? history.find((h) => h.played) ?? history[0];
  }, [history, ratings]);

  const label = KIND_LABEL[kind];

  const listRow = (key: string, title: string, params: ListTitlesParams, href?: string) => (
    <LazyRow key={key} title={title} queryKey={listKey(params)} load={() => fetchList(params)} href={href} />
  );

  const genreRows = (kids ? KIDS_GENRE_NAMES.map((names) => ({ names, title: names[0] })) : GENRE_ROWS)
    .map((g) => ({ ...g, genre: findGenre(genres, ...g.names) }))
    .filter((g): g is { names: string[]; title: string; genre: Genre } => !!g.genre);

  const captions = (list: Release[]) =>
    Object.fromEntries(list.map((r) => [r.id, `${r.source_name} · ${formatDate(r.source_release_date)}`]));

  return (
    <div className="page page--browse">
      {kind !== 'all' && (
        <div className="subnav">
          <h1>{label}</h1>
          <select
            className="select select--outline"
            defaultValue=""
            aria-label="Genres"
            onChange={(e) => e.target.value && navigate(`/explore?genre=${e.target.value}&type=${kind}`)}
          >
            <option value="" disabled>Genres</option>
            {(genres ?? []).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {popular.error ? (
        <div className="load-error">
          <h2>Couldn't load titles</h2>
          <p className="muted">{popular.error.message}</p>
          <button type="button" className="btn btn--white" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        <Hero ids={heroIds} salt={kind} />
      )}

      <div className="rows">
        {!!continueWatching.length && (
          <Row title={`Continue Watching for ${profile?.name}`} items={continueWatching} />
        )}

        {kind === 'all' && !kids ? (
          <>
            <Row title="Trending Now" items={popular.data} loading={popular.loading} href={`/explore?sort=popularity_desc`} />
            <Row title="Top 10 TV Shows Today" items={popularTv.data?.slice(0, 10)} loading={popularTv.loading} variant="poster" ranked />
          </>
        ) : (
          <>
            <Row title={kids ? 'Popular for Kids' : `Top 10 ${label} Today`} items={popular.data?.slice(0, 10)} loading={popular.loading} variant="poster" ranked={!kids} />
            {!kids && <Row title="Trending Now" items={popular.data?.slice(10)} href={`/explore?type=${kind}&sort=popularity_desc`} />}
          </>
        )}

        {/* Release lists have no maturity ratings, so kids profiles skip them. */}
        {!kids && <Row
          title={kind === 'all' ? 'New on Streaming' : `New ${label}`}
          items={toItems(newReleases.slice(0, 30))}
          loading={releases.loading}
          variant="poster"
          captions={captions(newReleases)}
        />}

        {!!myList.length && <Row title="My List" items={myList.filter((m) => (kind === 'movie' ? m.type === 'movie' : kind === 'tv' ? isTv(m.type) : true))} href="/my-list" />}

        {seedTitle && !kids && <BecauseYouWatched id={seedTitle.id} title={seedTitle.title} liked={(ratings[seedTitle.id] ?? 0) > 0} />}

        {kind === 'all' && !kids && (
          <Row title="Top 10 Movies Today" items={popularMovies.data?.slice(0, 10)} loading={popularMovies.loading} variant="poster" ranked />
        )}

        {services.slice(0, 2).map((s) => serviceRow(s))}

        {base && listRow('picks', `Top Picks for ${profile?.name ?? 'You'}`, { ...base, sort_by: 'relevance_desc', limit: 20 })}

        {genreRows.slice(0, 3).map((g) =>
          listRow(`genre-${g.genre.id}`, kids ? g.title : `${g.title}${kind === 'movie' ? ' Movies' : kind === 'tv' ? ' TV' : ''}`, { types, genres: g.genre.id, sort_by: 'popularity_desc', limit: 20 }, `/explore?genre=${g.genre.id}${kind !== 'all' ? `&type=${kind}` : ''}`),
        )}

        {!kids && !!originals.length && (
          <Row title="Streaming Originals" items={toItems(originals.slice(0, 30))} variant="poster" captions={captions(originals)} />
        )}

        <ServiceStrip services={services} kind={kind} />

        {services.slice(2, 5).map((s) => serviceRow(s))}

        {!kids && base && listRow('acclaimed', 'Critically Acclaimed', { types, critic_score_low: 85, sort_by: 'popularity_desc', limit: 20 })}

        {genreRows.slice(3).map((g) =>
          listRow(`genre-${g.genre.id}`, kids ? g.title : `${g.title}${kind === 'movie' ? ' Movies' : kind === 'tv' ? ' TV' : ''}`, { types, genres: g.genre.id, sort_by: 'popularity_desc', limit: 20 }, `/explore?genre=${g.genre.id}${kind !== 'all' ? `&type=${kind}` : ''}`),
        )}

        {kind === 'all' && !kids && !!comingSoon.length && (
          <Row
            title="Coming Soon"
            items={toItems(comingSoon.slice(0, 30))}
            variant="poster"
            captions={captions(comingSoon)}
            href="/latest"
          />
        )}
      </div>
    </div>
  );

  function serviceRow(s: Source) {
    const params: ListTitlesParams = {
      types,
      source_ids: s.id,
      regions: settings.region,
      sort_by: 'popularity_desc',
      limit: 20,
      ...(kids && kidsGenreIds ? { genres: kidsGenreIds } : {}),
    };
    return listRow(`service-${s.id}`, `Popular on ${s.name}`, params, `/explore?service=${s.id}${kind !== 'all' ? `&type=${kind}` : ''}`);
  }
}

function BecauseYouWatched({ id, title, liked }: { id: number; title: string; liked: boolean }) {
  const { data } = useDetails(id);
  const items = (data?.similar_titles ?? []).slice(0, 20).map((sid) => ({ id: sid }));
  if (!items.length) return null;
  return <Row title={`${liked ? 'Because You Liked' : 'Because You Watched'} ${title}`} items={items} />;
}
