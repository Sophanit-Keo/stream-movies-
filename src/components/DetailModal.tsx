import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CastMember, Episode, Season, TitleDetails } from '../api/types';
import { requestCards, setFullCard, useCardEntry, useInView } from '../lib/cards';
import { isHttpUrl, isTv, matchScore, runtime, truncate, yearRange, youtubeEmbed, youtubeId } from '../lib/format';
import { useCloseTitle, useOpenTitle, usePlay } from '../lib/nav';
import { useQuery } from '../lib/useQuery';
import { openExternal } from '../native/platform';
import { useApp } from '../store/AppState';
import { CheckIcon, CloseIcon, PlayIcon, PlusIcon, VolumeOff, VolumeOn } from './Icons';
import { RateButton } from './RateButton';
import { freeSource, useTitleSources, WhereToWatch } from './WhereToWatch';

/** Renders the details modal whenever the URL has ?title=<id>. */
export function DetailModal() {
  const [params] = useSearchParams();
  const id = Number(params.get('title'));
  if (!Number.isFinite(id) || id <= 0) return null;
  return <Modal key={id} id={id} />;
}

export function useDetails(id: number) {
  return useQuery<TitleDetails>(`details:${id}`, async () => {
    const d = await api.details(id);
    setFullCard(d);
    return d;
  });
}

function Modal({ id }: { id: number }) {
  const close = useCloseTitle();
  const play = usePlay();
  const { settings, inMyList, toggleMyList, recordView } = useApp();
  const { data: details, error } = useDetails(id);
  const seed = useCardEntry(id)?.card;
  const card = details ?? seed;
  const dialog = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  useEffect(() => {
    if (details) recordView(details, false);
    // Only once per title opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.id]);

  const videoId = youtubeId(details?.trailer);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!videoId || !settings.autoplayPreviews || reduce) return;
    const t = window.setTimeout(() => setShowVideo(true), 1500);
    return () => window.clearTimeout(t);
  }, [videoId, settings.autoplayPreviews]);

  const listed = inMyList(id);
  // Shares its request with the Where to Watch section below.
  const { data: sources } = useTitleSources(id, settings.region);
  const free = freeSource(sources);
  const match = matchScore(card);
  const tv = isTv(card?.type);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={card?.title ?? 'Title details'} ref={dialog} tabIndex={-1}>
        <button type="button" className="modal-close" onClick={close} aria-label="Close">
          <CloseIcon size={22} />
        </button>

        <div className="modal-media">
          {card?.backdrop || card?.poster ? (
            <img src={card.backdrop || card.poster!} alt="" className={card.backdrop ? undefined : 'is-fallback'} />
          ) : (
            <div className="hero-placeholder shimmer" />
          )}
          {showVideo && videoId && (
            <iframe
              ref={frame}
              className="modal-video"
              src={youtubeEmbed(videoId, { autoplay: true, mute: true, controls: false, loop: true })}
              title={`${card?.title} trailer`}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          )}
          <div className="modal-media-fade" />
          <div className="modal-media-content">
            <h2 className="modal-title">{card?.title}</h2>
            <div className="modal-actions">
              <button type="button" className="btn btn--white" onClick={() => play(id)}>
                <PlayIcon size={24} /> Play
              </button>
              {free && (
                <button
                  type="button"
                  className="btn btn--free"
                  onClick={() => openExternal(free.web_url!)}
                  title={`Watch the full ${tv ? 'series' : 'movie'} free on ${free.name}`}
                >
                  <PlayIcon size={22} /> <span><span className="hide-sm">Watch </span>Free</span>
                </button>
              )}
              {card && (
                <button
                  type="button"
                  className="circle-btn circle-btn--lg"
                  onClick={() => toggleMyList(card)}
                  aria-label={listed ? 'Remove from My List' : 'Add to My List'}
                  title={listed ? 'Remove from My List' : 'Add to My List'}
                >
                  {listed ? <CheckIcon size={22} /> : <PlusIcon size={22} />}
                </button>
              )}
              <RateButton id={id} />
              {showVideo && videoId && (
                <button
                  type="button"
                  className="circle-btn circle-btn--outline push-right"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  onClick={() => {
                    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: [] }), '*');
                    setMuted(!muted);
                  }}
                >
                  {muted ? <VolumeOff size={20} /> : <VolumeOn size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-body">
          {error && !details && <p className="error-text">Couldn't load this title: {error.message}</p>}
          {card && (
            <div className="modal-info">
              <div>
                <div className="meta-line meta-line--lg">
                  {match !== null && <span className="match">{match}% Match</span>}
                  {yearRange(card) && <span>{yearRange(card)}</span>}
                  {card.us_rating && <span className="maturity">{card.us_rating}</span>}
                  {!tv && runtime(card.runtime_minutes) && <span>{runtime(card.runtime_minutes)}</span>}
                  {tv && <span>Series</span>}
                  {free && <span className="pill pill--free">Free on {free.name}</span>}
                </div>
                <p className="modal-overview">{card.plot_overview}</p>
              </div>
              <aside className="modal-side">
                <CastLine id={id} />
                {!!card.genre_names?.length && (
                  <p><span className="muted">Genres: </span>{card.genre_names.join(', ')}</p>
                )}
                {details?.critic_score != null && (
                  <p><span className="muted">Critic score: </span>{details.critic_score}/100</p>
                )}
                {details?.user_rating != null && (
                  <p><span className="muted">Audience rating: </span>{details.user_rating}/10</p>
                )}
              </aside>
            </div>
          )}

          <section className="modal-section">
            <h3>Where to Watch</h3>
            <WhereToWatch id={id} region={settings.region} />
          </section>

          {tv && <Episodes id={id} region={settings.region} />}

          {!!details?.similar_titles?.length && (
            <section className="modal-section">
              <h3>More Like This</h3>
              <div className="similar-grid">
                {details.similar_titles.slice(0, 12).map((sid) => (
                  <SimilarCard key={sid} id={sid} />
                ))}
              </div>
            </section>
          )}

          {details && <About details={details} />}
        </div>
      </div>
    </div>
  );
}

function useCast(id: number) {
  return useQuery<CastMember[]>(`cast:${id}`, () => api.castCrew(id));
}

function CastLine({ id }: { id: number }) {
  const { data } = useCast(id);
  const cast = (data ?? []).filter((c) => c.type === 'Cast').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  if (!cast.length) return null;
  return (
    <p>
      <span className="muted">Cast: </span>
      {cast.slice(0, 3).map((c, i) => (
        <span key={c.person_id}>
          {i > 0 && ', '}
          <Link to={`/person/${c.person_id}`} className="link-plain">{c.full_name}</Link>
        </span>
      ))}
      {cast.length > 3 && <>, <a href="#about" className="link-plain muted-italic">more</a></>}
    </p>
  );
}

function Episodes({ id, region }: { id: number; region: string }) {
  const { data: seasons, loading } = useQuery<Season[]>(`seasons:${id}`, () => api.seasons(id));
  const sorted = (seasons ?? []).filter((s) => s.number > 0).sort((a, b) => a.number - b.number);
  const [season, setSeason] = useState<number | null>(null);
  const current = season ?? sorted[0]?.number ?? null;
  const play = usePlay();
  const { data: episodes, loading: epLoading } = useQuery<Episode[]>(
    current !== null ? `episodes:${id}:${current}:${region}` : null,
    () => api.episodes(id, current!, region),
  );

  if (loading) return <section className="modal-section"><h3>Episodes</h3><div className="skeleton-line" /></section>;
  if (!sorted.length) return null;

  return (
    <section className="modal-section">
      <div className="episodes-head">
        <h3>Episodes</h3>
        {sorted.length > 1 ? (
          <select className="select" value={current ?? ''} onChange={(e) => setSeason(Number(e.target.value))} aria-label="Season">
            {sorted.map((s) => (
              <option key={s.id} value={s.number}>
                {s.name || `Season ${s.number}`} ({s.episode_count ?? '?'} Episodes)
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">{sorted[0].name || 'Season 1'}</span>
        )}
      </div>
      {epLoading && <div className="skeleton-line" />}
      <ol className="episodes">
        {(episodes ?? [])
          .sort((a, b) => a.episode_number - b.episode_number)
          .map((ep) => {
            const link = ep.sources?.find((s) => isHttpUrl(s.web_url))?.web_url;
            const open = () => (link ? openExternal(link) : play(id));
            return (
              <li key={ep.id}>
                <button type="button" className="episode" onClick={open} title={link ? 'Open this episode on a streaming service' : 'Play trailer'}>
                  <span className="episode-num">{ep.episode_number}</span>
                  <span className="episode-thumb">
                    {ep.thumbnail_url ? <img src={ep.thumbnail_url} alt="" loading="lazy" /> : <span className="card-fallback" />}
                    <span className="episode-play"><PlayIcon size={22} /></span>
                  </span>
                  <span className="episode-text">
                    <span className="episode-title">
                      <strong>{ep.name}</strong>
                      {ep.runtime_minutes ? <span>{ep.runtime_minutes}m</span> : null}
                    </span>
                    <span className="episode-overview">{truncate(ep.overview, 180)}</span>
                  </span>
                </button>
              </li>
            );
          })}
      </ol>
    </section>
  );
}

function SimilarCard({ id }: { id: number }) {
  const entry = useCardEntry(id);
  const [ref, inView] = useInView<HTMLDivElement>();
  const openTitle = useOpenTitle();
  const { inMyList, toggleMyList } = useApp();

  useEffect(() => {
    if (inView) requestCards([id]);
  }, [inView, id]);

  const card = entry?.card;
  const match = matchScore(card);
  const image = card?.backdrop || card?.posterMedium || card?.poster;

  return (
    <div className="similar" ref={ref}>
      <button type="button" className="similar-art" onClick={() => openTitle(id)} aria-label={card?.title || 'Open title'}>
        {image ? <img src={image} alt="" loading="lazy" /> : <div className={`card-fallback${entry?.status === 'loading' ? ' shimmer' : ''}`}><span>{card?.title}</span></div>}
        {card?.runtime_minutes && !isTv(card.type) ? <span className="similar-runtime">{runtime(card.runtime_minutes)}</span> : null}
      </button>
      <div className="similar-body">
        <div className="similar-head">
          <div className="similar-meta">
            {match !== null && <span className="match">{match}% Match</span>}
            <span className="similar-tags">
              {card?.us_rating && <span className="maturity">{card.us_rating}</span>}
              {card?.year && <span>{card.year}</span>}
            </span>
          </div>
          {card?.title && (
            <button
              type="button"
              className="circle-btn"
              onClick={() => toggleMyList(card)}
              aria-label={inMyList(id) ? 'Remove from My List' : 'Add to My List'}
              title={inMyList(id) ? 'Remove from My List' : 'Add to My List'}
            >
              {inMyList(id) ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
            </button>
          )}
        </div>
        <strong className="similar-title">{card?.title}</strong>
        <p>{truncate(card?.plot_overview, 140)}</p>
      </div>
    </div>
  );
}

function About({ details }: { details: TitleDetails }) {
  const { data } = useCast(details.id);
  const cast = (data ?? []).filter((c) => c.type === 'Cast').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const crew = (data ?? []).filter((c) => c.type === 'Crew');
  const directors = crew.filter((c) => /director|creator/i.test(c.role ?? ''));
  const writers = crew.filter((c) => /writer|screenplay/i.test(c.role ?? ''));
  const people = (list: CastMember[]) =>
    list.slice(0, 12).map((c, i) => (
      <span key={`${c.person_id}-${i}`}>
        {i > 0 && ', '}
        <Link to={`/person/${c.person_id}`} className="link-plain">{c.full_name}</Link>
      </span>
    ));

  return (
    <section className="modal-section about" id="about">
      <h3>
        About <strong>{details.title}</strong>
      </h3>
      {!!directors.length && <p><span className="muted">{isTv(details.type) ? 'Creators' : 'Director'}: </span>{people(uniqueByPerson(directors))}</p>}
      {!!cast.length && <p><span className="muted">Cast: </span>{people(cast)}</p>}
      {!!writers.length && <p><span className="muted">Writers: </span>{people(uniqueByPerson(writers))}</p>}
      {!!details.genre_names?.length && <p><span className="muted">Genres: </span>{details.genre_names.join(', ')}</p>}
      {!!details.network_names?.length && <p><span className="muted">Network: </span>{details.network_names.join(', ')}</p>}
      {details.us_rating && (
        <p>
          <span className="muted">Maturity rating: </span>
          <span className="maturity">{details.us_rating}</span>
        </p>
      )}
      {details.release_date && <p><span className="muted">Released: </span>{details.release_date}</p>}
    </section>
  );
}

function uniqueByPerson(list: CastMember[]) {
  const seen = new Set<number>();
  return list.filter((c) => (seen.has(c.person_id) ? false : (seen.add(c.person_id), true)));
}
