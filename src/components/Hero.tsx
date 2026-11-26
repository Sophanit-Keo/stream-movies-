import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestCards, useCardEntry } from '../lib/cards';
import { isTv, matchScore, truncate, youtubeEmbed, youtubeId } from '../lib/format';
import { useOpenTitle, usePlay } from '../lib/nav';
import { useApp } from '../store/AppState';
import { InfoIcon, PlayIcon, ReplayIcon, VolumeOff, VolumeOn } from './Icons';

/** Picks one of the first few titles, changing daily so the billboard doesn't feel static. */
function pickFeatured(ids: number[], salt: string) {
  const pool = ids.slice(0, 6);
  if (!pool.length) return [];
  const day = Math.floor(Date.now() / 86400000);
  const seed = [...salt].reduce((a, c) => a + c.charCodeAt(0), day);
  const start = seed % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)];
}

function postToPlayer(frame: HTMLIFrameElement | null, func: string) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
}

/** The large billboard at the top of browse pages, with an optional muted trailer. */
export function Hero({ ids, salt }: { ids: number[]; salt: string }) {
  const order = useMemo(() => pickFeatured(ids, salt), [ids, salt]);
  const [index, setIndex] = useState(0);
  const id = order[index];
  const entry = useCardEntry(id ?? -1);
  const card = entry?.card;
  const openTitle = useOpenTitle();
  const play = usePlay();
  const { settings } = useApp();
  const [params] = useSearchParams();
  const modalOpen = params.has('title');

  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (id) requestCards([id]);
  }, [id]);

  // Skip featured titles that have no artwork.
  useEffect(() => {
    if (entry?.full && !entry.card.backdrop && index < order.length - 1) setIndex((i) => i + 1);
    if (entry?.status === 'error' && index < order.length - 1) setIndex((i) => i + 1);
  }, [entry, index, order.length]);

  const videoId = youtubeId(card?.trailer);

  useEffect(() => {
    setShowVideo(false);
    setVideoReady(false);
    setEnded(false);
    setMuted(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!videoId || !settings.autoplayPreviews || reduce) return;
    const t = window.setTimeout(() => setShowVideo(true), 2500);
    return () => window.clearTimeout(t);
  }, [videoId, settings.autoplayPreviews]);

  useEffect(() => {
    const onScroll = () => {
      const h = root.current?.offsetHeight ?? 600;
      setOffscreen(window.scrollY > h * 0.65);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stop the preview after a trailer-length interval so it doesn't loop forever.
  useEffect(() => {
    if (!videoReady) return;
    const t = window.setTimeout(() => setEnded(true), 90000);
    return () => window.clearTimeout(t);
  }, [videoReady]);

  if (!id) return <div className="hero hero--empty" />;

  const videoActive = showVideo && !ended && !offscreen && !modalOpen && !!videoId;
  const match = matchScore(card);

  return (
    <section className="hero" ref={root} aria-label="Featured title">
      <div className="hero-media">
        {card?.backdrop ? (
          <img src={card.backdrop} alt="" className={videoActive && videoReady ? 'is-hidden' : undefined} />
        ) : (
          <div className="hero-placeholder shimmer" />
        )}
        {videoActive && (
          <iframe
            ref={frame}
            className={`hero-video${videoReady ? ' is-ready' : ''}`}
            src={youtubeEmbed(videoId!, { autoplay: true, mute: true, controls: false, loop: true })}
            title={`${card?.title ?? 'Title'} trailer`}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            onLoad={() => window.setTimeout(() => setVideoReady(true), 1200)}
          />
        )}
        <div className="hero-vignette" />
      </div>

      {card && (
        <div className="hero-content">
          <h1 className={`hero-title${videoActive && videoReady ? ' is-compact' : ''}`}>{card.title}</h1>
          <div className="hero-meta">
            {match !== null && <span className="match">{match}% Match</span>}
            {card.year && <span>{card.year}</span>}
            {isTv(card.type) && <span>Series</span>}
            {!!card.genre_names?.length && <span className="muted">{card.genre_names.slice(0, 3).join(' · ')}</span>}
          </div>
          <p className={`hero-overview${videoActive && videoReady ? ' is-faded' : ''}`}>{truncate(card.plot_overview, 220)}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn--white" onClick={() => play(card.id)}>
              <PlayIcon size={26} /> Play
            </button>
            <button type="button" className="btn btn--gray" onClick={() => openTitle(card.id)}>
              <InfoIcon size={26} /> More Info
            </button>
          </div>
        </div>
      )}

      <div className="hero-side">
        {videoActive && videoReady && (
          <button
            type="button"
            className="circle-btn circle-btn--outline"
            aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
            onClick={() => {
              postToPlayer(frame.current, muted ? 'unMute' : 'mute');
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeOff size={20} /> : <VolumeOn size={20} />}
          </button>
        )}
        {ended && videoId && (
          <button type="button" className="circle-btn circle-btn--outline" aria-label="Replay trailer" onClick={() => { setEnded(false); setVideoReady(false); }}>
            <ReplayIcon size={20} />
          </button>
        )}
        {card?.us_rating && <span className="hero-rating">{card.us_rating}</span>}
      </div>
    </section>
  );
}
