import { useEffect, useRef } from 'react';
import { TitleCard, type CardItem, type CardVariant } from './TitleCard';

interface Props {
  items: CardItem[];
  variant?: CardVariant;
  loading?: boolean;
  onEndReached?: () => void;
  captions?: Record<number, string>;
}

/** A wrapping grid of titles, with optional infinite scroll. */
export function TitleGrid({ items, variant = 'landscape', loading, onEndReached, captions }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const cb = useRef(onEndReached);
  cb.current = onEndReached;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !onEndReached) return;
    const obs = new IntersectionObserver((e) => e[0]?.isIntersecting && cb.current?.(), { rootMargin: '400px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
    // Re-observing after each page fires again if the end is still on screen.
  }, [!!onEndReached, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className={`grid grid--${variant}`}>
        {items.map((item) => (
          <TitleCard key={item.id} item={item} variant={variant} caption={captions?.[item.id]} />
        ))}
        {loading &&
          Array.from({ length: 12 }, (_, i) => (
            <div key={`s${i}`} className={`card card--${variant}`}>
              <div className="card-art shimmer" />
            </div>
          ))}
      </div>
      {onEndReached && <div ref={sentinel} className="grid-sentinel" />}
    </>
  );
}
