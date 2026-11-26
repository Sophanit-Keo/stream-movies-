import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNative, openExternal } from './platform';

const ROOT_PATHS = new Set(['/browse', '/profiles']);

/** Android integration: hardware back button and links that should leave the app. */
export function NativeBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = useRef(location);
  current.current = location;

  useEffect(() => {
    if (!isNative) return;
    document.documentElement.classList.add('is-native');

    // Links that open in a new tab on the web open in the browser or the service's app here.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target !== '_blank' || !/^https?:/i.test(link.href)) return;
      e.preventDefault();
      openExternal(link.href);
    };
    document.addEventListener('click', onClick, true);

    let removeListener: (() => void) | undefined;
    let cancelled = false;
    import('@capacitor/app').then(async ({ App }) => {
      const handle = await App.addListener('backButton', () => {
        const { pathname, search } = current.current;
        const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        const params = new URLSearchParams(search);
        if (params.has('title') && historyIndex === 0) {
          params.delete('title');
          const rest = params.toString();
          navigate({ pathname, search: rest ? `?${rest}` : '' }, { replace: true });
        } else if (historyIndex > 0) {
          navigate(-1);
        } else if (!ROOT_PATHS.has(pathname)) {
          navigate('/browse', { replace: true });
        } else {
          App.minimizeApp();
        }
      });
      if (cancelled) handle.remove();
      else removeListener = () => handle.remove();
    });

    return () => {
      cancelled = true;
      document.removeEventListener('click', onClick, true);
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
