import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { uniqueById, useReleases } from '../lib/catalog';
import { formatDate, isoDate } from '../lib/format';
import { useOpenTitle } from '../lib/nav';
import { useApp } from '../store/AppState';
import { Avatar } from './Avatar';
import { BellIcon, ChevronDown, CloseIcon, SearchIcon } from './Icons';

export const APP_NAME = 'StreamMovies';

const LINKS = [
  { to: '/browse', label: 'Home' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/movies', label: 'Movies' },
  { to: '/latest', label: 'New & Popular' },
  { to: '/my-list', label: 'My List' },
  { to: '/explore', label: 'Browse by Service' },
];

export function Logo() {
  return <span className="logo">{APP_NAME}</span>;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { profile } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? ' nav--solid' : ''}`}>
      <Link to="/browse" className="nav-logo" aria-label={`${APP_NAME} home`}>
        <Logo />
      </Link>
      <nav className="nav-links" aria-label="Main">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <MobileMenu />
      <nav className="nav-chips" aria-label="Categories">
        <NavLink to="/tv" className={({ isActive }) => `chip${isActive ? ' is-active' : ''}`}>TV Shows</NavLink>
        <NavLink to="/movies" className={({ isActive }) => `chip${isActive ? ' is-active' : ''}`}>Movies</NavLink>
      </nav>
      <div className="nav-right">
        <SearchBox />
        {profile?.kids && <span className="nav-kids">Kids</span>}
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <div className="nav-mobile" onMouseLeave={() => setOpen(false)}>
      <button type="button" className="nav-mobile-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Browse <ChevronDown size={16} />
      </button>
      {open && (
        <div className="dropdown dropdown--center">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `dropdown-item${isActive ? ' is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const onSearch = location.pathname === '/search';
  const urlQuery = onSearch ? params.get('q') ?? '' : '';
  const [open, setOpen] = useState(onSearch);
  const [value, setValue] = useState(urlQuery);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number>();

  useEffect(() => {
    if (!onSearch) {
      setValue('');
      return;
    }
    setOpen(true);
    if (document.activeElement !== input.current) setValue(urlQuery);
  }, [onSearch, urlQuery]);

  const submit = (q: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const trimmed = q.trim();
      if (!trimmed && !onSearch) return;
      navigate(`/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`, { replace: onSearch });
    }, 400);
  };

  return (
    <div className={`search${open ? ' search--open' : ''}`}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Search"
        onClick={() => {
          setOpen(true);
          input.current?.focus();
        }}
      >
        <SearchIcon size={22} />
      </button>
      <input
        ref={input}
        type="search"
        placeholder="Titles, people, genres"
        value={value}
        aria-label="Search titles and people"
        onChange={(e) => {
          setValue(e.target.value);
          submit(e.target.value);
        }}
        onBlur={() => !value && !onSearch && setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setValue('');
            setOpen(false);
            input.current?.blur();
          }
        }}
      />
      {open && value && (
        <button
          type="button"
          className="icon-btn search-clear"
          aria-label="Clear search"
          onClick={() => {
            setValue('');
            submit('');
            input.current?.focus();
          }}
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const { data } = useReleases(open);
  const openTitle = useOpenTitle();
  const today = isoDate(new Date());
  const items = uniqueById(
    (data ?? []).filter((r) => r.source_release_date <= today).sort((a, b) => b.source_release_date.localeCompare(a.source_release_date)),
  ).slice(0, 8);

  return (
    <div className="nav-pop nav-bell" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="icon-btn" aria-label="New arrivals" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <BellIcon size={22} />
      </button>
      {open && (
        <div className="dropdown dropdown--right notifications">
          {!data && <div className="dropdown-empty">Loading new arrivals…</div>}
          {data && !items.length && <div className="dropdown-empty">No new arrivals right now.</div>}
          {items.map((r) => (
            <button
              key={`${r.id}-${r.source_id}`}
              type="button"
              className="notification"
              onClick={() => {
                setOpen(false);
                openTitle(r.id);
              }}
            >
              {r.poster_url ? <img src={r.poster_url} alt="" /> : <span className="card-fallback" />}
              <span>
                <strong>New on {r.source_name}</strong>
                <span>{r.title}{r.season_number ? ` · Season ${r.season_number}` : ''}</span>
                <small>{formatDate(r.source_release_date)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { profile, profiles, selectProfile } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!profile) return null;
  return (
    <div className="nav-pop" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="profile-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Avatar profile={profile} size={32} />
        <ChevronDown size={16} className={open ? 'flip' : undefined} />
      </button>
      {open && (
        <div className="dropdown dropdown--right">
          {profiles
            .filter((p) => p.id !== profile.id)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                className="dropdown-item dropdown-profile"
                onClick={() => {
                  selectProfile(p.id);
                  setOpen(false);
                  navigate('/browse');
                }}
              >
                <Avatar profile={p} size={28} /> {p.name}
              </button>
            ))}
          <Link to="/profiles?manage=1" className="dropdown-item">Manage Profiles</Link>
          <Link to="/account" className="dropdown-item">Account &amp; Settings</Link>
          <hr />
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              selectProfile(null);
              navigate('/profiles');
            }}
          >
            Switch Profile
          </button>
        </div>
      )}
    </div>
  );
}
