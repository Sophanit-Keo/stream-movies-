import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, onApiError, type ApiError } from './api/client';
import type { AppConfig } from './api/types';
import { DetailModal } from './components/DetailModal';
import { Footer } from './components/Footer';
import { HoverPreviewProvider } from './components/HoverPreview';
import { CloseIcon } from './components/Icons';
import { Logo, Navbar } from './components/Navbar';
import { AccountPage } from './pages/AccountPage';
import { ExplorePage } from './pages/ExplorePage';
import { HomePage } from './pages/HomePage';
import { MyListPage } from './pages/MyListPage';
import { NewPopularPage } from './pages/NewPopularPage';
import { PersonPage } from './pages/PersonPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { SearchPage } from './pages/SearchPage';
import { WatchPage } from './pages/WatchPage';
import { AppStateProvider, useApp } from './store/AppState';

export function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.config().then(setConfig, (e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="splash">
        <Logo />
        <p>Couldn't reach the API server.</p>
        <p className="muted">{error}</p>
        <p className="muted">Start it with <code>npm run dev</code> and reload this page.</p>
      </div>
    );
  }
  if (!config) {
    return (
      <div className="splash">
        <Logo />
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <AppStateProvider config={config}>
      <HoverPreviewProvider>
        <Shell />
      </HoverPreviewProvider>
    </AppStateProvider>
  );
}

function Shell() {
  const { profile } = useApp();
  const location = useLocation();
  const bare = location.pathname.startsWith('/watch') || location.pathname === '/profiles';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!profile && location.pathname !== '/profiles') {
    return <Navigate to="/profiles" replace />;
  }

  return (
    <>
      {!bare && <Navbar />}
      <main id="main">
        <Routes>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="/browse" element={<HomePage key="all" kind="all" />} />
          <Route path="/tv" element={<HomePage key="tv" kind="tv" />} />
          <Route path="/movies" element={<HomePage key="movie" kind="movie" />} />
          <Route path="/latest" element={<NewPopularPage />} />
          <Route path="/my-list" element={<MyListPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/person/:id" element={<PersonPage />} />
          <Route path="/watch/:id" element={<WatchPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!bare && <Footer />}
      <DetailModal />
      <Notices />
    </>
  );
}

function NotFound() {
  return (
    <div className="page page--padded empty">
      <h1 className="page-title">Lost your way?</h1>
      <p className="muted">That page doesn't exist. Head back home to find something to watch.</p>
    </div>
  );
}

/** Demo-mode notice and account-level API problems (bad key, quota or rate limit). */
function Notices() {
  const { config } = useApp();
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [demoDismissed, setDemoDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('sm.demoDismissed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => onApiError((err) => setApiError(err)), []);

  // The demo notice is informational, so it gets out of the way on its own.
  useEffect(() => {
    if (!config.demo || demoDismissed) return;
    const t = window.setTimeout(() => setDemoDismissed(true), 9000);
    return () => window.clearTimeout(t);
  }, [config.demo, demoDismissed]);

  return (
    <div className="notices" aria-live="polite">
      {apiError && (
        <div className="notice notice--error">
          <span>
            {apiError.status === 401
              ? 'Watchmode rejected the API key. Check WATCHMODE_API_KEY in your .env file and restart the server.'
              : 'Watchmode request limit reached. Titles you have already seen still load from the cache; new ones will load again later.'}
          </span>
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setApiError(null)}>
            <CloseIcon size={16} />
          </button>
        </div>
      )}
      {config.demo && !demoDismissed && (
        <div className="notice">
          <span>
            <strong>Demo mode:</strong> these are generated sample titles. Add your Watchmode API key to <code>.env</code> to browse real movies and shows.
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Dismiss"
            onClick={() => {
              setDemoDismissed(true);
              try {
                sessionStorage.setItem('sm.demoDismissed', '1');
              } catch {
                /* ignore */
              }
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
