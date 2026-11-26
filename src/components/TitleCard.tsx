import { memo, useEffect, useState } from 'react';
import type { Card } from '../api/types';
import { requestCards, seedCards, useCardEntry, useInView } from '../lib/cards';
import { isMature, useOpenTitle } from '../lib/nav';
import { useApp } from '../store/AppState';
import { usePreview } from './HoverPreview';

export interface CardItem {
  id: number;
  title?: string;
  type?: Card['type'];
  year?: number | null;
  poster?: string | null;
  backdrop?: string | null;
}

export type CardVariant = 'landscape' | 'poster';

interface Props {
  item: CardItem;
  variant?: CardVariant;
  rank?: number;
  /** Extra line under the card (for example a release date). */
  caption?: string;
  badge?: string;
}

/** A title tile. It fetches its own artwork the first time it scrolls into view. */
export const TitleCard = memo(function TitleCard({ item, variant = 'landscape', rank, caption, badge }: Props) {
  const entry = useCardEntry(item.id);
  const [ref, inView] = useInView<HTMLButtonElement>();
  const openTitle = useOpenTitle();
  const preview = usePreview();
  const { profile } = useApp();
  const [imgFailed, setImgFailed] = useState(false);

  const { id, title, type, year, poster, backdrop } = item;
  useEffect(() => {
    if (title || poster || backdrop) {
      seedCards([{ id, title: title ?? '', type, year, poster, posterMedium: poster, backdrop }]);
    }
  }, [id, title, type, year, poster, backdrop]);

  const card = entry?.card ?? { ...item, title: item.title ?? '' };
  const image = variant === 'poster' ? card.posterMedium || card.poster : card.backdrop;
  const fallbackImage = variant === 'landscape' && !card.backdrop ? card.posterMedium || card.poster : null;

  useEffect(() => {
    if (!inView || entry?.full) return;
    // Poster cards that already have artwork from a list don't need a details call.
    if (variant === 'poster' && (card.posterMedium || card.poster)) return;
    requestCards([item.id]);
  }, [inView, entry?.full, variant, item.id, card.poster, card.posterMedium]);

  if (profile?.kids && entry?.full && isMature(card.us_rating)) return null;

  const loading = !image && !fallbackImage && entry?.status === 'loading';
  const shownImage = imgFailed ? null : image || fallbackImage;

  return (
    <div className={`card card--${variant}${rank ? ' card--ranked' : ''}`}>
      {rank !== undefined && (
        <span className="rank" aria-hidden="true">
          {rank}
        </span>
      )}
      <button
        ref={ref}
        type="button"
        className="card-btn"
        onClick={() => openTitle(item.id)}
        onMouseEnter={(e) => preview.schedule(item.id, e.currentTarget)}
        onMouseLeave={preview.cancel}
        aria-label={card.title || 'Title'}
      >
        <div className={`card-art${loading ? ' shimmer' : ''}`}>
          {shownImage ? (
            <img
              src={shownImage}
              alt=""
              loading="lazy"
              decoding="async"
              className={fallbackImage && !image ? 'is-fallback' : undefined}
              onError={() => setImgFailed(true)}
            />
          ) : (
            !loading && <div className="card-fallback"><span>{card.title}</span></div>
          )}
          {variant === 'landscape' && shownImage && <span className="card-title">{card.title}</span>}
          {badge && <span className={`card-badge${badge === 'Free' ? ' card-badge--free' : ''}`}>{badge}</span>}
        </div>
      </button>
      {caption && <div className="card-caption">{caption}</div>}
    </div>
  );
});
