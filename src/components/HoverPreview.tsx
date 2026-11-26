import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { requestCards, useCardEntry } from '../lib/cards';
import { isTv, matchScore, runtime } from '../lib/format';
import { useOpenTitle, usePlay } from '../lib/nav';
import { useApp } from '../store/AppState';
import { CheckIcon, ChevronDown, PlayIcon, PlusIcon } from './Icons';
import { RateButton } from './RateButton';

interface Target {
  id: number;
  rect: DOMRect;
}

interface PreviewApi {
  schedule: (id: number, el: HTMLElement) => void;
  cancel: () => void;
}

const Ctx = createContext<PreviewApi>({ schedule: () => {}, cancel: () => {} });
export const usePreview = () => useContext(Ctx);

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** The enlarged card that pops up when you rest the pointer on a title. */
export function HoverPreviewProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  const timer = useRef<number>();
  const location = useLocation();

  const cancel = useCallback(() => window.clearTimeout(timer.current), []);
  const schedule = useCallback((id: number, el: HTMLElement) => {
    if (!canHover()) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!el.isConnected || !el.matches(':hover')) return;
      requestCards([id]);
      setTarget({ id, rect: el.getBoundingClientRect() });
    }, 550);
  }, []);

  useEffect(() => {
    setTarget(null);
  }, [location]);

  useEffect(() => {
    if (!target) return;
    const close = () => setTarget(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [target]);

  const api = useMemo(() => ({ schedule, cancel }), [schedule, cancel]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {target && createPortal(<Preview key={target.id} target={target} onClose={() => setTarget(null)} />, document.body)}
    </Ctx.Provider>
  );
}

function Preview({ target, onClose }: { target: Target; onClose: () => void }) {
  const entry = useCardEntry(target.id);
  const card = entry?.card;
  const { inMyList, toggleMyList } = useApp();
  const openTitle = useOpenTitle();
  const play = usePlay();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { rect } = target;
  const vw = document.documentElement.clientWidth;
  const width = Math.min(Math.max(rect.width * 1.5, 300), vw - 32);
  const imgH = (width * 9) / 16;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), vw - width - 16);
  const top = rect.top + window.scrollY + rect.height / 2 - imgH / 2 - 10;
  const originX = ((rect.left + rect.width / 2 - left) / width) * 100;
  const scale = rect.width / width;

  if (!card) return null;
  const image = card.backdrop || card.posterMedium || card.poster;
  const match = matchScore(card);
  const listed = inMyList(card.id);

  return (
    <div
      className={`preview${entered ? ' is-entered' : ''}`}
      style={{ left, top, width, transformOrigin: `${originX}% 30%`, ['--from-scale' as string]: scale }}
      onMouseLeave={onClose}
      role="dialog"
      aria-label={card.title}
    >
      <button type="button" className="preview-media" onClick={() => openTitle(card.id)} aria-label={`More info about ${card.title}`}>
        {image ? <img src={image} alt="" /> : <div className="card-fallback" />}
        <span className="preview-title">{card.title}</span>
      </button>
      <div className="preview-body">
        <div className="preview-actions">
          <button type="button" className="circle-btn circle-btn--white" aria-label="Play" onClick={() => play(card.id)}>
            <PlayIcon size={18} />
          </button>
          <button
            type="button"
            className="circle-btn"
            aria-label={listed ? 'Remove from My List' : 'Add to My List'}
            title={listed ? 'Remove from My List' : 'Add to My List'}
            onClick={() => toggleMyList(card)}
          >
            {listed ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
          </button>
          <RateButton id={card.id} size="sm" />
          <button type="button" className="circle-btn push-right" aria-label="More info" title="More info" onClick={() => openTitle(card.id)}>
            <ChevronDown size={18} />
          </button>
        </div>
        <div className="meta-line">
          {match !== null && <span className="match">{match}% Match</span>}
          {card.us_rating && <span className="maturity">{card.us_rating}</span>}
          <span>{isTv(card.type) ? 'Series' : runtime(card.runtime_minutes)}</span>
          {card.year && <span className="muted">{card.year}</span>}
        </div>
        {!!card.genre_names?.length && (
          <ul className="genre-dots">
            {card.genre_names.slice(0, 3).map((g) => <li key={g}>{g}</li>)}
          </ul>
        )}
        {entry?.status === 'loading' && !entry.full && <div className="skeleton-line" />}
      </div>
    </div>
  );
}
