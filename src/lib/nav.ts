import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/** Title details open as a modal over the current page, addressed by ?title=<id>. */
export function useOpenTitle() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (id: number) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('title', String(id));
        return next;
      }),
    [setParams],
  );
}

export function useCloseTitle() {
  const [, setParams] = useSearchParams();
  return useCallback(
    () =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('title');
        return next;
      }),
    [setParams],
  );
}

export function usePlay() {
  const navigate = useNavigate();
  return useCallback((id: number) => navigate(`/watch/${id}`), [navigate]);
}

const MATURE = new Set(['R', 'NC-17', 'TV-MA', 'NR', 'X', 'TV-14', 'PG-13']);
export const isMature = (rating?: string | null) => !!rating && MATURE.has(rating.toUpperCase());
