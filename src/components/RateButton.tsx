import { useState } from 'react';
import { useApp, type Rating } from '../store/AppState';
import { DoubleThumb, ThumbDown, ThumbUp } from './Icons';

const OPTIONS: { value: Rating; label: string; Icon: typeof ThumbUp }[] = [
  { value: -1, label: 'Not for me', Icon: ThumbDown },
  { value: 1, label: 'I like this', Icon: ThumbUp },
  { value: 2, label: 'Love this!', Icon: DoubleThumb },
];

/** Thumb rating with a pop-out of three choices, like the familiar streaming UI. */
export function RateButton({ id, size = 'md' }: { id: number; size?: 'sm' | 'md' }) {
  const { ratings, rate } = useApp();
  const [open, setOpen] = useState(false);
  const current = ratings[id];
  const CurrentIcon = OPTIONS.find((o) => o.value === current)?.Icon ?? ThumbUp;

  return (
    <div
      className={`rate rate--${size}${open ? ' rate--open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="circle-btn"
        aria-label="Rate this title"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <CurrentIcon size={size === 'sm' ? 18 : 22} filled={current !== undefined} />
      </button>
      {open && (
        <div className="rate-pop" role="group" aria-label="Rate">
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              className={`rate-opt${current === value ? ' is-active' : ''}`}
              title={label}
              aria-label={label}
              aria-pressed={current === value}
              onClick={(e) => {
                e.stopPropagation();
                rate(id, current === value ? null : value);
                setOpen(false);
              }}
            >
              <Icon size={size === 'sm' ? 18 : 22} filled={current === value} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
