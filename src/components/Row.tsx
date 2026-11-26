import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNearView } from '../lib/cards';
import { useQuery } from '../lib/useQuery';
import { ChevronLeft, ChevronRight } from './Icons';
import { TitleCard, type CardItem, type CardVariant } from './TitleCard';

interface RowProps {
  title: string;
  items?: CardItem[];
  loading?: boolean;
  variant?: CardVariant;
  ranked?: boolean;
  href?: string;
  captions?: Record<number, string>;
  badges?: Record<number, string>;
}

/** A horizontally scrolling shelf of titles with paging arrows. */
export function Row({ title, items, loading, variant = 'landscape', ranked, href, captions, badges }: RowProps) {
  const track = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items?.length]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className={`row row--${variant}${ranked ? ' row--ranked' : ''}`} aria-label={title}>
      <h2 className="row-title">
        {href ? (
          <Link to={href}>
            {title}
            <span className="row-explore">
              <span className="row-explore-text">Explore All</span> <ChevronRight size={14} />
            </span>
          </Link>
        ) : (
          title
        )}
      </h2>
      <div className="row-viewport">
        {canLeft && (
          <button type="button" className="row-arrow row-arrow--left" onClick={() => page(-1)} aria-label={`Scroll ${title} left`}>
            <ChevronLeft size={36} />
          </button>
        )}
        <div className="row-track" ref={track} onScroll={update}>
          {loading && !items
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={`card card--${variant}${ranked ? ' card--ranked' : ''}`}>
                  <div className="card-art shimmer" />
                </div>
              ))
            : items!.map((item, i) => (
                <TitleCard
                  key={item.id}
                  item={item}
                  variant={variant}
                  rank={ranked ? i + 1 : undefined}
                  caption={captions?.[item.id]}
                  badge={badges?.[item.id]}
                />
              ))}
        </div>
        {canRight && (
          <button type="button" className="row-arrow row-arrow--right" onClick={() => page(1)} aria-label={`Scroll ${title} right`}>
            <ChevronRight size={36} />
          </button>
        )}
      </div>
    </section>
  );
}

interface LazyRowProps extends Omit<RowProps, 'items' | 'loading'> {
  /** Cache key for the request; rows with the same key share data. */
  queryKey: string | null;
  load: () => Promise<CardItem[]>;
}

/** A row that only requests its list once it is close to the viewport, to save API credits. */
export function LazyRow({ queryKey, load, ...rest }: LazyRowProps) {
  const [ref, near] = useNearView<HTMLDivElement>();
  const { data, loading, error } = useQuery<CardItem[]>(near ? queryKey : null, load);
  if (error || (data && data.length === 0)) return null;
  return (
    <div ref={ref} className="lazy-row">
      <Row {...rest} items={data} loading={!data && (loading || !near)} />
    </div>
  );
}
